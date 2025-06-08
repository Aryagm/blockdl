/**
 * DAG Parser for Neural Network Graph Structures
 * 
 * Converts visual flow graphs into topologically sorted layer objects
 * for neural network code generation.
 */

import type { Node, Edge } from '@xyflow/react'
import type { LayerParams } from './layers/parameters'
import graphlib from 'graphlib'

export interface LayerObject {
  id: string
  type: string
  params: LayerParams
  varName: string
}

export interface DAGResult {
  orderedNodes: LayerObject[]
  edgeMap: Map<string, string[]>
  isValid: boolean
  errors: string[]
}

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

function generateVariableNames(orderedNodeIds: string[], nodeMap: Map<string, Node>): Map<string, string> {
  const typeCounters = new Map<string, number>()
  const varNames = new Map<string, string>()
  
  for (const nodeId of orderedNodeIds) {
    const node = nodeMap.get(nodeId)
    if (!node) throw new Error(`Node '${nodeId}' not found`)
    
    const type = (node.data as { type: string }).type
    const counter = typeCounters.get(type) || 0
    typeCounters.set(type, counter + 1)
    
    const varName = counter === 0 ? type.toLowerCase() : `${type.toLowerCase()}_${counter}`
    varNames.set(nodeId, varName)
  }
  
  return varNames
}

export function parseGraphToDAG(nodes: Node[], edges: Edge[]): DAGResult {
  const errors: string[] = []
  
  if (nodes.length === 0) {
    return { orderedNodes: [], edgeMap: new Map(), isValid: false, errors: ['Network must have at least one layer'] }
  }

  const graph = new graphlib.Graph({ directed: true })
  const nodeMap = new Map<string, Node>()
  
  // Build graph structure
  nodes.forEach(node => {
    nodeMap.set(node.id, node)
    graph.setNode(node.id)
  })

  edges.forEach(edge => {
    graph.setEdge(edge.source, edge.target)
  })

  // Validate structure
  const inputNodes = nodes.filter(node => graph.inEdges(node.id)?.length === 0)
  const outputNodes = nodes.filter(node => graph.outEdges(node.id)?.length === 0)
  
  if (inputNodes.length === 0) errors.push('Network must have at least one Input layer')
  if (outputNodes.length === 0) errors.push('Network must have at least one Output layer')
  if (!graphlib.alg.isAcyclic(graph)) errors.push('Network contains cycles - DAG structure required')

  if (errors.length > 0) {
    return { orderedNodes: [], edgeMap: new Map(), isValid: false, errors }
  }

  // Generate ordered nodes with variable names
  const topologicalOrder = graphlib.alg.topsort(graph)
  const varNames = generateVariableNames(topologicalOrder, nodeMap)

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


