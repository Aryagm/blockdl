import { create } from 'zustand'
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react'
import type { Node, Edge, NodeChange, EdgeChange, Connection } from '@xyflow/react'
import { parseGraphToDAG } from './dag-parser'
import { computeShapes } from './shape-computation'
import { getLayerDefinition } from './layer-definitions'

interface FlowState {
  nodes: Node[]
  edges: Edge[]
  
  // Actions
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addNode: (node: Node) => void
  updateShapeErrors: () => void
}

// Constants for configuration
const SHAPE_UPDATE_DEBOUNCE_MS = 100
const DEFAULT_INPUT_SHAPE = '(28, 28, 1)'

// Debouncing utility for shape error updates
let shapeUpdateTimeout: NodeJS.Timeout | null = null

const scheduleShapeUpdate = (updateFn: () => void) => {
  if (shapeUpdateTimeout) {
    clearTimeout(shapeUpdateTimeout)
  }
  shapeUpdateTimeout = setTimeout(() => {
    updateFn()
    shapeUpdateTimeout = null
  }, SHAPE_UPDATE_DEBOUNCE_MS)
}

/**
 * Helper function to compute input shape from Input node
 */
const getInputShape = (nodes: Node[]): string => {
  const inputNode = nodes.find(node => node.data.type === 'Input')
  
  if (!inputNode?.data.params) {
    return DEFAULT_INPUT_SHAPE
  }
  
  const params = inputNode.data.params as Record<string, unknown>
  const inputLayerDef = getLayerDefinition('Input')
  
  if (inputLayerDef) {
    const computedShape = inputLayerDef.computeShape([], params)
    if (computedShape) {
      return `(${computedShape.join(', ')})`
    }
  }
  
  // Legacy fallback
  if (params.shape && typeof params.shape === 'string') {
    return params.shape
  }
  
  return DEFAULT_INPUT_SHAPE
}

/**
 * Helper function to update nodes with error information
 */
const updateNodesWithErrors = (
  nodes: Node[], 
  errorMap: Map<string, string>
): { nodes: Node[], hasChanges: boolean } => {
  let hasChanges = false
  
  const updatedNodes = nodes.map(node => {
    const hasError = errorMap.has(node.id)
    const errorMessage = errorMap.get(node.id)
    
    if (node.data.hasShapeError !== hasError || node.data.shapeErrorMessage !== errorMessage) {
      hasChanges = true
      return {
        ...node,
        data: {
          ...node.data,
          hasShapeError: hasError,
          shapeErrorMessage: errorMessage
        }
      }
    }
    return node
  })
  
  return { nodes: updatedNodes, hasChanges }
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],

  setNodes: (nodes) => {
    set({ nodes })
    scheduleShapeUpdate(() => get().updateShapeErrors())
  },

  setEdges: (edges) => {
    set({ edges })
    scheduleShapeUpdate(() => get().updateShapeErrors())
  },

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    })
    scheduleShapeUpdate(() => get().updateShapeErrors())
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    })
    scheduleShapeUpdate(() => get().updateShapeErrors())
  },

  onConnect: (connection) => {
    const edgeWithType = {
      ...connection,
      type: 'smoothstep',
      style: { strokeWidth: 2, stroke: '#6b7280' }
    }
    set({
      edges: addEdge(edgeWithType, get().edges),
    })
    scheduleShapeUpdate(() => get().updateShapeErrors())
  },

  addNode: (node) => {
    set({
      nodes: [...get().nodes, node],
    })
    scheduleShapeUpdate(() => get().updateShapeErrors())
  },

  updateShapeErrors: () => {
    const { nodes, edges } = get()
    
    // Early return if no nodes to process
    if (nodes.length === 0) {
      return
    }
    
    try {
      const inputShape = getInputShape(nodes)
      const dagResult = parseGraphToDAG(nodes, edges)
      
      if (!dagResult.isValid) {
        // For DAG errors, mark all nodes as having graph-level errors
        const errorMap = new Map<string, string>()
        const firstError = dagResult.errors[0] || 'Invalid graph structure'
        
        // Apply error to all nodes for visibility
        nodes.forEach(node => {
          errorMap.set(node.id, firstError)
        })
        
        const { nodes: updatedNodes, hasChanges } = updateNodesWithErrors(nodes, errorMap)
        if (hasChanges) {
          set({ nodes: updatedNodes })
        }
        return
      }
      
      // Compute shapes for each node
      const { errors } = computeShapes(dagResult, inputShape)
      const errorMap = new Map<string, string>()
      
      errors.forEach(error => {
        errorMap.set(error.nodeId, error.message)
      })
      
      const { nodes: updatedNodes, hasChanges } = updateNodesWithErrors(nodes, errorMap)
      if (hasChanges) {
        set({ nodes: updatedNodes })
      }
    } catch (error) {
      console.error('Error computing shapes:', error instanceof Error ? error.message : 'Unknown error')
    }
  }
}))
