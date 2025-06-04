/**
 * YAML Layer Configuration Loader
 * Loads layer definitions from YAML configuration files
 */

import yaml from 'js-yaml'
import type { LayerDef, LayerFormField, LayerParamValue } from './layer-defs'
import { layerDefs } from './layer-defs'

// Define a type for parameter values - use the shared type
type ParamValue = LayerParamValue

// YAML configuration interfaces
interface YAMLLayerConfig {
  metadata: {
    version: string
    description: string
    framework: string
    created: string
  }
  categories: Record<string, {
    name: string
    color: string
    bg_color: string
    border_color: string
    text_color: string
    description: string
  }>
  layers: Record<string, YAMLLayer>
}

interface YAMLLayer {
  metadata: {
    category: string
    icon: string
    description: string
    tags: string[]
    documentation?: string
  }
  visual: {
    handles: {
      input: boolean
      output: boolean
    }
    default_size?: [number, number]
  }
  parameters: Record<string, YAMLParameter>
  features?: {
    supports_multiplier?: boolean
  }
  keras: {
    import: string
    code_template: string
    shape_computation: string
  }
}

interface YAMLParameter {
  type: 'number' | 'text' | 'select'
  label: string
  default?: ParamValue
  options?: Array<{ value: string; label: string }>
  validation?: {
    min?: number
    max?: number
    step?: number
    required?: boolean
  }
  show_when?: Record<string, string[]>
  help?: string
}

/**
 * Convert YAML parameter to LayerFormField format
 */
function convertParameter(key: string, param: YAMLParameter): LayerFormField {
  const { label, type, options, validation, show_when } = param
  
  const field: LayerFormField = {
    key,
    label,
    type,
    ...(options && { options }),
    ...(validation?.min !== undefined && { min: validation.min }),
    ...(validation?.max !== undefined && { max: validation.max }),
    ...(validation?.step !== undefined && { step: validation.step })
  }

  // Convert show_when conditions to show function
  if (show_when) {
    field.show = (params: Record<string, ParamValue>) => {
      return Object.entries(show_when).some(([paramKey, values]) => {
        return values.includes(String(params[paramKey]))
      })
    }
  }

  return field
}

/**
 * Handle computed values based on shape computation type
 */
function handleComputedValue(varName: string, params: Record<string, ParamValue>): string {
  switch (varName) {
    case 'computed_shape':
      return computeInputShape(params)
    case 'computed_units':
      return computeOutputUnits(params).toString()
    case 'computed_activation':
      return computeOutputActivation(params)
    default:
      return `{{${varName}}}`
  }
}

/**
 * Handle multiplier logic for code generation
 */
function handleMultiplier(code: string, params: Record<string, ParamValue>, layerName: string): string {
  const multiplier = Number(params.multiplier) || 1
  if (multiplier <= 1) {
    return code.trim()
  }

  const baseCode = code.trim()
  
  if (multiplier <= 5) {
    // For small multipliers, generate individual layers
    return Array(multiplier).fill(baseCode).join(',\n    ')
  } else {
    // For large multipliers, use Python list comprehension
    return `# Add ${multiplier} ${layerName} layers\n    *[${baseCode} for _ in range(${multiplier})]`
  }
}

/**
 * Generate code from YAML template
 */
function generateCodeFromTemplate(
  template: string, 
  params: Record<string, ParamValue>,
  layerName: string
): string {
  let code = template
  
  // Handle template variables with computed values
  code = code.replace(/{{\s*(\w+)\s*}}/g, (_match, varName) => {
    // Handle computed values
    if (varName.startsWith('computed_')) {
      return handleComputedValue(varName, params)
    }
    
    // Handle activation suffix
    if (varName === 'activation_suffix') {
      const activation = params.activation
      return activation && activation !== 'none' ? `, activation='${activation}'` : ''
    }
    
    // Handle regular parameter values
    const value = params[varName]
    return value !== undefined ? value.toString() : `{{${varName}}}`
  })

  // Handle multiplier logic
  return handleMultiplier(code, params, layerName)
}

/**
 * Compute input shape for Input layers
 */
