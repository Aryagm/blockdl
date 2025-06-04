import type { Node, Edge } from '@xyflow/react'
import { Graph, alg } from 'graphlib'
import { generateLayerCode, getUsedKerasImports } from './layer-defs'

export interface LayerObject {
  id: string
  type: string
  params: Record<string, any>
  varName: string
}

export interface DAGResult {
  orderedNodes: LayerObject[]
  edgeMap: Map<string, string[]>
  isValid: boolean
  errors: string[]
}

export interface ShapeError {
  nodeId: string
  message: string
}

/**
 * Parses a graph into a DAG structure with unique variable names for code generation.
 * Returns ordered nodes, edge map, and validation information.
 * Uses graphlib for robust cycle detection and topological sorting.
 */
export function parseGraphToDAG(nodes: Node[], edges: Edge[]): DAGResult {
  const errors: string[] = []
  
  if (nodes.length === 0) {
    return {
      orderedNodes: [],
      edgeMap: new Map(),
      isValid: false,
      errors: ['Network must have at least one layer']
    }
  }

  // Create graphlib Graph instance
  const graph = new Graph({ directed: true })
  
  // Convert nodes to a map for easy lookup
  const nodeMap = new Map<string, Node>()
  nodes.forEach(node => {
    nodeMap.set(node.id, node)
    graph.setNode(node.id)
  })

  // Add edges to the graph
  edges.forEach(edge => {
    graph.setEdge(edge.source, edge.target)
  })

  // Find input nodes (nodes with no incoming edges)
  const inputNodes = nodes.filter(node => {
    return graph.inEdges(node.id)?.length === 0
  })

  // Find output nodes (nodes with no outgoing edges)
  const outputNodes = nodes.filter(node => {
    return graph.outEdges(node.id)?.length === 0
  })

  // Validate input/output structure
  if (inputNodes.length === 0) {
    errors.push('Network must have at least one Input layer')
  }
  if (outputNodes.length === 0) {
    errors.push('Network must have at least one Output layer')
  }

  // Check for cycles using graphlib's isAcyclic function
  if (!alg.isAcyclic(graph)) {
    errors.push('Network contains cycles - DAG structure required')
  }

  // If there are validation errors, return early
  if (errors.length > 0) {
    return {
      orderedNodes: [],
      edgeMap: new Map(),
      isValid: false,
      errors
    }
  }

  // Perform topological sort using graphlib
  const topologicalOrder = alg.topsort(graph)
  
  // Generate unique variable names
  const typeCounters = new Map<string, number>()
  
  function generateVarName(type: string): string {
    const counter = typeCounters.get(type) || 0
    typeCounters.set(type, counter + 1)
    
    if (counter === 0) {
      return type.toLowerCase()
    }
    return `${type.toLowerCase()}_${counter}`
  }

  // Create ordered LayerObjects
  const orderedNodes: LayerObject[] = topologicalOrder.map(nodeId => {
    const node = nodeMap.get(nodeId)!
    const nodeData = node.data as { type: string; params?: Record<string, unknown> }
    
    return {
      id: node.id,
      type: nodeData.type,
      params: nodeData.params || {},
      varName: generateVarName(nodeData.type)
    }
  })

  // Build edge map for compatibility with existing code
  const edgeMap = new Map<string, string[]>()
  nodes.forEach(node => {
    const outgoingEdges = graph.outEdges(node.id) || []
    const targets = outgoingEdges.map(edge => edge.w)
    edgeMap.set(node.id, targets)
  })

  return {
    orderedNodes,
    edgeMap,
    isValid: true,
    errors: []
  }
}

/**
 * Legacy function for backward compatibility - returns only ordered layers for linear paths
 */
export function getOrderedLayers(nodes: Node[], edges: Edge[]): LayerObject[] {
  const result = parseGraphToDAG(nodes, edges)
  
  // For backward compatibility, only return ordered nodes if it's a valid linear path
  if (!result.isValid) {
    return []
  }
  
  // Check if it's a linear path (each node has at most one outgoing connection)
  for (const [_nodeId, targets] of result.edgeMap.entries()) {
    if (targets.length > 1) {
      return [] // Not a linear path
    }
  }
  
  return result.orderedNodes
}

/**
 * Validates if the current graph structure represents a valid neural network DAG
 */
export function validateNetworkStructure(nodes: Node[], edges: Edge[]): {
  isValid: boolean
  errors: string[]
} {
  const result = parseGraphToDAG(nodes, edges)
  return {
    isValid: result.isValid,
    errors: result.errors
  }
}

