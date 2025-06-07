/**
 * YAML-driven shape computation loader
 * 
 * Loads shape computation configurations from cached YAML content.
 * All layer definitions and shape computation methods are driven by YAML configuration.
 */

import { computeShapeEnhanced, type ShapeComputationResult } from './enhanced-shape-computation'
import { getCachedYamlContent } from './yaml-layer-loader'
import type { LayerParams } from './layer-defs'
import yaml from 'js-yaml'

// Cache for parsed YAML content to avoid repeated parsing
let parsedYamlCache: Record<string, unknown> | null = null

/**
 * Get cached and parsed YAML content
 */
function getCachedParsedYAML(): Record<string, unknown> | null {
  if (parsedYamlCache) {
    return parsedYamlCache
  }

  const yamlText = getCachedYamlContent()
  if (!yamlText) {
    console.error('YAML content not cached. Ensure initializeLayerDefs() was called at startup.')
    return null
  }

  try {
    parsedYamlCache = yaml.load(yamlText) as Record<string, unknown>
    return parsedYamlCache
  } catch (error) {
    console.error('Failed to parse cached YAML content:', error)
    return null
  }
}

/**
 * Extract shape computation method name from YAML layer definition
 */
function getShapeComputationMethod(yamlContent: Record<string, unknown>, layerType: string): string | null {
  const layers = yamlContent.layers as Record<string, Record<string, unknown>>
  const layerDef = layers?.[layerType]
  
  if (!layerDef) {
    return null
  }

  // Navigate through frameworks configuration - this structure is defined in YAML
  const frameworks = layerDef.frameworks as Record<string, Record<string, unknown>>
  const metadata = yamlContent.metadata as Record<string, unknown>
  const settings = metadata?.settings as Record<string, unknown>
  const defaultFramework = settings?.default_framework as string || 'keras'
  const frameworkConfig = frameworks?.[defaultFramework] as Record<string, unknown>
  
  return frameworkConfig?.shape_computation as string || null
}

/**
 * Computes output shape for a layer using YAML-driven configuration
 */
export async function computeYAMLDrivenShape(
  layerType: string,
  inputShapes: number[][],
  params: LayerParams
): Promise<ShapeComputationResult> {
  const yamlContent = getCachedParsedYAML()
  
  if (!yamlContent?.layers) {
    return {
      shape: null,
      error: `YAML configuration not available for layer type: ${layerType}`
    }
  }

  const shapeComputationName = getShapeComputationMethod(yamlContent, layerType)
  
  if (!shapeComputationName) {
    return {
      shape: null,
      error: `No shape computation method defined for layer type: ${layerType}`
    }
  }

  // Delegate to enhanced shape computation with existing params (no conversion needed)
  return computeShapeEnhanced(shapeComputationName, inputShapes, params)
}
