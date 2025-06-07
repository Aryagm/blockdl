/**
 * Shape Computation Registry for YAML-driven layer definitions
 * 
 * This module provides a registry of shape computation functions that are referenced
 * by the `shape_computation` field in the enhanced YAML configuration.
 * It replaces the hardcoded switch statements with a modular, extensible system.
 */

type LayerParams = Record<string, any>

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
      const shapeString = params.computed_shape || params.shape || '(784,)'
      return parseShapeString(shapeString)
    }
    
    // Otherwise, compute shape from inputType and parameters
    const inputType = params.inputType || 'image_grayscale'
    
    switch (inputType) {
      case 'image_grayscale':
        return [Number(params.height) || 28, Number(params.width) || 28, 1]
      case 'image_color':
        return [Number(params.height) || 28, Number(params.width) || 28, 3]
      case 'image_custom':
        return [Number(params.height) || 28, Number(params.width) || 28, Number(params.channels) || 1]
      case 'flat_data':
        return [Number(params.flatSize) || 784]
      case 'sequence':
        return [Number(params.seqLength) || 100, Number(params.features) || 128]
      case 'custom': {
        const customShape = params.customShape || '(784,)'
        return parseShapeString(String(customShape))
      }
      default:
        return [784] // Default fallback
    }
  },

  // Dense layer computation
  dense_layer: (inputShapes, params) => {
    if (inputShapes.length !== 1) return null
    
    // Dense layers can accept any input shape and will flatten it
    // The output is always 1D with the specified number of units
    const units = Number(params.units) || Number(params.numClasses) || 128
    return [units]
  },

  // Conv2D layer computation
  conv2d_layer: (inputShapes, params) => {
    if (inputShapes.length !== 1) return null
    const inputShape = inputShapes[0]
    
    // Conv2D requires 3D input (height, width, channels)
    if (inputShape.length !== 3) return null
    
    const [inputHeight, inputWidth] = inputShape
    const filters = Number(params.filters) || 32
    const kernelSize = parseKernelSize(String(params.kernel_size) || '(3,3)')
    const strides = parseKernelSize(String(params.strides) || '(1,1)')
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
    const strides = parseKernelSize(String(params.strides) || '(2,2)')
    
    if (!strides) return null
    
    // Simplified transpose convolution shape calculation
    const outputHeight = inputHeight * strides[0]
    const outputWidth = inputWidth * strides[1]
    
    return [outputHeight, outputWidth, filters]
  },

  // MaxPool2D layer computation
  maxpool2d_layer: (inputShapes, params) => {
    if (inputShapes.length !== 1) return null
    const inputShape = inputShapes[0]
    
    if (inputShape.length !== 3) return null
    
    const [inputHeight, inputWidth, channels] = inputShape
    const poolSize = parseKernelSize(String(params.pool_size) || '(2,2)')
    // Default strides to pool_size if not provided (MaxPool2D behavior)
    const stridesParam = params.strides || params.pool_size || '(2,2)'
    const strides = parseKernelSize(String(stridesParam))
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
  flatten_layer: (inputShapes, _params) => {
    if (inputShapes.length !== 1) return null
    const inputShape = inputShapes[0]
    
    // Flatten all dimensions into one
    const totalElements = inputShape.reduce((acc, dim) => acc * dim, 1)
    return [totalElements]
  },

  // UpSampling2D layer computation
  upsampling2d_layer: (inputShapes, params) => {
    if (inputShapes.length !== 1) return null
    const inputShape = inputShapes[0]
    
    if (inputShape.length !== 3) return null
    
    const [inputHeight, inputWidth, channels] = inputShape
    const size = parseUpSamplingSize(String(params.size) || '(2,2)')
    
    if (!size) return null
    
    return [inputHeight * size[0], inputWidth * size[1], channels]
  },

  // Global Average Pooling layer computation
  global_avg_pool_layer: (inputShapes, _params) => {
    if (inputShapes.length !== 1) return null
    const inputShape = inputShapes[0]
    
    if (inputShape.length === 3) {
      // For 3D input, keep only channel dimension
      return [inputShape[2]]
    }
    
    // For other dimensions, pass through
    return inputShape
  },

  // Embedding layer computation
  embedding_layer: (inputShapes, params) => {
    if (inputShapes.length !== 1) return null
    const inputShape = inputShapes[0]
    
    const outputDim = Number(params.output_dim) || 128
    
    if (inputShape.length === 1) {
      // 1D input (batch_size,) -> (batch_size, output_dim)
      return [inputShape[0], outputDim]
    } else if (inputShape.length === 2) {
      // 2D input (batch_size, sequence_length) -> (batch_size, sequence_length, output_dim)
      return [inputShape[0], inputShape[1], outputDim]
    }
    
    return null
  },

  // LSTM layer computation
  lstm_layer: (inputShapes, params) => {
    if (inputShapes.length !== 1) return null
    const inputShape = inputShapes[0]
    
    // LSTM expects 3D input (batch_size, timesteps, features)
    if (inputShape.length !== 3) return null
    
    const units = Number(params.units) || 128
    const returnSequences = Boolean(params.return_sequences)
    
    if (returnSequences) {
      // Return full sequence: (batch_size, timesteps, units)
      return [inputShape[0], inputShape[1], units]
    } else {
      // Return last output: (batch_size, units)
      return [inputShape[0], units]
    }
  },

  // GRU layer computation
  gru_layer: (inputShapes, params) => {
    if (inputShapes.length !== 1) return null
    const inputShape = inputShapes[0]
    
    // GRU expects 3D input (batch_size, timesteps, features)
    if (inputShape.length !== 3) return null
    
    const units = Number(params.units) || 128
    const returnSequences = Boolean(params.return_sequences)
    
    if (returnSequences) {
      // Return full sequence: (batch_size, timesteps, units)
      return [inputShape[0], inputShape[1], units]
    } else {
      // Return last output: (batch_size, units)
      return [inputShape[0], units]
    }
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
  preserve_shape: (inputShapes, _params) => {
    if (inputShapes.length !== 1) return null
    return inputShapes[0]
  }
}

/**
 * Parse shape string like "(28, 28, 3)" into number array [28, 28, 3]
 */
function parseShapeString(shapeStr: string): number[] | null {
  try {
    // Remove parentheses and split by comma
    const cleaned = shapeStr.replace(/[()]/g, '').trim()
    if (!cleaned) return []
    
    return cleaned.split(',').map(s => {
      const num = parseInt(s.trim())
      if (isNaN(num)) throw new Error(`Invalid dimension: ${s}`)
      return num
    })
  } catch {
    return null
  }
}

/**
 * Parse kernel size string like "(3,3)" into [3, 3]
 */
function parseKernelSize(sizeStr: string): [number, number] | null {
  try {
    const cleaned = sizeStr.replace(/[()]/g, '').trim()
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
 * Parse upsampling size - can be single number or tuple
 */
function parseUpSamplingSize(sizeStr: string): [number, number] | null {
  try {
    // Handle single number case like "2"
    if (!/[(),]/.test(sizeStr)) {
      const num = parseInt(sizeStr.trim())
      if (!isNaN(num)) return [num, num]
    }
    
    // Handle tuple case like "(2,2)"
    return parseKernelSize(sizeStr)
  } catch {
    return null
  }
}

/**
 * Get shape computation function by name from YAML configuration
 */
export function getShapeComputationFunction(shapeComputationName: string): ShapeComputeFunction | null {
  return shapeComputationRegistry[shapeComputationName] || null
}

/**
 * Compute layer output shape using YAML-driven shape computation
 */
export function computeLayerShape(
  layerType: string,
  inputShapes: number[][],
  params: LayerParams,
  shapeComputationName?: string
): { shape: number[] | null; error?: string } {
  // Get shape computation function name from YAML or use fallback
  const computationName = shapeComputationName || getDefaultShapeComputation(layerType)
  
  if (!computationName) {
    return { 
      shape: null, 
      error: `No shape computation defined for layer type: ${layerType}` 
    }
  }
  
  const computeFunction = getShapeComputationFunction(computationName)
  
  if (!computeFunction) {
    return { 
      shape: null, 
      error: `Shape computation function '${computationName}' not found` 
    }
  }
  
  try {
    const shape = computeFunction(inputShapes, params)
    return { shape }
  } catch (error) {
    return { 
      shape: null, 
      error: `Shape computation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

/**
 * Fallback mapping for layers without explicit shape computation in YAML
 */
function getDefaultShapeComputation(layerType: string): string | null {
  const defaults: Record<string, string> = {
    'Input': 'input_layer',
    'Dense': 'dense_layer',
    'Output': 'dense_layer',
    'Conv2D': 'conv2d_layer',
    'Conv2DTranspose': 'conv2d_transpose_layer',
    'MaxPool2D': 'maxpool2d_layer',
    'Flatten': 'flatten_layer',
    'UpSampling2D': 'upsampling2d_layer',
    'GlobalAvgPool': 'global_avg_pool_layer',
    'Embedding': 'embedding_layer',
    'LSTM': 'lstm_layer',
    'GRU': 'gru_layer',
    'Merge': 'merge_layer',
    'BatchNorm': 'preserve_shape',
    'BatchNormalization': 'preserve_shape',
    'Activation': 'preserve_shape',
    'Dropout': 'preserve_shape'
  }
  
  return defaults[layerType] || null
}
