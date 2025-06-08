/**
 * Unified Layer Definitions - Pure TypeScript Approach
 * 
 * Everything needed to define a layer is in this single file:
 * - Metadata (category, icon, description)
 * - Parameters (form fields, validation, defaults)
 * - Shape computation logic
 * - Code generation for multiple frameworks
 * 
 * To add a new layer, simply add it to the layerDefinitions object below.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ParameterType = 'number' | 'text' | 'select' | 'boolean'

export interface SelectOption {
  value: string
  label: string
  description?: string
}

export interface ParameterDefinition {
  key: string
  type: ParameterType
  label: string
  description?: string
  default?: string | number | boolean
  validation?: {
    min?: number
    max?: number
    required?: boolean
    pattern?: string
  }
  options?: SelectOption[]
  conditional?: {
    showWhen?: Record<string, string | string[]>
  }
  ui?: {
    tooltip?: string
    group?: string
    order?: number
  }
}

export interface LayerMetadata {
  category: string
  icon: string
  description: string
  tags?: string[]
  performance?: {
    complexity?: string
    memory?: string
    usage?: string
  }
}

export interface CodeGenerator {
  keras: (params: Record<string, unknown>) => string
  pytorch?: (params: Record<string, unknown>) => string
  onnx?: (params: Record<string, unknown>) => string
}

export interface LayerDefinition {
  metadata: LayerMetadata
  parameters: ParameterDefinition[]
  validateInputs: (inputShapes: number[][], params: Record<string, unknown>) => { isValid: boolean; errorMessage?: string }
  computeShape: (inputShapes: number[][], params: Record<string, unknown>) => number[] | null
  generateCode: CodeGenerator
  supportsMultiplier?: boolean
}

// ============================================================================
// CATEGORY DEFINITIONS
// ============================================================================

export const categories = {
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
// UTILITY FUNCTIONS
// ============================================================================

function parseTupleOrNumber(input: string): [number, number] | null {
  try {
    // Handle single number case like "2"
    if (!/[(),]/.test(input)) {
      const num = parseInt(input.trim())
      if (!isNaN(num)) return [num, num]
    }
    
    // Handle tuple case like "(2,2)"
    const cleaned = input.replace(/[()]/g, '').trim()
    const parts = cleaned.split(',').map(s => parseInt(s.trim()))
    
    if (parts.length === 2 && !parts.some(isNaN)) {
      return [parts[0], parts[1]]
    }
  } catch {
    // ignore
  }
  return null
}

function parseShape(shapeString: string): number[] | null {
  try {
    // Remove parentheses and split by comma
    const cleaned = shapeString.replace(/[()]/g, '').trim()
    if (cleaned === '') return []
    
    const parts = cleaned.split(',').map(s => s.trim()).filter(s => s !== '')
    const numbers = parts.map(s => parseInt(s))
    
    if (numbers.some(isNaN)) return null
    return numbers
  } catch {
    return null
  }
}

// ============================================================================
// LAYER DEFINITIONS
// ============================================================================

export const layerDefinitions: Record<string, LayerDefinition> = {
  
  // INPUT/OUTPUT LAYERS
  // ============================================================================
  
  Input: {
    metadata: {
      category: 'input_output',
      icon: '📥',
      description: 'Input layer for data',
      tags: ['input', 'data'],
      performance: {
        complexity: 'O(1)',
        memory: 'Minimal',
        usage: 'Start of all neural networks'
      }
    },
    parameters: [
      {
        key: 'inputType',
        type: 'select',
        label: 'Input Type',
        description: 'Choose the type of input data',
        default: 'image_grayscale',
        validation: { required: true },
        options: [
          { value: 'image_grayscale', label: 'Grayscale Image (H×W×1)', description: 'Single channel images like MNIST' },
          { value: 'image_color', label: 'Color Image (H×W×3)', description: 'RGB color images' },
          { value: 'image_custom', label: 'Custom Image (H×W×C)', description: 'Images with custom channels' },
          { value: 'flat_data', label: 'Flattened Data (N,)', description: '1D vector data' },
          { value: 'sequence', label: 'Sequence Data (seq_len, features)', description: 'Time series or text data' }
        ]
      },
      {
        key: 'height',
        type: 'number',
        label: 'Height',
        description: 'Height dimension of input',
        default: 28,
        validation: { min: 1, max: 10000 },
        conditional: { showWhen: { inputType: ['image_grayscale', 'image_color', 'image_custom'] } }
      },
      {
        key: 'width',
        type: 'number',
        label: 'Width', 
        description: 'Width dimension of input',
        default: 28,
        validation: { min: 1, max: 10000 },
        conditional: { showWhen: { inputType: ['image_grayscale', 'image_color', 'image_custom'] } }
      },
      {
        key: 'channels',
        type: 'number',
        label: 'Channels',
        description: 'Number of channels',
        default: 1,
        validation: { min: 1, max: 512 },
        conditional: { showWhen: { inputType: ['image_custom'] } }
      },
      {
        key: 'flatSize',
        type: 'number',
        label: 'Size',
        description: 'Size of flattened vector',
        default: 784,
        validation: { min: 1, max: 1000000 },
        conditional: { showWhen: { inputType: ['flat_data'] } }
      },
      {
        key: 'seqLength',
        type: 'number',
        label: 'Sequence Length',
        description: 'Length of input sequence',
        default: 100,
        validation: { min: 1, max: 10000 },
        conditional: { showWhen: { inputType: ['sequence'] } }
      },
      {
        key: 'features',
        type: 'number',
        label: 'Features',
        description: 'Features per sequence step',
        default: 128,
        validation: { min: 1, max: 10000 },
        conditional: { showWhen: { inputType: ['sequence'] } }
      }
    ],
    validateInputs: (inputShapes, params) => {
      // Input layers don't require input validation as they are the starting point
      // Parameters are required by interface but not used in this implementation
      void inputShapes; // Explicitly mark as intentionally unused
      void params;      // Explicitly mark as intentionally unused
      return { isValid: true }
    },
    computeShape: (inputShapes, params) => {
      // Input layers determine their own shape
      void inputShapes; // Explicitly mark as intentionally unused
      // Input layers determine their own shape
      if (params.computed_shape || params.shape) {
        const shapeString = String(params.computed_shape || params.shape || '(784,)')
        return parseShape(shapeString)
      }
      
      const inputType = String(params.inputType || 'image_grayscale')
      const height = Number(params.height) || 28
      const width = Number(params.width) || 28
      const channels = Number(params.channels) || 1
      
      switch (inputType) {
        case 'image_grayscale':
          return [height, width, 1]
        case 'image_color':
          return [height, width, 3]
        case 'image_custom':
          return [height, width, channels]
        case 'flat_data':
          return [Number(params.flatSize) || 784]
        case 'sequence':
          return [Number(params.seqLength) || 100, Number(params.features) || 128]
        default:
          return [784]
      }
    },
    generateCode: {
      keras: (params) => {
        const inputType = String(params.inputType || 'image_grayscale')
        const height = Number(params.height) || 28
        const width = Number(params.width) || 28
        const channels = Number(params.channels) || 1
        
        let shape: string
        switch (inputType) {
          case 'image_grayscale':
            shape = `(${height}, ${width}, 1)`
            break
          case 'image_color':
            shape = `(${height}, ${width}, 3)`
            break
          case 'image_custom':
            shape = `(${height}, ${width}, ${channels})`
            break
          case 'flat_data':
            shape = `(${Number(params.flatSize) || 784},)`
            break
          case 'sequence':
            shape = `(${Number(params.seqLength) || 100}, ${Number(params.features) || 128})`
            break
          default:
            shape = '(784,)'
        }
        
        return `Input(shape=${shape})`
      },
      pytorch: (params) => {
        // PyTorch doesn't have explicit Input layers, but we can document the expected shape
        const inputType = String(params.inputType || 'image_grayscale')
        const height = Number(params.height) || 28
        const width = Number(params.width) || 28
        const channels = Number(params.channels) || 1
        
        let shape: string
        switch (inputType) {
          case 'image_grayscale':
            shape = `[batch_size, 1, ${height}, ${width}]`
            break
          case 'image_color':
            shape = `[batch_size, 3, ${height}, ${width}]`
            break
          case 'image_custom':
            shape = `[batch_size, ${channels}, ${height}, ${width}]`
            break
          case 'flat_data':
            shape = `[batch_size, ${Number(params.flatSize) || 784}]`
            break
          case 'sequence':
            shape = `[batch_size, ${Number(params.seqLength) || 100}, ${Number(params.features) || 128}]`
            break
          default:
            shape = '[batch_size, 784]'
        }
        
        return `# Expected input shape: ${shape}`
      }
    }
  },

  Output: {
    metadata: {
      category: 'input_output',
      icon: '📤',
      description: 'Output layer for predictions',
      tags: ['output', 'classification', 'regression']
    },
    parameters: [
      {
        key: 'outputType',
        type: 'select',
        label: 'Output Type',
        description: 'Type of prediction task',
        default: 'multiclass',
        validation: { required: true },
        options: [
          { value: 'multiclass', label: 'Multi-class Classification (softmax)', description: 'Choose one class from many' },
          { value: 'binary', label: 'Binary Classification (sigmoid)', description: 'Yes/No predictions' },
          { value: 'regression', label: 'Regression (linear)', description: 'Continuous values' },
          { value: 'multilabel', label: 'Multi-label Classification (sigmoid)', description: 'Multiple yes/no predictions' }
        ]
      },
      {
        key: 'numClasses',
        type: 'number',
        label: 'Number of Classes',
        description: 'Number of classes to predict',
        default: 10,
        validation: { min: 2, max: 10000 },
        conditional: { showWhen: { outputType: ['multiclass'] } }
      },
      {
        key: 'units',
        type: 'number',
        label: 'Output Units',
        description: 'Number of output neurons',
        default: 1,
        validation: { min: 1, max: 10000 },
        conditional: { showWhen: { outputType: ['regression', 'multilabel'] } }
      }
    ],
    validateInputs: (inputShapes, params) => {
      void params; // Explicitly mark as intentionally unused
      if (inputShapes.length !== 1) {
        return { isValid: false, errorMessage: 'Output layer requires exactly one input' }
      }
      const inputShape = inputShapes[0]
      if (inputShape.length > 2) {
        return { isValid: false, errorMessage: 'Output layer requires flat input (1D or 2D with batch dimension)' }
      }
      return { isValid: true }
    },
    computeShape: (inputShapes, params) => {
      if (inputShapes.length !== 1) return null
      const inputShape = inputShapes[0]
      if (inputShape.length > 2) return null
      
      const outputType = String(params.outputType || 'multiclass')
      switch (outputType) {
        case 'multiclass':
          return [Number(params.numClasses) || 10]
        case 'binary':
          return [1]
        case 'regression':
          return [Number(params.units) || 1]
        case 'multilabel':
          return [Number(params.units) || 1]
        default:
          return [10]
      }
    },
    generateCode: {
      keras: (params) => {
        const outputType = String(params.outputType || 'multiclass')
        let units: number
        let activation: string
        
        switch (outputType) {
          case 'multiclass':
            units = Number(params.numClasses) || 10
            activation = 'softmax'
            break
          case 'binary':
            units = 1
            activation = 'sigmoid'
            break
          case 'regression':
            units = Number(params.units) || 1
            activation = 'linear'
            break
          case 'multilabel':
            units = Number(params.units) || 1
            activation = 'sigmoid'
            break
          default:
            units = 10
            activation = 'softmax'
        }
        
        return `Dense(${units}, activation='${activation}')`
      }
    }
  },

  // DENSE LAYERS
  // ============================================================================
  
  Dense: {
    metadata: {
      category: 'dense',
      icon: '🔗',
      description: 'Fully connected layer',
      tags: ['dense', 'fully_connected'],
      performance: {
        complexity: 'O(n*m) where n=input_size, m=units',
        memory: 'High for large layers',
        usage: 'Feature learning and classification'
      }
    },
    parameters: [
      {
        key: 'units',
        type: 'number',
        label: 'Units',
        description: 'Number of output neurons',
        default: 128,
        validation: { min: 1, max: 10000, required: true },
        ui: { tooltip: 'Number of neurons in this dense layer' }
      },
      {
        key: 'activation',
        type: 'select',
        label: 'Activation (optional)',
        description: 'Activation function to apply',
        default: 'none',
        options: [
          { value: 'none', label: 'None', description: 'Linear activation' },
          { value: 'relu', label: 'ReLU', description: 'Most common for hidden layers' },
          { value: 'sigmoid', label: 'Sigmoid', description: 'Outputs between 0 and 1' },
          { value: 'tanh', label: 'Tanh', description: 'Outputs between -1 and 1' },
          { value: 'softmax', label: 'Softmax', description: 'For probability distributions' }
        ]
      }
    ],
    validateInputs: (inputShapes, params) => {
      void params; // Explicitly mark as intentionally unused
      if (inputShapes.length !== 1) {
        return { isValid: false, errorMessage: 'Dense layer requires exactly one input' }
      }
      const inputShape = inputShapes[0]
      if (inputShape.length > 2) {
        return { isValid: false, errorMessage: 'Dense layer requires flat input (1D or 2D with batch dimension). Use Flatten layer before Dense for multi-dimensional inputs.' }
      }
      return { isValid: true }
    },
    computeShape: (inputShapes, params) => {
      if (inputShapes.length !== 1) return null
      const inputShape = inputShapes[0]
      if (inputShape.length > 2) return null
      
      return [Number(params.units) || 128]
    },
    generateCode: {
      keras: (params) => {
        const units = Number(params.units) || 128
        const activation = String(params.activation || 'none')
        
        if (activation === 'none') {
          return `Dense(${units})`
        } else {
          return `Dense(${units}, activation='${activation}')`
        }
      },
      pytorch: (params) => {
        const units = Number(params.units) || 128
        const activation = String(params.activation || 'none')
        
        let code = `nn.Linear(in_features, ${units})`
        
        if (activation !== 'none') {
          const activationMap: Record<string, string> = {
            'relu': 'nn.ReLU()',
            'sigmoid': 'nn.Sigmoid()',
            'tanh': 'nn.Tanh()',
            'softmax': 'nn.Softmax(dim=1)'
          }
          if (activationMap[activation]) {
            code += `,\n${activationMap[activation]}`
          }
        }
        
        return code
      }
    },
    supportsMultiplier: true
  },

  // CONVOLUTIONAL LAYERS  
  // ============================================================================
  
  Conv2D: {
    metadata: {
      category: 'convolutional',
      icon: '🔲',
      description: '2D convolution layer',
      tags: ['convolution', 'cnn', '2d'],
      performance: {
        complexity: 'O(H*W*C*F*K²) where H,W=output size, C=input channels, F=filters, K=kernel size',
        memory: 'Moderate, depends on filter count',
        usage: 'Feature extraction from images'
      }
    },
    parameters: [
      {
        key: 'filters',
        type: 'number',
        label: 'Filters',
        description: 'Number of output filters/feature maps',
        default: 32,
        validation: { min: 1, max: 1024, required: true },
        ui: { tooltip: 'More filters = more features detected' }
      },
      {
        key: 'kernel_size',
        type: 'text',
        label: 'Kernel Size',
        description: 'Size of convolution window',
        default: '(3,3)',
        validation: { pattern: '^\\([0-9]+,[0-9]+\\)$' },
        ui: { tooltip: 'e.g., (3,3) for 3x3 kernel' }
      },
      {
        key: 'strides',
        type: 'text',
        label: 'Strides',
        description: 'Stride of convolution',
        default: '(1,1)',
        validation: { pattern: '^\\([0-9]+,[0-9]+\\)$' }
      },
      {
        key: 'padding',
        type: 'select',
        label: 'Padding',
        description: 'Padding strategy',
        default: 'same',
        options: [
          { value: 'valid', label: 'Valid', description: 'No padding, output size reduced' },
          { value: 'same', label: 'Same', description: 'Padding to keep same output size' }
        ]
      }
    ],
    validateInputs: (inputShapes, params) => {
      void params; // Explicitly mark as intentionally unused
      if (inputShapes.length !== 1) {
        return { isValid: false, errorMessage: 'Conv2D layer requires exactly one input' }
      }
      const inputShape = inputShapes[0]
      if (inputShape.length !== 3) {
        return { isValid: false, errorMessage: 'Conv2D layer requires 3D input (height, width, channels)' }
      }
      return { isValid: true }
    },
    computeShape: (inputShapes, params) => {
      if (inputShapes.length !== 1) return null
      const inputShape = inputShapes[0]
      if (inputShape.length !== 3) return null
      
      const [inputHeight, inputWidth] = inputShape
      const filters = Number(params.filters) || 32
      const kernelSize = parseTupleOrNumber(String(params.kernel_size) || '(3,3)')
      const strides = parseTupleOrNumber(String(params.strides) || '(1,1)')
      const padding = String(params.padding) || 'same'
      
      if (!kernelSize || !strides) return null
      
      let outputHeight: number
      let outputWidth: number
      
      if (padding === 'same') {
        outputHeight = Math.ceil(inputHeight / strides[0])
        outputWidth = Math.ceil(inputWidth / strides[1])
      } else {
        outputHeight = Math.floor((inputHeight - kernelSize[0]) / strides[0]) + 1
        outputWidth = Math.floor((inputWidth - kernelSize[1]) / strides[1]) + 1
      }
      
      return [outputHeight, outputWidth, filters]
    },
    generateCode: {
      keras: (params) => {
        const filters = Number(params.filters) || 32
        const kernelSize = String(params.kernel_size) || '(3,3)'
        const strides = String(params.strides) || '(1,1)'
        const padding = String(params.padding) || 'same'
        
        return `Conv2D(${filters}, kernel_size=${kernelSize}, strides=${strides}, padding='${padding}')`
      },
      pytorch: (params) => {
        const filters = Number(params.filters) || 32
        const kernelSizeStr = String(params.kernel_size) || '(3,3)'
        const stridesStr = String(params.strides) || '(1,1)'
        const padding = String(params.padding) || 'same'
        
        // Parse kernel size and strides for PyTorch format
        const kernelSize = parseTupleOrNumber(kernelSizeStr)
        const strides = parseTupleOrNumber(stridesStr)
        
        if (!kernelSize || !strides) {
          return `nn.Conv2d(in_channels, ${filters}, kernel_size=3)`
        }
        
        const paddingValue = padding === 'same' ? 'same' : '0'
        return `nn.Conv2d(in_channels, ${filters}, kernel_size=${kernelSize[0]}, stride=${strides[0]}, padding='${paddingValue}')`
      }
    },
    supportsMultiplier: true
  },

  // POOLING LAYERS
  // ============================================================================
  
  MaxPool2D: {
    metadata: {
      category: 'pooling',
      icon: '🏊',
      description: 'Max pooling operation for 2D spatial data',
      tags: ['pooling', 'max', 'cnn'],
      performance: {
        complexity: 'O(H*W*C)',
        memory: 'Low',
        usage: 'Reduce spatial dimensions, retain important features'
      }
    },
    parameters: [
      {
        key: 'pool_size',
        type: 'text',
        label: 'Pool Size',
        description: 'Size of pooling window',
        default: '(2,2)',
        validation: { pattern: '^\\([0-9]+,[0-9]+\\)$', required: true },
        ui: { tooltip: 'Typically (2,2) to halve dimensions' }
      },
      {
        key: 'strides',
        type: 'text',
        label: 'Strides (optional)',
        description: 'Strides of pooling operation',
        default: '',
        validation: { pattern: '^\\([0-9]+,[0-9]+\\)$' },
        ui: { tooltip: 'Defaults to pool_size if empty' }
      },
      {
        key: 'padding',
        type: 'select',
        label: 'Padding',
        description: 'Padding strategy',
        default: 'valid',
        options: [
          { value: 'valid', label: 'Valid', description: 'No padding' },
          { value: 'same', label: 'Same', description: 'Padding to maintain dimensions' }
        ]
      }
    ],
    validateInputs: (inputShapes, params) => {
      void params; // Explicitly mark as intentionally unused
      if (inputShapes.length !== 1) {
        return { isValid: false, errorMessage: 'MaxPool2D layer requires exactly one input' }
      }
      const inputShape = inputShapes[0]
      if (inputShape.length !== 3) {
        return { isValid: false, errorMessage: 'MaxPool2D layer requires 3D input (height, width, channels)' }
      }
      return { isValid: true }
    },
    computeShape: (inputShapes, params) => {
      if (inputShapes.length !== 1) return null
      const inputShape = inputShapes[0]
      if (inputShape.length !== 3) return null
      
      const [inputHeight, inputWidth, channels] = inputShape
      const poolSize = parseTupleOrNumber(String(params.pool_size) || '(2,2)')
      const stridesParam = params.strides || params.pool_size || '(2,2)'
      const strides = parseTupleOrNumber(String(stridesParam))
      const padding = String(params.padding) || 'valid'
      
      if (!poolSize || !strides) return null
      
      let outputHeight: number
      let outputWidth: number
      
      if (padding === 'same') {
        outputHeight = Math.ceil(inputHeight / strides[0])
        outputWidth = Math.ceil(inputWidth / strides[1])
      } else {
        outputHeight = Math.floor((inputHeight - poolSize[0]) / strides[0]) + 1
        outputWidth = Math.floor((inputWidth - poolSize[1]) / strides[1]) + 1
      }
      
      return [outputHeight, outputWidth, channels]
    },
    generateCode: {
      keras: (params) => {
        const poolSize = String(params.pool_size) || '(2,2)'
        const strides = params.strides ? `, strides=${params.strides}` : ''
        const padding = String(params.padding) || 'valid'
        
        return `MaxPool2D(pool_size=${poolSize}${strides}, padding='${padding}')`
      },
      pytorch: (params) => {
        const poolSizeStr = String(params.pool_size) || '(2,2)'
        const poolSize = parseTupleOrNumber(poolSizeStr)
        const stridesStr = String(params.strides) || poolSizeStr
        const strides = parseTupleOrNumber(stridesStr)
        
        if (!poolSize || !strides) {
          return 'nn.MaxPool2d(kernel_size=2)'
        }
        
        return `nn.MaxPool2d(kernel_size=${poolSize[0]}, stride=${strides[0]})`
      }
    }
  },

  // TRANSFORMATION LAYERS
  // ============================================================================
  
  Flatten: {
    metadata: {
      category: 'transformation',
      icon: '📏',
      description: 'Flattens input into 1D array',
      tags: ['flatten', 'reshape', 'transformation'],
      performance: {
        complexity: 'O(1)',
        memory: 'None (reshape only)',
        usage: 'Connect CNN layers to Dense layers'
      }
    },
    parameters: [],
    validateInputs: (inputShapes, params) => {
      void params; // Explicitly mark as intentionally unused
      if (inputShapes.length !== 1) {
        return { isValid: false, errorMessage: 'Flatten layer requires exactly one input' }
      }
      return { isValid: true }
    },
    computeShape: (inputShapes) => {
      if (inputShapes.length !== 1) return null
      const inputShape = inputShapes[0]
      return [inputShape.reduce((acc, dim) => acc * dim, 1)]
    },
    generateCode: {
      keras: () => 'Flatten()',
      pytorch: () => 'nn.Flatten()'
    }
  },

  // ACTIVATION LAYERS
  // ============================================================================
  
  Activation: {
    metadata: {
      category: 'activation',
      icon: '⚡',
      description: 'Applies activation function',
      tags: ['activation', 'nonlinearity'],
      performance: {
        complexity: 'O(N) where N is number of elements',
        memory: 'Low, often in-place',
        usage: 'Apply non-linearities'
      }
    },
    parameters: [
      {
        key: 'activation_function',
        type: 'select',
        label: 'Activation Type',
        description: 'Type of activation function',
        default: 'relu',
        validation: { required: true },
        options: [
          { value: 'relu', label: 'ReLU', description: 'Rectified Linear Unit' },
          { value: 'sigmoid', label: 'Sigmoid', description: 'Sigmoid function' },
          { value: 'tanh', label: 'Tanh', description: 'Hyperbolic Tangent' },
          { value: 'softmax', label: 'Softmax', description: 'For probability distributions' },
          { value: 'linear', label: 'Linear', description: 'Linear activation' }
        ]
      }
    ],
    validateInputs: (inputShapes, params) => {
      void params; // Explicitly mark as intentionally unused
      if (inputShapes.length !== 1) {
        return { isValid: false, errorMessage: 'Activation layer requires exactly one input' }
      }
      return { isValid: true }
    },
    computeShape: (inputShapes) => {
      if (inputShapes.length !== 1) return null
      return inputShapes[0]
    },
    generateCode: {
      keras: (params) => {
        const activation = String(params.activation_function) || 'relu'
        return `Activation('${activation}')`
      },
      pytorch: (params) => {
        const activation = String(params.activation_function) || 'relu'
        const activationMap: Record<string, string> = {
          'relu': 'nn.ReLU()',
          'sigmoid': 'nn.Sigmoid()',
          'tanh': 'nn.Tanh()',
          'softmax': 'nn.Softmax(dim=1)',
          'linear': 'nn.Identity()'
        }
        return activationMap[activation] || 'nn.ReLU()'
      }
    }
  },

  // REGULARIZATION LAYERS
  // ============================================================================
  
  Dropout: {
    metadata: {
      category: 'regularization',
      icon: '🛡️',
      description: 'Randomly sets input units to 0 during training',
      tags: ['dropout', 'regularization'],
      performance: {
        complexity: 'O(N)',
        memory: 'Low',
        usage: 'Prevent overfitting'
      }
    },
    parameters: [
      {
        key: 'rate',
        type: 'number',
        label: 'Dropout Rate',
        description: 'Fraction of input units to drop',
        default: 0.5,
        validation: { min: 0, max: 1, required: true },
        ui: { tooltip: 'Between 0 and 1, e.g., 0.5 drops 50% of inputs' }
      }
    ],
    validateInputs: (inputShapes, params) => {
      void params; // Explicitly mark as intentionally unused
      if (inputShapes.length !== 1) {
        return { isValid: false, errorMessage: 'Dropout layer requires exactly one input' }
      }
      return { isValid: true }
    },
    computeShape: (inputShapes) => {
      if (inputShapes.length !== 1) return null
      return inputShapes[0]
    },
    generateCode: {
      keras: (params) => {
        const rate = Number(params.rate) || 0.5
        return `Dropout(${rate})`
      },
      pytorch: (params) => {
        const rate = Number(params.rate) || 0.5
        return `nn.Dropout(p=${rate})`
      }
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all layer definitions
 */
