/**
 * Shape computation utilities for neural network layers
 */

import type { LayerObject } from './dag-parser'
import { computeInputShape } from './layer-definitions'
import { getLayerDefinition } from './layer-definitions'
import { parseShape } from './utils'

export interface ShapeError {
  nodeId: string
  message: string
}

/**
 * Walks the DAG, computes output shapes for each node, and returns computed shapes and errors
 */
export async function computeShapes(
  dag: { orderedNodes: LayerObject[], edgeMap: Map<string, string[]> }, 
  inputShape: string
): Promise<{ errors: ShapeError[], nodeShapes: Map<string, number[]> }> {
  const errors: ShapeError[] = []
  const nodeShapes = new Map<string, number[]>()
  
  // Validate input shape format
  if (!parseShape(inputShape)) {
    errors.push({
      nodeId: 'input',
      message: `Invalid input shape format: ${inputShape}. Expected format like "(784,)" or "(28, 28, 1)"`
    })
    return { errors, nodeShapes }
  }
  
  // Process nodes in topological order
  for (const node of dag.orderedNodes) {
    try {
      let outputShape: number[] | null = null
      
      if (node.type === 'Input') {
        // Input layer defines the initial shape
        const computedShape = await computeInputShape(node.params)
        outputShape = parseShape(computedShape)
        
        if (!outputShape) {
          errors.push({
            nodeId: node.id,
            message: `Invalid input shape in Input layer: ${computedShape}`
          })
          continue
        }
      } else {
        // Find input nodes for this layer
        const inputNodeIds = Array.from(dag.edgeMap.entries())
          .filter(([, targets]) => targets.includes(node.id))
          .map(([sourceId]) => sourceId)
        
        if (inputNodeIds.length === 0) {
          errors.push({
            nodeId: node.id,
            message: `Node ${node.type} has no input connections`
          })
          continue
        }
        
        // Get input shapes from connected nodes
        const inputShapes = inputNodeIds
          .map(id => nodeShapes.get(id))
          .filter((shape): shape is number[] => shape !== undefined)
        
        if (inputShapes.length !== inputNodeIds.length) {
          errors.push({
            nodeId: node.id,
            message: `Could not determine input shapes for ${node.type} layer`
          })
          continue
        }
        
        // Compute output shape using new layer definitions system
        const layerDef = getLayerDefinition(node.type)
        
        if (!layerDef) {
          errors.push({
            nodeId: node.id,
            message: `Unknown layer type: ${node.type}`
          })
          continue
        }
        
        // Validate input shapes
        const validation = layerDef.validateInputs(inputShapes, node.params)
        if (!validation.isValid) {
          errors.push({
            nodeId: node.id,
            message: validation.errorMessage || `Invalid input for ${node.type} layer`
          })
          continue
        }
        
        outputShape = layerDef.computeShape(inputShapes, node.params)
        
        if (!outputShape) {
          errors.push({
            nodeId: node.id,
            message: `Could not compute output shape for ${node.type} layer`
          })
          continue
        }
      }
      
      // Store the computed output shape for this node
      if (outputShape) {
        nodeShapes.set(node.id, outputShape)
      }
      
    } catch (error) {
      errors.push({
        nodeId: node.id,
        message: `Error computing shape for ${node.type}: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  }
  
  return { errors, nodeShapes }
}
