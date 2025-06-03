import { useCallback, useState, useEffect } from 'react'
import { 
  ReactFlow, 
  ReactFlowProvider, 
  Background, 
  Controls, 
  MiniMap,
  BackgroundVariant,
  ConnectionLineType,
} from '@xyflow/react'
import type { 
  Edge,
  Node,
  NodeTypes,
  ReactFlowInstance,
  XYPosition
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { LayerNode } from './LayerNode'
import { getDefaultParams } from '../lib/layer-defs'
import { useFlowStore } from '../lib/flow-store'

// Custom node types can be defined here
const nodeTypes: NodeTypes = {
  layerNode: LayerNode,
}

interface CanvasEditorProps {
  className?: string
  // For backwards compatibility, but we'll use Zustand instead
  nodes?: Node[]
  edges?: Edge[]
  onNodesChange?: (nodes: Node[]) => void
  onEdgesChange?: (edges: Edge[]) => void
}

function CanvasEditorInner({ 
  className = '',
  nodes: propNodes = [],
  edges: propEdges = [],
  onNodesChange,
  onEdgesChange 
}: CanvasEditorProps) {
  const { 
    nodes, 
    edges, 
    setNodes,
    setEdges,
    onNodesChange: onNodesChangeStore, 
    onEdgesChange: onEdgesChangeStore, 
    onConnect: onConnectStore,
    addNode 
  } = useFlowStore()
  
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)

  // Initialize store with prop values on mount if store is empty
  useEffect(() => {
    if (nodes.length === 0 && propNodes.length > 0) {
      setNodes(propNodes)
    }
    if (edges.length === 0 && propEdges.length > 0) {
      setEdges(propEdges)
    }
  }, [nodes.length, edges.length, propNodes, propEdges, setNodes, setEdges])

  // Notify parent when store state changes (for backwards compatibility)
  useEffect(() => {
    if (onNodesChange) {
      onNodesChange(nodes)
    }
  }, [nodes, onNodesChange])

  useEffect(() => {
    if (onEdgesChange) {
      onEdgesChange(edges)
    }
  }, [edges, onEdgesChange])

  // Prevent all delete key functionality
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // Check if the target is an input element where deletion should be allowed
        const target = event.target as HTMLElement
        if (target && (
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' ||
          target.contentEditable === 'true'
        )) {
          return // Allow deletion in input fields
        }
        
        // Prevent all other delete operations
        event.preventDefault()
        event.stopPropagation()
      }
    }

    // Add event listener with capture to intercept before ReactFlow
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [])

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
      if (typeof layerType === 'undefined' || !layerType || !reactFlowInstance) {
        return
      }

      const position: XYPosition = reactFlowInstance.screenToFlowPosition({
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

      addNode(newNode)
    },
    [reactFlowInstance, addNode]
  )

  return (
    <div className={`h-full w-full ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeStore}
        onEdgesChange={onEdgesChangeStore}
        onConnect={onConnectStore}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="top-right"
        deleteKeyCode={[]}
        multiSelectionKeyCode={['Control', 'Meta']}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { strokeWidth: 2, stroke: '#6b7280' }
        }}
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Lines} gap={25} size={1} color="#f7f7f7" />
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