/**
 * Generates Keras/TensorFlow Python code from a DAG structure
 */
export function generateKerasCode(layers: LayerObject[]): string {
  if (layers.length === 0) {
    return '# No layers to generate code for'
  }

  // For now, we'll generate Sequential model code for backward compatibility
  // TODO: Add support for Functional API for complex DAG structures
  
  // Generate imports using only the layers that are actually used
  const usedLayerTypes = layers.map(layer => layer.type)
  const kerasImports = getUsedKerasImports(usedLayerTypes)
  const imports = [
    'import tensorflow as tf',
    'from tensorflow.keras.models import Sequential',
    `from tensorflow.keras.layers import ${kerasImports.join(', ')}`
  ]

  // Generate model creation
  const modelLines: string[] = ['', '# Create the model', 'model = Sequential([']

  // Generate layer code
  layers.forEach((layer) => {
    const layerCode = generateLayerCode(layer.type, layer.params)
    if (layerCode) {
      // Handle multi-line layer code (for multiplier > 5)
      const lines = layerCode.split('\n')
      if (lines.length > 1) {
        // Multi-line code: add comment first, then the layer code
        lines.forEach((line, index) => {
          if (index === 0) {
            // First line is the comment
            modelLines.push(`    ${line}`)
          } else {
            // Subsequent lines - check if it's spread operator syntax
            const trimmedLine = line.trim()
            if (trimmedLine.startsWith('*[') && trimmedLine.endsWith(']')) {
              // Spread operator syntax - don't add comma
              modelLines.push(`    ${line}`)
            } else {
              // Regular layer code - add comma only if it doesn't already end with one
              const hasComma = trimmedLine.endsWith(',')
              modelLines.push(`    ${line}${hasComma ? '' : ','}`)
            }
          }
        })
      } else {
        // Single line code - check if it's spread operator syntax
        const trimmedCode = layerCode.trim()
        if (trimmedCode.startsWith('*[') && trimmedCode.endsWith(']')) {
          // Spread operator syntax - don't add comma
          modelLines.push(`    ${layerCode}`)
        } else {
          // Regular layer code - add comma
          modelLines.push(`    ${layerCode},`)
        }
      }
    }
  })

  modelLines.push('])')

  // Generate compilation and summary
  const compilationLines: string[] = [
    '',
    '# Compile the model',
    'model.compile(',
    "    optimizer='adam',",
    "    loss='categorical_crossentropy',",
    "    metrics=['accuracy']",
    ')',
    '',
    '# Display model summary',
    'model.summary()'
  ]

  return [...imports, ...modelLines, ...compilationLines].join('\n')
}

/**
 * Generates Keras Functional API code for complex DAG structures
 */
