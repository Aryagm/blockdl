/**
 * Enhanced YAML-driven shape computation loader with detailed error messages
 */

import type { LayerParams } from './layer-defs'
import { computeEnhancedLayerShape, type ShapeComputationResult } from './enhanced-shape-computation'
import { getCachedYamlContent } from './yaml-layer-loader'

/**
 * Loads YAML content from cache (loaded once at startup)
 */
async function loadYAMLContent(): Promise<Record<string, unknown> | null> {
  try {
    const yamlText = getCachedYamlContent()
    if (!yamlText) {
      console.error('YAML content not cached. Ensure initializeLayerDefs() was called at startup.')
      return null
    }
    
    const YAML = await import('yaml')
    return YAML.parse(yamlText) as Record<string, unknown>
  } catch (error) {
    console.error('Failed to parse cached YAML content:', error)
    return null
  }
}

/**
 * Computes output shape for a layer using enhanced YAML-driven configuration
 */
export async function computeEnhancedYAMLDrivenShape(
  layerType: string,
  inputShapes: number[][],
  params: LayerParams
): Promise<ShapeComputationResult> {
  try {
    // Load YAML content from cache
    const yamlContent = await loadYAMLContent()
    
    if (!yamlContent || !yamlContent.layers) {
      return {
        shape: null,
        error: `YAML content not available for layer type: ${layerType}`
      }
    }

    // Get layer definition with proper typing
    const layers = yamlContent.layers as Record<string, Record<string, unknown>>
    const layerDef = layers[layerType]
    let shapeComputationName: string | undefined
    
    if (layerDef) {
      const frameworks = layerDef.frameworks as Record<string, Record<string, unknown>>
      const keras = frameworks?.keras as Record<string, unknown>
      shapeComputationName = keras?.shape_computation as string
    }

    // Use enhanced shape computation
    return computeEnhancedLayerShape(layerType, inputShapes, params, shapeComputationName)
    
  } catch (error) {
    return {
      shape: null,
      error: `Enhanced YAML-driven shape computation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
