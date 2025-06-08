/**
 * Layer Parameter Display Utilities
 * 
 * Functions for formatting and displaying layer parameters in the UI.
 */

import type { LayerParamValue } from './layer-compatibility'
import { getLayerDef } from './layer-compatibility'
import { getLayerDefinition } from './layer-definitions'

// ============================================================================
// PARAMETER DISPLAY UTILITIES
// ============================================================================

/**
 * Generate visible parameter display strings for layer visualization
 */
export function getParameterDisplayValues(layerType: string, params: Record<string, LayerParamValue>): string[] {
  const layerDef = getLayerDef(layerType)
  if (!layerDef) return []

  // Special handling for Input layers
  if (layerType === 'Input') {
    const inputType = String(params.inputType || 'image_grayscale')
    return [
      `shape: ${computeInputShapeDisplay(params)}`,
      getInputTypeLabel(inputType)
    ]
  }

  // Special handling for Output layers
  if (layerType === 'Output') {
    return computeOutputDisplay(params)
  }

  // Generic parameter formatting for all other layers
  return formatCommonParams(layerType, params)
}

/**
 * Get the total number of configurable parameters for a layer
 */
export function getTotalParameterCount(layerType: string): number {
  const layerDef = getLayerDef(layerType)
  return layerDef?.formSpec.length || 0
}

// ============================================================================
// SHAPE DISPLAY UTILITIES
// ============================================================================

/**
 * Shape display utilities for Input layers
 */
const computeInputShapeDisplay = (params: Record<string, LayerParamValue>): string => {
  const inputType = String(params.inputType || 'image_grayscale')
  
  switch (inputType) {
    case 'image_grayscale': {
      const h = Number(params.height) || 28
      const w = Number(params.width) || 28
      return `${h}×${w}×1`
    }
    case 'image_color': {
      const h = Number(params.height) || 28
      const w = Number(params.width) || 28
      return `${h}×${w}×3`
    }
    case 'image_custom': {
      const h = Number(params.height) || 28
      const w = Number(params.width) || 28
      const c = Number(params.channels) || 1
      return `${h}×${w}×${c}`
    }
    case 'flat_data': {
      const size = Number(params.flatSize) || 784
      return `${size}`
    }
    case 'sequence': {
      const seqLen = Number(params.seqLength) || 100
      const features = Number(params.features) || 128
      return `${seqLen}×${features}`
    }
    default: {
      return '28×28×1'
    }
  }
}

const getInputTypeLabel = (inputType: string): string => {
  const labels: Record<string, string> = {
    'image_grayscale': 'Grayscale',
    'image_color': 'Color', 
    'image_custom': 'Custom Image',
    'flat_data': 'Flattened',
    'sequence': 'Sequence'
  }
  return labels[inputType] || inputType
}

// ============================================================================
// OUTPUT LAYER UTILITIES
// ============================================================================

/**
 * Output layer configuration utilities
 */
const computeOutputDisplay = (params: Record<string, LayerParamValue>): string[] => {
  const outputType = String(params.outputType || 'multiclass')
  const visibleParams: string[] = []
  
  switch (outputType) {
    case 'multiclass': {
      const numClasses = Number(params.numClasses) || 10
      visibleParams.push(`${numClasses} classes`, 'softmax')
      break
    }
    case 'binary': {
      visibleParams.push('1 unit', 'sigmoid')
      break
    }
    case 'regression': {
      visibleParams.push('1 unit', 'linear')
      break
    }
    case 'multilabel': {
      const mlUnits = Number(params.units) || 10
      visibleParams.push(`${mlUnits} labels`, 'sigmoid')
      break
    }
    default: {
      const labels: Record<string, string> = {
        'multiclass': 'Multi-class',
        'binary': 'Binary',
        'regression': 'Regression',
        'multilabel': 'Multi-label'
      }
      visibleParams.push(labels[outputType] || outputType)
    }
  }
  
  return visibleParams
}

// ============================================================================
// GENERIC PARAMETER FORMATTERS
// ============================================================================

const formatCommonParams = (layerType: string, params: Record<string, LayerParamValue>): string[] => {
  const visibleParams: string[] = []

  // Layer-specific parameters first
  if (layerType === 'Activation' && params.activation_function) {
    visibleParams.push(String(params.activation_function))
  }
  
  if (layerType === 'Merge' && params.mode) {
    const modeLabels: Record<string, string> = {
      'concatenate': 'Concatenate',
      'add': 'Add', 
      'multiply': 'Multiply',
      'average': 'Average',
      'maximum': 'Maximum'
    }
    visibleParams.push(modeLabels[String(params.mode)] || String(params.mode))
  }

  // Common parameters in priority order
  if (params.filters) visibleParams.push(`${params.filters} filters`)
  if (params.units && layerType !== 'Output') visibleParams.push(`${params.units} units`)
  if (params.pool_size) visibleParams.push(`pool: ${params.pool_size}`)
  if (params.kernel_size) visibleParams.push(`kernel: ${params.kernel_size}`)
  
  // Show activation for non-Activation/Output layers if not default
  if (layerType !== 'Activation' && layerType !== 'Output' && 
      params.activation && params.activation !== 'linear' && params.activation !== 'none') {
    visibleParams.push(String(params.activation))
  }
  
  if (params.rate) visibleParams.push(`rate: ${params.rate}`)
  if (params.size) visibleParams.push(`size: ${params.size}`)
  
  // Legacy shape parameter support
  if (params.shape && layerType !== 'Input') visibleParams.push(`shape: ${params.shape}`)

  return visibleParams
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

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
