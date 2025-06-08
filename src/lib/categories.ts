/**
 * Layer Category Definitions and Color Mappings
 * 
 * Single source of truth for layer categorization and theming.
 * Defines the visual categorization and theming for different types of neural network layers.
 */

import { getLayersByCategory } from './layer-definitions'

// ============================================================================
// CATEGORY DEFINITIONS
// ============================================================================

export const categories: Record<string, CategoryDefinition> = {
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

// ============================================================================
// COLOR MAPPINGS
// ============================================================================

/**
 * Static color mapping to ensure Tailwind classes are included in build
 */
const categoryColorMap: Record<string, { bg: string; border: string; text: string; hover: string }> = {
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

// ============================================================================
// TYPES
// ============================================================================

export interface CategoryDefinition {
  name: string
  color: string
  description: string
  icon: string
}

export interface CategoryColors {
  bg: string
  border: string
  text: string
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get category colors for a specific layer type
 */
export function getLayerCategoryColors(layerType: string): { bg: string; border: string; text: string; hover: string } {
  // Simple static mapping to avoid circular dependency
  const layerToCategoryMap: Record<string, string> = {
    'Input': 'input_output',
    'Output': 'input_output',
    'Dense': 'dense',
    'Conv2D': 'convolutional',
    'MaxPool2D': 'pooling',
    'Flatten': 'transformation',
    'Activation': 'activation',
    'Dropout': 'regularization'
  }
  
  const category = layerToCategoryMap[layerType] || 'dense'
  const categoryInfo = categories[category as keyof typeof categories]
  
  if (!categoryInfo?.color) {
    return categoryColorMap.blue // fallback to blue
  }
  
  return categoryColorMap[categoryInfo.color] || categoryColorMap.blue
}

/**
 * Get category colors by category key
 */
export function getCategoryColorsByKey(categoryKey: string): { bg: string; border: string; text: string; hover: string } {
  const categoryInfo = categories[categoryKey as keyof typeof categories]
  
  if (!categoryInfo?.color) {
    return categoryColorMap.blue // fallback to blue
  }
  
  return categoryColorMap[categoryInfo.color] || categoryColorMap.blue
}

/**
 * Get layer categories with their associated layers
 */
export function getLayerCategories() {
  return Object.entries(categories).map(([key, category]) => {
    const colorClasses = getCategoryColorsByKey(key)
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
