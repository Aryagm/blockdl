/**
 * Simplified YAML-driven shape computation loader
 * 
 * This module loads shape computation configurations directly from YAML
 * without caching complexity.
 */

import type { LayerParams } from './layer-defs'
import { getShapeComputationFunction } from './shape-computation-registry'

interface ShapeComputationResult {
  shape: number[] | null
  error?: string
}

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
    const layerDef = yamlContent.layers[layerType]
    if (!layerDef) {
      return {
        shape: null,
        error: `Layer type '${layerType}' not found in YAML configuration`
      }
    }

    // Get shape computation function name
    const shapeComputationName = layerDef.frameworks?.keras?.shape_computation
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
