/**
 * Shape computation utilities for neural network layers
 */

import type { LayerObject } from './dag-parser'
import { getLayerDefinition } from './layer-definitions'
import { parseShape } from './utils'

export interface ShapeError {
  nodeId: string
  message: string
}

/**
 * Computes output shapes for each node in a DAG
 */
export function computeShapes(
  dag: { orderedNodes: LayerObject[], edgeMap: Map<string, string[]> }, 
  inputShape: string
): { errors: ShapeError[], nodeShapes: Map<string, number[]> } {
  const errors: ShapeError[] = []
  const nodeShapes = new Map<string, number[]>()
  
  // Validate input shape format early
  const parsedInputShape = parseShape(inputShape)
  if (!parsedInputShape) {
    return { 
      errors: [{ 
        nodeId: 'input', 
        message: `Invalid input shape: ${inputShape}` 
      }], 
      nodeShapes 
    }
  }
  
  // Process nodes in topological order
  for (const node of dag.orderedNodes) {
    const outputShape = computeNodeShape(node, dag.edgeMap, nodeShapes, parsedInputShape)
    
    if (outputShape.error) {
      errors.push({ nodeId: node.id, message: outputShape.error })
      continue
    }
    
    if (outputShape.shape) {
      nodeShapes.set(node.id, outputShape.shape)
    }
  }
  
  return { errors, nodeShapes }
}

/**
 * Computes the output shape for a single node
 */
function computeNodeShape(
  node: LayerObject,
  edgeMap: Map<string, string[]>,
  nodeShapes: Map<string, number[]>,
  defaultInputShape: number[]
): { shape?: number[], error?: string } {
  try {
    if (node.type === 'Input') {
      return computeInputNodeShape(node, defaultInputShape)
    }
    
    return computeLayerNodeShape(node, edgeMap, nodeShapes)
  } catch (error) {
    return { 
      error: `Error computing shape: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

/**
 * Computes shape for Input nodes
 */
function computeInputNodeShape(
  node: LayerObject,
  defaultInputShape: number[]
): { shape?: number[], error?: string } {
  const layerDef = getLayerDefinition('Input')
  if (!layerDef) {
    return { error: 'Input layer definition not found' }
  }
  
  const shape = layerDef.computeShape([], node.params) || defaultInputShape
  return { shape }
}

/**
 * Computes shape for non-Input nodes
 */
function computeLayerNodeShape(
  node: LayerObject,
  edgeMap: Map<string, string[]>,
  nodeShapes: Map<string, number[]>
): { shape?: number[], error?: string } {
  // Get input connections
  const inputNodeIds = getInputNodeIds(node.id, edgeMap)
  if (inputNodeIds.length === 0) {
    return { error: `${node.type} has no input connections` }
  }
  
  // Get input shapes
  const inputShapes = getInputShapes(inputNodeIds, nodeShapes)
  if (inputShapes.length !== inputNodeIds.length) {
    return { error: `Could not determine input shapes for ${node.type}` }
  }
  
  // Get layer definition
  const layerDef = getLayerDefinition(node.type)
  if (!layerDef) {
    return { error: `Unknown layer type: ${node.type}` }
  }
  
  // Validate inputs
  const validation = layerDef.validateInputs(inputShapes, node.params)
  if (!validation.isValid) {
    return { error: validation.errorMessage || `Invalid input for ${node.type}` }
  }
  
  // Compute output shape
  const shape = layerDef.computeShape(inputShapes, node.params)
  if (!shape) {
    return { error: `Could not compute output shape for ${node.type}` }
  }
  
  return { shape }
}

/**
 * Gets input node IDs for a given node
 */
function getInputNodeIds(nodeId: string, edgeMap: Map<string, string[]>): string[] {
  return Array.from(edgeMap.entries())
    .filter(([, targets]) => targets.includes(nodeId))
    .map(([sourceId]) => sourceId)
}

/**
 * Gets input shapes from node IDs
 */
function getInputShapes(nodeIds: string[], nodeShapes: Map<string, number[]>): number[][] {
  return nodeIds
    .map(id => nodeShapes.get(id))
    .filter((shape): shape is number[] => shape !== undefined)
}
