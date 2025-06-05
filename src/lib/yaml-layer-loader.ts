/**
 * YAML Layer Configuration Loader
 * Loads layer definitions from YAML configuration files using Zod validation
 */

import yaml from 'js-yaml'
import { z } from 'zod'
import type { LayerDef, LayerFormField, LayerParamValue } from './layer-defs'
import { layerDefs } from './layer-defs'

// Zod schemas for YAML structure validation
const YAMLParameterSchema = z.object({
  type: z.enum(['number', 'text', 'select']),
  label: z.string(),
  default: z.union([z.string(), z.number(), z.boolean()]).optional(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string()
  })).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),
    required: z.boolean().optional()
  }).optional(),
  show_when: z.record(z.array(z.string())).optional(),
  help: z.string().optional()
})

const YAMLLayerSchema = z.object({
  metadata: z.object({
    category: z.string(),
    icon: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    documentation: z.string().optional()
  }),
  visual: z.object({
    handles: z.object({
      input: z.boolean(),
      output: z.boolean()
    }),
    default_size: z.tuple([z.number(), z.number()]).optional()
  }),
  parameters: z.record(YAMLParameterSchema),
  features: z.object({
    supports_multiplier: z.boolean().optional()
  }).optional(),
  keras: z.object({
    import: z.string(),
    code_template: z.string(),
    shape_computation: z.string()
  })
})

const YAMLLayerConfigSchema = z.object({
  metadata: z.object({
    version: z.string(),
    description: z.string(),
    framework: z.string(),
    created: z.string()
  }),
  categories: z.record(z.object({
    name: z.string(),
    color: z.string(),
    bg_color: z.string(),
    border_color: z.string(),
    text_color: z.string(),
    description: z.string()
  })),
  layers: z.record(YAMLLayerSchema)
})

type YAMLLayer = z.infer<typeof YAMLLayerSchema>
type YAMLParameter = z.infer<typeof YAMLParameterSchema>

/**
 * Convert YAML parameter to LayerFormField format
 */
function convertParameter(key: string, param: YAMLParameter): LayerFormField {
  const field: LayerFormField = {
    key,
    label: param.label,
    type: param.type,
    ...(param.options && { options: param.options }),
    ...(param.validation?.min !== undefined && { min: param.validation.min }),
    ...(param.validation?.max !== undefined && { max: param.validation.max }),
    ...(param.validation?.step !== undefined && { step: param.validation.step })
  }

  // Convert show_when conditions to show function
  if (param.show_when) {
    field.show = (params: Record<string, LayerParamValue>) => {
      return Object.entries(param.show_when!).some(([paramKey, values]) => {
        return values.includes(String(params[paramKey]))
      })
    }
  }

  return field
}

/**
 * Shape computation utilities
 */
const ShapeComputers = {
  computeInputShape(params: Record<string, LayerParamValue>): string {
    const inputType = params.inputType || 'image_grayscale'
    
    const computations: Record<string, () => string> = {
      image_grayscale: () => `(${Number(params.height) || 28}, ${Number(params.width) || 28}, 1)`,
      image_color: () => `(${Number(params.height) || 28}, ${Number(params.width) || 28}, 3)`,
      image_custom: () => `(${Number(params.height) || 28}, ${Number(params.width) || 28}, ${Number(params.channels) || 1})`,
      flat_data: () => `(${Number(params.flatSize) || 784},)`,
      sequence: () => `(${Number(params.seqLength) || 100}, ${Number(params.features) || 128})`,
      custom: () => String(params.customShape) || '(784,)'
    }
    
    return computations[String(inputType)]?.() || '(784,)'
  },

  computeOutputUnits(params: Record<string, LayerParamValue>): number {
    const outputType = params.outputType || 'multiclass'
    
    const computations: Record<string, () => number> = {
      multiclass: () => Number(params.numClasses) || 10,
      binary: () => 1,
      regression: () => Number(params.units) || 1,
      multilabel: () => Number(params.units) || 10,
      custom: () => Number(params.units) || 10
    }
    
    return computations[String(outputType)]?.() || 10
  },

  computeOutputActivation(params: Record<string, LayerParamValue>): string {
    const outputType = params.outputType || 'multiclass'
    
    const activations: Record<string, string> = {
      multiclass: 'softmax',
      binary: 'sigmoid',
      regression: 'linear',
      multilabel: 'sigmoid',
      custom: String(params.activation) || 'softmax'
    }
    
    return activations[String(outputType)] || 'softmax'
  }
}

/**
 * Template processing utilities
 */