function computeInputShape(params: Record<string, ParamValue>): string {
  const inputType = params.inputType || 'image_grayscale'
  
  switch (inputType) {
    case 'image_grayscale': {
      const h1 = Number(params.height) || 28
      const w1 = Number(params.width) || 28
      return `(${h1}, ${w1}, 1)`
    }
    case 'image_color': {
      const h2 = Number(params.height) || 28
      const w2 = Number(params.width) || 28
      return `(${h2}, ${w2}, 3)`
    }
    case 'image_custom': {
      const h3 = Number(params.height) || 28
      const w3 = Number(params.width) || 28
      const c3 = Number(params.channels) || 1
      return `(${h3}, ${w3}, ${c3})`
    }
    case 'flat_data': {
      const size = Number(params.flatSize) || 784
      return `(${size},)`
    }
    case 'sequence': {
      const seqLen = Number(params.seqLength) || 100
      const features = Number(params.features) || 128
      return `(${seqLen}, ${features})`
    }
    case 'custom': {
      return String(params.customShape) || '(784,)'
    }
    default:
      return '(784,)'
  }
}

/**
 * Compute output units for Output layers
 */
function computeOutputUnits(params: Record<string, ParamValue>): number {
  const outputType = params.outputType || 'multiclass'
  
  switch (outputType) {
    case 'multiclass':
      return Number(params.numClasses) || 10
    case 'binary':
      return 1
    case 'regression':
      return Number(params.units) || 1
    case 'multilabel':
      return Number(params.units) || 10
    case 'custom':
      return Number(params.units) || 10
    default:
      return 10
  }
}

/**
 * Compute activation for Output layers
 */
function computeOutputActivation(params: Record<string, ParamValue>): string {
  const outputType = params.outputType || 'multiclass'
  
  switch (outputType) {
    case 'multiclass':
      return 'softmax'
    case 'binary':
      return 'sigmoid'
    case 'regression':
      return 'linear'
    case 'multilabel':
      return 'sigmoid'
    case 'custom':
      return String(params.activation) || 'softmax'
    default:
      return 'softmax'
  }
}

/**
 * Convert YAML layer to LayerDef format
 */
function convertYAMLLayer(layerName: string, yamlLayer: YAMLLayer): LayerDef {
  const { metadata, parameters, keras, features } = yamlLayer
  
  // Convert parameters to formSpec and extract defaults
  const formSpec: LayerFormField[] = []
  const defaultParams: Record<string, ParamValue> = {}
  
  Object.entries(parameters).forEach(([key, param]) => {
    formSpec.push(convertParameter(key, param))
    if (param.default !== undefined) {
      defaultParams[key] = param.default
    }
  })

  return {
    type: layerName,
    icon: metadata.icon,
    description: metadata.description,
    defaultParams,
    formSpec,
    codeGen: (params: Record<string, ParamValue>) => {
      return generateCodeFromTemplate(keras.code_template, params, layerName)
    },
    kerasImport: keras.import,
    supportsMultiplier: features?.supports_multiplier || false
  }
}

/**
 * Load layer definitions from YAML file
 */
export async function loadLayersFromYAML(yamlContent: string): Promise<Record<string, LayerDef>> {
  try {
    const config = yaml.load(yamlContent) as YAMLLayerConfig
    const layerDefs: Record<string, LayerDef> = {}

    // Convert each YAML layer to LayerDef format
    Object.entries(config.layers).forEach(([layerName, yamlLayer]) => {
      layerDefs[layerName] = convertYAMLLayer(layerName, yamlLayer)
    })

    return layerDefs
  } catch (error) {
    console.error('Error loading YAML configuration:', error)
    throw error
  }
}

/**
 * Load layer categories from YAML
 */
export function loadCategoriesFromYAML(yamlContent: string) {
  try {
    const config = yaml.load(yamlContent) as YAMLLayerConfig
    return config.categories
  } catch (error) {
    console.error('Error loading categories from YAML:', error)
    throw error
  }
}

/**
 * Initialize layer definitions by loading from YAML file and populating layerDefs
 */
export async function initializeLayerDefs(): Promise<void> {
  try {
    // Load YAML from public directory
    const response = await fetch('/layers.yaml')
    if (!response.ok) {
      throw new Error(`Failed to fetch layers.yaml: ${response.status} ${response.statusText}`)
    }
    
    const yamlContent = await response.text()
    const loadedLayerDefs = await loadLayersFromYAML(yamlContent)
    
    // Clear existing definitions and add loaded ones
    Object.keys(layerDefs).forEach(key => delete layerDefs[key])
    Object.assign(layerDefs, loadedLayerDefs)
    
    console.log(`Successfully loaded ${Object.keys(layerDefs).length} layer definitions from YAML`)
  } catch (error) {
    console.error('Failed to initialize layer definitions from YAML:', error)
    throw error
  }
}
