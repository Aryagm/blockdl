/**
 * Enhanced Shape Computation Registry with detailed error messages
 * 
 * This module provides enhanced shape computation functions that return detailed
 * validation messages instead of just null when validation fails.
 */

type LayerParams = Record<string, any>

/**
 * Shape computation result with detailed error information
 */
export interface ShapeComputationResult {
  shape: number[] | null
  error?: string
  warning?: string
}

/**
 * Enhanced shape computation function type
 */
export type EnhancedShapeComputeFunction = (
  inputShapes: number[][],
  params: LayerParams
) => ShapeComputationResult

/**
 * Enhanced shape computation registry with detailed validation
 */
export const enhancedShapeComputationRegistry: Record<string, EnhancedShapeComputeFunction> = {
  // Input layer computation
  input_layer: (_inputShapes, params) => {
    // Input layers determine their own shape from parameters
    if (params.computed_shape || params.shape) {
      const shapeString = params.computed_shape || params.shape || '(784,)'
      const shape = parseShapeString(shapeString)
      if (shape === null) {
        return {
          shape: null,
          error: `Invalid shape format: ${shapeString}. Expected format like "(784,)" or "(28, 28, 1)"`
        }
      }
      return { shape }
    }
    
    // Compute shape from inputType and parameters
    const inputType = params.inputType || 'image_grayscale'
    
    switch (inputType) {
      case 'image_grayscale':
        return { shape: [Number(params.height) || 28, Number(params.width) || 28, 1] }
      case 'image_color':
        return { shape: [Number(params.height) || 28, Number(params.width) || 28, 3] }
      case 'image_custom':
        return { shape: [Number(params.height) || 28, Number(params.width) || 28, Number(params.channels) || 1] }
      case 'flat_data':
        return { shape: [Number(params.flatSize) || 784] }
      case 'sequence':
        return { shape: [Number(params.seqLength) || 100, Number(params.features) || 128] }
      case 'custom': {
        const customShape = params.customShape || '(784,)'
        const shape = parseShapeString(String(customShape))
        if (shape === null) {
          return {
            shape: null,
            error: `Invalid custom shape format: ${customShape}. Expected format like "(784,)" or "(28, 28, 1)"`
          }
        }
        return { shape }
      }
      default:
        return { shape: [784] } // Default fallback
    }
  },

  // Enhanced Dense layer computation with proper validation
  dense_layer: (inputShapes, params) => {
    if (inputShapes.length !== 1) {
      return {
        shape: null,
        error: `Dense layer expects exactly 1 input, but received ${inputShapes.length} inputs`
      }
    }
    
    const inputShape = inputShapes[0]
    const units = Number(params.units) || Number(params.numClasses) || 128
    
    // Check if input is compatible with Dense layer
    if (inputShape.length > 2) {
      // Multi-dimensional input - Dense can handle this but we should warn
      const totalElements = inputShape.reduce((acc, dim) => acc * dim, 1)
      return {
        shape: [units],
        warning: `Dense layer receiving ${inputShape.length}D input ${JSON.stringify(inputShape)} will be automatically flattened to ${totalElements} features. Consider adding an explicit Flatten layer for clarity.`
      }
    }
    
    if (inputShape.length === 2) {
      // 2D input is fine for Dense layers
      return { shape: [units] }
    }
    
    if (inputShape.length === 1) {
      // 1D input is ideal for Dense layers
      return { shape: [units] }
    }
    
    // 0D input is invalid
    return {
      shape: null,
      error: `Dense layer cannot process 0-dimensional input`
    }
  },

  // Enhanced Conv2D layer computation
  conv2d_layer: (inputShapes, params) => {
    if (inputShapes.length !== 1) {
      return {
        shape: null,
        error: `Conv2D layer expects exactly 1 input, but received ${inputShapes.length} inputs`
      }
    }
    
    const inputShape = inputShapes[0]
    
    // Conv2D requires exactly 3D input (height, width, channels)
    if (inputShape.length !== 3) {
      const shapeStr = JSON.stringify(inputShape)
      if (inputShape.length === 1) {
        return {
          shape: null,
          error: `Conv2D layer expects 3D input (height, width, channels), but received 1D input ${shapeStr}. Consider using Dense layers for 1D data, or reshape your data to 3D.`
        }
      } else if (inputShape.length === 2) {
        return {
          shape: null,
          error: `Conv2D layer expects 3D input (height, width, channels), but received 2D input ${shapeStr}. If this is sequence data, consider using Conv1D or LSTM layers. If this is image data, specify the channel dimension.`
        }
      } else {
        return {
          shape: null,
          error: `Conv2D layer expects 3D input (height, width, channels), but received ${inputShape.length}D input ${shapeStr}.`
        }
      }
    }
    
    const [inputHeight, inputWidth] = inputShape
    const filters = Number(params.filters) || 32
    const kernelSize = parseKernelSize(String(params.kernel_size) || '(3,3)')
    const strides = parseKernelSize(String(params.strides) || '(1,1)')
    const padding = String(params.padding) || 'same'
    
    if (!kernelSize) {
      return {
        shape: null,
        error: `Invalid kernel_size format: ${params.kernel_size}. Expected format like "(3,3)" or "3"`
      }
    }
    
    if (!strides) {
      return {
        shape: null,
        error: `Invalid strides format: ${params.strides}. Expected format like "(1,1)" or "1"`
      }
    }
    
    let outputHeight: number
    let outputWidth: number
    
    if (padding === 'same') {
      outputHeight = Math.ceil(inputHeight / strides[0])
      outputWidth = Math.ceil(inputWidth / strides[1])
    } else { // 'valid'
      outputHeight = Math.floor((inputHeight - kernelSize[0]) / strides[0]) + 1
      outputWidth = Math.floor((inputWidth - kernelSize[1]) / strides[1]) + 1
    }
    
    // Check for invalid output dimensions
    if (outputHeight <= 0 || outputWidth <= 0) {
      return {
        shape: null,
        error: `Conv2D configuration results in invalid output dimensions: ${outputHeight}x${outputWidth}. Check kernel_size, strides, and padding parameters.`
      }
    }
    
    return { shape: [outputHeight, outputWidth, filters] }
  },

  // Enhanced MaxPool2D layer computation
  maxpool2d_layer: (inputShapes, params) => {
    if (inputShapes.length !== 1) {
      return {
        shape: null,
        error: `MaxPool2D layer expects exactly 1 input, but received ${inputShapes.length} inputs`
      }
    }
    
    const inputShape = inputShapes[0]
    
    if (inputShape.length !== 3) {
      const shapeStr = JSON.stringify(inputShape)
      return {
        shape: null,
        error: `MaxPool2D layer expects 3D input (height, width, channels), but received ${inputShape.length}D input ${shapeStr}.`
      }
    }
    
    const [inputHeight, inputWidth, channels] = inputShape
    const poolSize = parseKernelSize(String(params.pool_size) || '(2,2)')
    const stridesParam = params.strides || params.pool_size || '(2,2)'
    const strides = parseKernelSize(String(stridesParam))
    const padding = String(params.padding) || 'valid'
    
    if (!poolSize) {
      return {
        shape: null,
        error: `Invalid pool_size format: ${params.pool_size}. Expected format like "(2,2)" or "2"`
      }
    }
    
    if (!strides) {
      return {
        shape: null,
        error: `Invalid strides format: ${stridesParam}. Expected format like "(2,2)" or "2"`
      }
    }
    
    let outputHeight: number
    let outputWidth: number
    
    if (padding === 'same') {
      outputHeight = Math.ceil(inputHeight / strides[0])
      outputWidth = Math.ceil(inputWidth / strides[1])
    } else { // 'valid'
      outputHeight = Math.floor((inputHeight - poolSize[0]) / strides[0]) + 1
      outputWidth = Math.floor((inputWidth - poolSize[1]) / strides[1]) + 1
    }
    
    // Check for invalid output dimensions
    if (outputHeight <= 0 || outputWidth <= 0) {
      return {
        shape: null,
        error: `MaxPool2D configuration results in invalid output dimensions: ${outputHeight}x${outputWidth}. Check pool_size, strides, and padding parameters.`
      }
    }
    
    return { shape: [outputHeight, outputWidth, channels] }
  },

  // Enhanced Flatten layer computation
  flatten_layer: (inputShapes, _params) => {
    if (inputShapes.length !== 1) {
      return {
        shape: null,
        error: `Flatten layer expects exactly 1 input, but received ${inputShapes.length} inputs`
      }
    }
    
    const inputShape = inputShapes[0]
    
    if (inputShape.length === 0) {
      return {
        shape: null,
        error: `Flatten layer cannot process 0-dimensional input`
      }
    }
    
    if (inputShape.length === 1) {
      return {
        shape: inputShape,
        warning: `Input is already 1D ${JSON.stringify(inputShape)}, Flatten layer has no effect`
      }
    }
    
    // Flatten all dimensions into one
    const totalElements = inputShape.reduce((acc, dim) => acc * dim, 1)
    return { shape: [totalElements] }
  },

  // Shape-preserving layers with validation
  preserve_shape: (inputShapes, _params) => {
    if (inputShapes.length !== 1) {
      return {
        shape: null,
        error: `Layer expects exactly 1 input, but received ${inputShapes.length} inputs`
      }
    }
    return { shape: inputShapes[0] }
  },

  // Enhanced Merge layer computation
  merge_layer: (inputShapes, params) => {
    if (inputShapes.length < 2) {
      return {
        shape: null,
        error: `Merge layer expects at least 2 inputs, but received ${inputShapes.length} inputs`
      }
    }
    
    const mode = String(params.mode) || 'concatenate'
    
    if (mode === 'concatenate') {
      const firstShape = inputShapes[0]
      const axis = Number(params.axis) || -1
      const actualAxis = axis < 0 ? firstShape.length + axis : axis
      
      // Validate axis
      if (actualAxis < 0 || actualAxis >= firstShape.length) {
        return {
          shape: null,
          error: `Invalid concatenation axis ${axis} for shapes with ${firstShape.length} dimensions`
        }
      }
      
      // Check that all shapes are compatible
      for (let i = 1; i < inputShapes.length; i++) {
        const shape = inputShapes[i]
        if (shape.length !== firstShape.length) {
          return {
            shape: null,
            error: `Cannot concatenate shapes with different dimensionalities: ${JSON.stringify(firstShape)} and ${JSON.stringify(shape)}`
          }
        }
        
        for (let j = 0; j < shape.length; j++) {
          if (j !== actualAxis && shape[j] !== firstShape[j]) {
            return {
              shape: null,
              error: `Cannot concatenate shapes ${JSON.stringify(firstShape)} and ${JSON.stringify(shape)} - dimensions must match except at concatenation axis ${actualAxis}`
            }
          }
        }
      }
      
      // Calculate concatenated size
      const result = [...firstShape]
      result[actualAxis] = inputShapes.reduce((sum, shape) => sum + shape[actualAxis], 0)
      return { shape: result }
    } else {
      // For add, multiply, average, maximum - all shapes must be identical
      const firstShape = inputShapes[0]
      
      for (let i = 1; i < inputShapes.length; i++) {
        const shape = inputShapes[i]
        if (shape.length !== firstShape.length) {
          return {
            shape: null,
            error: `Cannot ${mode} shapes with different dimensionalities: ${JSON.stringify(firstShape)} and ${JSON.stringify(shape)}`
          }
        }
        
        for (let j = 0; j < shape.length; j++) {
          if (shape[j] !== firstShape[j]) {
            return {
              shape: null,
              error: `Cannot ${mode} shapes ${JSON.stringify(firstShape)} and ${JSON.stringify(shape)} - all dimensions must match exactly`
            }
          }
        }
      }
      
      return { shape: firstShape }
    }
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
    
    // Handle single number case like "3" -> [3, 3]
    if (parts.length === 1 && !isNaN(parts[0])) {
      return [parts[0], parts[0]]
    }
  } catch {
    // ignore
  }
  return null
}

/**
 * Get enhanced shape computation function by name
 */
export function getEnhancedShapeComputationFunction(shapeComputationName: string): EnhancedShapeComputeFunction | null {
  return enhancedShapeComputationRegistry[shapeComputationName] || null
}

/**
 * Compute layer output shape using enhanced validation
 */
export function computeEnhancedLayerShape(
  layerType: string,
  inputShapes: number[][],
  params: LayerParams,
  shapeComputationName?: string
): ShapeComputationResult {
  // Get shape computation function name
  const computationName = shapeComputationName || getDefaultShapeComputation(layerType)
  
  if (!computationName) {
    return { 
      shape: null, 
      error: `No shape computation defined for layer type: ${layerType}` 
    }
  }
  
  const computeFunction = getEnhancedShapeComputationFunction(computationName)
  
  if (!computeFunction) {
    return { 
      shape: null, 
      error: `Enhanced shape computation function '${computationName}' not found` 
    }
  }
  
  try {
    return computeFunction(inputShapes, params)
  } catch (error) {
    return { 
      shape: null, 
      error: `Shape computation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

/**
 * Default mapping for layers without explicit shape computation in YAML
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
