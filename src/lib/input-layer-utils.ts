/**
 * Input layer utilities for YAML-driven shape computation
 */

import { computeYAMLDrivenShape } from './yaml-shape-loader'
import type { LayerParams } from './layer-defs'

/**
 * Computes shape string from input layer parameters using YAML-driven computation
 * Used by code generation and shape computation systems.
 */
export async function computeInputShape(params: Record<string, unknown>): Promise<string> {
  try {
    // Use YAML-driven shape computation for Input layer
    const shapeResult = await computeYAMLDrivenShape('Input', [], params as LayerParams)
    if (shapeResult.shape) {
      // Convert shape array to string format
      return `(${shapeResult.shape.join(', ')})`
    }
    if (shapeResult.error) {
      console.warn('YAML-driven shape computation error:', shapeResult.error)
    }
  } catch (error) {
    console.warn('YAML-driven shape computation failed, using fallback:', error)
  }
  
  // Fallback to legacy behavior if YAML computation fails
  if (params.shape && typeof params.shape === 'string') {
    return params.shape;
  }
  
  return '(784,)'; // Default fallback
}