export function getAllLayers(): Record<string, LayerDefinition> {
  return layerDefinitions
}

/**
 * Get layer definition by type
 */
export function getLayerDefinition(layerType: string): LayerDefinition | undefined {
  return layerDefinitions[layerType]
}

/**
 * Get layers by category
 */
export function getLayersByCategory(category: string): Array<{ type: string; definition: LayerDefinition }> {
  return Object.entries(layerDefinitions)
    .filter(([, def]) => def.metadata.category === category)
    .map(([type, definition]) => ({ type, definition }))
}

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

/**
 * Get category information with layer types
 */
export function getCategoriesWithLayers() {
  const categoriesWithLayers = Object.entries(categories).map(([key, category]) => {
    const colorClasses = categoryColorMap[category.color] || categoryColorMap.blue // fallback to blue
    
    return {
      name: category.name,
      color: category.color,
      bgColor: colorClasses.bg,
      borderColor: colorClasses.border,
      textColor: colorClasses.text,
      description: category.description,
      layerTypes: getLayersByCategory(key).map(({ type }) => type)
    }
  })
  
  return categoriesWithLayers
}

/**
 * Helper to add a new layer (for development/testing)
 */
export function addLayer(layerType: string, definition: LayerDefinition): void {
  layerDefinitions[layerType] = definition
}

