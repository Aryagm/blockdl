/**
 * Enhanced YAML Layer Configuration Loader
 * 
 * This module loads layer definitions from enhanced YAML configuration and converts them
 * to the internal LayerDef format used by the application. It serves as the bridge between
 * the declarative YAML configuration and the runtime layer system.
 * 
 * Key Functions:
 * - initializeLayerDefs(): Loads YAML on app startup and populates the layer registry
 * - getCachedYamlContent(): Provides cached YAML content to other modules
 * - loadCategoriesFromYAML(): Loads category definitions for UI styling
 * - loadCategoriesWithLayers(): Creates category-layer mappings for the palette
 * 
 * Optimizations Made:
 * - Simplified template processing from complex regex to basic string interpolation
 * - Removed redundant shape computation (handled by dedicated shape computation modules)
 * - Streamlined parameter type mapping
 * - Maintained all essential functionality while reducing complexity
 */

import yaml from 'js-yaml'
import type { LayerDef, LayerFormField, LayerParamValue } from './layer-defs'
import { layerDefs } from './layer-defs'
import { 
  validateYAMLConfig,
  type EnhancedLayer,
  type ParameterDefinition 
} from './yaml-schema'

/**
 * Convert enhanced YAML parameter to LayerFormField format
 */
function convertParameter(key: string, param: ParameterDefinition): LayerFormField {
  // Direct type mapping from YAML to LayerFormField
  const fieldType = param.type === 'boolean' ? 'select' : 
                   param.type === 'color' ? 'text' :
                   param.type === 'range' ? 'number' :
                   param.type as 'number' | 'text' | 'select'
  
  const field: LayerFormField = {
    key,
    label: param.label,
    type: fieldType,
    ...(param.validation?.min !== undefined && { min: param.validation.min }),
    ...(param.validation?.max !== undefined && { max: param.validation.max }),
    ...(param.validation?.step !== undefined && { step: param.validation.step })
  }

  // Handle options for select fields
  if (param.options) {
    field.options = param.options
  } else if (param.type === 'boolean') {
    field.options = [
      { value: 'true', label: 'True' },
      { value: 'false', label: 'False' }
    ]
  }

  // Convert conditional display logic
  if (param.conditional?.show_when) {
    field.show = (params: Record<string, LayerParamValue>) => {
      return Object.entries(param.conditional!.show_when!).some(([paramKey, values]) => {
        if (Array.isArray(values)) {
          return values.includes(String(params[paramKey]))
        }
        return false
      })
    }
  }

  return field
}

/**
 * Compute computed values referenced in templates
 */
function getComputedValue(varName: string, params: Record<string, LayerParamValue>): string {
  switch (varName) {
    case 'computed_shape': {
      const inputType = String(params.inputType || 'image_grayscale')
      const height = Number(params.height) || 28
      const width = Number(params.width) || 28
      const channels = Number(params.channels) || 1
      
      switch (inputType) {
        case 'image_grayscale': return `(${height}, ${width}, 1)`
        case 'image_color': return `(${height}, ${width}, 3)`
        case 'image_custom': return `(${height}, ${width}, ${channels})`
        case 'flat_data': return `(${Number(params.flatSize) || 784},)`
        case 'sequence': return `(${Number(params.seqLength) || 100}, ${Number(params.features) || 128})`
        default: return '(784,)'
      }
    }
    case 'computed_units': {
      const outputType = String(params.outputType || 'multiclass')
      switch (outputType) {
        case 'multiclass': return String(Number(params.numClasses) || 10)
        case 'binary': return '1'
        case 'regression': return String(Number(params.units) || 1)
        case 'multilabel': return String(Number(params.units) || 10)
        default: return '10'
      }
    }
    case 'computed_activation': {
      const outputType = String(params.outputType || 'multiclass')
      switch (outputType) {
        case 'multiclass': return 'softmax'
        case 'binary': return 'sigmoid'
        case 'regression': return 'linear'
        case 'multilabel': return 'sigmoid'
        case 'custom': return String(params.activation) || 'softmax'
        default: return 'softmax'
      }
    }
    default: return `{{${varName}}}`
  }
}

/**
 * Simple template processing utilities
 */
