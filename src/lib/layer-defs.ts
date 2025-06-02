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
  supportsMultiplier?: boolean  // New property to indicate if layer supports multiplier
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
  // =============== INPUT/OUTPUT LAYERS ===============
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
  },

  // =============== DENSE LAYERS ===============
  Dense: {
    type: 'Dense',
    icon: '🔗',
    description: 'Fully connected layer',
    defaultParams: { units: 128, multiplier: 1 },
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
          { value: 'none', label: 'None' },
          { value: 'relu', label: 'ReLU' },
          { value: 'sigmoid', label: 'Sigmoid' },
          { value: 'tanh', label: 'Tanh' },
          { value: 'softmax', label: 'Softmax' },
          { value: 'linear', label: 'Linear' }
        ]
      },
      {
        key: 'multiplier',
        label: 'Repeat (x times)',
        type: 'number',
        min: 1,
        max: 20
      }
    ],
    codeGen: (params) => {
      const units = params.units || 128
      const activation = params.activation && params.activation !== 'none' ? `, activation='${params.activation}'` : ''
      const multiplier = params.multiplier || 1
      
      const layerCode = `Dense(${units}${activation})`
      
      if (multiplier === 1) {
        return layerCode
      } else if (multiplier <= 5) {
        // For small multipliers, generate individual layers
        return Array(multiplier).fill(layerCode).join(',\n    ')
      } else {
        // For large multipliers, use a loop for cleaner code
        return `# Add ${multiplier} Dense layers with ${units} units${activation ? ` and ${params.activation} activation` : ''}
*[${layerCode} for _ in range(${multiplier})]`
      }
    },
    kerasImport: 'Dense',
    supportsMultiplier: true
  },

  // =============== CONVOLUTIONAL LAYERS ===============
  Conv2D: {
    type: 'Conv2D',
    icon: '🔲',
    description: '2D convolution layer',
    defaultParams: { 
      filters: 32, 
      kernel_size: '(3,3)', 
      strides: '(1,1)', 
      padding: 'same',
      multiplier: 1
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
      },
      {
        key: 'multiplier',
        label: 'Repeat (x times)',
        type: 'number',
        min: 1,
        max: 10
      }
    ],
    codeGen: (params) => {
      const filters = params.filters || 32
      const kernel_size = params.kernel_size || '(3,3)'
      const strides = params.strides || '(1,1)'
      const padding = params.padding || 'same'
      const multiplier = params.multiplier || 1
      
      const layerCode = `Conv2D(${filters}, kernel_size=${kernel_size}, strides=${strides}, padding='${padding}')`
      
      if (multiplier === 1) {
        return layerCode
      } else if (multiplier <= 5) {
        // For small multipliers, generate individual layers
        return Array(multiplier).fill(layerCode).join(',\n    ')
      } else {
        // For large multipliers, use a loop for cleaner code
        return `# Add ${multiplier} Conv2D layers with ${filters} filters
*[${layerCode} for _ in range(${multiplier})]`
      }
    },
    kerasImport: 'Conv2D',
    supportsMultiplier: true
  },

  Conv2DTranspose: {
    type: 'Conv2DTranspose',
    icon: '🔳',
    description: '2D transpose convolution layer (deconvolution)',
    defaultParams: { 
      filters: 32, 
      kernel_size: '(3,3)', 
      strides: '(2,2)', 
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
      const strides = params.strides || '(2,2)'
      const padding = params.padding || 'same'
      return `Conv2DTranspose(${filters}, kernel_size=${kernel_size}, strides=${strides}, padding='${padding}')`
    },
    kerasImport: 'Conv2DTranspose'
  },

  // =============== POOLING LAYERS ===============
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

  GlobalAvgPool: {
    type: 'GlobalAvgPool',
    icon: '🌐',
    description: 'Global average pooling layer',
    defaultParams: {},
    formSpec: [],
    codeGen: () => 'GlobalAveragePooling2D()',
    kerasImport: 'GlobalAveragePooling2D'
  },

  UpSampling2D: {
    type: 'UpSampling2D',
    icon: '⬆️',
    description: '2D upsampling layer',
    defaultParams: { 
      size: '(2,2)' 
    },
    formSpec: [
      {
        key: 'size',
        label: 'Upsampling Size',
        type: 'text'
      }
    ],
    codeGen: (params) => {
      const size = params.size || '(2,2)'
      return `UpSampling2D(size=${size})`
    },
    kerasImport: 'UpSampling2D'
  },

  // =============== TRANSFORMATION LAYERS ===============
  Flatten: {
    type: 'Flatten',
    icon: '📏',
    description: 'Flatten multi-dimensional input',
    defaultParams: {},
    formSpec: [],
    codeGen: () => 'Flatten()',
    kerasImport: 'Flatten'
  },

  // =============== ACTIVATION LAYERS ===============
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

  // =============== REGULARIZATION LAYERS ===============
  BatchNorm: {
    type: 'BatchNorm',
    icon: '📊',
    description: 'Batch normalization layer',
    defaultParams: {},
    formSpec: [],
    codeGen: () => 'BatchNormalization()',
    kerasImport: 'BatchNormalization'
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

  // =============== SEQUENCE LAYERS ===============
  Embedding: {
    type: 'Embedding',
    icon: '📚',
    description: 'Embedding layer for text data',
    defaultParams: { 
      input_dim: 10000, 
      output_dim: 128, 
      input_length: 100 
    },
    formSpec: [
      {
        key: 'input_dim',
        label: 'Input Dimension',
        type: 'number',
        min: 1
      },
      {
        key: 'output_dim',
        label: 'Output Dimension',
        type: 'number',
        min: 1
      },
      {
        key: 'input_length',
        label: 'Input Length',
        type: 'number',
        min: 1
      }
    ],
    codeGen: (params) => {
      const input_dim = params.input_dim || 10000
      const output_dim = params.output_dim || 128
      const input_length = params.input_length || 100
      return `Embedding(${input_dim}, ${output_dim}, input_length=${input_length})`
    },
    kerasImport: 'Embedding'
  },

  LSTM: {
    type: 'LSTM',
    icon: '🔄',
    description: 'Long Short-Term Memory layer',
    defaultParams: { 
      units: 128, 
      return_sequences: false,
      multiplier: 1
    },
    formSpec: [
      {
        key: 'units',
        label: 'Units',
        type: 'number',
        min: 1
      },
      {
        key: 'return_sequences',
        label: 'Return Sequences',
        type: 'select',
        options: [
          { value: 'false', label: 'False' },
          { value: 'true', label: 'True' }
        ]
      },
      {
        key: 'multiplier',
        label: 'Repeat (x times)',
        type: 'number',
        min: 1,
        max: 10
      }
    ],
    codeGen: (params) => {
      const units = params.units || 128
      const return_sequences = params.return_sequences === 'true' || params.return_sequences === true
      const multiplier = params.multiplier || 1
      
      const layerCode = `LSTM(${units}, return_sequences=${return_sequences})`
      
      if (multiplier === 1) {
        return layerCode
      } else if (multiplier <= 5) {
        // For small multipliers, generate individual layers
        return Array(multiplier).fill(layerCode).join(',\n    ')
      } else {
        // For large multipliers, use a loop for cleaner code
        return `# Add ${multiplier} LSTM layers with ${units} units
*[${layerCode} for _ in range(${multiplier})]`
      }
    },
    kerasImport: 'LSTM',
    supportsMultiplier: true
  },

  GRU: {
    type: 'GRU',
    icon: '🔁',
    description: 'Gated Recurrent Unit layer',
    defaultParams: { 
      units: 128, 
      return_sequences: false 
    },
    formSpec: [
      {
        key: 'units',
        label: 'Units',
        type: 'number',
        min: 1
      },
      {
        key: 'return_sequences',
        label: 'Return Sequences',
        type: 'select',
        options: [
          { value: 'false', label: 'False' },
          { value: 'true', label: 'True' }
        ]
      }
    ],
    codeGen: (params) => {
      const units = params.units || 128
      const return_sequences = params.return_sequences === 'true' || params.return_sequences === true
      return `GRU(${units}, return_sequences=${return_sequences})`
    },
    kerasImport: 'GRU'
  },

  // =============== MERGE LAYERS ===============
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

/**
 * Get Keras imports for only the layers that are actually used in the network
 */
export function getUsedKerasImports(usedLayerTypes: string[]): string[] {
  const imports = new Set<string>()
  
  usedLayerTypes.forEach(layerType => {
    const layerDef = layerDefs[layerType]
    if (layerDef && layerDef.kerasImport) {
      // Handle comma-separated imports (like for Merge layer)
      const layerImports = layerDef.kerasImport.split(',').map(imp => imp.trim())
      layerImports.forEach(imp => imports.add(imp))
    }
  })
  
  return Array.from(imports).sort()
}