/**
 * Get category colors for a specific layer type
 * @param layerType - Layer type identifier
 * @returns Color classes object with bg, border, text, and hover properties
 */
export function getLayerCategoryColors(layerType: string): { bg: string; border: string; text: string; hover: string } {
  const layerDef = getLayerDefinition(layerType)
  if (!layerDef) {
    return categoryColorMap.blue // fallback to blue
  }
  
  const category = categories[layerDef.metadata.category as keyof typeof categories]
  if (!category?.color) {
    return categoryColorMap.blue // fallback to blue
  }
  
  return categoryColorMap[category.color] || categoryColorMap.blue
}

// ============================================================================
// LEGACY COMPATIBILITY FUNCTIONS (from layer-defs.ts)
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

/** Runtime registry of all loaded layer definitions */
export const layerDefs: Record<string, LayerDef> = {}

// Populate layerDefs from new system
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

/**
 * Get layer definition by type
 * @param type - Layer type identifier
 * @returns Layer definition or undefined if not found
 */
export function getLayerDef(type: string): LayerDef | undefined {
  return layerDefs[type]
}

/**
 * Get default parameters for a layer type
 * @param type - Layer type identifier
 * @returns Default parameters object
 */
export function getDefaultParams(type: string): Record<string, LayerParamValue> {
  return layerDefs[type]?.defaultParams || {}
}

