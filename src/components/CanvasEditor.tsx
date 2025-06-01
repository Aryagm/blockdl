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
import { parseGraphToDAG, validateNetworkStructure } from '../lib/graph-utils'
import { getDefaultParams } from '../lib/layer-defs'

// Initial nodes and edges - start with empty canvas
const initialNodes: Node[] = []

const initialEdges: Edge[] = []

// Custom node types can be defined here
const nodeTypes: NodeTypes = {
  layerNode: LayerNode,
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
      
      // Validate network structure and get DAG information
      const dagResult = parseGraphToDAG(updatedNodes, edges)
      const validation = validateNetworkStructure(updatedNodes, edges)
      
      console.log('Network validation:', validation)
      if (dagResult.isValid) {
        console.log('DAG structure:', {
          nodeCount: dagResult.orderedNodes.length,
          hasComplexStructure: Array.from(dagResult.edgeMap.values()).some(targets => targets.length > 1)
        })
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
      const dagResult = parseGraphToDAG(nodes, edges)
      const validation = validateNetworkStructure(nodes, edges)
      
      console.log('Network validation (edges changed):', validation)
      if (dagResult.isValid) {
        console.log('DAG structure (edges changed):', {
          nodeCount: dagResult.orderedNodes.length,
          hasComplexStructure: Array.from(dagResult.edgeMap.values()).some(targets => targets.length > 1)
        })
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
        deleteKeyCode={[]}
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
