/**
 * Centralized layer definitions registry for BlockDL
 * Layer definitions are loaded from YAML configuration at startup
 */

import { loadCategoriesWithLayers, getCachedYamlContent } from './yaml-layer-loader'

// Type for parameter values - matching the YAML loader
export type LayerParamValue = string | number | boolean

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

export interface LayerDef {
  type: string
  icon: string
  description: string
  defaultParams: Record<string, LayerParamValue>
  formSpec: LayerFormField[]
  codeGen: (params: Record<string, LayerParamValue>) => string
  kerasImport?: string
  supportsMultiplier?: boolean
}

// Layer definitions - populated from YAML at startup
export const layerDefs: Record<string, LayerDef> = {}

// Utility functions for accessing layer definitions

/**
 * Get layer definition by type
 */
export function getLayerDef(type: string): LayerDef | undefined {
  return layerDefs[type]
}

/**
 * Get default parameters for a layer type
 */
export function getDefaultParams(type: string): Record<string, LayerParamValue> {
  return layerDefs[type]?.defaultParams || {}
}

/**
 * Get icon for a layer type
 */
export function getLayerIcon(type: string): string {
  return layerDefs[type]?.icon || '🔧'
}

/**
 * Get all available layer types
 */
export function getLayerTypes(): Array<{ type: string; icon: string; description: string }> {
  return Object.entries(layerDefs).map(([type, def]) => ({
    type,
    icon: def.icon,
    description: def.description
  }))
}

/**
 * Generate code for a layer with given parameters
 */
export function generateLayerCode(type: string, params: Record<string, LayerParamValue>): string {
  const layerDef = layerDefs[type]
  if (!layerDef) {
    return `# Unknown layer type: ${type}`
  }
  return layerDef.codeGen(params)
}

/**
 * Get used Keras imports from a list of layer types
 */
export function getUsedKerasImports(layerTypes: string[]): string[] {
  const imports = new Set<string>()
  
  layerTypes.forEach(type => {
    const layerDef = layerDefs[type]
    if (layerDef?.kerasImport) {
      // Split by comma in case multiple imports are specified
      layerDef.kerasImport.split(',').forEach(imp => {
        imports.add(imp.trim())
      })
    }
  })
  
  return Array.from(imports)
}

/**
 * Get layer categories with their associated layers from YAML
 */
export function getLayerCategoriesFromYAML() {
  const yamlContent = getCachedYamlContent()
  if (!yamlContent) {
    console.warn('YAML content not loaded yet, returning empty categories')
    return []
  }
  
  try {
    return loadCategoriesWithLayers(yamlContent)
  } catch (error) {
    console.error('Error getting categories from YAML:', error)
    return []
  }
}
