/**
 * Simplified YAML-driven shape computation loader
 * 
 * This module loads shape computation configurations using cached YAML content
 * for optimal performance during object moves.
 */

import type { LayerParams } from './layer-defs'
import { getShapeComputationFunction } from './shape-computation-registry'
import { getCachedYamlContent } from './yaml-layer-loader'

interface ShapeComputationResult {
  shape: number[] | null
  error?: string
}

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
 * Computes output shape for a layer using YAML-driven configuration
 */
export async function computeYAMLDrivenShape(
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
    if (!layerDef) {
      return {
        shape: null,
        error: `Layer type '${layerType}' not found in YAML configuration`
      }
    }

    // Get shape computation function name
    const frameworks = layerDef.frameworks as Record<string, Record<string, unknown>>
    const keras = frameworks?.keras as Record<string, unknown>
    const shapeComputationName = keras?.shape_computation as string
    
    if (!shapeComputationName) {
      return {
        shape: null,
        error: `No shape computation configuration found for layer type: ${layerType}`
      }
    }

    // Get the actual computation function
    const computeFunction = getShapeComputationFunction(shapeComputationName)
    if (!computeFunction) {
      return {
        shape: null,
        error: `Shape computation function '${shapeComputationName}' not implemented`
      }
    }

    // Compute the shape
    const shape = computeFunction(inputShapes, params)
    return { shape }
    
  } catch (error) {
    return {
      shape: null,
      error: `YAML-driven shape computation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
