import { create } from 'zustand'
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react'
import type { Node, Edge, NodeChange, EdgeChange, Connection } from '@xyflow/react'
import { computeNetworkShapes } from './shape-utils'

interface LayerParams {
  inputType?: string;
  height?: number;
  width?: number;
  channels?: number;
  flatSize?: number;
  seqLength?: number;
  features?: number;
  customShape?: string;
  shape?: string;
  [key: string]: unknown;
}

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

  updateShapeErrors: () => {
    const { nodes, edges } = get()
    
    try {
      // Find the input node to determine the input shape
      const inputNode = nodes.find(node => node.data.type === 'Input')
      let inputShape = '(224, 224, 3)' // Default fallback shape
      
      if (inputNode?.data.params) {
        const params = inputNode.data.params as LayerParams;
        // Check if it's the new input type structure
        if (params.inputType) {
          const inputType = params.inputType;
          let h = 28;
          let w = 28;
          let c = 1;
          let size = 784;
          let seqLen = 100;
          let features = 128;

          switch (inputType) {
            case 'image_grayscale':
              h = params.height || 28;
              w = params.width || 28;
              inputShape = `(${h}, ${w}, 1)`;
              break;
            case 'image_color':
              h = params.height || 28;
              w = params.width || 28;
              inputShape = `(${h}, ${w}, 3)`;
              break;
            case 'image_custom':
              h = params.height || 28;
              w = params.width || 28;
              c = params.channels || 1;
              inputShape = `(${h}, ${w}, ${c})`;
              break;
            case 'flat_data':
              size = params.flatSize || 784;
              inputShape = `(${size},)`;
              break;
            case 'sequence':
              seqLen = params.seqLength || 100;
              features = params.features || 128;
              inputShape = `(${seqLen}, ${features})`;
              break;
            case 'custom':
              inputShape = params.customShape || '(784,)';
              break;
            default:
              inputShape = '(784,)';
          }
        } else if (params.shape) {
          // Legacy input layer with shape parameter
          inputShape = params.shape;
        }
      }
      
      const { errors } = computeNetworkShapes(nodes, edges, inputShape)
      const errorMap = new Map<string, string>()
      
      errors.forEach(error => {
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
