/**
 * Pure Layer Definitions
 * 
 * Contains only the core layer definitions with metadata, parameters, validation,
 * shape computation, and code generation. This is the single source of truth
 * for what layers exist and how they behave.
 */

import { parseShape, parseTupleOrNumber } from '../utils'
import type { LayerParamValue } from '../layer-definitions'

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
      void inputShapes; // Explicitly mark as intentionally unused
      void params;      // Explicitly mark as intentionally unused
      return { isValid: true }
    },
    computeShape: (inputShapes, params) => {
      // Input layers determine their own shape
      void inputShapes; // Explicitly mark as intentionally unused
      
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
 * Get all available layer types with basic metadata
 */
export function getLayerTypes(): Array<{ type: string; icon: string; description: string }> {
  return Object.entries(layerDefinitions).map(([type, def]) => ({
    type,
    icon: def.metadata.icon,
    description: def.metadata.description
  }))
}

/**
 * Generate Keras code for a layer with given parameters
 */
export function generateLayerCode(type: string, params: Record<string, LayerParamValue>): string {
  const layerDef = layerDefinitions[type]
  if (!layerDef) {
    return `# Unknown layer type: ${type}`
  }
  return layerDef.generateCode.keras(params)
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
 * Get the icon for a layer type
 */
export function getLayerIcon(type: string): string {
  return layerDefinitions[type]?.metadata.icon || '🔧'
}