const TemplateProcessor = {
  /**
   * Process variable substitutions and conditionals in template
   */
  generateCode(template: string, params: Record<string, LayerParamValue>, layerName: string): string {
    let code = template
    
    // Handle basic conditionals: {% if variable %}content{% endif %}
    code = code.replace(/\{%\s*if\s+(\w+)\s*%\}(.*?)\{%\s*endif\s*%\}/g, (_, varName, content) => {
      const value = params[varName]
      return value && value !== '' && value !== null && value !== undefined ? content.trim() : ''
    })
    
    // Handle mode-specific conditionals: {% if mode == 'value' %}content{% endif %}
    code = code.replace(/\{%\s*if\s+(\w+)\s*==\s*['"](\w+)['"]\s*%\}(.*?)\{%\s*endif\s*%\}/g, (_, varName, expectedValue, content) => {
      const actualValue = String(params[varName] || '')
      return actualValue === expectedValue ? content.trim() : ''
    })
    
    // Handle variable substitution: {{ variable }}
    code = code.replace(/{{\s*(\w+)\s*}}/g, (_, varName) => {
      if (varName.startsWith('computed_')) {
        return getComputedValue(varName, params)
      }
      
      if (varName === 'activation_suffix') {
        const activation = params.activation
        return activation && activation !== 'none' ? `, activation='${activation}'` : ''
      }
      
      const value = params[varName]
      return value !== undefined ? value.toString() : `{{${varName}}}`
    })
    
    // Handle multiplier
    const multiplier = Number(params.multiplier) || 1
    if (multiplier > 1) {
      const baseCode = code.trim()
      return multiplier <= 5 
        ? Array(multiplier).fill(baseCode).join(',\n    ')
        : `# Add ${multiplier} ${layerName} layers\n    *[${baseCode} for _ in range(${multiplier})]`
    }
    
    return code.trim()
  }
}

/**
 * Convert enhanced YAML layer to LayerDef format using validated schema
 */
function convertYAMLLayer(layerName: string, yamlLayer: EnhancedLayer): LayerDef {
  const { metadata, parameters, frameworks, features } = yamlLayer
  
  // Convert parameters to formSpec and extract defaults
  const formSpec: LayerFormField[] = Object.entries(parameters).map(([key, param]) => 
    convertParameter(key, param)
  )
  
  const defaultParams: Record<string, LayerParamValue> = Object.fromEntries(
    Object.entries(parameters)
      .filter(([, param]) => param.default !== undefined)
      .map(([key, param]) => [key, param.default!])
  )

  // Use Keras framework by default (enhanced YAML uses frameworks structure)
  const kerasFramework = frameworks.keras
  if (!kerasFramework) {
    throw new Error(`Layer ${layerName} missing Keras framework definition`)
  }

  return {
    type: layerName,
    icon: metadata.icon,
    description: metadata.description,
    category: metadata.category,  // Include category from metadata
    defaultParams,
    formSpec,
    codeGen: (params: Record<string, LayerParamValue>) => 
      TemplateProcessor.generateCode(
        typeof kerasFramework.template === 'string' ? kerasFramework.template : kerasFramework.template.base, 
        params, 
        layerName
      ),
    kerasImport: Array.isArray(kerasFramework.import) ? kerasFramework.import[0] : kerasFramework.import,
    supportsMultiplier: features?.supports_multiplier || false
  }
}

/**
 * Load layer definitions from enhanced YAML file with validation
 */
export async function loadLayersFromYAML(yamlContent: string): Promise<Record<string, LayerDef>> {
  try {
    const rawConfig = yaml.load(yamlContent)
    const config = validateYAMLConfig(rawConfig)
    
    return Object.fromEntries(
      Object.entries(config.layers).map(([layerName, yamlLayer]) => [
        layerName,
        convertYAMLLayer(layerName, yamlLayer)
      ])
    )
  } catch (error) {
    if (error instanceof Error) {
      console.error('YAML validation errors:', error.message)
      throw new Error(`Invalid YAML configuration: ${error.message}`)
    }
    console.error('Error loading YAML configuration:', error)
    throw error
  }
}

// Store the YAML content for later use
let cachedYamlContent: string | null = null

/**
 * Load layer categories from enhanced YAML with validation
 */
export function loadCategoriesFromYAML(yamlContent: string) {
  try {
    const rawConfig = yaml.load(yamlContent)
    const config = validateYAMLConfig(rawConfig)
    return config.categories
  } catch (error) {
    if (error instanceof Error) {
      console.error('YAML validation errors:', error.message)
      throw new Error(`Invalid YAML configuration: ${error.message}`)
    }
    console.error('Error loading categories from YAML:', error)
    throw error
  }
}

/**
 * Load categories with their associated layers with validation
 */
export function loadCategoriesWithLayers(yamlContent: string) {
  try {
    const rawConfig = yaml.load(yamlContent)
    const config = validateYAMLConfig(rawConfig)
    
    // Create category-layer mapping
    const categoryLayerMap = Object.fromEntries(
      Object.keys(config.categories).map(categoryKey => [categoryKey, []])
    ) as Record<string, string[]>
    
    // Map layers to their categories
    Object.entries(config.layers).forEach(([layerName, layerDef]) => {
      const categoryKey = layerDef.metadata.category
      if (categoryLayerMap[categoryKey]) {
        categoryLayerMap[categoryKey].push(layerName)
      }
    })
    
    // Transform to BlockPalette format
    return Object.entries(config.categories).map(([categoryKey, categoryDef]) => ({
      name: categoryDef.name,
      color: categoryDef.color,
      bgColor: categoryDef.bg_color,
      borderColor: categoryDef.border_color,
      textColor: categoryDef.text_color,
      description: categoryDef.description,
      layerTypes: categoryLayerMap[categoryKey] || []
    }))
  } catch (error) {
    if (error instanceof Error) {
      console.error('YAML validation errors:', error.message)
      throw new Error(`Invalid YAML configuration: ${error.message}`)
    }
    console.error('Error loading categories with layers from YAML:', error)
    throw error
  }
}

/**
 * Get the cached YAML content
 */
export function getCachedYamlContent(): string | null {
  return cachedYamlContent
}

/**
 * Initialize layer definitions by loading from enhanced YAML file and populating layerDefs
 */
export async function initializeLayerDefs(): Promise<void> {
  try {
    // Load enhanced YAML from public directory
    const response = await fetch('/layers-enhanced.yaml')
    if (!response.ok) {
      throw new Error(`Failed to fetch layers-enhanced.yaml: ${response.status} ${response.statusText}`)
    }
    
    const yamlContent = await response.text()
    cachedYamlContent = yamlContent // Cache the content
    const loadedLayerDefs = await loadLayersFromYAML(yamlContent)
    
    // Clear existing definitions and add loaded ones
    Object.keys(layerDefs).forEach(key => delete layerDefs[key])
    Object.assign(layerDefs, loadedLayerDefs)
    
    console.log(`Successfully loaded ${Object.keys(layerDefs).length} layer definitions from enhanced YAML`)
  } catch (error) {
    console.error('Failed to initialize layer definitions from enhanced YAML:', error)
    throw error
  }
}