/**
 * Get icon for a layer type
 * @param type - Layer type identifier  
 * @returns Icon emoji or default wrench emoji
 */
export function getLayerIcon(type: string): string {
  return layerDefs[type]?.icon || '🔧'
}

/**
 * Get all available layer types with basic metadata
 * @returns Array of layer type information
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
 * @param type - Layer type identifier
 * @param params - Layer parameter values
 * @returns Generated Keras code string
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
 * @param layerTypes - Array of layer type identifiers
 * @returns Array of unique Keras import names
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
 * @returns Array of category objects with layer information
 */
export function getLayerCategories() {
  return getCategoriesWithLayers()
}

// ============================================================================
// PARAMETER DISPLAY UTILITIES (from parameter-display.ts)
// ============================================================================

// Shape display utilities for Input layers
const computeInputShapeDisplay = (params: Record<string, LayerParamValue>): string => {
  const inputType = String(params.inputType || 'image_grayscale')
  
  switch (inputType) {
    case 'image_grayscale': {
      const h = Number(params.height) || 28
      const w = Number(params.width) || 28
      return `${h}×${w}×1`
    }
    case 'image_color': {
      const h = Number(params.height) || 28
      const w = Number(params.width) || 28
      return `${h}×${w}×3`
    }
    case 'image_custom': {
      const h = Number(params.height) || 28
      const w = Number(params.width) || 28
      const c = Number(params.channels) || 1
      return `${h}×${w}×${c}`
    }
    case 'flat_data': {
      const size = Number(params.flatSize) || 784
      return `${size}`
    }
    case 'sequence': {
      const seqLen = Number(params.seqLength) || 100
      const features = Number(params.features) || 128
      return `${seqLen}×${features}`
    }
    default: {
      return '28×28×1'
    }
  }
}

