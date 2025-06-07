/**
 * Shape Computation Registry for YAML-driven layer definitions
 * 
 * This module provides a registry of shape computation functions that are referenced
 * by the `shape_computation` field in the enhanced YAML configuration.
 * It replaces the hardcoded switch statements with a modular, extensible system.
 */

import { parseShape } from './utils'

type LayerParams = Record<string, string | number | boolean | unknown>

/**
 * Shape computation function type
 */
export type ShapeComputeFunction = (
  inputShapes: number[][],
  params: LayerParams
) => number[] | null

/**
 * Shape computation registry mapping YAML references to functions
 */
export const shapeComputationRegistry: Record<string, ShapeComputeFunction> = {
  // Input layer computation
  input_layer: (_inputShapes, params) => {
    // Input layers determine their own shape from parameters
    // First check if we have a computed shape or direct shape parameter
    if (params.computed_shape || params.shape) {
      const shapeString = String(params.computed_shape || params.shape || '(784,)')
      return parseShape(shapeString)
    }
    
    // Otherwise, compute shape from inputType and parameters
    const inputType = String(params.inputType || 'image_grayscale')
    const height = Number(params.height) || 28
    const width = Number(params.width) || 28
    const channels = Number(params.channels) || 1
    
    switch (inputType) {
      case 'image_grayscale':
        return [height, width, 1]
      case 'image_color':
        return [height, width, 3]
      case 'image_custom':
        return [height, width, channels]
      case 'flat_data':
        return [Number(params.flatSize) || 784]
      case 'sequence':
        return [Number(params.seqLength) || 100, Number(params.features) || 128]
      default:
        return [784] // Default fallback
    }
  },

  // Dense layer computation
  dense_layer: (inputShapes, params) => {
    if (inputShapes.length !== 1) return null
    const inputShape = inputShapes[0]
    
    // Dense layers should only accept 1D or 2D inputs
    // Multi-dimensional inputs (3D+) should be explicitly flattened first
    if (inputShape.length > 2) {
      return null // This will trigger an error in enhanced computation
    }
    
    // The output is always 1D with the specified number of units
    return [Number(params.units) || Number(params.numClasses) || 128]
  },

  // Conv2D layer computation
  conv2d_layer: (inputShapes, params) => {
    if (inputShapes.length !== 1) return null
    const inputShape = inputShapes[0]
    
    // Conv2D requires 3D input (height, width, channels)
    if (inputShape.length !== 3) return null
    
    const [inputHeight, inputWidth] = inputShape
    const filters = Number(params.filters) || 32
    const kernelSize = parseTupleOrNumber(String(params.kernel_size) || '(3,3)')
    const strides = parseTupleOrNumber(String(params.strides) || '(1,1)')
    const padding = String(params.padding) || 'same'
    
    if (!kernelSize || !strides) return null
    
    let outputHeight: number
    let outputWidth: number
    
    if (padding === 'same') {
      outputHeight = Math.ceil(inputHeight / strides[0])
      outputWidth = Math.ceil(inputWidth / strides[1])
    } else { // 'valid'
      outputHeight = Math.floor((inputHeight - kernelSize[0]) / strides[0]) + 1
      outputWidth = Math.floor((inputWidth - kernelSize[1]) / strides[1]) + 1
    }
    
    return [outputHeight, outputWidth, filters]
  },

  // Conv2D Transpose layer computation
  conv2d_transpose_layer: (inputShapes, params) => {
    if (inputShapes.length !== 1) return null
    const inputShape = inputShapes[0]
    if (inputShape.length !== 3) return null
    
    const [inputHeight, inputWidth] = inputShape
    const filters = Number(params.filters) || 32
    const strides = parseTupleOrNumber(String(params.strides) || '(2,2)')
    if (!strides) return null
    
    // Simplified transpose convolution shape calculation
    return [inputHeight * strides[0], inputWidth * strides[1], filters]
  },

  // MaxPool2D layer computation
  maxpool2d_layer: (inputShapes, params) => {
    if (inputShapes.length !== 1) return null
    const inputShape = inputShapes[0]
    
    if (inputShape.length !== 3) return null
    
    const [inputHeight, inputWidth, channels] = inputShape
    const poolSize = parseTupleOrNumber(String(params.pool_size) || '(2,2)')
    // Default strides to pool_size if not provided (MaxPool2D behavior)
    const stridesParam = params.strides || params.pool_size || '(2,2)'
    const strides = parseTupleOrNumber(String(stridesParam))
    const padding = String(params.padding) || 'valid'
    
    if (!poolSize || !strides) return null
    
    let outputHeight: number
    let outputWidth: number
    
    if (padding === 'same') {
      outputHeight = Math.ceil(inputHeight / strides[0])
      outputWidth = Math.ceil(inputWidth / strides[1])
    } else { // 'valid'
      outputHeight = Math.floor((inputHeight - poolSize[0]) / strides[0]) + 1
      outputWidth = Math.floor((inputWidth - poolSize[1]) / strides[1]) + 1
    }
    
    return [outputHeight, outputWidth, channels]
  },

  // Flatten layer computation
  flatten_layer: (inputShapes) => {
    if (inputShapes.length !== 1) return null
    return [inputShapes[0].reduce((acc, dim) => acc * dim, 1)]
  },

  // UpSampling2D layer computation
  upsampling2d_layer: (inputShapes, params) => {
    if (inputShapes.length !== 1) return null
    const inputShape = inputShapes[0]
    if (inputShape.length !== 3) return null
    
    const [inputHeight, inputWidth, channels] = inputShape
    const size = parseTupleOrNumber(String(params.size) || '(2,2)')
    if (!size) return null
    
    return [inputHeight * size[0], inputWidth * size[1], channels]
  },

  // Global Average Pooling layer computation
  global_avg_pool_layer: (inputShapes) => {
    if (inputShapes.length !== 1) return null
    const inputShape = inputShapes[0]
    // For 3D input, keep only channel dimension; otherwise pass through
    return inputShape.length === 3 ? [inputShape[2]] : inputShape
  },

  // Embedding layer computation
  embedding_layer: (inputShapes, params) => {
    if (inputShapes.length !== 1) return null
    const inputShape = inputShapes[0]
    const outputDim = Number(params.output_dim) || 128
    
    // 1D input -> 2D output, 2D input -> 3D output
    return inputShape.length === 1 
      ? [inputShape[0], outputDim]
      : inputShape.length === 2 
        ? [inputShape[0], inputShape[1], outputDim]
        : null
  },

  // LSTM layer computation
  lstm_layer: (inputShapes, params) => {
    if (inputShapes.length !== 1) return null
    const inputShape = inputShapes[0]
    if (inputShape.length !== 3) return null // Expects 3D input
    
    const units = Number(params.units) || 128
    const returnSequences = Boolean(params.return_sequences)
    
    return returnSequences 
      ? [inputShape[0], inputShape[1], units] // Full sequence
      : [inputShape[0], units] // Last output only
  },

  // GRU layer computation
  gru_layer: (inputShapes, params) => {
    if (inputShapes.length !== 1) return null
    const inputShape = inputShapes[0]
    if (inputShape.length !== 3) return null // Expects 3D input
    
    const units = Number(params.units) || 128
    const returnSequences = Boolean(params.return_sequences)
    
    return returnSequences 
      ? [inputShape[0], inputShape[1], units] // Full sequence
      : [inputShape[0], units] // Last output only
  },

  // Merge layer computation
  merge_layer: (inputShapes, params) => {
    if (inputShapes.length < 2) return null
    
    const mode = String(params.mode) || 'concatenate'
    
    if (mode === 'concatenate') {
      // Concatenate along last axis
      const firstShape = inputShapes[0]
      const axis = Number(params.axis) || -1
      const actualAxis = axis < 0 ? firstShape.length + axis : axis
      
      // Check that all shapes are compatible
      for (let i = 1; i < inputShapes.length; i++) {
        const shape = inputShapes[i]
        if (shape.length !== firstShape.length) return null
        
        for (let j = 0; j < shape.length; j++) {
          if (j !== actualAxis && shape[j] !== firstShape[j]) return null
        }
      }
      
      // Calculate concatenated size
      const result = [...firstShape]
      result[actualAxis] = inputShapes.reduce((sum, shape) => sum + shape[actualAxis], 0)
      return result
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
  },

  // Shape-preserving layers (Dropout, BatchNorm, Activation)
  preserve_shape: (inputShapes) => {
    if (inputShapes.length !== 1) return null
    return inputShapes[0]
  }
}

/**
 * Parse tuple string like "(3,3)" into [3, 3] or single number into [num, num]
 */
function parseTupleOrNumber(input: string): [number, number] | null {
  try {
    // Handle single number case like "2"
    if (!/[(),]/.test(input)) {
      const num = parseInt(input.trim())
      if (!isNaN(num)) return [num, num]
    }
    
    // Handle tuple case like "(2,2)"
    const cleaned = input.replace(/[()]/g, '').trim()
    const parts = cleaned.split(',').map(s => parseInt(s.trim()))
    
    if (parts.length === 2 && !parts.some(isNaN)) {
      return [parts[0], parts[1]]
    }
  } catch {
    // ignore
  }
  return null
}

/**
 * Get shape computation function by name from registry
 */
export function getShapeComputationFunction(shapeComputationName: string): ShapeComputeFunction | null {
  return shapeComputationRegistry[shapeComputationName] || null
}