export function generateFunctionalKerasCode(dagResult: DAGResult): string {
  if (!dagResult.isValid || dagResult.orderedNodes.length === 0) {
    return '# Invalid DAG structure - cannot generate code'
  }

  const { orderedNodes, edgeMap } = dagResult

  // Generate imports using only the layers that are actually used
  const usedLayerTypes = orderedNodes.map(layer => layer.type)
  const kerasImports = getUsedKerasImports(usedLayerTypes.filter(type => type !== 'Input'))
  const imports = [
    'import tensorflow as tf',
    'from tensorflow.keras.models import Model',
    'from tensorflow.keras.layers import Input',
    `from tensorflow.keras.layers import ${kerasImports.join(', ')}`
  ]

  const codeLines: string[] = [...imports, '']

  // Track variable assignments
  const layerVariables = new Map<string, string>()

  // Generate layer definitions
  orderedNodes.forEach((layer) => {
    const { id, type, params, varName } = layer
    
    if (type === 'Input') {
      // Handle input layers - compute shape from inputType and dimensions
      let shape = '(784,)' // fallback default
      
      if (params.inputType) {
        // New input layer structure - compute shape from input type
        const inputType = params.inputType;
        switch (inputType) {
          case 'image_grayscale':
            const h1 = params.height || 28;
            const w1 = params.width || 28;
            shape = `(${h1}, ${w1}, 1)`;
            break;
          case 'image_color':
            const h2 = params.height || 28;
            const w2 = params.width || 28;
            shape = `(${h2}, ${w2}, 3)`;
            break;
          case 'image_custom':
            const h3 = params.height || 28;
            const w3 = params.width || 28;
            const c3 = params.channels || 1;
            shape = `(${h3}, ${w3}, ${c3})`;
            break;
          case 'flat_data':
            const size = params.flatSize || 784;
            shape = `(${size},)`;
            break;
          case 'sequence':
            const seqLen = params.seqLength || 100;
            const features = params.features || 128;
            shape = `(${seqLen}, ${features})`;
            break;
          case 'custom':
            shape = params.customShape || '(784,)';
            break;
          default:
            shape = '(784,)';
        }
      } else if (params.shape) {
        // Legacy input layer with shape parameter
        shape = params.shape;
      }
      
      codeLines.push(`${varName} = Input(shape=${shape})`)
      layerVariables.set(id, varName)
    } else {
      // Handle other layers
      const layerCode = generateLayerCode(type, params)
      const inputNodes = []
      
      // Find input connections for this layer
      for (const [sourceId, targets] of edgeMap.entries()) {
        if (targets.includes(id)) {
          const inputVar = layerVariables.get(sourceId)
          if (inputVar) {
            inputNodes.push(inputVar)
          }
        }
      }
      
      // Check if this is multi-line layer code 
      const lines = layerCode.split('\n')
      const isMultiLine = lines.length > 1
      
      if (isMultiLine) {
        // Check if it's multiplier > 5 (starts with comment) or multiplier <= 5 (comma-separated layers)
        const firstLine = lines[0].trim()
        const isCommentMultiplier = firstLine.startsWith('#')
        const isCommaSeparatedMultiplier = layerCode.includes(',\n    ')
        
        if (isCommentMultiplier) {
          // Handle multiplier > 5 case for Functional API with condensed approach
          const commentLine = lines[0]
          const spreadLine = lines[1]
          
          codeLines.push(`${commentLine}`)
          
          if (inputNodes.length === 0) {
            codeLines.push(`# Warning: ${varName} has no inputs`)
            codeLines.push(`${varName} = ${spreadLine}`)
          } else if (inputNodes.length === 1) {
            // Use a more readable loop approach
            const match = spreadLine.match(/\*\[(.+?) for _ in range\((\d+)\)\]/)
            if (match) {
              const layerConstructor = match[1]
              const count = parseInt(match[2])
              
              // Generate a for loop for better readability
              codeLines.push(`${varName} = ${inputNodes[0]}`)
              codeLines.push(`for _ in range(${count}):`)
              codeLines.push(`    ${varName} = ${layerConstructor}(${varName})`)
            }
          } else {
            // Multiple inputs - might need merge layer
            if (type === 'Merge') {
              codeLines.push(`${varName} = ${spreadLine}([${inputNodes.join(', ')}])`)
            } else {
              codeLines.push(`${varName} = ${spreadLine}([${inputNodes.join(', ')}])`)
            }
          }
        } else if (isCommaSeparatedMultiplier) {
          // Handle multiplier <= 5 case - chain individual layers
          const individualLayers = layerCode.split(',\n    ').map(layer => layer.trim())
          
          if (inputNodes.length === 0) {
            codeLines.push(`# Warning: ${varName} has no inputs`)
            codeLines.push(`${varName} = ${individualLayers[0]}`)
          } else if (inputNodes.length === 1) {
            let currentVar = inputNodes[0]
            individualLayers.forEach((layer, index) => {
              if (index === 0) {
                codeLines.push(`${varName} = ${layer}(${currentVar})`)
                currentVar = varName
              } else {
                const nextVarName = `${varName.replace(/\d+$/, '')}_${index}`
                codeLines.push(`${nextVarName} = ${layer}(${currentVar})`)
                currentVar = nextVarName
                layerVariables.set(`${id}_${index}`, nextVarName)
              }
            })
            // Update the final variable name
            if (individualLayers.length > 1) {
              const finalVarName = `${varName.replace(/\d+$/, '')}_${individualLayers.length - 1}`
              layerVariables.set(id, finalVarName)
            }
          } else {
            // Multiple inputs - handle as single layer for now
            codeLines.push(`${varName} = ${individualLayers[0]}([${inputNodes.join(', ')}])`)
          }
        }
        
        if (!isCommaSeparatedMultiplier) {
          layerVariables.set(id, varName)
        }
      } else {
        // Single line layer code - handle normally
        if (inputNodes.length === 0) {
          codeLines.push(`# Warning: ${varName} has no inputs`)
          codeLines.push(`${varName} = ${layerCode}`)
        } else if (inputNodes.length === 1) {
          codeLines.push(`${varName} = ${layerCode}(${inputNodes[0]})`)
        } else {
          // Multiple inputs - might need merge layer
          if (type === 'Merge') {
            codeLines.push(`${varName} = ${layerCode}([${inputNodes.join(', ')}])`)
          } else {
            codeLines.push(`${varName} = ${layerCode}([${inputNodes.join(', ')}])`)
          }
        }
        layerVariables.set(id, varName)
      }
    }
  })

  // Find output nodes
  const outputVars: string[] = []
  orderedNodes.forEach((layer) => {
    const hasOutgoing = edgeMap.has(layer.id) && edgeMap.get(layer.id)!.length > 0
    if (!hasOutgoing) {
      const outputVar = layerVariables.get(layer.id)
      if (outputVar) {
        outputVars.push(outputVar)
      }
    }
  })

  // Find input nodes
  const inputVars: string[] = []
  orderedNodes.forEach((layer) => {
    if (layer.type === 'Input') {
      const inputVar = layerVariables.get(layer.id)
      if (inputVar) {
        inputVars.push(inputVar)
      }
    }
  })

  // Generate model creation
  codeLines.push('')
  if (inputVars.length === 1 && outputVars.length === 1) {
    codeLines.push(`model = Model(inputs=${inputVars[0]}, outputs=${outputVars[0]})`)
  } else {
    const inputsStr = inputVars.length === 1 ? inputVars[0] : `[${inputVars.join(', ')}]`
    const outputsStr = outputVars.length === 1 ? outputVars[0] : `[${outputVars.join(', ')}]`
    codeLines.push(`model = Model(inputs=${inputsStr}, outputs=${outputsStr})`)
  }

  // Generate compilation and summary
  const compilationLines: string[] = [
    '',
    '# Compile the model',
    'model.compile(',
    "    optimizer='adam',",
    "    loss='categorical_crossentropy',",
    "    metrics=['accuracy']",
    ')',
    '',
    '# Display model summary',
    'model.summary()'
  ]

  return [...codeLines, ...compilationLines].join('\n')
}

