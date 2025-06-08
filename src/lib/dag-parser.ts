/**
 * DAG Parser for Neural Network Graph Structures
 * 
 * Converts visual flow graphs into Directed Acyclic Graphs (DAGs) suitable
 * for neural network code generation. Handles topological sorting, cycle detection,
 * and variable name generation.
 * 
 * @author BlockDL Team
 * @version 1.0.0
 */

import type { Node, Edge } from '@xyflow/react'
import type { LayerParams } from './layer-definitions'
import graphlib from 'graphlib'

/**
 * Represents a processed layer object ready for code generation
 */
export interface LayerObject {
  /** Unique identifier for the layer */
  id: string
  /** Layer type (e.g., 'Dense', 'Conv2D') */
  type: string
  /** Layer configuration parameters */
  params: LayerParams
  /** Generated variable name for code output */
  varName: string
}

/**
 * Safely converts unknown params to LayerParams with type validation
 * @param params - Raw parameters object from node data
 * @returns Validated LayerParams object
 */
function convertToLayerParams(params: Record<string, unknown>): LayerParams {
  const result: LayerParams = {}
  
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      result[key] = value
    } else if (value != null) {
      result[key] = String(value)
    }
  }
  
  return result
}

/**
 * Result of parsing a graph into a DAG structure
 */
export interface DAGResult {
  /** Topologically sorted layer objects */
  orderedNodes: LayerObject[]
  /** Map of node ID to array of target node IDs */
  edgeMap: Map<string, string[]>
  /** Whether the graph is a valid DAG */
  isValid: boolean
  /** Array of validation error messages */
  errors: string[]
}

/**
 * Generates unique variable names for layers based on their type
 * @param orderedNodeIds - Array of node IDs in topological order
 * @param nodeMap - Map of node ID to Node object
 * @returns Map of node ID to generated variable name
 */
function generateVariableNames(orderedNodeIds: string[], nodeMap: Map<string, Node>): Map<string, string> {
  const typeCounters = new Map<string, number>()
  const varNames = new Map<string, string>()
  
  for (const nodeId of orderedNodeIds) {
    const node = nodeMap.get(nodeId)
    if (!node) {
      throw new Error(`Node with ID '${nodeId}' not found in node map`)
    }
    
    const nodeData = node.data as { type: string }
    const type = nodeData.type
    
    const counter = typeCounters.get(type) || 0
    typeCounters.set(type, counter + 1)
    
    const varName = counter === 0 ? type.toLowerCase() : `${type.toLowerCase()}_${counter}`
    varNames.set(nodeId, varName)
  }
  
  return varNames
}

/**
 * Parses a graph into a DAG structure with unique variable names for code generation.
 * Returns ordered nodes, edge map, and validation information.
 * Uses graphlib for robust cycle detection and topological sorting.
 */
export function parseGraphToDAG(nodes: Node[], edges: Edge[]): DAGResult {
  const errors: string[] = []
  
  if (nodes.length === 0) {
    return {
      orderedNodes: [],
      edgeMap: new Map(),
      isValid: false,
      errors: ['Network must have at least one layer']
    }
  }

  // Create graphlib Graph instance and node map
  const graph = new graphlib.Graph({ directed: true })
  const nodeMap = new Map<string, Node>()
  
  nodes.forEach(node => {
    nodeMap.set(node.id, node)
    graph.setNode(node.id)
  })

  edges.forEach(edge => {
    graph.setEdge(edge.source, edge.target)
  })

  // Validate input/output structure
  const inputNodes = nodes.filter(node => graph.inEdges(node.id)?.length === 0)
  const outputNodes = nodes.filter(node => graph.outEdges(node.id)?.length === 0)
  
  if (inputNodes.length === 0) errors.push('Network must have at least one Input layer')
  if (outputNodes.length === 0) errors.push('Network must have at least one Output layer')

  // Check for cycles
  if (!graphlib.alg.isAcyclic(graph)) {
    errors.push('Network contains cycles - DAG structure required')
  }

  // Return early if validation fails
  if (errors.length > 0) {
    return { orderedNodes: [], edgeMap: new Map(), isValid: false, errors }
  }

  // Perform topological sort and generate variable names
  const topologicalOrder = graphlib.alg.topsort(graph)
  const varNames = generateVariableNames(topologicalOrder, nodeMap)

  // Create ordered LayerObjects
  const orderedNodes: LayerObject[] = topologicalOrder.map((nodeId: string) => {
    const node = nodeMap.get(nodeId)!
    const nodeData = node.data as { type: string; params?: Record<string, unknown> }
    
    return {
      id: node.id,
      type: nodeData.type,
      params: convertToLayerParams(nodeData.params || {}),
      varName: varNames.get(nodeId)!
    }
  })

  // Build edge map
  const edgeMap = new Map<string, string[]>()
  nodes.forEach(node => {
    const outgoingEdges = graph.outEdges(node.id) || []
    const targets = outgoingEdges.map((edge: { w: string }) => edge.w)
    edgeMap.set(node.id, targets)
  })

  return { orderedNodes, edgeMap, isValid: true, errors: [] }
}


