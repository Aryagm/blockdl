/**
 * Input layer utilities for unified TypeScript layer definitions
 */

import { getLayerDefinition } from './layer-definitions'

/**
 * Computes shape string from input layer parameters using unified layer definitions
 * Used by code generation and shape computation systems.
 */
export async function computeInputShape(params: Record<string, unknown>): Promise<string> {
  try {
    // Use new layer definitions system for Input layer
    const inputLayerDef = getLayerDefinition('Input')
    if (inputLayerDef) {
      const shape = inputLayerDef.computeShape([], params)
      if (shape) {
        // Convert shape array to string format
        return `(${shape.join(', ')})`
      }
    }
  } catch (error) {
    console.warn('Layer definition shape computation failed, using fallback:', error)
  }
  
  // Fallback to legacy behavior if computation fails
  if (params.shape && typeof params.shape === 'string') {
    return params.shape;
  }
  
  return '(784,)'; // Default fallback
}
