/**
 * Simplified YAML-driven shape computation loader
 * 
 * This module loads shape computation configurations directly from YAML
 * without caching complexity.
 */

import { computeEnhancedLayerShape, type ShapeComputationResult } from './enhanced-shape-computation'
import type { LayerParams } from './layer-defs'

/**
 * Loads YAML content directly from file
 */
async function loadYAMLContent(): Promise<Record<string, unknown> | null> {
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
 * Computes output shape for a layer using YAML-driven configuration
 */
export async function computeYAMLDrivenShape(
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
    const layers = yamlContent.layers as Record<string, Record<string, unknown>>
    const layerDef = layers?.[layerType]
    let shapeComputationName: string | undefined
    
    if (layerDef) {
      const frameworks = layerDef.frameworks as Record<string, Record<string, unknown>>
      const keras = frameworks?.keras as Record<string, unknown>
      shapeComputationName = keras?.shape_computation as string
    }

    // Use enhanced shape computation with detailed error messages
    const enhancedParams: LayerParams = {}
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        enhancedParams[key] = value
      } else {
        enhancedParams[key] = String(value)
      }
    }
    
    const enhancedResult = computeEnhancedLayerShape(layerType, inputShapes, enhancedParams, shapeComputationName)
    
    // Convert enhanced result to legacy format for now
    return {
      shape: enhancedResult.shape,
      error: enhancedResult.error || (enhancedResult.warning ? `Warning: ${enhancedResult.warning}` : undefined)
    }
    
  } catch (error) {
    return {
      shape: null,
      error: `YAML-driven shape computation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