/**
 * Parses a tuple string like "(28, 28, 1)" or "(784,)" into a number array
 */
function parseShape(shapeStr: string): number[] | null {
  try {
    // Remove whitespace and extract numbers from tuple format
    const cleaned = shapeStr.trim()
    if (!cleaned.startsWith('(') || !cleaned.endsWith(')')) {
      return null
    }
    
    const content = cleaned.slice(1, -1).trim()
    if (content === '') return []
    
    return content.split(',').map(s => {
      const num = parseInt(s.trim())
      return isNaN(num) ? null : num
    }).filter(n => n !== null) as number[]
  } catch {
    return null
  }
}

/**
 * Computes output shape for Dense layer
 */
function computeDenseShape(inputShape: number[], params: Record<string, any>): number[] | null {
  if (inputShape.length === 0) return null
  
  const units = params.units
  if (typeof units !== 'number' || units <= 0) return null
  
  // Dense layer can only accept 1D input (after flattening)
  // If input is multidimensional, it's a shape error
  if (inputShape.length > 1) {
    return null // This will cause an error - Dense needs 1D input
  }
  
  // Dense layer outputs (batch_size, units) - we only track the units dimension
  return [units]
}

/**
 * Computes output shape for Conv2D layer
 */
function computeConv2DShape(inputShape: number[], params: Record<string, any>): number[] | null {
  if (inputShape.length !== 3) return null // Expect (height, width, channels)
  
  const [height, width, _channels] = inputShape
  const filters = params.filters
  
  if (typeof filters !== 'number' || filters <= 0) return null
  
  // Parse kernel size - handle both string and array formats
  let kernelSize: number[]
  if (typeof params.kernel_size === 'string') {
    const parsed = parseShape(params.kernel_size)
    if (!parsed || parsed.length !== 2) return null
    kernelSize = parsed
  } else if (Array.isArray(params.kernel_size) && params.kernel_size.length === 2) {
    kernelSize = params.kernel_size
  } else {
    kernelSize = [3, 3] // Default
  }
  
  // Parse strides - handle both string and array formats
  let strides: number[]
  if (typeof params.strides === 'string') {
    const parsed = parseShape(params.strides)
    if (!parsed || parsed.length !== 2) {
      strides = [1, 1] // Default
    } else {
      strides = parsed
    }
  } else if (Array.isArray(params.strides) && params.strides.length === 2) {
    strides = params.strides
  } else {
    strides = [1, 1] // Default
  }
  
  const [kernelH, kernelW] = kernelSize
  const [strideH, strideW] = strides
  const padding = params.padding || 'same'
  
  let outHeight: number
  let outWidth: number
  
  if (padding === 'same') {
    outHeight = Math.ceil(height / strideH)
    outWidth = Math.ceil(width / strideW)
  } else { // 'valid'
    outHeight = Math.ceil((height - kernelH + 1) / strideH)
    outWidth = Math.ceil((width - kernelW + 1) / strideW)
  }
  
  // Ensure output dimensions are positive
  if (outHeight <= 0 || outWidth <= 0) return null
  
  return [outHeight, outWidth, filters]
}

