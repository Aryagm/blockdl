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
  ConnectionLineType,
} from '@xyflow/react'
import type { 
  Connection,
  Edge,
  Node,
  NodeTypes,
  NodeChange,
  EdgeChange,
  ReactFlowInstance,
  XYPosition
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { LayerNode } from './LayerNode'
import { getDefaultParams } from '../lib/layer-defs'
import { computeNetworkShapes } from '../lib/shape-utils'

// Custom node types can be defined here
const nodeTypes: NodeTypes = {
  layerNode: LayerNode,
}

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
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)

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
      console.error('Error computing shapes:', error instanceof Error ? error.message : 'Unknown error')
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
    (changes: NodeChange[]) => {
      onNodesChangeInternal(changes)
      // Let React Flow handle the internal state changes first
      // Then notify parent component with the updated state
      setTimeout(() => {
        if (onNodesChange && reactFlowInstance) {
          const currentNodes = reactFlowInstance.getNodes()
          onNodesChange(currentNodes)
        }
      }, 0)
    },
    [onNodesChangeInternal, onNodesChange, reactFlowInstance]
  )

  // Handle edges changes with callback
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChangeInternal(changes)
      // Let React Flow handle the internal state changes first
      // Then notify parent component with the updated state
      setTimeout(() => {
        if (onEdgesChange && reactFlowInstance) {
          const currentEdges = reactFlowInstance.getEdges()
          onEdgesChange(currentEdges)
        }
      }, 0)
    },
    [onEdgesChangeInternal, onEdgesChange, reactFlowInstance]
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

      setNodes(nodes => {
        const updatedNodes = [...nodes, newNode]
        // Notify parent component about the change
        setTimeout(() => {
          if (onNodesChange) {
            onNodesChange(updatedNodes)
          }
        }, 0)
        return updatedNodes
      })
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
