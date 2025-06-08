/**
 * Legacy Layer Compatibility Layer
 * 
 * Provides backwards compatibility for the old layer definition system
 * while the codebase transitions to the new unified system.
 */

import { layerDefinitions, getLayersByCategory } from './layer-definitions'

// ============================================================================
// LEGACY TYPES
// ============================================================================

/** Valid types for layer parameter values */
export type LayerParamValue = string | number | boolean

/** Layer parameters as key-value pairs */
export type LayerParams = Record<string, LayerParamValue>

/** Form field configuration for layer parameter editing */
export interface LayerFormField {
  key: string
  label: string
  type: 'number' | 'text' | 'select' | 'boolean'
  options?: { value: string; label: string; description?: string }[]
  min?: number
  max?: number
  step?: number
  default?: string | number | boolean
  validation?: {
    min?: number
    max?: number
    required?: boolean
    pattern?: string
  }
  show?: (params: Record<string, LayerParamValue>) => boolean
}

/** Complete layer definition with metadata and configuration */
export interface LayerDef {
  type: string
  icon: string
  description: string
  category: string
  defaultParams: Record<string, LayerParamValue>
  formSpec: LayerFormField[]
  codeGen: (params: Record<string, LayerParamValue>) => string
  kerasImport?: string
  supportsMultiplier?: boolean
}

// ============================================================================
// LEGACY COMPATIBILITY FUNCTIONS
// ============================================================================

/** Runtime registry of all loaded layer definitions */
export const layerDefs: Record<string, LayerDef> = {}

/**
 * Populate layerDefs from new system
 */
function initializeLayerDefs() {
  Object.entries(layerDefinitions).forEach(([type, definition]) => {
    const formSpec: LayerFormField[] = definition.parameters.map(param => {
      const field: LayerFormField = {
        key: param.key,
        label: param.label,
        type: param.type,
        options: param.options,
        min: param.validation?.min,
        max: param.validation?.max,
        default: param.default,
        validation: param.validation
      }

      // Convert conditional logic from new system to old function format
      if (param.conditional?.showWhen) {
        field.show = (params: Record<string, LayerParamValue>) => {
          return Object.entries(param.conditional!.showWhen!).every(([paramKey, allowedValues]) => {
            const currentValue = String(params[paramKey] || '')
            if (Array.isArray(allowedValues)) {
              return allowedValues.includes(currentValue)
            }
            return allowedValues === currentValue
          })
        }
      }

      return field
    })

    // Add multiplier parameter for layers that support it
    if (definition.supportsMultiplier) {
      formSpec.push({
        key: 'multiplier',
        label: 'Multiplier',
        type: 'number',
        default: 1,
        validation: { min: 1, max: 20 }
      })
    }

    const defaultParams: Record<string, LayerParamValue> = {}
    definition.parameters.forEach(param => {
      if (param.default !== undefined) {
        defaultParams[param.key] = param.default
      }
    })

    // Add multiplier default for layers that support it
    if (definition.supportsMultiplier) {
      defaultParams.multiplier = 1
    }

    layerDefs[type] = {
      type,
      icon: definition.metadata.icon,
      description: definition.metadata.description,
      category: definition.metadata.category,
      defaultParams,
      formSpec,
      codeGen: (params) => {
        const baseCode = definition.generateCode.keras(params)
        const multiplier = Number(params.multiplier) || 1
        
        if (multiplier > 1 && definition.supportsMultiplier) {
          if (multiplier >= 5) {
            // High multiplier case - use spread syntax with range for readability
            return `# Repeated ${multiplier} times\n    *[${baseCode} for _ in range(${multiplier})]`
          } else {
            // Low multiplier case - list individual layers
            return Array(multiplier).fill(baseCode).join(',\n    ')
          }
        }
        
        return baseCode
      },
      supportsMultiplier: definition.supportsMultiplier
    }
  })
}

// Initialize on module load
initializeLayerDefs()

// ============================================================================
// LEGACY API FUNCTIONS
// ============================================================================

/**
 * Get layer definition by type
 */
export function getLayerDef(type: string): LayerDef | undefined {
  return layerDefs[type]
}

/**
 * Get default parameters for a layer type
 */
