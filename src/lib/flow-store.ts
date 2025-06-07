import { create } from 'zustand'
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react'
import type { Node, Edge, NodeChange, EdgeChange, Connection } from '@xyflow/react'
import { parseGraphToDAG } from './dag-parser'
import { computeShapes } from './shape-computation'
import { computeYAMLDrivenShape } from './yaml-shape-loader'
import type { LayerParams } from './layer-defs'

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
  updateShapeErrors: () => Promise<void>
}

// Debouncing utility for shape error updates
let shapeUpdateTimeout: NodeJS.Timeout | null = null

const scheduleShapeUpdate = (updateFn: () => Promise<void>) => {
  if (shapeUpdateTimeout) {
    clearTimeout(shapeUpdateTimeout)
  }
  shapeUpdateTimeout = setTimeout(() => {
    updateFn()
    shapeUpdateTimeout = null
  }, 100) // Debounce rapid updates
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

  updateShapeErrors: async () => {
    const { nodes, edges } = get()
    
    // Early return if no nodes to process
    if (nodes.length === 0) {
      return
    }
    
    try {
      // Find the input node to determine the input shape
      const inputNode = nodes.find(node => node.data.type === 'Input')
      let inputShape = '(224, 224, 3)' // Default fallback shape
      
      if (inputNode?.data.params) {
        const params = inputNode.data.params as LayerParams;
        // Use YAML-driven shape computation for Input layer
        const shapeResult = await computeYAMLDrivenShape('Input', [], params)
        if (shapeResult.shape) {
          // Convert shape array to string format
          inputShape = `(${shapeResult.shape.join(', ')})`
        } else if (params.shape) {
          // Legacy fallback - convert to string
          inputShape = String(params.shape);
        }
      }
      
      // Parse the graph into a DAG
      const dagResult = parseGraphToDAG(nodes, edges)
      
      if (!dagResult.isValid) {
        const errorMap = new Map<string, string>()
        dagResult.errors.forEach(error => {
          errorMap.set('graph', error)
        })
        
        // Update nodes with error information
        let hasChanges = false
        const updatedNodes = nodes.map(node => {
          const hasError = errorMap.has('graph')
          const errorMessage = errorMap.get('graph')
          
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
        
        if (hasChanges) {
          set({ nodes: updatedNodes })
        }
        return
      }
      
      // Compute shapes for each node
      const { errors } = await computeShapes(dagResult, inputShape)
      const errorMap = new Map<string, string>()
      
      errors.forEach((error: { nodeId: string; message: string }) => {
        errorMap.set(error.nodeId, error.message)
      })
      
      // Update nodes with error information - optimize comparison
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
      
      // Only update state if there are actual changes
      if (hasChanges) {
        set({ nodes: updatedNodes })
      }
    } catch (error) {
      console.error('Error computing shapes:', error instanceof Error ? error.message : 'Unknown error')
    }
  }
}))