/**
 * Computes output shape for MaxPool2D layer
 */
/**
 * Computes output shape for MaxPool2D layer
 */
function computeMaxPool2DShape(inputShape: number[], params: Record<string, any>): number[] | null {
  if (inputShape.length !== 3) return null // Expect (height, width, channels)
  
  const [height, width, channels] = inputShape
  
  // Parse pool size
  const poolSizeStr = params.pool_size || '(2,2)'
  const poolSize = parseShape(poolSizeStr)
  if (!poolSize || poolSize.length !== 2) return null
  
  const [poolH, poolW] = poolSize
  
  const outHeight = Math.floor(height / poolH)
  const outWidth = Math.floor(width / poolW)
  
  return [outHeight, outWidth, channels]
}

/**
 * Computes output shape for Flatten layer
 */
function computeFlattenShape(inputShape: number[]): number[] | null {
  if (inputShape.length === 0) return null
  
  // Flatten all dimensions into a single dimension
  const totalElements = inputShape.reduce((acc, dim) => acc * dim, 1)
  return [totalElements]
}

/**
 * Computes output shape for Merge/Concat layer
 */
function computeMergeShape(inputShapes: number[][], params: Record<string, any>): number[] | null {
  if (inputShapes.length === 0) return null
  
  const mode = params.mode || 'concat'
  
  if (mode === 'concat') {
    // For concatenation, all dimensions except the last must match
    const firstShape = inputShapes[0]
    if (firstShape.length === 0) return null
    
    for (let i = 1; i < inputShapes.length; i++) {
      const shape = inputShapes[i]
      if (shape.length !== firstShape.length) return null
      
      // Check all dimensions except the last one match
      for (let j = 0; j < shape.length - 1; j++) {
        if (shape[j] !== firstShape[j]) return null
      }
    }
    
    // Sum the last dimension (feature dimension)
    const concatDim = inputShapes.reduce((sum, shape) => sum + shape[shape.length - 1], 0)
    return [...firstShape.slice(0, -1), concatDim]
  } else {
    // For add, multiply, average, maximum - all shapes must be identical
    const firstShape = inputShapes[0]
    for (let i = 1; i < inputShapes.length; i++) {
      const shape = inputShapes[i]
      if (shape.length !== firstShape.length) return null
      
      for (let j = 0; j < shape.length; j++) {
        if (shape[j] !== firstShape[j]) return null
      }
    }
    
    return firstShape
  }
}

/**
 * Walks the DAG, computes output shapes for each node, stores them in node.data.outShape,
 * and returns an array of shape computation errors along with computed shapes.
 */