export function getDefaultParams(type: string): Record<string, LayerParamValue> {
  return layerDefs[type]?.defaultParams || {}
}

/**
 * Get icon for a layer type
 */
export function getLayerIcon(type: string): string {
  return layerDefs[type]?.icon || '🔧'
}

/**
 * Get all available layer types with basic metadata
 */
export function getLayerTypes(): Array<{ type: string; icon: string; description: string }> {
  return Object.entries(layerDefs).map(([type, def]) => ({
    type,
    icon: def.icon,
    description: def.description
  }))
}

/**
 * Generate Keras code for a layer with given parameters
 */
export function generateLayerCode(type: string, params: Record<string, LayerParamValue>): string {
  const layerDef = layerDefs[type]
  if (!layerDef) {
    return `# Unknown layer type: ${type}`
  }
  return layerDef.codeGen(params)
}

/**
 * Get required Keras imports for a list of layer types
 */
export function getUsedKerasImports(layerTypes: string[]): string[] {
  const imports = new Set<string>()
  
  layerTypes.forEach(type => {
    const layerDefinition = layerDefinitions[type]
    if (layerDefinition) {
      // Extract import from the actual layer type name
      imports.add(type)
    }
  })
  
  return Array.from(imports)
}

/**
 * Get layer categories with their associated layers
 */
export function getLayerCategories() {
  // Define categories locally to avoid circular dependency
  const categories = {
    input_output: {
      name: 'Input/Output',
      color: 'emerald',
      description: 'Start and end points of your network',
      icon: '🔌'
    },
    dense: {
      name: 'Dense Layers',
      color: 'blue', 
      description: 'Fully connected layers',
      icon: '🔗'
    },
    convolutional: {
      name: 'Convolutional',
      color: 'purple',
      description: 'Conv2D and related layers',
      icon: '🔲'
    },
    pooling: {
      name: 'Pooling',
      color: 'indigo',
      description: 'Downsampling and upsampling',
      icon: '🏊'
    },
    transformation: {
      name: 'Transformation',
      color: 'amber',
      description: 'Shape transformation layers',
      icon: '🔄'
    },
    activation: {
      name: 'Activation',
      color: 'orange',
      description: 'Non-linear activation functions',
      icon: '⚡'
    },
    regularization: {
      name: 'Regularization',
      color: 'rose',
      description: 'Batch normalization and dropout',
      icon: '🛡️'
    },
    sequence: {
      name: 'Sequence',
      color: 'cyan',
      description: 'RNN and embedding layers',
      icon: '📊'
    },
    merge: {
      name: 'Merge',
      color: 'teal',
      description: 'Layer combination operations', 
      icon: '🔀'
    }
  } as const

  const colorMap: Record<string, { bg: string; border: string; text: string; hover: string }> = {
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      hover: 'hover:border-emerald-300 hover:shadow-emerald-200/50'
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      hover: 'hover:border-blue-300 hover:shadow-blue-200/50'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      hover: 'hover:border-purple-300 hover:shadow-purple-200/50'
    },
    indigo: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      text: 'text-indigo-700',
      hover: 'hover:border-indigo-300 hover:shadow-indigo-200/50'
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      hover: 'hover:border-amber-300 hover:shadow-amber-200/50'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      hover: 'hover:border-orange-300 hover:shadow-orange-200/50'
    },
    rose: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-700',
      hover: 'hover:border-rose-300 hover:shadow-rose-200/50'
    },
    cyan: {
      bg: 'bg-cyan-50',
      border: 'border-cyan-200',
      text: 'text-cyan-700',
      hover: 'hover:border-cyan-300 hover:shadow-cyan-200/50'
    },
    teal: {
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      text: 'text-teal-700',
      hover: 'hover:border-teal-300 hover:shadow-teal-200/50'
    }
  }
  
  return Object.entries(categories).map(([key, category]) => {
    const colorClasses = colorMap[category.color] || colorMap.blue // fallback to blue
    const layersByCategory = getLayersByCategory(key)
    
    return {
      name: category.name,
      color: category.color,
      bgColor: colorClasses.bg,
      borderColor: colorClasses.border,
      textColor: colorClasses.text,
      description: category.description,
      layerTypes: layersByCategory.map(({ type }: { type: string }) => type)
    }
  })
}
