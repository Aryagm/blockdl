/**
 * Shape computation utilities for neural network layers
 * This module provides functions to compute output shapes for different layer types
 */

import { computeShapes, parseGraphToDAG, type ShapeError } from './graph-utils'
import type { Node, Edge } from '@xyflow/react'

/**
 * Computes shapes for all nodes in a React Flow graph and returns shape information
 * along with any errors encountered during computation.
 */
export function computeNetworkShapes(nodes: Node[], edges: Edge[], inputShape: string) {
  // Parse the graph into a DAG
  const dagResult = parseGraphToDAG(nodes, edges)
  
  if (!dagResult.isValid) {
    return {
      success: false,
      errors: dagResult.errors.map(error => ({ nodeId: 'graph', message: error })),
      nodeShapes: new Map<string, string>()
    }
  }
  
  // Compute shapes for each node
  const shapeResult = computeShapes(dagResult, inputShape)
  
  // Create a map of node IDs to their computed output shapes as formatted strings
  const nodeShapes = new Map<string, string>()
  
  // Convert computed shapes to formatted strings
  for (const [nodeId, shape] of shapeResult.nodeShapes.entries()) {
    nodeShapes.set(nodeId, formatShapeForDisplay(shape))
  }
  
  return {
    success: shapeResult.errors.length === 0,
    errors: shapeResult.errors,
    nodeShapes
  }
}

/**
 * Formats a shape array for display in the UI
 */
export function formatShapeForDisplay(shape: number[]): string {
  if (shape.length === 0) return '()'
  if (shape.length === 1) return `(${shape[0]},)`
  return `(${shape.join(', ')})`
}

/**
 * Validates if a shape string is in the correct format
 */
export function validateShapeString(shapeStr: string): boolean {
  try {
    const cleaned = shapeStr.trim()
    if (!cleaned.startsWith('(') || !cleaned.endsWith(')')) {
      return false
    }
    
    const content = cleaned.slice(1, -1).trim()
    if (content === '') return true // Empty tuple is valid
    
    const parts = content.split(',').map(s => s.trim())
    return parts.every(part => {
      const num = parseInt(part)
      return !isNaN(num) && num > 0
    })
  } catch {
    return false
  }
}

export type { ShapeError }
