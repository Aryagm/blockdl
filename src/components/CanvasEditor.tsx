import { useCallback, useState } from 'react'
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

// Initial nodes and edges
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Input Node' },
    position: { x: 250, y: 25 },
  },
  {
    id: '2',
    data: { label: 'Default Node' },
    position: { x: 100, y: 125 },
  },
  {
    id: '3',
    type: 'output',
    data: { label: 'Output Node' },
    position: { x: 250, y: 250 },
  },
]

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
]

// Custom node types can be defined here
const nodeTypes: NodeTypes = {
  // Add custom node types as needed
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
      onNodesChange?.(nodes)
    },
    [onNodesChangeInternal, onNodesChange, nodes]
  )

  // Handle edges changes with callback
  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChangeInternal(changes)
      onEdgesChange?.(edges)
    },
    [onEdgesChangeInternal, onEdgesChange, edges]
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
      const type = event.dataTransfer.getData('application/reactflow')
      const layerType = event.dataTransfer.getData('application/layertype')

      // Check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return
      }

      const position = reactFlowInstance?.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { 
          label: `${type} node`,
          layerType: layerType || 'default'
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
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
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
