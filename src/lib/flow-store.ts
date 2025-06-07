import { create } from 'zustand'
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react'
import type { Node, Edge, NodeChange, EdgeChange, Connection } from '@xyflow/react'
import { computeNetworkShapes } from './shape-utils'
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

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],

  setNodes: (nodes) => {
    set({ nodes })
    // Update shape errors after setting nodes
    setTimeout(() => get().updateShapeErrors(), 0)
  },

  setEdges: (edges) => {
    set({ edges })
    // Update shape errors after setting edges
    setTimeout(() => get().updateShapeErrors(), 0)
  },

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    })
    // Update shape errors after node changes
    setTimeout(() => get().updateShapeErrors(), 0)
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    })
    // Update shape errors after edge changes
    setTimeout(() => get().updateShapeErrors(), 0)
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
    // Update shape errors after connection
    setTimeout(() => get().updateShapeErrors(), 0)
  },

  addNode: (node) => {
    set({
      nodes: [...get().nodes, node],
    })
    // Update shape errors after adding node
    setTimeout(() => get().updateShapeErrors(), 0)
  },

  updateShapeErrors: async () => {
    const { nodes, edges } = get()
    
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
      
      const { errors } = await computeNetworkShapes(nodes, edges, inputShape)
      const errorMap = new Map<string, string>()
      
      errors.forEach((error: { nodeId: string; message: string }) => {
        errorMap.set(error.nodeId, error.message)
      })
      
      // Update nodes with error information
      const updatedNodes = nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          hasShapeError: errorMap.has(node.id),
          shapeErrorMessage: errorMap.get(node.id)
        }
      }))
      
      if (JSON.stringify(updatedNodes) !== JSON.stringify(nodes)) {
        set({ nodes: updatedNodes })
      }
    } catch (error) {
      console.error('Error computing shapes:', error instanceof Error ? error.message : 'Unknown error')
    }
  }
}))
