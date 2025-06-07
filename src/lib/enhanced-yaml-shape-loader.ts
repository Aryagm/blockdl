/**
 * Enhanced YAML-driven shape computation loader with detailed error messages
 */

import type { LayerParams } from './layer-defs'
import { computeEnhancedLayerShape, type ShapeComputationResult } from './enhanced-shape-computation'

/**
 * Loads YAML content directly from file
 */
async function loadYAMLContent(): Promise<any> {
  try {
    const response = await fetch('/layers-enhanced.yaml')
    if (!response.ok) {
      throw new Error(`Failed to fetch YAML: ${response.status}`)
    }
    const yamlText = await response.text()
    const YAML = await import('yaml')
    return YAML.parse(yamlText)
  } catch (error) {
    console.error('Failed to load YAML content:', error)
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
    // Load YAML content directly
    const yamlContent = await loadYAMLContent()
    
    if (!yamlContent || !yamlContent.layers) {
      return {
        shape: null,
        error: `YAML content not available for layer type: ${layerType}`
      }
    }

    // Get layer definition
    const layerDef = yamlContent.layers[layerType]
    let shapeComputationName: string | undefined
    
    if (layerDef && layerDef.frameworks?.keras?.shape_computation) {
      shapeComputationName = layerDef.frameworks.keras.shape_computation
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
