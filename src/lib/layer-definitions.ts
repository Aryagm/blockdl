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

import { parseTupleOrNumber } from './utils'

// ============================================================================
// ACTIVATION CONSTANTS
// ============================================================================

/**
 * Unified activation function options used across all layers
 */
export const ACTIVATION_OPTIONS: SelectOption[] = [
  { value: 'linear', label: 'Linear (None)', description: 'No activation function' },
  { value: 'relu', label: 'ReLU', description: 'Rectified Linear Unit' },
  { value: 'sigmoid', label: 'Sigmoid', description: 'Sigmoid function' },
  { value: 'tanh', label: 'Tanh', description: 'Hyperbolic Tangent' },
  { value: 'softmax', label: 'Softmax', description: 'For probability distributions' },
  { value: 'leaky_relu', label: 'Leaky ReLU', description: 'Leaky Rectified Linear Unit' },
  { value: 'elu', label: 'ELU', description: 'Exponential Linear Unit' }
]

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ParameterType = 'number' | 'text' | 'select' | 'boolean'

// Legacy compatibility types
export type LayerParamValue = string | number | boolean
export type LayerParams = Record<string, LayerParamValue>

// New type system for layer definitions
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
}

export interface LayerDefinition {
  metadata: LayerMetadata
  parameters: ParameterDefinition[]
  validateInputs: (inputShapes: number[][], params: Record<string, unknown>) => { isValid: boolean; errorMessage?: string }
  computeShape: (inputShapes: number[][], params: Record<string, unknown>) => number[] | null
  generateCode: CodeGenerator
  supportsMultiplier?: boolean
  supportsActivation?: boolean
}

