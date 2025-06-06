/**
 * Shape computation utilities for neural network layers
 */

import type { LayerObject } from './dag-parser'
import { computeInputShape } from './input-layer-utils'

export interface ShapeError {
  nodeId: string
  message: string
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
 * Computes output shape for Conv2DTranspose layer
 */
function computeConv2DTransposeShape(inputShape: number[], params: Record<string, any>): number[] | null {
  if (inputShape.length !== 3) return null
  
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
    outHeight = height * strideH
    outWidth = width * strideW
  } else { // 'valid'
    outHeight = (height - 1) * strideH + kernelH
    outWidth = (width - 1) * strideW + kernelW
  }
  
  // Ensure output dimensions are positive
  if (outHeight <= 0 || outWidth <= 0) return null
  
  return [outHeight, outWidth, filters]
}

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
 * Computes output shape for UpSampling2D layer
 */
function computeUpSampling2DShape(inputShape: number[], params: Record<string, any>): number[] | null {
  if (inputShape.length !== 3) return null
  
  const [height, width, channels] = inputShape
  const size = params.size || [2, 2]
  
  let upSampleFactors: number[]
  if (Array.isArray(size) && size.length === 2) {
    upSampleFactors = size
  } else {
    upSampleFactors = [2, 2] // Default
  }
  
  const [upH, upW] = upSampleFactors
  return [height * upH, width * upW, channels]
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
 * Computes output shape for Embedding layer
 */
function computeEmbeddingShape(inputShape: number[], params: Record<string, any>): number[] | null {
  if (inputShape.length < 1 || inputShape.length > 2) return null
  
  const outputDim = params.output_dim
  if (typeof outputDim !== 'number' || outputDim <= 0) return null
  
  // Embedding adds a dimension at the end
  return [...inputShape, outputDim]
}

/**
 * Computes output shape for LSTM layer
 */
function computeLSTMShape(inputShape: number[], params: Record<string, any>): number[] | null {
  if (inputShape.length !== 2) return null // Expect (timesteps, features)
  
  const units = params.units
  if (typeof units !== 'number' || units <= 0) return null
  
  const returnSequences = params.return_sequences || false
  
  if (returnSequences) {
    return [inputShape[0], units] // Return sequences: (timesteps, units)
  } else {
    return [units] // Return last output: (units,)
  }
}

/**
 * Computes output shape for GRU layer
 */
function computeGRUShape(inputShape: number[], params: Record<string, any>): number[] | null {
  if (inputShape.length !== 2) return null // Expect (timesteps, features)
  
  const units = params.units
  if (typeof units !== 'number' || units <= 0) return null
  
  const returnSequences = params.return_sequences || false
  
  if (returnSequences) {
    return [inputShape[0], units] // Return sequences: (timesteps, units)
  } else {
    return [units] // Return last output: (units,)
  }
}

/**
 * Walks the DAG, computes output shapes for each node, and returns computed shapes and errors
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
        // Input layer defines the initial shape
        const computedShape = computeInputShape(node.params)
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
      
    } catch (error) {
      errors.push({
        nodeId: node.id,
        message: `Error computing shape for ${node.type}: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  }
  
  return { errors, nodeShapes }
}
