/**
 * Centralized layer definitions registry for BlockDL
 * Contains default parameters, form specifications, and code generation snippets for each layer type
 */

export interface LayerFormField {
  key: string
  label: string
  type: 'number' | 'text' | 'select'
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  step?: number
}

export interface LayerDef {
  type: string
  icon: string
  description: string
  defaultParams: Record<string, any>
  formSpec: LayerFormField[]
  codeGen: (params: Record<string, any>) => string
  kerasImport?: string
}

export const layerDefs: Record<string, LayerDef> = {
  Input: {
    type: 'Input',
    icon: '📥',
    description: 'Input layer for data',
    defaultParams: { shape: '(784,)' },
    formSpec: [
      {
        key: 'shape',
        label: 'Input Shape',
        type: 'text'
      }
    ],
    codeGen: (params) => `Input(shape=${params.shape || '(784,)'})`,
    kerasImport: 'Input'
  },

  Dense: {
    type: 'Dense',
    icon: '🔗',
    description: 'Fully connected layer',
    defaultParams: { units: 128 },
    formSpec: [
      {
        key: 'units',
        label: 'Units',
        type: 'number',
        min: 1
      },
      {
        key: 'activation',
        label: 'Activation (optional)',
        type: 'select',
        options: [
          { value: '', label: 'None' },
          { value: 'relu', label: 'ReLU' },
          { value: 'sigmoid', label: 'Sigmoid' },
          { value: 'tanh', label: 'Tanh' },
          { value: 'softmax', label: 'Softmax' },
          { value: 'linear', label: 'Linear' }
        ]
      }
    ],
    codeGen: (params) => {
      const units = params.units || 128
      const activation = params.activation ? `, activation='${params.activation}'` : ''
      return `Dense(${units}${activation})`
    },
    kerasImport: 'Dense'
  },

  Conv2D: {
    type: 'Conv2D',
    icon: '🔲',
    description: '2D convolution layer',
    defaultParams: { 
      filters: 32, 
      kernel_size: '(3,3)', 
      strides: '(1,1)', 
      padding: 'same' 
    },
    formSpec: [
      {
        key: 'filters',
        label: 'Filters',
        type: 'number',
        min: 1
      },
      {
        key: 'kernel_size',
        label: 'Kernel Size',
        type: 'text'
      },
      {
        key: 'strides',
        label: 'Strides',
        type: 'text'
      },
      {
        key: 'padding',
        label: 'Padding',
        type: 'select',
        options: [
          { value: 'valid', label: 'Valid' },
          { value: 'same', label: 'Same' }
        ]
      }
    ],
    codeGen: (params) => {
      const filters = params.filters || 32
      const kernel_size = params.kernel_size || '(3,3)'
      const strides = params.strides || '(1,1)'
      const padding = params.padding || 'same'
      return `Conv2D(${filters}, kernel_size=${kernel_size}, strides=${strides}, padding='${padding}')`
    },
    kerasImport: 'Conv2D'
  },

  MaxPool2D: {
    type: 'MaxPool2D',
    icon: '⬇️',
    description: '2D max pooling layer',
    defaultParams: { pool_size: '(2,2)' },
    formSpec: [
      {
        key: 'pool_size',
        label: 'Pool Size',
        type: 'text'
      }
    ],
    codeGen: (params) => {
      const pool_size = params.pool_size || '(2,2)'
      return `MaxPool2D(pool_size=${pool_size})`
    },
    kerasImport: 'MaxPool2D'
  },

  BatchNorm: {
    type: 'BatchNorm',
    icon: '📊',
    description: 'Batch normalization layer',
    defaultParams: {},
    formSpec: [],
    codeGen: () => 'BatchNormalization()',
    kerasImport: 'BatchNormalization'
  },

  GlobalAvgPool: {
    type: 'GlobalAvgPool',
    icon: '🌐',
    description: 'Global average pooling layer',
    defaultParams: {},
    formSpec: [],
    codeGen: () => 'GlobalAveragePooling2D()',
    kerasImport: 'GlobalAveragePooling2D'
  },

  Flatten: {
    type: 'Flatten',
    icon: '📏',
    description: 'Flatten multi-dimensional input',
    defaultParams: {},
    formSpec: [],
    codeGen: () => 'Flatten()',
    kerasImport: 'Flatten'
  },

  Activation: {
    type: 'Activation',
    icon: '⚡',
    description: 'Activation function',
    defaultParams: { type: 'relu' },
    formSpec: [
      {
        key: 'type',
        label: 'Activation Type',
        type: 'select',
        options: [
          { value: 'relu', label: 'ReLU' },
          { value: 'sigmoid', label: 'Sigmoid' },
          { value: 'tanh', label: 'Tanh' },
          { value: 'softmax', label: 'Softmax' },
          { value: 'linear', label: 'Linear' }
        ]
      }
    ],
    codeGen: (params) => {
      const activationType = params.type || 'relu'
      return `Activation('${activationType}')`
    },
    kerasImport: 'Activation'
  },

  Dropout: {
    type: 'Dropout',
    icon: '🎲',
    description: 'Regularization layer',
    defaultParams: { rate: 0.2 },
    formSpec: [
      {
        key: 'rate',
        label: 'Dropout Rate',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.1
      }
    ],
    codeGen: (params) => {
      const rate = params.rate || 0.2
      return `Dropout(${rate})`
    },
    kerasImport: 'Dropout'
  },

  Merge: {
    type: 'Merge',
    icon: '🔀',
    description: 'Merge multiple inputs',
    defaultParams: { mode: 'concat' },
    formSpec: [
      {
        key: 'mode',
        label: 'Merge Mode',
        type: 'select',
        options: [
          { value: 'concat', label: 'Concatenate' },
          { value: 'add', label: 'Add' },
          { value: 'multiply', label: 'Multiply' },
          { value: 'average', label: 'Average' },
          { value: 'maximum', label: 'Maximum' }
        ]
      }
    ],
    codeGen: (params) => {
      const mode = params.mode || 'concat'
      const modeMap: Record<string, string> = {
        'concat': 'Concatenate()',
        'add': 'Add()',
        'multiply': 'Multiply()',
        'average': 'Average()',
        'maximum': 'Maximum()'
      }
      return modeMap[mode] || 'Concatenate()'
    },
    kerasImport: 'Concatenate, Add, Multiply, Average, Maximum'
  },

  Output: {
    type: 'Output',
    icon: '📤',
    description: 'Output layer',
    defaultParams: { units: 10, activation: 'softmax' },
    formSpec: [
      {
        key: 'units',
        label: 'Units',
        type: 'number',
        min: 1
      },
      {
        key: 'activation',
        label: 'Activation',
        type: 'select',
        options: [
          { value: 'softmax', label: 'Softmax' },
          { value: 'sigmoid', label: 'Sigmoid' },
          { value: 'linear', label: 'Linear' }
        ]
      }
    ],
    codeGen: (params) => {
      const outputUnits = params.units || 10
      const outputActivation = params.activation ? `, activation='${params.activation}'` : ''
      return `Dense(${outputUnits}${outputActivation})`
    },
    kerasImport: 'Dense'
  }
}

// Helper functions
export function getLayerDef(type: string): LayerDef | undefined {
  return layerDefs[type]
}

export function getLayerTypes(): LayerDef[] {
  return Object.values(layerDefs)
}

export function getDefaultParams(type: string): Record<string, any> {
  return layerDefs[type]?.defaultParams || {}
}

export function getLayerIcon(type: string): string {
  return layerDefs[type]?.icon || '⚙️'
}

export function generateLayerCode(type: string, params: Record<string, any>): string {
  const layerDef = layerDefs[type]
  if (!layerDef) {
    return `# Unknown layer type: ${type}`
  }
  return layerDef.codeGen(params)
}

export function getKerasImports(): string[] {
  const imports = new Set<string>()
  Object.values(layerDefs).forEach(layerDef => {
    if (layerDef.kerasImport) {
      imports.add(layerDef.kerasImport)
    }
  })
  return Array.from(imports).sort()
}