// ============================================================================
// NEW LAYER DEFINITIONS (Main SYSTEM)
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
    validateInputs: () => ({ isValid: true }),
    computeShape: (_inputShapes: number[][], params: Record<string, unknown>) => {
      const inputType = String(params.inputType || 'image_grayscale')
      
      switch (inputType) {
        case 'image_grayscale': {
          const h = Number(params.height) || 28
          const w = Number(params.width) || 28
          return [h, w, 1]
        }
        case 'image_color': {
          const h = Number(params.height) || 28
          const w = Number(params.width) || 28
          return [h, w, 3]
        }
        case 'image_custom': {
          const h = Number(params.height) || 28
          const w = Number(params.width) || 28
          const c = Number(params.channels) || 1
          return [h, w, c]
        }
        case 'flat_data': {
          const size = Number(params.flatSize) || 784
          return [size]
        }
        case 'sequence': {
          const seqLen = Number(params.seqLength) || 100
          const features = Number(params.features) || 128
          return [seqLen, features]
        }
        default: {
          return [28, 28, 1]
        }
      }
    },
    generateCode: {
      keras: (params: Record<string, unknown>) => {
        const inputType = String(params.inputType || 'image_grayscale')
        
        switch (inputType) {
          case 'image_grayscale': {
            const h = Number(params.height) || 28
            const w = Number(params.width) || 28
            return `Input(shape=(${h}, ${w}, 1))`
          }
          case 'image_color': {
            const h = Number(params.height) || 28
            const w = Number(params.width) || 28
            return `Input(shape=(${h}, ${w}, 3))`
          }
          case 'image_custom': {
            const h = Number(params.height) || 28
            const w = Number(params.width) || 28
            const c = Number(params.channels) || 1
            return `Input(shape=(${h}, ${w}, ${c}))`
          }
          case 'flat_data': {
            const size = Number(params.flatSize) || 784
            return `Input(shape=(${size},))`
          }
          case 'sequence': {
            const seqLen = Number(params.seqLength) || 100
            const features = Number(params.features) || 128
            return `Input(shape=(${seqLen}, ${features}))`
          }
          default: {
            return `Input(shape=(28, 28, 1))`
          }
        }
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
      category: 'core',
      icon: '🔗',
      description: 'Fully connected layer',
      tags: ['dense', 'fully-connected']
    },
    parameters: [
      {
        key: 'units',
        type: 'number',
        label: 'Units',
        description: 'Number of neurons',
        default: 128,
        validation: { min: 1, max: 10000, required: true }
      },
      {
        key: 'activation',
        type: 'select',
        label: 'Activation',
        description: 'Activation function to use',
        default: 'linear',
        options: ACTIVATION_OPTIONS
      }
    ],
    validateInputs: (inputShapes: number[][]) => {
      if (inputShapes.length === 0) {
        return { isValid: false, errorMessage: 'Dense layer requires input' }
      }
      if (inputShapes.length !== 1) {
        return { isValid: false, errorMessage: 'Dense layer requires exactly one input' }
      }
      const inputShape = inputShapes[0]
      if (inputShape.length > 2) {
        return { isValid: false, errorMessage: 'Dense layer requires flat input (1D or 2D with batch dimension). Use Flatten layer before Dense for multi-dimensional inputs.' }
      }
      return { isValid: true }
    },
    computeShape: (inputShapes: number[][], params: Record<string, unknown>) => {
      if (inputShapes.length !== 1) return null
      const inputShape = inputShapes[0]
      if (inputShape.length > 2) return null // Dense needs flat input
      
      const units = Number(params.units) || 128
      return [units]
    },
    generateCode: {
      keras: (params: Record<string, unknown>) => {
        const units = Number(params.units) || 128
        const activation = String(params.activation) || 'linear'
        
        if (activation === 'linear') {
          return `Dense(${units})`
        } else {
          return `Dense(${units}, activation='${activation}')`
        }
      }
    },
    supportsMultiplier: true,
    supportsActivation: true
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
      },
      {
        key: 'activation',
        type: 'select',
        label: 'Activation',
        description: 'Activation function to use',
        default: 'linear',
        options: ACTIVATION_OPTIONS
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
        const activation = String(params.activation) || 'linear'
        
        let code = `Conv2D(${filters}, kernel_size=${kernelSize}, strides=${strides}, padding='${padding}'`
        if (activation !== 'linear') {
          code += `, activation='${activation}'`
        }
        code += ')'
        
        return code
      }
    },
    supportsMultiplier: true,
    supportsActivation: true
  },

  Conv1D: {
    metadata: {
      category: 'convolutional',
      icon: '📏',
      description: '1D convolution layer for sequence data',
      tags: ['convolution', 'cnn', '1d', 'sequence'],
      performance: {
        complexity: 'O(L*C*F*K) where L=sequence length, C=input channels, F=filters, K=kernel size',
        memory: 'Moderate, depends on filter count',
        usage: 'Feature extraction from sequential data like time series or text'
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
        type: 'number',
        label: 'Kernel Size',
        description: 'Size of 1D convolution window',
        default: 3,
        validation: { min: 1, max: 100, required: true },
        ui: { tooltip: 'e.g., 3 for analyzing 3 consecutive time steps' }
      },
      {
        key: 'strides',
        type: 'number',
        label: 'Strides',
        description: 'Stride of convolution',
        default: 1,
        validation: { min: 1, max: 10 }
      },
      {
        key: 'padding',
        type: 'select',
        label: 'Padding',
        description: 'Padding strategy',
        default: 'same',
        options: [
          { value: 'valid', label: 'Valid', description: 'No padding, output length reduced' },
          { value: 'same', label: 'Same', description: 'Padding to keep same output length' }
        ]
      },
      {
        key: 'activation',
        type: 'select',
        label: 'Activation',
        description: 'Activation function to use',
        default: 'linear',
        options: ACTIVATION_OPTIONS
      }
    ],
    validateInputs: (inputShapes, params) => {
      void params; // Explicitly mark as intentionally unused
      if (inputShapes.length !== 1) {
        return { isValid: false, errorMessage: 'Conv1D layer requires exactly one input' }
      }
      const inputShape = inputShapes[0]
      if (inputShape.length !== 2) {
        return { isValid: false, errorMessage: 'Conv1D layer requires 2D input (sequence_length, features)' }
      }
      return { isValid: true }
    },
    computeShape: (inputShapes, params) => {
      if (inputShapes.length !== 1) return null
      const inputShape = inputShapes[0]
      if (inputShape.length !== 2) return null
      
      const [inputLength] = inputShape
      const filters = Number(params.filters) || 32
      const kernelSize = Number(params.kernel_size) || 3
      const strides = Number(params.strides) || 1
      const padding = String(params.padding) || 'same'
      
      let outputLength: number
      
      if (padding === 'same') {
        outputLength = Math.ceil(inputLength / strides)
      } else {
        outputLength = Math.floor((inputLength - kernelSize) / strides) + 1
      }
      
      return [outputLength, filters]
    },
    generateCode: {
      keras: (params) => {
        const filters = Number(params.filters) || 32
        const kernelSize = Number(params.kernel_size) || 3
        const strides = Number(params.strides) || 1
        const padding = String(params.padding) || 'same'
        const activation = String(params.activation) || 'linear'
        
        let code = `Conv1D(${filters}, kernel_size=${kernelSize}`
        if (strides !== 1) {
          code += `, strides=${strides}`
        }
        code += `, padding='${padding}'`
        if (activation !== 'linear') {
          code += `, activation='${activation}'`
        }
        code += ')'
        
        return code
      }
    },
    supportsMultiplier: true,
    supportsActivation: true
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
      keras: () => 'Flatten()'
    }
  },

  // ACTIVATION LAYERS
  // ============================================================================
  
  Activation: {
    metadata: {
      category: 'core',
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
        options: ACTIVATION_OPTIONS
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
      }
    }
  },

  // REGULARIZATION LAYERS
  // ============================================================================
  
  Dropout: {
    metadata: {
      category: 'core',
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

// ============================================================================
// LAYER ACCESS FUNCTIONS  
// ============================================================================

/**
 * Get icon for a layer type
 */
export function getLayerIcon(type: string): string {
  const definition = layerDefinitions[type]
  return definition?.metadata.icon || '🔧'
}

/**
 * Get all available layer types with basic metadata
 */
export function getLayerTypes(): Array<{ type: string; icon: string; description: string }> {
  return Object.entries(layerDefinitions).map(([type, definition]) => ({
    type,
    icon: definition.metadata.icon,
    description: definition.metadata.description
  }))
}

/**
 * Generate Keras code for a layer with given parameters
 */
export function generateLayerCode(type: string, params: Record<string, LayerParamValue>): string {
  const definition = layerDefinitions[type]
  if (!definition) {
    return `# Unknown layer type: ${type}`
  }
  
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

import { categories, getCategoryColorsByKey } from './categories'

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


