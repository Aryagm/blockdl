/**
 * Layer Input Validation
 * 
 * Centralized validation logic for layer inputs. This ensures that layers
 * receive the correct input shapes and can provide meaningful error messages.
 */

import { layerDefinitions } from './definitions'

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationResult {
  isValid: boolean
  errorMessage?: string
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate inputs for a specific layer type
 */
export function validateLayerInputs(
  layerType: string,
  inputShapes: number[][],
  params: Record<string, unknown> = {}
): ValidationResult {
  const definition = layerDefinitions[layerType]
  
  if (!definition) {
    return {
      isValid: false,
      errorMessage: `Unknown layer type: ${layerType}`
    }
  }
  
  return definition.validateInputs(inputShapes, params)
}

/**
 * Validate a complete layer configuration
 */
export function validateLayerConfiguration(
  layerType: string,
  inputShapes: number[][],
  params: Record<string, unknown> = {}
): ValidationResult {
  // First validate the layer inputs
  const inputValidation = validateLayerInputs(layerType, inputShapes, params)
  if (!inputValidation.isValid) {
    return inputValidation
  }
  
  // Then validate the parameters (if we add parameter validation in the future)
  // For now, we assume parameters are valid if they pass the form validation
  
  return { isValid: true }
}

/**
 * Get validation errors for multiple layers
 */
export function validateLayerChain(
  layers: Array<{
    type: string
    params: Record<string, unknown>
    inputShapes: number[][]
  }>
): Array<{ layerIndex: number; error: string }> {
  const errors: Array<{ layerIndex: number; error: string }> = []
  
  layers.forEach((layer, index) => {
    const validation = validateLayerInputs(layer.type, layer.inputShapes, layer.params)
    if (!validation.isValid) {
      errors.push({
        layerIndex: index,
        error: validation.errorMessage || 'Unknown validation error'
      })
    }
  })
  
  return errors
}

/**
 * Check if a layer type exists and is valid
 */
export function isValidLayerType(layerType: string): boolean {
  return layerType in layerDefinitions
}

/**
 * Get all supported layer types
 */
export function getSupportedLayerTypes(): string[] {
  return Object.keys(layerDefinitions)
}