const getInputTypeLabel = (inputType: string): string => {
  const labels: Record<string, string> = {
    'image_grayscale': 'Grayscale',
    'image_color': 'Color', 
    'image_custom': 'Custom Image',
    'flat_data': 'Flattened',
    'sequence': 'Sequence'
  }
  return labels[inputType] || inputType
}

// Output layer configuration utilities
const computeOutputDisplay = (params: Record<string, LayerParamValue>): string[] => {
  const outputType = String(params.outputType || 'multiclass')
  const visibleParams: string[] = []
  
  switch (outputType) {
    case 'multiclass': {
      const numClasses = Number(params.numClasses) || 10
      visibleParams.push(`${numClasses} classes`, 'softmax')
      break
    }
    case 'binary': {
      visibleParams.push('1 unit', 'sigmoid')
      break
    }
    case 'regression': {
      visibleParams.push('1 unit', 'linear')
      break
    }
    case 'multilabel': {
      const mlUnits = Number(params.units) || 10
      visibleParams.push(`${mlUnits} labels`, 'sigmoid')
      break
    }
    default: {
      const labels: Record<string, string> = {
        'multiclass': 'Multi-class',
        'binary': 'Binary',
        'regression': 'Regression',
        'multilabel': 'Multi-label'
      }
      visibleParams.push(labels[outputType] || outputType)
    }
  }
  
  return visibleParams
}

