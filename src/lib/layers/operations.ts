/**
 * Layer Operations and Utilities
 * 
 * High-level functions for working with layers, categories, and metadata.
 */

import { LayerDefinition } from './types'
import { layerDefinitions } from './registry'
import { categories, getCategoryColorsByKey } from './categories'

// ============================================================================
// LAYER QUERIES
// ============================================================================

/**
 * Get all layer definitions
 */
export function getAllLayers(): Record<string, LayerDefinition> {
  return layerDefinitions
}

/**
 * Get layer definition by type
 */
export function getLayerDefinition(layerType: string): LayerDefinition | undefined {
  return layerDefinitions[layerType]
}

/**
 * Get layers by category
 */
export function getLayersByCategory(category: string): Array<{ type: string; definition: LayerDefinition }> {
  return Object.entries(layerDefinitions)
    .filter(([, def]) => def.metadata.category === category)
    .map(([type, definition]) => ({ type, definition }))
}

/**
 * Get all available layer types with basic metadata
 */
export function getLayerTypes(): Array<{ type: string; icon: string; description: string }> {
  return Object.entries(layerDefinitions).map(([type, def]) => ({
    type,
    icon: def.metadata.icon,
    description: def.metadata.description
  }))
}

// ============================================================================
// CATEGORY OPERATIONS
// ============================================================================

/**
 * Get layer categories with their associated layers
 */
export function getLayerCategories() {
  return Object.entries(categories).map(([key, category]) => {
    const colorClasses = getCategoryColorsByKey(key)
    const layersByCategory = getLayersByCategory(key)
    
    return {
      name: category.name,
      color: category.color,
      bgColor: colorClasses.bg,
      borderColor: colorClasses.border,
      textColor: colorClasses.text,
      description: category.description,
      layerTypes: layersByCategory.map(({ type }) => type)
    }
  })
}

// ============================================================================
// CODE GENERATION
// ============================================================================

/**
 * Generate Keras code for a layer with given parameters
 */
export function generateLayerCode(type: string, params: Record<string, unknown>): string {
  const layerDefinition = layerDefinitions[type]
  if (!layerDefinition) {
    return `# Unknown layer type: ${type}`
  }
  return layerDefinition.generateCode.keras(params)
}

/**
 * Get required Keras imports for a list of layer types
 */
export function getUsedKerasImports(layerTypes: string[]): string[] {
  const imports = new Set<string>()
  
  layerTypes.forEach(type => {
    const layerDefinition = layerDefinitions[type]
    if (layerDefinition) {
      imports.add(type)
    }
  })
  
  return Array.from(imports)
}

// ============================================================================
// PARAMETER UTILITIES
// ============================================================================

/**
 * Get default parameters for a layer type
 */
export function getDefaultParams(type: string): Record<string, unknown> {
  const layerDefinition = layerDefinitions[type]
  if (!layerDefinition) return {}
  
  const defaults: Record<string, unknown> = {}
  layerDefinition.parameters.forEach(param => {
    if (param.default !== undefined) {
      defaults[param.key] = param.default
    }
  })
  
  // Add multiplier default for layers that support it
  if (layerDefinition.supportsMultiplier) {
    defaults.multiplier = 1
  }
  
  return defaults
}

/**
 * Get icon for a layer type
 */
export function getLayerIcon(type: string): string {
  return layerDefinitions[type]?.metadata.icon || '🔧'
}
