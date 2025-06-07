/**
 * Centralized layer definitions registry for BlockDL
 * 
 * This module serves as the main API for accessing layer definitions from the new unified TypeScript system.
 * It provides type-safe access to layer metadata, parameters, and code generation.
 */

import { 
  layerDefinitions, 
  getCategoriesWithLayers
} from './layer-definitions'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Valid types for layer parameter values */
export type LayerParamValue = string | number | boolean

/** Layer parameters as key-value pairs */
export type LayerParams = Record<string, LayerParamValue>

/** Form field configuration for layer parameter editing - using new system */
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

/** Complete layer definition with metadata and configuration - adapts new system */
export interface LayerDef {
  type: string
  icon: string
  description: string
  category: string
  defaultParams: Record<string, LayerParamValue>
  formSpec: LayerFormField[]
  codeGen: (params: Record<string, LayerParamValue>) => string
  kerasImport?: string
  supportsMultiplier?: boolean
}

// ============================================================================
// LAYER REGISTRY
// ============================================================================

/** Runtime registry of all loaded layer definitions - now populated from new system */
export const layerDefs: Record<string, LayerDef> = {}

// Populate layerDefs from new system
function initializeLayerDefs() {
  Object.entries(layerDefinitions).forEach(([type, definition]) => {
    const formSpec: LayerFormField[] = definition.parameters.map(param => {
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

    const defaultParams: Record<string, LayerParamValue> = {}
    definition.parameters.forEach(param => {
      if (param.default !== undefined) {
        defaultParams[param.key] = param.default
      }
    })

    layerDefs[type] = {
      type,
      icon: definition.metadata.icon,
      description: definition.metadata.description,
      category: definition.metadata.category,
      defaultParams,
      formSpec,
      codeGen: (params) => definition.generateCode.keras(params),
      supportsMultiplier: definition.supportsMultiplier
    }
  })
}

// Initialize on module load
initializeLayerDefs()

// ============================================================================
// CORE API FUNCTIONS
// ============================================================================

/**
 * Get layer definition by type
 * @param type - Layer type identifier
 * @returns Layer definition or undefined if not found
 */
export function getLayerDef(type: string): LayerDef | undefined {
  return layerDefs[type]
}

/**
 * Get default parameters for a layer type
 * @param type - Layer type identifier
 * @returns Default parameters object
 */
export function getDefaultParams(type: string): Record<string, LayerParamValue> {
  return layerDefs[type]?.defaultParams || {}
}

/**
 * Get icon for a layer type
 * @param type - Layer type identifier  
 * @returns Icon emoji or default wrench emoji
 */
export function getLayerIcon(type: string): string {
  return layerDefs[type]?.icon || '🔧'
}

/**
 * Get all available layer types with basic metadata
 * @returns Array of layer type information
 */
export function getLayerTypes(): Array<{ type: string; icon: string; description: string }> {
  return Object.entries(layerDefs).map(([type, def]) => ({
    type,
    icon: def.icon,
    description: def.description
  }))
}

// ============================================================================
// CODE GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate Keras code for a layer with given parameters
 * @param type - Layer type identifier
 * @param params - Layer parameter values
 * @returns Generated Keras code string
 */
export function generateLayerCode(type: string, params: Record<string, LayerParamValue>): string {
  const layerDef = layerDefs[type]
  if (!layerDef) {
    return `# Unknown layer type: ${type}`
  }
  return layerDef.codeGen(params)
}

/**
 * Get required Keras imports for a list of layer types
 * @param layerTypes - Array of layer type identifiers
 * @returns Array of unique Keras import names
 */
export function getUsedKerasImports(layerTypes: string[]): string[] {
  const imports = new Set<string>()
  
  layerTypes.forEach(type => {
    const layerDef = layerDefs[type]
    if (layerDef?.kerasImport) {
      // Handle comma-separated imports
      layerDef.kerasImport.split(',').forEach(imp => {
        imports.add(imp.trim())
      })
    }
  })
  
  return Array.from(imports)
}

// ============================================================================
// CATEGORY INTEGRATION FUNCTIONS
// ============================================================================

/**
 * Get layer categories with their associated layers from TypeScript system
 * @returns Array of category objects with layer information
 */
export function getLayerCategories() {
  return getCategoriesWithLayers()
}