// Generic parameter formatters
const formatCommonParams = (layerType: string, params: Record<string, LayerParamValue>): string[] => {
  const visibleParams: string[] = []

  // Layer-specific parameters first
  if (layerType === 'Activation' && params.activation_function) {
    visibleParams.push(String(params.activation_function))
  }
  
  if (layerType === 'Merge' && params.mode) {
    const modeLabels: Record<string, string> = {
      'concatenate': 'Concatenate',
      'add': 'Add', 
      'multiply': 'Multiply',
      'average': 'Average',
      'maximum': 'Maximum'
    }
    visibleParams.push(modeLabels[String(params.mode)] || String(params.mode))
  }

  // Common parameters in priority order
  if (params.filters) visibleParams.push(`${params.filters} filters`)
  if (params.units && layerType !== 'Output') visibleParams.push(`${params.units} units`)
  if (params.pool_size) visibleParams.push(`pool: ${params.pool_size}`)
  if (params.kernel_size) visibleParams.push(`kernel: ${params.kernel_size}`)
  
  // Show activation for non-Activation/Output layers if not default
  if (layerType !== 'Activation' && layerType !== 'Output' && 
      params.activation && params.activation !== 'linear' && params.activation !== 'none') {
    visibleParams.push(String(params.activation))
  }
  
  if (params.rate) visibleParams.push(`rate: ${params.rate}`)
  if (params.size) visibleParams.push(`size: ${params.size}`)
  
  // Legacy shape parameter support
  if (params.shape && layerType !== 'Input') visibleParams.push(`shape: ${params.shape}`)

  return visibleParams
}

