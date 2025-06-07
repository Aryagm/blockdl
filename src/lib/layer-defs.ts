/**
 * Centralized layer definitions registry for BlockDL
 * 
 * This module serves as the main API for accessing layer definitions loaded from YAML.
 * It provides type-safe access to layer metadata, parameters, and code generation.
 */

import { loadCategoriesWithLayers, getCachedYamlContent } from './yaml-layer-loader'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Valid types for layer parameter values */
export type LayerParamValue = string | number | boolean

/** Layer parameters as key-value pairs */
export type LayerParams = Record<string, LayerParamValue>

/** Form field configuration for layer parameter editing */
export interface LayerFormField {
  key: string
  label: string
  type: 'number' | 'text' | 'select'
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  step?: number
  show?: (params: Record<string, LayerParamValue>) => boolean
}

/** Complete layer definition with metadata and configuration */
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

/** Runtime registry of all loaded layer definitions */
export const layerDefs: Record<string, LayerDef> = {}

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
// YAML INTEGRATION FUNCTIONS
// ============================================================================

/**
 * Get layer categories with their associated layers from YAML configuration
 * @returns Array of category objects with layer information
 */
export function getLayerCategoriesFromYAML() {
  const yamlContent = getCachedYamlContent()
  if (!yamlContent) {
    // Silent return during initial load - this is expected behavior
    return []
  }
  
  try {
    return loadCategoriesWithLayers(yamlContent)
  } catch (error) {
    console.error('Error loading categories from YAML:', error)
    return []
  }
}
