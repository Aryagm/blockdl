import { useCallback, useState, useEffect } from 'react'
import { 
  ReactFlow, 
  ReactFlowProvider, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState, 
  useEdgesState,
  addEdge,
  BackgroundVariant
} from '@xyflow/react'
import type { 
  Connection,
  Edge,
  Node,
  NodeTypes
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { LayerNode } from './LayerNode'
import { getOrderedLayers, validateNetworkStructure } from '../lib/graph-utils'

// Initial nodes and edges - start with empty canvas
const initialNodes: Node[] = []

const initialEdges: Edge[] = []

// Custom node types can be defined here
const nodeTypes: NodeTypes = {
  layerNode: LayerNode,
}

// Default parameters for each layer type
const getDefaultParams = (type: string): Record<string, any> => {
  switch (type) {
    case 'Dense':
      return { units: 128 }
    case 'Activation':
      return { type: 'relu' }
    case 'Dropout':
      return { rate: 0.2 }
    case 'Input':
      return { shape: '(784,)' }
    case 'Output':
      return { units: 10, activation: 'softmax' }
    default:
      return {}
  }
}

interface CanvasEditorProps {
  className?: string
  onNodesChange?: (nodes: Node[]) => void
  onEdgesChange?: (edges: Edge[]) => void
}

function CanvasEditorInner({ 
  className = '',
  onNodesChange,
  onEdgesChange 
}: CanvasEditorProps) {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)

  // Add keyboard listener for global delete functionality
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // Only delete if no input element is focused
        const activeElement = document.activeElement
        if (activeElement && 
            (activeElement.tagName === 'INPUT' || 
             activeElement.tagName === 'TEXTAREA' || 
             (activeElement as HTMLElement).contentEditable === 'true')) {
          return
        }

        const selectedNodes = nodes.filter(node => node.selected)
        const selectedEdges = edges.filter(edge => edge.selected)
        
        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          event.preventDefault()
          
          // Remove selected nodes and edges
          const newNodes = nodes.filter(node => !node.selected)
          const newEdges = edges.filter(edge => !edge.selected && 
            !selectedNodes.some(selectedNode => 
              edge.source === selectedNode.id || edge.target === selectedNode.id
            )
          )
          
          setNodes(newNodes)
          setEdges(newEdges)
          onNodesChange?.(newNodes)
          onEdgesChange?.(newEdges)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange])

  // Handle connection between nodes
  const onConnect = useCallback(
    (params: Connection | Edge) => {
      const newEdges = addEdge(params, edges)
      setEdges(newEdges)
      onEdgesChange?.(newEdges)
    },
    [edges, setEdges, onEdgesChange]
  )

  // Handle nodes changes with callback
  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChangeInternal(changes)
      
      // Get updated nodes after changes are applied
      const updatedNodes = nodes // This will be updated on next render
      
      // Validate network structure and get ordered layers
      const orderedLayers = getOrderedLayers(updatedNodes, edges)
      const validation = validateNetworkStructure(updatedNodes, edges)
      
      console.log('Network validation:', validation)
      if (orderedLayers.length > 0) {
        console.log('Ordered layers:', orderedLayers)
      }
      
      onNodesChange?.(updatedNodes)
    },
    [onNodesChangeInternal, onNodesChange, nodes, edges]
  )

  // Handle edges changes with callback
  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChangeInternal(changes)
      
      // Validate network structure when edges change
      const orderedLayers = getOrderedLayers(nodes, edges)
      const validation = validateNetworkStructure(nodes, edges)
      
      console.log('Network validation (edges changed):', validation)
      if (orderedLayers.length > 0) {
        console.log('Ordered layers (edges changed):', orderedLayers)
      }
      
      onEdgesChange?.(edges)
    },
    [onEdgesChangeInternal, onEdgesChange, edges, nodes]
  )

  // Handle drag over event
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  // Handle drop event with custom layer type strings
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const reactFlowBounds = event.currentTarget.getBoundingClientRect()
      const layerType = event.dataTransfer.getData('layerType')

      // Check if the dropped element is valid
      if (typeof layerType === 'undefined' || !layerType) {
        return
      }

      const position = reactFlowInstance?.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      const newNode: Node = {
        id: `${layerType.toLowerCase()}-${Date.now()}`,
        type: 'layerNode',
        position,
        data: { 
          type: layerType,
          params: getDefaultParams(layerType)
        },
      }

      const newNodes = [...nodes, newNode]
      setNodes(newNodes)
      onNodesChange?.(newNodes)
    },
    [reactFlowInstance, nodes, setNodes, onNodesChange]
  )

  return (
    <div className={`h-full w-full ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="top-right"
        deleteKeyCode={['Delete', 'Backspace']}
        multiSelectionKeyCode={['Control', 'Meta']}
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={20} size={2} color="#cbd5e1" />
      </ReactFlow>
    </div>
  )
}

export function CanvasEditor(props: CanvasEditorProps) {
  return (
    <ReactFlowProvider>
      <CanvasEditorInner {...props} />
    </ReactFlowProvider>
  )
}
