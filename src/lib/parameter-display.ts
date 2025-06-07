/**
 * YAML-driven parameter display utilities
 * 
 * This replaces hardcoded parameter visibility and display logic with
 * a dynamic system that reads configuration from the YAML definitions.
 */

import type { LayerParamValue } from './layer-defs'
import { getLayerDef } from './layer-defs'

/**
 * Generate visible parameter display strings based on YAML configuration
 */
export function getParameterDisplayValues(layerType: string, params: Record<string, LayerParamValue>): string[] {
  const layerDef = getLayerDef(layerType)
  if (!layerDef) return []

  const visibleParams: string[] = []

  // For Input layers, show computed shape based on inputType
  if (layerType === 'Input') {
    const inputType = String(params.inputType || 'image_grayscale')
    let displayShape = ''
    
    switch (inputType) {
      case 'image_grayscale': {
        const h = Number(params.height) || 28
        const w = Number(params.width) || 28
        displayShape = `${h}×${w}×1`
        break
      }
      case 'image_color': {
        const h = Number(params.height) || 28
        const w = Number(params.width) || 28
        displayShape = `${h}×${w}×3`
        break
      }
      case 'image_custom': {
        const h = Number(params.height) || 28
        const w = Number(params.width) || 28
        const c = Number(params.channels) || 1
        displayShape = `${h}×${w}×${c}`
        break
      }
      case 'flat_data': {
        const size = Number(params.flatSize) || 784
        displayShape = `${size}`
        break
      }
      case 'sequence': {
        const seqLen = Number(params.seqLength) || 100
        const features = Number(params.features) || 128
        displayShape = `${seqLen}×${features}`
        break
      }
      case 'custom': {
        displayShape = String(params.customShape) || '784'
        break
      }
      default: {
        displayShape = '28×28×1'
      }
    }
    
    visibleParams.push(`shape: ${displayShape}`)
    
    // Show input type label
    const inputTypeLabels: Record<string, string> = {
      'image_grayscale': 'Grayscale',
      'image_color': 'Color', 
      'image_custom': 'Custom Image',
      'flat_data': 'Flattened',
      'sequence': 'Sequence',
      'custom': 'Custom'
    }
    visibleParams.push(inputTypeLabels[inputType] || inputType)
    return visibleParams
  }

  // For Output layers, show computed configuration
  if (layerType === 'Output') {
    const outputType = String(params.outputType || 'multiclass')
    const outputTypeLabels: Record<string, string> = {
      'multiclass': 'Multi-class',
      'binary': 'Binary',
      'regression': 'Regression',
      'multilabel': 'Multi-label',
      'custom': 'Custom'
    }
    
    switch (outputType) {
      case 'multiclass': {
        const numClasses = Number(params.numClasses) || 10
        visibleParams.push(`${numClasses} classes`)
        visibleParams.push('softmax')
        break
      }
      case 'binary': {
        visibleParams.push('1 unit')
        visibleParams.push('sigmoid')
        if (params.threshold && Number(params.threshold) !== 0.5) {
          visibleParams.push(`threshold: ${params.threshold}`)
        }
        break
      }
      case 'regression': {
        const regUnits = Number(params.units) || 1
        visibleParams.push(`${regUnits} output${regUnits > 1 ? 's' : ''}`)
        visibleParams.push('linear')
        break
      }
      case 'multilabel': {
        const mlUnits = Number(params.units) || 10
        visibleParams.push(`${mlUnits} labels`)
        visibleParams.push('sigmoid')
        break
      }
      case 'custom': {
        const customUnits = Number(params.units) || 10
        const customActivation = String(params.activation) || 'softmax'
        visibleParams.push(`${customUnits} units`)
        visibleParams.push(customActivation)
        break
      }
      default: {
        visibleParams.push(outputTypeLabels[outputType] || outputType)
      }
    }
    return visibleParams
  }

  // For Activation layers, show the activation type prominently
  if (layerType === 'Activation' && params.activation_function) {
    visibleParams.push(String(params.activation_function))
  }
  
  // For Merge layers, show the merge mode prominently
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

  // Generic parameter display - show most important parameters first
  if (params.filters) visibleParams.push(`${params.filters} filters`)
  if (params.units && layerType !== 'Output') visibleParams.push(`${params.units} units`)
  if (params.pool_size) visibleParams.push(`pool: ${params.pool_size}`)
  if (params.kernel_size) visibleParams.push(`kernel: ${params.kernel_size}`)
  
  // For non-Activation and non-Output layers, show activation if it's not default/linear
  if (layerType !== 'Activation' && layerType !== 'Output' && params.activation && params.activation !== 'linear' && params.activation !== 'none') {
    visibleParams.push(String(params.activation))
  }
  
  if (params.rate) visibleParams.push(`rate: ${params.rate}`)
  if (params.size) visibleParams.push(`size: ${params.size}`)
  
  // Legacy support for old shape parameter
  if (params.shape && layerType !== 'Input') visibleParams.push(`shape: ${params.shape}`)

  return visibleParams
}

/**
 * Get the number of total parameters for a layer (for "more" indicator)
 */
export function getTotalParameterCount(layerType: string): number {
  const layerDef = getLayerDef(layerType)
  return layerDef?.formSpec.length || 0
}

/**
 * Check if a parameter should be visible based on YAML conditional logic
 */
export function isParameterVisible(
  layerType: string,
  paramKey: string,
  currentParams: Record<string, LayerParamValue>
): boolean {
  const layerDef = getLayerDef(layerType)
  if (!layerDef) return false

  const field = layerDef.formSpec.find(f => f.key === paramKey)
  if (!field) return false

  // Check YAML-defined show function
  if (field.show && !field.show(currentParams)) {
    return false
  }

  return true
}
