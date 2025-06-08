/**
 * Layer Parameter Utilities
 * 
 * Handles parameter processing, form field generation, and default values
 * for all layer types. This provides a clean interface for parameter management.
 */

import { layerDefinitions, type ParameterDefinition, type SelectOption } from '../layer-definitions'

// ============================================================================
// LEGACY COMPATIBILITY TYPES
// ============================================================================

export type LayerParamValue = string | number | boolean
export type LayerParams = Record<string, LayerParamValue>

// Form field configuration for layer parameter editing (legacy format)
export interface LayerFormField {
  key: string
  label: string
  type: 'number' | 'text' | 'select' | 'boolean'
  options?: { value: string; label: string; description?: string }[]
  min?: number
  max?: number
  step?: number
  default?: string | number | boolean
  validation?: {
    min?: number
    max?: number
    required?: boolean
    pattern?: string
  }
  show?: (params: Record<string, LayerParamValue>) => boolean
}

// ============================================================================
// PARAMETER UTILITIES
// ============================================================================

/**
 * Get default parameters for a layer type
 */
export function getDefaultParams(layerType: string): Record<string, LayerParamValue> {
  const definition = layerDefinitions[layerType]
  if (!definition) return {}
  
  const defaultParams: Record<string, LayerParamValue> = {}
  
  definition.parameters.forEach((param: ParameterDefinition) => {
    if (param.default !== undefined) {
      defaultParams[param.key] = param.default
    }
  })
  
  // Add multiplier default for layers that support it
  if (definition.supportsMultiplier) {
    defaultParams.multiplier = 1
  }
  
  return defaultParams
}

/**
 * Get form specification for a layer type (legacy compatibility)
 */
export function getLayerFormSpec(layerType: string): LayerFormField[] {
  const definition = layerDefinitions[layerType]
  if (!definition) return []
  
  const formSpec: LayerFormField[] = definition.parameters.map((param: ParameterDefinition) => {
    const field: LayerFormField = {
      key: param.key,
      label: param.label,
      type: param.type,
      options: param.options,
      min: param.validation?.min,
      max: param.validation?.max,
      default: param.default,
      validation: param.validation
    }

    // Convert conditional logic from new system to old function format
    if (param.conditional?.showWhen) {
      field.show = (params: Record<string, LayerParamValue>) => {
        return Object.entries(param.conditional!.showWhen!).every(([paramKey, allowedValues]) => {
          const currentValue = String(params[paramKey] || '')
          if (Array.isArray(allowedValues)) {
            return allowedValues.includes(currentValue)
          }
          return allowedValues === currentValue
        })
      }
    }

    return field
  })
  
  // Add multiplier parameter for layers that support it
  if (definition.supportsMultiplier) {
    formSpec.push({
      key: 'multiplier',
      label: 'Multiplier',
      type: 'number',
      default: 1,
      validation: { min: 1, max: 20 }
    })
  }
  
  return formSpec
}

/**
 * Validate parameter values against parameter definitions
 */
export function validateParameterValues(
  layerType: string, 
  params: Record<string, unknown>
): { isValid: boolean; errors: string[] } {
  const definition = layerDefinitions[layerType]
  if (!definition) {
    return { isValid: false, errors: [`Unknown layer type: ${layerType}`] }
  }
  
  const errors: string[] = []
  
  definition.parameters.forEach((param: ParameterDefinition) => {
    const value = params[param.key]
    
    // Check required parameters
    if (param.validation?.required && (value === undefined || value === null || value === '')) {
      errors.push(`${param.label} is required`)
      return
    }
    
    // Skip validation if value is empty and not required
    if (value === undefined || value === null || value === '') {
      return
    }
    
    // Validate number parameters
    if (param.type === 'number') {
      const numValue = Number(value)
      if (isNaN(numValue)) {
        errors.push(`${param.label} must be a valid number`)
        return
      }
      
      if (param.validation?.min !== undefined && numValue < param.validation.min) {
        errors.push(`${param.label} must be at least ${param.validation.min}`)
      }
      
      if (param.validation?.max !== undefined && numValue > param.validation.max) {
        errors.push(`${param.label} must be at most ${param.validation.max}`)
      }
    }
    
    // Validate text parameters
    if (param.type === 'text' && param.validation?.pattern) {
      const stringValue = String(value)
      const regex = new RegExp(param.validation.pattern)
      if (!regex.test(stringValue)) {
        errors.push(`${param.label} format is invalid`)
      }
    }
    
    // Validate select parameters
    if (param.type === 'select' && param.options) {
      const stringValue = String(value)
      const validValues = param.options.map((opt: SelectOption) => opt.value)
      if (!validValues.includes(stringValue)) {
        errors.push(`${param.label} must be one of: ${validValues.join(', ')}`)
      }
    }
  })
  
  return { isValid: errors.length === 0, errors }
}

/**
 * Get parameter information for a specific layer
 */
export function getParameterInfo(layerType: string, paramKey: string): ParameterDefinition | undefined {
  const definition = layerDefinitions[layerType]
  if (!definition) return undefined
  
  return definition.parameters.find((param: ParameterDefinition) => param.key === paramKey)
}

/**
 * Get all parameter keys for a layer type
 */
export function getParameterKeys(layerType: string): string[] {
  const definition = layerDefinitions[layerType]
  if (!definition) return []
  
  const keys = definition.parameters.map((param: ParameterDefinition) => param.key)
  
  // Add multiplier for layers that support it
  if (definition.supportsMultiplier) {
    keys.push('multiplier')
  }
  
  return keys
}

/**
 * Get parameter count for a layer (for UI display purposes)
 */
export function getTotalParameterCount(layerType: string): number {
  const definition = layerDefinitions[layerType]
  if (!definition) return 0
  
  let count = definition.parameters.length
  
  // Add multiplier for layers that support it
  if (definition.supportsMultiplier) {
    count += 1
  }
  
  return count
}

/**
 * Check if a parameter should be shown based on conditional logic
 */
export function shouldShowParameter(
  layerType: string,
  paramKey: string,
  currentParams: Record<string, LayerParamValue>
): boolean {
  const paramInfo = getParameterInfo(layerType, paramKey)
  if (!paramInfo || !paramInfo.conditional?.showWhen) {
    return true
  }
  
  return Object.entries(paramInfo.conditional.showWhen).every(([conditionKey, allowedValues]) => {
    const currentValue = String(currentParams[conditionKey] || '')
    if (Array.isArray(allowedValues)) {
      return allowedValues.includes(currentValue)
    }
    return allowedValues === currentValue
  })
}

/**
 * Get visible parameters based on current parameter values
 */
export function getVisibleParameters(
  layerType: string,
  currentParams: Record<string, LayerParamValue>
): ParameterDefinition[] {
  const definition = layerDefinitions[layerType]
  if (!definition) return []
  
  return definition.parameters.filter((param: ParameterDefinition) => 
    shouldShowParameter(layerType, param.key, currentParams)
  )
}