const TemplateProcessor = {
  handleComputedValue(varName: string, params: Record<string, LayerParamValue>): string {
    const computations: Record<string, () => string> = {
      computed_shape: () => ShapeComputers.computeInputShape(params),
      computed_units: () => ShapeComputers.computeOutputUnits(params).toString(),
      computed_activation: () => ShapeComputers.computeOutputActivation(params)
    }
    
    return computations[varName]?.() || `{{${varName}}}`
  },

  handleMultiplier(code: string, params: Record<string, LayerParamValue>, layerName: string): string {
    const multiplier = Number(params.multiplier) || 1
    if (multiplier <= 1) return code.trim()

    const baseCode = code.trim()
    
    return multiplier <= 5 
      ? Array(multiplier).fill(baseCode).join(',\n    ')
      : `# Add ${multiplier} ${layerName} layers\n    *[${baseCode} for _ in range(${multiplier})]`
  },

  processConditionals(code: string, params: Record<string, LayerParamValue>): string {
    // Handle Jinja2-like conditional statements for Merge layer
    return code.replace(
      /\{%\s*if\s+mode\s*==\s*["'](\w+)["']\s*%\}([^{]+)\{%\s*endif\s*%\}/g,
      (_, conditionMode, content) => {
        const mode = params.mode || 'concat'
        return mode === conditionMode ? content.trim() : ''
      }
    ).split('\n').filter(line => line.trim() !== '').join('\n').trim()
  },

  processVariables(code: string, params: Record<string, LayerParamValue>): string {
    return code.replace(/{{\s*(\w+)\s*}}/g, (_, varName) => {
      if (varName.startsWith('computed_')) {
        return this.handleComputedValue(varName, params)
      }
      
      if (varName === 'activation_suffix') {
        const activation = params.activation
        return activation && activation !== 'none' ? `, activation='${activation}'` : ''
      }
      
      const value = params[varName]
      return value !== undefined ? value.toString() : `{{${varName}}}`
    })
  },

  generateCode(template: string, params: Record<string, LayerParamValue>, layerName: string): string {
    let code = this.processConditionals(template, params)
    code = this.processVariables(code, params)
    return this.handleMultiplier(code, params, layerName)
  }
}

/**
 * Convert YAML layer to LayerDef format using validated schema
 */
function convertYAMLLayer(layerName: string, yamlLayer: YAMLLayer): LayerDef {
  const { metadata, parameters, keras, features } = yamlLayer
  
  // Convert parameters to formSpec and extract defaults
  const formSpec: LayerFormField[] = Object.entries(parameters).map(([key, param]) => 
    convertParameter(key, param)
  )
  
  const defaultParams: Record<string, LayerParamValue> = Object.fromEntries(
    Object.entries(parameters)
      .filter(([, param]) => param.default !== undefined)
      .map(([key, param]) => [key, param.default!])
  )

  return {
    type: layerName,
    icon: metadata.icon,
    description: metadata.description,
    defaultParams,
    formSpec,
    codeGen: (params: Record<string, LayerParamValue>) => 
      TemplateProcessor.generateCode(keras.code_template, params, layerName),
    kerasImport: keras.import,
    supportsMultiplier: features?.supports_multiplier || false
  }
}

/**
 * Load layer definitions from YAML file with Zod validation
 */
export async function loadLayersFromYAML(yamlContent: string): Promise<Record<string, LayerDef>> {
  try {
    const rawConfig = yaml.load(yamlContent)
    const config = YAMLLayerConfigSchema.parse(rawConfig)
    
    return Object.fromEntries(
      Object.entries(config.layers).map(([layerName, yamlLayer]) => [
        layerName,
        convertYAMLLayer(layerName, yamlLayer)
      ])
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('YAML validation errors:', error.errors)
      throw new Error(`Invalid YAML configuration: ${error.errors.map(e => e.message).join(', ')}`)
    }
    console.error('Error loading YAML configuration:', error)
    throw error
  }
}

// Store the YAML content for later use
let cachedYamlContent: string | null = null

/**
 * Load layer categories from YAML with validation
 */
export function loadCategoriesFromYAML(yamlContent: string) {
  try {
    const rawConfig = yaml.load(yamlContent)
    const config = YAMLLayerConfigSchema.parse(rawConfig)
    return config.categories
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('YAML validation errors:', error.errors)
      throw new Error(`Invalid YAML configuration: ${error.errors.map(e => e.message).join(', ')}`)
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
    const config = YAMLLayerConfigSchema.parse(rawConfig)
    
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
    if (error instanceof z.ZodError) {
      console.error('YAML validation errors:', error.errors)
      throw new Error(`Invalid YAML configuration: ${error.errors.map(e => e.message).join(', ')}`)
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
    cachedYamlContent = yamlContent // Cache the content
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
