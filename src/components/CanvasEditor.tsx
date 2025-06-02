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
  BackgroundVariant,
  ConnectionLineType
} from '@xyflow/react'
import type { 
  Connection,
  Edge,
  Node,
  NodeTypes
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { LayerNode } from './LayerNode'
import { getDefaultParams } from '../lib/layer-defs'
import { computeNetworkShapes } from '../lib/shape-utils'
// Removed clear all button imports - moved to BlockPalette

// Custom node types can be defined here
const nodeTypes: NodeTypes = {
  layerNode: LayerNode,
}

interface CanvasEditorProps {
  className?: string
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
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(propNodes)
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(propEdges)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)

  // Sync props with internal state when they change
  useEffect(() => {
    setNodes(propNodes)
  }, [propNodes, setNodes])

  useEffect(() => {
    setEdges(propEdges)
  }, [propEdges, setEdges])

  // Compute shapes and update error state
  const updateShapeErrors = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    try {
      // Find the input node to determine the input shape
      const inputNode = currentNodes.find(node => node.data.type === 'Input')
      let inputShape = '(224, 224, 3)' // Default fallback shape
      
      if (inputNode?.data.params) {
        const params = inputNode.data.params as Record<string, any>;
        // Check if it's the new input type structure
        if (params.inputType) {
          const inputType = params.inputType;
          switch (inputType) {
            case 'image_grayscale':
              const h1 = params.height || 28;
              const w1 = params.width || 28;
              inputShape = `(${h1}, ${w1}, 1)`;
              break;
            case 'image_color':
              const h2 = params.height || 28;
              const w2 = params.width || 28;
              inputShape = `(${h2}, ${w2}, 3)`;
              break;
            case 'image_custom':
              const h3 = params.height || 28;
              const w3 = params.width || 28;
              const c3 = params.channels || 1;
              inputShape = `(${h3}, ${w3}, ${c3})`;
              break;
            case 'flat_data':
              const size = params.flatSize || 784;
              inputShape = `(${size},)`;
              break;
            case 'sequence':
              const seqLen = params.seqLength || 100;
              const features = params.features || 128;
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
      
      const { errors } = computeNetworkShapes(currentNodes, currentEdges, inputShape)
      const errorMap = new Map<string, string>()
      
      errors.forEach(error => {
        errorMap.set(error.nodeId, error.message)
      })
      
      // Update nodes with error information
      const updatedNodes = currentNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          hasShapeError: errorMap.has(node.id),
          shapeErrorMessage: errorMap.get(node.id)
        }
      }))
      
      if (JSON.stringify(updatedNodes) !== JSON.stringify(currentNodes)) {
        setNodes(updatedNodes)
      }
    } catch (error) {
      console.error('Error computing shapes:', error)
    }
  }, [setNodes])

  // Effect to compute shapes when nodes or edges change
  useEffect(() => {
    if (nodes.length > 0) {
      updateShapeErrors(nodes, edges)
    }
  }, [nodes, edges, updateShapeErrors])

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
      // Add smoothstep edge type for cleaner vertical connections
      const edgeWithType = {
        ...params,
        type: 'smoothstep',
        style: { strokeWidth: 2, stroke: '#6b7280' }
      }
      const newEdges = addEdge(edgeWithType, edges)
      setEdges(newEdges)
      onEdgesChange?.(newEdges)
      // Update shape errors after connection change
      updateShapeErrors(nodes, newEdges)
    },
    [edges, setEdges, onEdgesChange, nodes, updateShapeErrors]
  )

  // Handle nodes changes with callback
  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChangeInternal(changes)
      
      // Use a timeout to get the updated nodes after the changes are applied
      setTimeout(() => {
        setNodes(currentNodes => {
          onNodesChange?.(currentNodes)
          return currentNodes
        })
      }, 0)
    },
    [onNodesChangeInternal, onNodesChange]
  )

  // Handle edges changes with callback
  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChangeInternal(changes)
      
      // Use a timeout to get the updated edges after the changes are applied
      setTimeout(() => {
        setEdges(currentEdges => {
          onEdgesChange?.(currentEdges)
          return currentEdges
        })
      }, 0)
    },
    [onEdgesChangeInternal, onEdgesChange]
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

      setNodes(currentNodes => [...currentNodes, newNode])
    },
    [reactFlowInstance, setNodes, onNodesChange]
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
