/**
 * Enhanced Shape Computation with detailed error messages
 * 
 * This module enhances the basic shape computation registry to provide detailed
 * validation messages and warnings for better user experience.
 */

import { 
  shapeComputationRegistry, 
  type ShapeComputeFunction
} from './shape-computation-registry'

type LayerParams = Record<string, string | number | boolean>

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
 * Enhance a basic shape computation function with detailed error messages
 */
function enhanceShapeComputation(
  basicFunction: ShapeComputeFunction,
  layerType: string
): EnhancedShapeComputeFunction {
  return (inputShapes: number[][], params: LayerParams): ShapeComputationResult => {
    try {
      // Basic validation
      if (inputShapes.length === 0 && layerType !== 'input_layer') {
        return {
          shape: null,
          error: `${layerType} layer expects at least 1 input, but received ${inputShapes.length} inputs`
        }
      }

      // Check for critical shape incompatibilities BEFORE attempting computation
      const criticalError = getCriticalShapeError(layerType, inputShapes, params)
      if (criticalError) {
        return {
          shape: null,
          error: criticalError
        }
      }

      const shape = basicFunction(inputShapes, params)
      
      if (shape === null) {
        return {
          shape: null,
          error: getDetailedErrorMessage(layerType, inputShapes, params)
        }
      }

      return { shape }
    } catch (error) {
      return {
        shape: null,
        error: `${layerType} computation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

/**
 * Generate detailed error messages for common shape computation failures
 */
function getDetailedErrorMessage(
  layerType: string, 
  inputShapes: number[][], 
  params: LayerParams
): string {
  const inputShape = inputShapes[0]
  
  switch (layerType) {
    case 'conv2d_layer':
      if (!inputShape) return 'Conv2D layer requires an input connection'
      if (inputShape.length !== 3) {
        return `Conv2D layer expects 3D input (height, width, channels), but received ${inputShape.length}D input ${JSON.stringify(inputShape)}`
      }
      return 'Conv2D layer configuration is invalid. Check kernel_size, strides, and padding parameters.'
      
    case 'maxpool2d_layer':
      if (!inputShape) return 'MaxPool2D layer requires an input connection'
      if (inputShape.length !== 3) {
        return `MaxPool2D layer expects 3D input (height, width, channels), but received ${inputShape.length}D input ${JSON.stringify(inputShape)}`
      }
      return 'MaxPool2D layer configuration is invalid. Check pool_size, strides, and padding parameters.'
      
    case 'dense_layer':
      if (!inputShape) return 'Dense layer requires an input connection'
      if (inputShape.length === 0) {
        return 'Dense layer cannot process 0-dimensional input'
      }
      return 'Dense layer configuration is invalid. Check units parameter.'
      
    case 'flatten_layer':
      if (!inputShape) return 'Flatten layer requires an input connection'
      if (inputShape.length === 0) {
        return 'Flatten layer cannot process 0-dimensional input'
      }
      return 'Flatten layer configuration is invalid'
      
    case 'merge_layer':
      if (inputShapes.length < 2) {
        return `Merge layer expects at least 2 inputs, but received ${inputShapes.length} inputs`
      }
      return 'Merge layer configuration is invalid. Check that input shapes are compatible for the specified merge mode.'

    case 'input_layer':
      if (params.computed_shape || params.shape) {
        const shapeString = params.computed_shape || params.shape || '(784,)'
        return `Invalid shape format: ${shapeString}. Expected format like "(784,)" or "(28, 28, 1)"`
      }
      return 'Input layer configuration is invalid. Check inputType and shape parameters.'
      
    default:
      return `${layerType} layer configuration is invalid or incompatible with input shapes`
  }
}

/**
 * Generate critical errors for shape incompatibilities that should prevent execution
 */
function getCriticalShapeError(
  layerType: string,
  inputShapes: number[][],
  params: LayerParams
): string | undefined {
  const inputShape = inputShapes[0]
   switch (layerType) {
    case 'dense_layer': {
      // Dense layers connecting directly to multi-dimensional inputs without flatten is an error
      if (inputShape && inputShape.length > 2) {
        return `Dense layer cannot directly connect to ${inputShape.length}D input ${JSON.stringify(inputShape)}. Add a Flatten layer before Dense to convert multi-dimensional input to 1D.`
      }
      break
    }

    case 'conv2d_layer': {
      // Conv2D requires exactly 3D input
      if (inputShape && inputShape.length !== 3) {
        return `Conv2D layer requires 3D input (height, width, channels), but received ${inputShape.length}D input ${JSON.stringify(inputShape)}. Check layer connections.`
      }
      break
    }
      
    case 'maxpool2d_layer': {
      // MaxPool2D requires exactly 3D input
      if (inputShape && inputShape.length !== 3) {
        return `MaxPool2D layer requires 3D input (height, width, channels), but received ${inputShape.length}D input ${JSON.stringify(inputShape)}. Check layer connections.`
      }
      break
    }
      
    case 'lstm_layer':
    case 'gru_layer': {
      // LSTM/GRU require exactly 3D input
      if (inputShape && inputShape.length !== 3) {
        return `${layerType.toUpperCase()} layer requires 3D input (batch, timesteps, features), but received ${inputShape.length}D input ${JSON.stringify(inputShape)}. Check layer connections.`
      }
      break
    }
      
    case 'embedding_layer': {
      // Embedding layers can only handle 1D or 2D input
      if (inputShape && inputShape.length > 2) {
        return `Embedding layer accepts 1D or 2D input, but received ${inputShape.length}D input ${JSON.stringify(inputShape)}. Check layer connections.`
      }
      break
    }
      
    case 'merge_layer': {
      // Merge layers need at least 2 inputs
      if (inputShapes.length < 2) {
        return `Merge layer requires at least 2 inputs, but received ${inputShapes.length} inputs. Connect more layers to this merge layer.`
      }
      
      // Check for dimensional compatibility between inputs
      const firstShape = inputShapes[0]
      const mode = String(params.mode) || 'concatenate'
      
      if (mode === 'concatenate') {
        // For concatenate, all dimensions except concat axis must match
        for (let i = 1; i < inputShapes.length; i++) {
          const currentShape = inputShapes[i]
          if (currentShape.length !== firstShape.length) {
            return `Merge (concatenate) requires all inputs to have same number of dimensions. Input 1: ${firstShape.length}D ${JSON.stringify(firstShape)}, Input ${i + 1}: ${currentShape.length}D ${JSON.stringify(currentShape)}.`
          }
        }
      } else {
        // For add/multiply/average/maximum, all shapes must be identical
        for (let i = 1; i < inputShapes.length; i++) {
          const currentShape = inputShapes[i]
          if (currentShape.length !== firstShape.length || 
              !currentShape.every((dim, idx) => dim === firstShape[idx])) {
            return `Merge (${mode}) requires all inputs to have identical shapes. Input 1: ${JSON.stringify(firstShape)}, Input ${i + 1}: ${JSON.stringify(currentShape)}.`
          }
        }
      }
      break
    }
  }
  
  // Avoid unused parameter warnings
  if (params) {
    // These parameters are available for future error logic
  }
  
  return undefined
}

/**
 * Enhanced shape computation registry with detailed error messages
 */
export const enhancedShapeComputationRegistry: Record<string, EnhancedShapeComputeFunction> = {}

// Enhance all basic shape computation functions
for (const [layerType, basicFunction] of Object.entries(shapeComputationRegistry)) {
  enhancedShapeComputationRegistry[layerType] = enhanceShapeComputation(basicFunction, layerType)
}

/**
 * Get an enhanced shape computation function by name
 */
export function getEnhancedShapeComputationFunction(shapeComputationName: string): EnhancedShapeComputeFunction | null {
  return enhancedShapeComputationRegistry[shapeComputationName] || null
}

/**
 * Compute shape with enhanced error messages
 */
export function computeShapeEnhanced(
  shapeComputationName: string,
  inputShapes: number[][],
  params: LayerParams
): ShapeComputationResult {
  const computeFunction = getEnhancedShapeComputationFunction(shapeComputationName)
  
  if (!computeFunction) {
    return {
      shape: null,
      error: `Unknown shape computation function: ${shapeComputationName}`
    }
  }
  
  return computeFunction(inputShapes, params)
}