export function computeShapes(dag: { orderedNodes: LayerObject[], edgeMap: Map<string, string[]> }, inputShape: string): {
  errors: ShapeError[]
  nodeShapes: Map<string, number[]>
} {
  const errors: ShapeError[] = []
  const nodeShapes = new Map<string, number[]>()
  
  // Parse the input shape
  const parsedInputShape = parseShape(inputShape)
  if (!parsedInputShape) {
    errors.push({
      nodeId: 'input',
      message: `Invalid input shape format: ${inputShape}. Expected format like "(784,)" or "(28, 28, 1)"`
    })
    return { errors, nodeShapes }
  }
  
  // Process nodes in topological order
  for (const node of dag.orderedNodes) {
    let outputShape: number[] | null = null
    
    try {
      if (node.type === 'Input') {
        // Input layer defines the initial shape - compute from inputType and dimensions
        let computedShape = inputShape; // fallback to default input shape
        
        if (node.params.inputType) {
          // New input layer structure - compute shape from input type
          const inputType = node.params.inputType;
          switch (inputType) {
            case 'image_grayscale':
              const h1 = node.params.height || 28;
              const w1 = node.params.width || 28;
              computedShape = `(${h1}, ${w1}, 1)`;
              break;
            case 'image_color':
              const h2 = node.params.height || 28;
              const w2 = node.params.width || 28;
              computedShape = `(${h2}, ${w2}, 3)`;
              break;
            case 'image_custom':
              const h3 = node.params.height || 28;
              const w3 = node.params.width || 28;
              const c3 = node.params.channels || 1;
              computedShape = `(${h3}, ${w3}, ${c3})`;
              break;
            case 'flat_data':
              const size = node.params.flatSize || 784;
              computedShape = `(${size},)`;
              break;
            case 'sequence':
              const seqLen = node.params.seqLength || 100;
              const features = node.params.features || 128;
              computedShape = `(${seqLen}, ${features})`;
              break;
            case 'custom':
              computedShape = node.params.customShape || '(784,)';
              break;
            default:
              computedShape = '(784,)';
          }
        } else if (node.params.shape) {
          // Legacy input layer with shape parameter
          computedShape = node.params.shape;
        }
        
        const nodeInputShape = parseShape(computedShape)
        if (!nodeInputShape) {
          errors.push({
            nodeId: node.id,
            message: `Invalid input shape in Input layer: ${computedShape}`
          })
          continue
        }
        outputShape = nodeInputShape
      } else {
        // Get input shapes for this node
        const inputNodeIds: string[] = []
        
        // Find all nodes that connect to this node
        for (const [sourceId, targets] of dag.edgeMap.entries()) {
          if (targets.includes(node.id)) {
            inputNodeIds.push(sourceId)
          }
        }
        
        if (inputNodeIds.length === 0) {
          errors.push({
            nodeId: node.id,
            message: `Node ${node.type} has no input connections`
          })
          continue
        }
        
        // Get input shapes
        const inputShapes = inputNodeIds.map(id => nodeShapes.get(id)).filter(shape => shape !== undefined) as number[][]
        
        if (inputShapes.length !== inputNodeIds.length) {
          errors.push({
            nodeId: node.id,
            message: `Could not determine input shapes for ${node.type} layer`
          })
          continue
        }
        
        // Compute output shape based on layer type
        switch (node.type) {
          case 'Dense':
          case 'Output': // Output is typically a Dense layer
            if (inputShapes.length !== 1) {
              errors.push({
                nodeId: node.id,
                message: `${node.type} layer expects exactly one input, got ${inputShapes.length}`
              })
              continue
            }
            outputShape = computeDenseShape(inputShapes[0], node.params)
            if (outputShape === null) {
              errors.push({
                nodeId: node.id,
                message: `Dense layer requires 1D input, got shape [${inputShapes[0].join(', ')}]. Use Flatten layer before Dense.`
              })
              continue
            }
            break
            
          case 'Conv2D':
            if (inputShapes.length !== 1) {
              errors.push({
                nodeId: node.id,
                message: `Conv2D layer expects exactly one input, got ${inputShapes.length}`
              })
              continue
            }
            outputShape = computeConv2DShape(inputShapes[0], node.params)
            if (outputShape === null) {
              if (inputShapes[0].length !== 3) {
                errors.push({
                  nodeId: node.id,
                  message: `Conv2D layer expects 3D input (height, width, channels), got shape [${inputShapes[0].join(', ')}]`
                })
              } else {
                errors.push({
                  nodeId: node.id,
                  message: `Conv2D layer configuration invalid. Check filters, kernel_size, and other parameters.`
                })
              }
              continue
            }
            break
            
          case 'Conv2DTranspose':
            if (inputShapes.length !== 1) {
              errors.push({
                nodeId: node.id,
                message: `Conv2DTranspose layer expects exactly one input, got ${inputShapes.length}`
              })
              continue
            }
            outputShape = computeConv2DTransposeShape(inputShapes[0], node.params)
            if (outputShape === null) {
              if (inputShapes[0].length !== 3) {
                errors.push({
                  nodeId: node.id,
                  message: `Conv2DTranspose layer expects 3D input (height, width, channels), got shape [${inputShapes[0].join(', ')}]`
                })
              } else {
                errors.push({
                  nodeId: node.id,
                  message: `Conv2DTranspose layer configuration invalid. Check filters, kernel_size, and other parameters.`
                })
              }
              continue
            }
            break
            
          case 'UpSampling2D':
            if (inputShapes.length !== 1) {
              errors.push({
                nodeId: node.id,
                message: `UpSampling2D layer expects exactly one input, got ${inputShapes.length}`
              })
              continue
            }
            outputShape = computeUpSampling2DShape(inputShapes[0], node.params)
            if (outputShape === null) {
              errors.push({
                nodeId: node.id,
                message: `UpSampling2D layer expects 3D input (height, width, channels), got shape [${inputShapes[0].join(', ')}]`
              })
              continue
            }
            break
            
          case 'MaxPool2D':
            if (inputShapes.length !== 1) {
              errors.push({
                nodeId: node.id,
                message: `MaxPool2D layer expects exactly one input, got ${inputShapes.length}`
              })
              continue
            }
            outputShape = computeMaxPool2DShape(inputShapes[0], node.params)
            break
            
          case 'Flatten':
            if (inputShapes.length !== 1) {
              errors.push({
                nodeId: node.id,
                message: `Flatten layer expects exactly one input, got ${inputShapes.length}`
              })
              continue
            }
            outputShape = computeFlattenShape(inputShapes[0])
            break
            
          case 'Merge':
            if (inputShapes.length < 2) {
              errors.push({
                nodeId: node.id,
                message: `Merge layer expects at least 2 inputs, got ${inputShapes.length}`
              })
              continue
            }
            outputShape = computeMergeShape(inputShapes, node.params)
            break
            
          case 'BatchNorm':
          case 'Activation':
          case 'Dropout':
          case 'GlobalAvgPool':
            // These layers preserve input shape (mostly)
            if (inputShapes.length !== 1) {
              errors.push({
                nodeId: node.id,
                message: `${node.type} layer expects exactly one input, got ${inputShapes.length}`
              })
              continue
            }
            
            if (node.type === 'GlobalAvgPool') {
              // Global average pooling reduces spatial dimensions to 1x1
              const inputShape = inputShapes[0]
              if (inputShape.length === 3) {
                outputShape = [inputShape[2]] // Keep only channel dimension
              } else {
                outputShape = inputShape // Pass through if not 3D
              }
            } else {
              outputShape = inputShapes[0] // Preserve shape
            }
            break
            
          case 'Embedding':
            if (inputShapes.length !== 1) {
              errors.push({
                nodeId: node.id,
                message: `Embedding layer expects exactly one input, got ${inputShapes.length}`
              })
              continue
            }
            outputShape = computeEmbeddingShape(inputShapes[0], node.params)
            if (outputShape === null) {
              errors.push({
                nodeId: node.id,
                message: `Invalid input shape for Embedding layer. Expected 1D or 2D input (batch_size, sequence_length).`
              })
              continue
            }
            break
            
          case 'LSTM':
            if (inputShapes.length !== 1) {
              errors.push({
                nodeId: node.id,
                message: `LSTM layer expects exactly one input, got ${inputShapes.length}`
              })
              continue
            }
            outputShape = computeLSTMShape(inputShapes[0], node.params)
            if (outputShape === null) {
              errors.push({
                nodeId: node.id,
                message: `Invalid input shape for LSTM layer. Expected 3D input (batch_size, timesteps, features).`
              })
              continue
            }
            break
            
          case 'GRU':
            if (inputShapes.length !== 1) {
              errors.push({
                nodeId: node.id,
                message: `GRU layer expects exactly one input, got ${inputShapes.length}`
              })
              continue
            }
            outputShape = computeGRUShape(inputShapes[0], node.params)
            if (outputShape === null) {
              errors.push({
                nodeId: node.id,
                message: `Invalid input shape for GRU layer. Expected 3D input (batch_size, timesteps, features).`
              })
              continue
            }
            break
            
          default:
            errors.push({
              nodeId: node.id,
              message: `Unknown layer type: ${node.type}`
            })
            continue
        }
      }
      
      if (outputShape === null) {
        errors.push({
          nodeId: node.id,
          message: `Could not compute output shape for ${node.type} layer`
        })
        continue
      }
      
      // Store the computed shape
      nodeShapes.set(node.id, outputShape)
      
      // Store shape in node data (you'll need to update the actual node data outside this function)
      // For now, we just track it in our local map
      
    } catch (error) {
      errors.push({
        nodeId: node.id,
        message: `Error computing shape for ${node.type}: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  }
  
  return { errors, nodeShapes }
}

/**
 * Computes output shape for Conv2DTranspose layer
 */
function computeConv2DTransposeShape(inputShape: number[], params: Record<string, any>): number[] | null {
  if (inputShape.length !== 3) return null // Expect (height, width, channels)
  
  const [height, width, _channels] = inputShape
  const filters = params.filters
  
  if (typeof filters !== 'number' || filters <= 0) return null
  
  // Parse kernel size - handle both string and array formats
  let kernelSize: number[]
  if (typeof params.kernel_size === 'string') {
    const parsed = parseShape(params.kernel_size)
    if (!parsed || parsed.length !== 2) return null
    kernelSize = parsed
  } else if (Array.isArray(params.kernel_size) && params.kernel_size.length === 2) {
    kernelSize = params.kernel_size
  } else {
    kernelSize = [3, 3] // Default
  }
  
  // Parse strides - handle both string and array formats
  let strides: number[]
  if (typeof params.strides === 'string') {
    const parsed = parseShape(params.strides)
    if (!parsed || parsed.length !== 2) {
      strides = [2, 2] // Default for transpose conv
    } else {
      strides = parsed
    }
  } else if (Array.isArray(params.strides) && params.strides.length === 2) {
    strides = params.strides
  } else {
    strides = [2, 2] // Default for transpose conv
  }
  
  const [kernelH, kernelW] = kernelSize
  const [strideH, strideW] = strides
  const padding = params.padding || 'same'
  
  let outHeight: number
  let outWidth: number
  
  if (padding === 'same') {
    // For transpose convolution with 'same' padding, output size is input * stride
    outHeight = height * strideH
    outWidth = width * strideW
  } else { // 'valid'
    // For 'valid' padding: output = (input - 1) * stride + kernel_size
    outHeight = (height - 1) * strideH + kernelH
    outWidth = (width - 1) * strideW + kernelW
  }
  
  // Ensure output dimensions are positive
  if (outHeight <= 0 || outWidth <= 0) return null
  
  return [outHeight, outWidth, filters]
}

/**
 * Computes output shape for UpSampling2D layer
 */
function computeUpSampling2DShape(inputShape: number[], params: Record<string, any>): number[] | null {
  if (inputShape.length !== 3) return null // Expect (height, width, channels)
  
  const [height, width, channels] = inputShape
  
  // Parse upsampling size
  const sizeStr = params.size || '(2,2)'
  const size = parseShape(sizeStr)
  if (!size || size.length !== 2) return null
  
  const [sizeH, sizeW] = size
  
  const outHeight = height * sizeH
  const outWidth = width * sizeW
  
  return [outHeight, outWidth, channels]
}

/**
 * Computes output shape for Embedding layer
 */
function computeEmbeddingShape(inputShape: number[], params: Record<string, any>): number[] | null {
  // Embedding typically takes 1D or 2D input (batch_size, sequence_length) 
  // and outputs (batch_size, sequence_length, output_dim)
  const output_dim = params.output_dim
  if (typeof output_dim !== 'number' || output_dim <= 0) return null
  
  if (inputShape.length === 1) {
    // 1D input (sequence_length,) -> (sequence_length, output_dim)
    return [inputShape[0], output_dim]
  } else if (inputShape.length === 2) {
    // 2D input (batch_size, sequence_length) -> (batch_size, sequence_length, output_dim)
    return [inputShape[0], inputShape[1], output_dim]
  }
  
  return null // Invalid input dimensions for Embedding
}

/**
 * Computes output shape for LSTM layer
 */
function computeLSTMShape(inputShape: number[], params: Record<string, any>): number[] | null {
  // LSTM expects 3D input: (batch_size, timesteps, features)
  // If return_sequences=True: outputs (batch_size, timesteps, units)
  // If return_sequences=False: outputs (batch_size, units)
  
  const units = params.units
  if (typeof units !== 'number' || units <= 0) return null
  
  if (inputShape.length !== 3) return null // Expect 3D input
  
  const [batch_size, timesteps, _features] = inputShape
  const return_sequences = params.return_sequences === 'true' || params.return_sequences === true
  
  if (return_sequences) {
    return [batch_size, timesteps, units] // Return full sequence
  } else {
    return [batch_size, units] // Return only last output
  }
}

/**
 * Computes output shape for GRU layer
 */
function computeGRUShape(inputShape: number[], params: Record<string, any>): number[] | null {
  // GRU has the same shape logic as LSTM
  const units = params.units
  if (typeof units !== 'number' || units <= 0) return null
  
  if (inputShape.length !== 3) return null // Expect 3D input
  
  const [batch_size, timesteps, _features] = inputShape
  const return_sequences = params.return_sequences === 'true' || params.return_sequences === true
  
  if (return_sequences) {
    return [batch_size, timesteps, units] // Return full sequence
  } else {
    return [batch_size, units] // Return only last output
  }
}