/**
 * Generate visible parameter display strings for layer visualization
 */
export function getParameterDisplayValues(layerType: string, params: Record<string, LayerParamValue>): string[] {
  const layerDef = getLayerDef(layerType)
  if (!layerDef) return []

  // Special handling for Input layers
  if (layerType === 'Input') {
    const inputType = String(params.inputType || 'image_grayscale')
    return [
      `shape: ${computeInputShapeDisplay(params)}`,
      getInputTypeLabel(inputType)
    ]
  }

  // Special handling for Output layers
  if (layerType === 'Output') {
    return computeOutputDisplay(params)
  }

  // Generic parameter formatting for all other layers
  return formatCommonParams(layerType, params)
}

/**
 * Get the total number of configurable parameters for a layer
 */
export function getTotalParameterCount(layerType: string): number {
  const layerDef = getLayerDef(layerType)
  return layerDef?.formSpec.length || 0
}

/**
 * Computes shape string from input layer parameters using unified layer definitions
 * Used by code generation and shape computation systems.
 */
export async function computeInputShape(params: Record<string, unknown>): Promise<string> {
  try {
    // Use new layer definitions system for Input layer
    const inputLayerDef = getLayerDefinition('Input')
    if (inputLayerDef) {
      const shape = inputLayerDef.computeShape([], params)
      if (shape) {
        // Convert shape array to string format
        return `(${shape.join(', ')})`
      }
    }
  } catch (error) {
    console.warn('Layer definition shape computation failed, using fallback:', error)
  }
  
  // Fallback to legacy behavior if computation fails
  if (params.shape && typeof params.shape === 'string') {
    return params.shape;
  }
  
  return '(784,)'; // Default fallback
}
