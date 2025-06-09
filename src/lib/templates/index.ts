 /**
 * Neural Network Templates System
 * 
 * Pre-built network architectures that can be dragged onto the canvas
 * as complete networks rather than individual layers.
 */

export interface TemplateLayer {
  id: string
  type: string
  params: Record<string, unknown>
  position: { x: number; y: number }
}

export interface TemplateConnection {
  source: string
  target: string
}

export interface NetworkTemplate {
  id: string
  name: string
  description: string
  icon: string
  tags: string[]
  category: 'classification' | 'regression' | 'cnn' | 'rnn' | 'autoencoder' | 'gan' | 'transformer'
  layers: TemplateLayer[]
  connections: TemplateConnection[]
  metadata: {
    inputShape?: number[]
    outputClasses?: number
    complexity: 'beginner' | 'intermediate' | 'advanced'
    useCase: string
    performance: {
      trainTime: string
      accuracy: string
      parameters: string
    }
  }
}

export interface TemplateCategory {
  name: string
  color: string
  description: string
  icon: string
}

// Template categories
export const templateCategories: Record<string, TemplateCategory> = {
  classification: {
    name: 'Classification',
    color: 'green',
    description: 'Networks for classification tasks',
    icon: '🎯'
  },
  regression: {
    name: 'Regression', 
    color: 'blue',
    description: 'Networks for regression tasks',
    icon: '📈'
  },
  cnn: {
    name: 'CNN',
    color: 'purple',
    description: 'Convolutional neural networks for images',
    icon: '🖼️'
  },
  rnn: {
    name: 'RNN',
    color: 'cyan',
    description: 'Recurrent networks for sequences',
    icon: '🔄'
  },
  autoencoder: {
    name: 'Autoencoder',
    color: 'orange',
    description: 'Networks for dimensionality reduction',
    icon: '🔄'
  },
  gan: {
    name: 'GAN',
    color: 'red',
    description: 'Generative adversarial networks',
    icon: '🎨'
  },
  transformer: {
    name: 'Transformer',
    color: 'indigo',
    description: 'Attention-based architectures',
    icon: '🤖'
  }
}

// Template data - simplified for now to avoid circular dependency issues
export const templates: NetworkTemplate[] = [
  {
    id: 'simple-classifier',
    name: 'Simple Classifier',
    description: 'Basic dense network for classification tasks',
    icon: '🎯',
    tags: ['beginner', 'dense', 'classification'],
    category: 'classification',
    layers: [
      {
        id: 'input-1',
        type: 'Input',
        params: { inputType: 'flat_data', flatSize: 784 },
        position: { x: 100, y: 100 }
      },
      {
        id: 'dense-1', 
        type: 'Dense',
        params: { units: 128, activation: 'relu' },
        position: { x: 100, y: 200 }
      },
      {
        id: 'dropout-1',
        type: 'Dropout', 
        params: { rate: 0.5 },
        position: { x: 100, y: 300 }
      },
      {
        id: 'dense-2',
        type: 'Dense',
        params: { units: 64, activation: 'relu' },
        position: { x: 100, y: 400 }
      },
      {
        id: 'output-1',
        type: 'Output',
        params: { outputType: 'multiclass', numClasses: 10 },
        position: { x: 100, y: 500 }
      }
    ],
    connections: [
      { source: 'input-1', target: 'dense-1' },
      { source: 'dense-1', target: 'dropout-1' },
      { source: 'dropout-1', target: 'dense-2' },
      { source: 'dense-2', target: 'output-1' }
    ],
    metadata: {
      inputShape: [784],
      outputClasses: 10,
      complexity: 'beginner',
      useCase: 'MNIST digit classification, simple tabular data',
      performance: {
        trainTime: '< 5 minutes',
        accuracy: '~95%',
        parameters: '~110K'
      }
    }
  }
]

// Utility functions
export function getTemplatesByCategory(category: string): NetworkTemplate[] {
  return templates.filter((template: NetworkTemplate) => template.category === category)
}

export function getAllTemplates(): NetworkTemplate[] {
  return templates
}

export function getTemplateById(id: string): NetworkTemplate | undefined {
  return templates.find((template: NetworkTemplate) => template.id === id)
}

export function getTemplateCategoryColors(category: string): { bg: string; border: string; text: string; hover: string } {
  const categoryColorMap: Record<string, { bg: string; border: string; text: string; hover: string }> = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200', 
      text: 'text-green-700',
      hover: 'hover:border-green-300 hover:shadow-green-200/50'
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
    cyan: {
      bg: 'bg-cyan-50',
      border: 'border-cyan-200',
      text: 'text-cyan-700',
      hover: 'hover:border-cyan-300 hover:shadow-cyan-200/50'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      hover: 'hover:border-orange-300 hover:shadow-orange-200/50'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      hover: 'hover:border-red-300 hover:shadow-red-200/50'
    },
    indigo: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      text: 'text-indigo-700',
      hover: 'hover:border-indigo-300 hover:shadow-indigo-200/50'
    }
  }

  const categoryInfo = templateCategories[category]
  if (!categoryInfo?.color) {
    return categoryColorMap.blue // fallback
  }
  
  return categoryColorMap[categoryInfo.color] || categoryColorMap.blue
}
