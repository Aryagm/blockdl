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

  Conv2DTranspose: {
    metadata: {
      category: 'convolutional',
      icon: '🔲↗️',
      description: 'Transposed 2D convolution layer for upsampling',
      tags: ['convolution', 'cnn', '2d', 'transpose', 'upsampling', 'deconvolution'],
      performance: {
        complexity: 'O(H*W*C*F*K²) where H,W=output size, C=input channels, F=filters, K=kernel size',
        memory: 'Moderate, depends on filter count and output size',
        usage: 'Upsampling for image generation, segmentation, and autoencoders'
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
        ui: { tooltip: 'More filters = more features generated' }
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
        description: 'Stride of convolution (controls upsampling factor)',
        default: '(2,2)',
        validation: { pattern: '^\\([0-9]+,[0-9]+\\)$' },
        ui: { tooltip: 'e.g., (2,2) doubles the spatial dimensions' }
      },
      {
        key: 'padding',
        type: 'select',
        label: 'Padding',
        description: 'Padding strategy',
        default: 'same',
        options: [
          { value: 'valid', label: 'Valid', description: 'No padding, output size depends on kernel and stride' },
          { value: 'same', label: 'Same', description: 'Padding to achieve predictable output size' }
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
        return { isValid: false, errorMessage: 'Conv2DTranspose layer requires exactly one input' }
      }
      const inputShape = inputShapes[0]
      if (inputShape.length !== 3) {
        return { isValid: false, errorMessage: 'Conv2DTranspose layer requires 3D input (height, width, channels)' }
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
      const strides = parseTupleOrNumber(String(params.strides) || '(2,2)')
      const padding = String(params.padding) || 'same'
      
      if (!kernelSize || !strides) return null
      
      let outputHeight: number
      let outputWidth: number
      
      if (padding === 'same') {
        outputHeight = inputHeight * strides[0]
        outputWidth = inputWidth * strides[1]
      } else {
        // For 'valid' padding in transpose convolution
        outputHeight = (inputHeight - 1) * strides[0] + kernelSize[0]
        outputWidth = (inputWidth - 1) * strides[1] + kernelSize[1]
      }
      
      return [outputHeight, outputWidth, filters]
    },
    generateCode: {
      keras: (params) => {
        const filters = Number(params.filters) || 32
        const kernelSize = String(params.kernel_size) || '(3,3)'
        const strides = String(params.strides) || '(2,2)'
        const padding = String(params.padding) || 'same'
        const activation = String(params.activation) || 'linear'
        
        let code = `Conv2DTranspose(${filters}, kernel_size=${kernelSize}, strides=${strides}, padding='${padding}'`
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

  AveragePooling2D: {
    metadata: {
      category: 'pooling',
      icon: '🌊',
      description: 'Average pooling operation for 2D spatial data',
      tags: ['pooling', 'average', 'cnn'],
      performance: {
        complexity: 'O(H*W*C)',
        memory: 'Low',
        usage: 'Reduce spatial dimensions by averaging values'
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
        return { isValid: false, errorMessage: 'AveragePooling2D layer requires exactly one input' }
      }
      const inputShape = inputShapes[0]
      if (inputShape.length !== 3) {
        return { isValid: false, errorMessage: 'AveragePooling2D layer requires 3D input (height, width, channels)' }
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
        
        return `AveragePooling2D(pool_size=${poolSize}${strides}, padding='${padding}')`
      }
    }
  },

  GlobalAveragePooling2D: {
    metadata: {
      category: 'pooling',
      icon: '🌍',
      description: 'Global average pooling operation for 2D spatial data',
      tags: ['pooling', 'global', 'average', 'cnn'],
      performance: {
        complexity: 'O(H*W*C)',
        memory: 'Very low',
        usage: 'Replace Flatten + Dense layers, reduce overfitting'
      }
    },
    parameters: [],
    validateInputs: (inputShapes, params) => {
      void params; // Explicitly mark as intentionally unused
      if (inputShapes.length !== 1) {
        return { isValid: false, errorMessage: 'GlobalAveragePooling2D layer requires exactly one input' }
      }
      const inputShape = inputShapes[0]
      if (inputShape.length !== 3) {
        return { isValid: false, errorMessage: 'GlobalAveragePooling2D layer requires 3D input (height, width, channels)' }
      }
      return { isValid: true }
    },
    computeShape: (inputShapes) => {
      if (inputShapes.length !== 1) return null
      const inputShape = inputShapes[0]
      if (inputShape.length !== 3) return null
      
      const [, , channels] = inputShape
      
      // Global average pooling reduces spatial dimensions to 1x1, keeping only channels
      return [channels]
    },
    generateCode: {
      keras: () => 'GlobalAveragePooling2D()'
    }
  },

  // ZeroPadding2D layer kept at the end to avoid conflicts with tuple parsing in other layers
  ZeroPadding2D: {
    metadata: {
      category: 'convolutional',
      icon: '🔲⬛',
      description: 'Zero-padding layer for 2D spatial data',
      tags: ['padding', 'zero', 'spatial', 'preprocessing'],
      performance: {
        complexity: 'O(H*W*C)',
        memory: 'Low (just adds zeros)',
        usage: 'Add zero padding around feature maps'
      }
    },
    parameters: [
      {
        key: 'padding',
        type: 'text',
        label: 'Padding',
        description: 'Amount of padding to add',
        default: '(1,1)',
        validation: { pattern: '^\\([0-9]+,[0-9]+\\)$|^[0-9]+$', required: true },
        ui: { tooltip: 'Single number or (rows, cols). E.g., (1,1) adds 1 pixel border' }
      }
    ],
    validateInputs: (inputShapes, params) => {
      void params; // Explicitly mark as intentionally unused
      if (inputShapes.length !== 1) {
        return { isValid: false, errorMessage: 'ZeroPadding2D layer requires exactly one input' }
      }
      const inputShape = inputShapes[0]
      if (inputShape.length !== 3) {
        return { isValid: false, errorMessage: 'ZeroPadding2D layer requires 3D input (height, width, channels)' }
      }
      return { isValid: true }
    },
    computeShape: (inputShapes, params) => {
      if (inputShapes.length !== 1) return null
      const inputShape = inputShapes[0]
      if (inputShape.length !== 3) return null
      
      const [inputHeight, inputWidth, channels] = inputShape
      const paddingStr = String(params.padding) || '(1,1)'
      
      let padRows: number, padCols: number
      
      // Handle both single number and tuple formats
      if (paddingStr.includes('(')) {
        const padding = parseTupleOrNumber(paddingStr)
        if (!padding) return null
        padRows = padding[0]
        padCols = padding[1]
      } else {
        const singlePad = Number(paddingStr)
        if (isNaN(singlePad)) return null
        padRows = singlePad
        padCols = singlePad
      }
      
      const outputHeight = inputHeight + 2 * padRows
      const outputWidth = inputWidth + 2 * padCols
      
      return [outputHeight, outputWidth, channels]
    },
    generateCode: {
      keras: (params) => {
        const paddingStr = String(params.padding) || '(1,1)'
        
        // Handle both single number and tuple formats
        if (paddingStr.includes('(')) {
          return `ZeroPadding2D(padding=${paddingStr})`
        } else {
          return `ZeroPadding2D(padding=${paddingStr})`
        }
      }
    }
  },

  Cropping2D: {
    metadata: {
      category: 'convolutional',
      icon: '✂️',
      description: 'Cropping layer for 2D spatial data',
      tags: ['cropping', 'spatial', 'preprocessing', 'resize'],
      performance: {
        complexity: 'O(1)',
        memory: 'None (just removes data)',
        usage: 'Remove pixels from borders of feature maps'
      }
    },
    parameters: [
      {
        key: 'cropping',
        type: 'text',
        label: 'Cropping',
        description: 'Amount of cropping to apply',
        default: '((1,1),(1,1))',
        validation: { pattern: '^\\(\\([0-9]+,[0-9]+\\),\\([0-9]+,[0-9]+\\)\\)$|^\\([0-9]+,[0-9]+\\)$|^[0-9]+$', required: true },
        ui: { tooltip: 'Single number, (rows,cols) or ((top,bottom),(left,right)). E.g., ((1,1),(1,1)) crops 1 pixel from all sides' }
      }
    ],
    validateInputs: (inputShapes, params) => {
      void params; // Explicitly mark as intentionally unused
      if (inputShapes.length !== 1) {
        return { isValid: false, errorMessage: 'Cropping2D layer requires exactly one input' }
      }
      const inputShape = inputShapes[0]
      if (inputShape.length !== 3) {
        return { isValid: false, errorMessage: 'Cropping2D layer requires 3D input (height, width, channels)' }
      }
      return { isValid: true }
    },
    computeShape: (inputShapes, params) => {
      if (inputShapes.length !== 1) return null
      const inputShape = inputShapes[0]
      if (inputShape.length !== 3) return null
      
      const [inputHeight, inputWidth, channels] = inputShape
      const croppingStr = String(params.cropping) || '((1,1),(1,1))'
      
      let topCrop: number, bottomCrop: number, leftCrop: number, rightCrop: number
      
      // Handle different cropping formats
      if (croppingStr.includes('((')) {
        // Format: ((top,bottom),(left,right))
        const match = croppingStr.match(/\(\((\d+),(\d+)\),\((\d+),(\d+)\)\)/)
        if (!match) return null
        topCrop = Number(match[1])
        bottomCrop = Number(match[2])
        leftCrop = Number(match[3])
        rightCrop = Number(match[4])
      } else if (croppingStr.includes('(')) {
        // Format: (rows,cols) - symmetric cropping
        const match = croppingStr.match(/\((\d+),(\d+)\)/)
        if (!match) return null
        topCrop = bottomCrop = Number(match[1])
        leftCrop = rightCrop = Number(match[2])
      } else {
        // Format: single number - symmetric cropping on all sides
        const singleCrop = Number(croppingStr)
        if (isNaN(singleCrop)) return null
        topCrop = bottomCrop = leftCrop = rightCrop = singleCrop
      }
      
      const outputHeight = inputHeight - topCrop - bottomCrop
      const outputWidth = inputWidth - leftCrop - rightCrop
      
      // Ensure output dimensions are positive
      if (outputHeight <= 0 || outputWidth <= 0) return null
      
      return [outputHeight, outputWidth, channels]
    },
    generateCode: {
      keras: (params) => {
        const croppingStr = String(params.cropping) || '((1,1),(1,1))'
        
        // Handle different cropping formats for Keras code generation
        if (croppingStr.includes('((')) {
          return `Cropping2D(cropping=${croppingStr})`
        } else if (croppingStr.includes('(')) {
          return `Cropping2D(cropping=${croppingStr})`
        } else {
          return `Cropping2D(cropping=${croppingStr})`
        }
      }
    }
  },

  // SEQUENCE LAYERS
  // ============================================================================
  
  Embedding: {
    metadata: {
      category: 'sequence',
      icon: '📋',
      description: 'Embedding layer for converting indices to dense vectors',
      tags: ['embedding', 'sequence', 'nlp', 'word2vec'],
      performance: {
        complexity: 'O(batch_size * sequence_length)',
        memory: 'Moderate (vocab_size * embedding_dim parameters)',
        usage: 'Convert discrete tokens/indices to dense vector representations'
      }
    },
    parameters: [
      {
        key: 'input_dim',
        type: 'number',
        label: 'Input Dimension (Vocabulary Size)',
        description: 'Size of the vocabulary (number of unique tokens)',
        default: 10000,
        validation: { min: 1, max: 1000000, required: true },
        ui: { tooltip: 'Maximum index value + 1. E.g., 10000 for vocab of indices 0-9999' }
      },
      {
        key: 'output_dim',
        type: 'number',
        label: 'Output Dimension (Embedding Size)',
        description: 'Dimension of the dense embedding vectors',
        default: 128,
        validation: { min: 1, max: 2048, required: true },
        ui: { tooltip: 'Higher dimensions can capture more relationships but require more memory' }
      },
      {
        key: 'input_length',
        type: 'number',
        label: 'Input Length (optional)',
        description: 'Length of input sequences (for shape inference)',
        default: 100,
        validation: { min: 1, max: 10000 },
        ui: { tooltip: 'Maximum sequence length. Leave empty if variable length' }
      },
      {
        key: 'mask_zero',
        type: 'select',
        label: 'Mask Zero',
        description: 'Whether to mask zero values in input',
        default: 'false',
        options: [
          { value: 'false', label: 'False', description: 'No masking' },
          { value: 'true', label: 'True', description: 'Mask zero values (for padding)' }
        ],
        ui: { tooltip: 'Enable for padded sequences where 0 represents padding' }
      }
    ],
    validateInputs: (inputShapes, params) => {
      void params; // Explicitly mark as intentionally unused
      if (inputShapes.length !== 1) {
        return { isValid: false, errorMessage: 'Embedding layer requires exactly one input' }
      }
      const inputShape = inputShapes[0]
      if (inputShape.length < 1 || inputShape.length > 2) {
        return { isValid: false, errorMessage: 'Embedding layer requires 1D (batch,) or 2D (batch, sequence_length) input' }
      }
      return { isValid: true }
    },
    computeShape: (inputShapes, params) => {
      if (inputShapes.length !== 1) return null
      const inputShape = inputShapes[0]
      if (inputShape.length < 1 || inputShape.length > 2) return null
      
      const outputDim = Number(params.output_dim) || 128
      
      if (inputShape.length === 1) {
        // Input is (batch,) -> Output is (batch, output_dim)
        return [outputDim]
      } else {
        // Input is (batch, sequence_length) -> Output is (batch, sequence_length, output_dim)
        const sequenceLength = inputShape[0]
        return [sequenceLength, outputDim]
      }
    },
    generateCode: {
      keras: (params) => {
        const inputDim = Number(params.input_dim) || 10000
        const outputDim = Number(params.output_dim) || 128
        const inputLength = params.input_length ? Number(params.input_length) : null
        const maskZero = String(params.mask_zero) === 'true'
        
        let code = `Embedding(${inputDim}, ${outputDim}`
        
        if (inputLength) {
          code += `, input_length=${inputLength}`
        }
        
        if (maskZero) {
          code += `, mask_zero=True`
        }
        
        code += ')'
        
        return code
      }
    }
  },

  LSTM: {
    metadata: {
      category: 'sequence',
      icon: '🔄',
      description: 'Long Short-Term Memory recurrent layer',
      tags: ['lstm', 'rnn', 'sequence', 'recurrent', 'memory'],
      performance: {
        complexity: 'O(batch_size * sequence_length * units²)',
        memory: 'High (stores cell state and hidden state)',
        usage: 'Process sequential data with long-term dependencies'
      }
    },
    parameters: [
      {
        key: 'units',
        type: 'number',
        label: 'Units',
        description: 'Dimensionality of the output space',
        default: 50,
        validation: { min: 1, max: 2048, required: true },
        ui: { tooltip: 'Number of LSTM units (memory cells)' }
      },
      {
        key: 'activation',
        type: 'select',
        label: 'Activation',
        description: 'Activation function for the LSTM gates',
        default: 'tanh',
        options: [
          { value: 'tanh', label: 'Tanh', description: 'Hyperbolic tangent (default)' },
          { value: 'relu', label: 'ReLU', description: 'Rectified Linear Unit' },
          { value: 'sigmoid', label: 'Sigmoid', description: 'Sigmoid function' },
          { value: 'hard_sigmoid', label: 'Hard Sigmoid', description: 'Faster approximation of sigmoid' }
        ]
      },
      {
        key: 'recurrent_activation',
        type: 'select',
        label: 'Recurrent Activation',
        description: 'Activation function for recurrent connections',
        default: 'sigmoid',
        options: [
          { value: 'sigmoid', label: 'Sigmoid', description: 'Sigmoid function (default)' },
          { value: 'hard_sigmoid', label: 'Hard Sigmoid', description: 'Faster approximation of sigmoid' },
          { value: 'tanh', label: 'Tanh', description: 'Hyperbolic tangent' }
        ]
      },
      {
        key: 'return_sequences',
        type: 'select',
        label: 'Return Sequences',
        description: 'Whether to return the full sequence or just the last output',
        default: 'false',
        options: [
          { value: 'false', label: 'False', description: 'Return only last output' },
          { value: 'true', label: 'True', description: 'Return full sequence' }
        ],
        ui: { tooltip: 'True for stacking RNNs, False for final output' }
      },
      {
        key: 'return_state',
        type: 'select',
        label: 'Return State',
        description: 'Whether to return the last state in addition to output',
        default: 'false',
        options: [
          { value: 'false', label: 'False', description: 'Return only output' },
          { value: 'true', label: 'True', description: 'Return output and states' }
        ]
      },
      {
        key: 'dropout',
        type: 'number',
        label: 'Dropout',
        description: 'Fraction of units to drop for input linear transformation',
        default: 0.0,
        validation: { min: 0, max: 1 },
        ui: { tooltip: 'Regularization: 0.0 = no dropout, 0.5 = drop 50%' }
      },
      {
        key: 'recurrent_dropout',
        type: 'number',
        label: 'Recurrent Dropout',
        description: 'Fraction of units to drop for recurrent connections',
        default: 0.0,
        validation: { min: 0, max: 1 },
        ui: { tooltip: 'Dropout for recurrent connections' }
      }
    ],
    validateInputs: (inputShapes, params) => {
      void params; // Explicitly mark as intentionally unused
      if (inputShapes.length !== 1) {
        return { isValid: false, errorMessage: 'LSTM layer requires exactly one input' }
      }
      const inputShape = inputShapes[0]
      if (inputShape.length !== 2) {
        return { isValid: false, errorMessage: 'LSTM layer requires 2D input (sequence_length, features)' }
      }
      return { isValid: true }
    },
    computeShape: (inputShapes, params) => {
      if (inputShapes.length !== 1) return null
      const inputShape = inputShapes[0]
      if (inputShape.length !== 2) return null
      
      const [sequenceLength] = inputShape
      const units = Number(params.units) || 50
      const returnSequences = String(params.return_sequences) === 'true'
      
      if (returnSequences) {
        return [sequenceLength, units]
      } else {
        return [units]
      }
    },
    generateCode: {
      keras: (params) => {
        const units = Number(params.units) || 50
        const activation = params.activation ? String(params.activation) : 'tanh'
        const recurrentActivation = params.recurrent_activation ? String(params.recurrent_activation) : 'sigmoid'
        const returnSequences = String(params.return_sequences) === 'true'
        const returnState = String(params.return_state) === 'true'
        const dropout = Number(params.dropout) || 0.0
        const recurrentDropout = Number(params.recurrent_dropout) || 0.0
        
        let code = `LSTM(${units}`
        
        if (activation !== 'tanh') {
          code += `, activation='${activation}'`
        }
        if (recurrentActivation !== 'sigmoid') {
          code += `, recurrent_activation='${recurrentActivation}'`
        }
        if (returnSequences) {
          code += `, return_sequences=True`
        }
        if (returnState) {
          code += `, return_state=True`
        }
        if (dropout > 0) {
          code += `, dropout=${dropout}`
        }
        if (recurrentDropout > 0) {
          code += `, recurrent_dropout=${recurrentDropout}`
        }
        
        code += ')'
        
        return code
      }
    }
  },

  GRU: {
    metadata: {
      category: 'sequence',
      icon: '🔄⚡',
      description: 'Gated Recurrent Unit layer',
      tags: ['gru', 'rnn', 'sequence', 'recurrent', 'gated'],
      performance: {
        complexity: 'O(batch_size * sequence_length * units²)',
        memory: 'Medium (stores hidden state, simpler than LSTM)',
        usage: 'Process sequential data, faster alternative to LSTM'
      }
    },
    parameters: [
      {
        key: 'units',
        type: 'number',
        label: 'Units',
        description: 'Dimensionality of the output space',
        default: 50,
        validation: { min: 1, max: 2048, required: true },
        ui: { tooltip: 'Number of GRU units' }
      },
      {
        key: 'activation',
        type: 'select',
        label: 'Activation',
        description: 'Activation function for the GRU gates',
        default: 'tanh',
        options: [
          { value: 'tanh', label: 'Tanh', description: 'Hyperbolic tangent (default)' },
          { value: 'relu', label: 'ReLU', description: 'Rectified Linear Unit' },
          { value: 'sigmoid', label: 'Sigmoid', description: 'Sigmoid function' },
          { value: 'hard_sigmoid', label: 'Hard Sigmoid', description: 'Faster approximation of sigmoid' }
        ]
      },
      {
        key: 'recurrent_activation',
        type: 'select',
        label: 'Recurrent Activation',
        description: 'Activation function for recurrent connections',
        default: 'sigmoid',
        options: [
          { value: 'sigmoid', label: 'Sigmoid', description: 'Sigmoid function (default)' },
          { value: 'hard_sigmoid', label: 'Hard Sigmoid', description: 'Faster approximation of sigmoid' },
          { value: 'tanh', label: 'Tanh', description: 'Hyperbolic tangent' }
        ]
      },
      {
        key: 'return_sequences',
        type: 'select',
        label: 'Return Sequences',
        description: 'Whether to return the full sequence or just the last output',
        default: 'false',
        options: [
          { value: 'false', label: 'False', description: 'Return only last output' },
          { value: 'true', label: 'True', description: 'Return full sequence' }
        ],
        ui: { tooltip: 'True for stacking RNNs, False for final output' }
      },
      {
        key: 'return_state',
        type: 'select',
        label: 'Return State',
        description: 'Whether to return the last state in addition to output',
        default: 'false',
        options: [
          { value: 'false', label: 'False', description: 'Return only output' },
          { value: 'true', label: 'True', description: 'Return output and states' }
        ]
      },
      {
        key: 'dropout',
        type: 'number',
        label: 'Dropout',
        description: 'Fraction of units to drop for input linear transformation',
        default: 0.0,
        validation: { min: 0, max: 1 },
        ui: { tooltip: 'Regularization: 0.0 = no dropout, 0.5 = drop 50%' }
      },
      {
        key: 'recurrent_dropout',
        type: 'number',
        label: 'Recurrent Dropout',
        description: 'Fraction of units to drop for recurrent connections',
        default: 0.0,
        validation: { min: 0, max: 1 },
        ui: { tooltip: 'Dropout for recurrent connections' }
      },
      {
        key: 'reset_after',
        type: 'select',
        label: 'Reset After',
        description: 'GRU convention (whether to apply reset gate after or before matrix multiplication)',
        default: 'true',
        options: [
          { value: 'true', label: 'True', description: 'Apply reset after matrix multiplication (CuDNN compatible)' },
          { value: 'false', label: 'False', description: 'Apply reset before matrix multiplication' }
        ],
        ui: { tooltip: 'True is faster on GPU, False follows original paper' }
      }
    ],
    validateInputs: (inputShapes, params) => {
      void params; // Explicitly mark as intentionally unused
      if (inputShapes.length !== 1) {
        return { isValid: false, errorMessage: 'GRU layer requires exactly one input' }
      }
      const inputShape = inputShapes[0]
      if (inputShape.length !== 2) {
        return { isValid: false, errorMessage: 'GRU layer requires 2D input (sequence_length, features)' }
      }
      return { isValid: true }
    },
    computeShape: (inputShapes, params) => {
      if (inputShapes.length !== 1) return null
      const inputShape = inputShapes[0]
      if (inputShape.length !== 2) return null
      
      const [sequenceLength] = inputShape
      const units = Number(params.units) || 50
      const returnSequences = String(params.return_sequences) === 'true'
      
      if (returnSequences) {
        return [sequenceLength, units]
      } else {
        return [units]
      }
    },
    generateCode: {
      keras: (params) => {
        const units = Number(params.units) || 50
        const activation = params.activation ? String(params.activation) : 'tanh'
        const recurrentActivation = params.recurrent_activation ? String(params.recurrent_activation) : 'sigmoid'
        const returnSequences = String(params.return_sequences) === 'true'
        const returnState = String(params.return_state) === 'true'
        const dropout = Number(params.dropout) || 0.0
        const recurrentDropout = Number(params.recurrent_dropout) || 0.0
        const resetAfter = params.reset_after ? String(params.reset_after) === 'true' : true
        
        let code = `GRU(${units}`
        
        if (activation !== 'tanh') {
          code += `, activation='${activation}'`
        }
        if (recurrentActivation !== 'sigmoid') {
          code += `, recurrent_activation='${recurrentActivation}'`
        }
        if (returnSequences) {
          code += `, return_sequences=True`
        }
        if (returnState) {
          code += `, return_state=True`
        }
        if (dropout > 0) {
          code += `, dropout=${dropout}`
        }
        if (recurrentDropout > 0) {
          code += `, recurrent_dropout=${recurrentDropout}`
        }
        if (!resetAfter) {
          code += `, reset_after=False`
        }
        
        code += ')'
        
        return code
      }
    }
  },

  Bidirectional: {
    metadata: {
      category: 'sequence',
      icon: '↔️',
      description: 'Bidirectional wrapper for RNNs',
      tags: ['bidirectional', 'wrapper', 'rnn', 'sequence'],
      performance: {
        complexity: 'O(2 * wrapped_layer_complexity)',
        memory: 'Double the wrapped layer memory',
        usage: 'Process sequences in both forward and backward directions'
      }
    },
    parameters: [
      {
        key: 'layer_type',
        type: 'select',
        label: 'Wrapped Layer Type',
        description: 'Type of RNN layer to wrap',
        default: 'LSTM',
        validation: { required: true },
        options: [
          { value: 'LSTM', label: 'LSTM', description: 'Long Short-Term Memory' },
          { value: 'GRU', label: 'GRU', description: 'Gated Recurrent Unit' }
        ],
        ui: { tooltip: 'The RNN layer that will be made bidirectional' }
      },
      {
        key: 'units',
        type: 'number',
        label: 'Units',
        description: 'Number of units in the wrapped layer',
        default: 50,
        validation: { min: 1, max: 2048, required: true },
        ui: { tooltip: 'Units for the underlying RNN layer' }
      },
      {
        key: 'merge_mode',
        type: 'select',
        label: 'Merge Mode',
        description: 'How to combine forward and backward outputs',
        default: 'concat',
        options: [
          { value: 'concat', label: 'Concatenate', description: 'Concatenate forward and backward outputs' },
          { value: 'sum', label: 'Sum', description: 'Sum forward and backward outputs' },
          { value: 'mul', label: 'Multiply', description: 'Multiply forward and backward outputs' },
          { value: 'ave', label: 'Average', description: 'Average forward and backward outputs' },
          { value: 'None', label: 'None', description: 'Return as list [forward, backward]' }
        ],
        ui: { tooltip: 'concat doubles output size, others keep same size' }
      },
      {
        key: 'return_sequences',
        type: 'select',
        label: 'Return Sequences',
        description: 'Whether to return the full sequence or just the last output',
        default: 'false',
        options: [
          { value: 'false', label: 'False', description: 'Return only last output' },
          { value: 'true', label: 'True', description: 'Return full sequence' }
        ],
        ui: { tooltip: 'True for stacking RNNs, False for final output' }
      },
      {
        key: 'dropout',
        type: 'number',
        label: 'Dropout',
        description: 'Dropout rate for the wrapped layer',
        default: 0.0,
        validation: { min: 0, max: 1 },
        ui: { tooltip: 'Regularization: 0.0 = no dropout, 0.5 = drop 50%' }
      }
    ],
    validateInputs: (inputShapes, params) => {
      void params; // Explicitly mark as intentionally unused
      if (inputShapes.length !== 1) {
        return { isValid: false, errorMessage: 'Bidirectional layer requires exactly one input' }
      }
      const inputShape = inputShapes[0]
      if (inputShape.length !== 2) {
        return { isValid: false, errorMessage: 'Bidirectional layer requires 2D input (sequence_length, features)' }
      }
      return { isValid: true }
    },
    computeShape: (inputShapes, params) => {
      if (inputShapes.length !== 1) return null
      const inputShape = inputShapes[0]
      if (inputShape.length !== 2) return null
      
      const [sequenceLength] = inputShape
      const units = Number(params.units) || 50
      const returnSequences = String(params.return_sequences) === 'true'
      const mergeMode = String(params.merge_mode) || 'concat'
      
      let outputUnits = units
      if (mergeMode === 'concat') {
        outputUnits = units * 2  // Forward + backward concatenated
      }
      // For other merge modes (sum, mul, ave), output size remains same as units
      
      if (returnSequences) {
        return [sequenceLength, outputUnits]
      } else {
        return [outputUnits]
      }
    },
    generateCode: {
      keras: (params) => {
        const layerType = String(params.layer_type) || 'LSTM'
        const units = Number(params.units) || 50
        const mergeMode = String(params.merge_mode) || 'concat'
        const returnSequences = String(params.return_sequences) === 'true'
        const dropout = Number(params.dropout) || 0.0
        
        let wrappedLayerCode = `${layerType}(${units}`
        if (returnSequences) {
          wrappedLayerCode += `, return_sequences=True`
        }
        if (dropout > 0) {
          wrappedLayerCode += `, dropout=${dropout}`
        }
        wrappedLayerCode += ')'
        
        let code = `Bidirectional(${wrappedLayerCode}`
        if (mergeMode !== 'concat') {
          if (mergeMode === 'None') {
            code += `, merge_mode=None`
          } else {
            code += `, merge_mode='${mergeMode}'`
          }
        }
        code += ')'
        
        return code
      }
    }
  },

  TimeDistributed: {
    metadata: {
      category: 'sequence',
      icon: '⏰',
      description: 'Apply a layer to every temporal slice of an input',
      tags: ['time-distributed', 'wrapper', 'sequence', 'temporal'],
      performance: {
        complexity: 'O(sequence_length * wrapped_layer_complexity)',
        memory: 'Similar to wrapped layer, applied per time step',
        usage: 'Apply Dense or Conv layers to each time step independently'
      }
    },
    parameters: [
      {
        key: 'layer_type',
        type: 'select',
        label: 'Wrapped Layer Type',
        description: 'Type of layer to apply at each time step',
        default: 'Dense',
        validation: { required: true },
        options: [
          { value: 'Dense', label: 'Dense', description: 'Fully connected layer' },
          { value: 'Conv1D', label: 'Conv1D', description: '1D convolution layer' },
          { value: 'Conv2D', label: 'Conv2D', description: '2D convolution layer' },
          { value: 'Activation', label: 'Activation', description: 'Activation function' },
          { value: 'Dropout', label: 'Dropout', description: 'Dropout regularization' }
        ],
        ui: { tooltip: 'The layer that will be applied to each time step' }
      },
      {
        key: 'units',
        type: 'number',
        label: 'Units/Filters',
        description: 'Number of units (for Dense) or filters (for Conv layers)',
        default: 32,
        validation: { min: 1, max: 2048 },
        conditional: { showWhen: { layer_type: ['Dense', 'Conv1D', 'Conv2D'] } },
        ui: { tooltip: 'Output dimension for the wrapped layer' }
      },
      {
        key: 'kernel_size',
        type: 'text',
        label: 'Kernel Size',
        description: 'Size of convolution kernel',
        default: '(3,3)',
        validation: { pattern: '^\\([0-9]+,[0-9]+\\)$' },
        conditional: { showWhen: { layer_type: ['Conv2D'] } },
        ui: { tooltip: 'e.g., (3,3) for 3x3 kernel' }
      },
      {
        key: 'kernel_size_1d',
        type: 'number',
        label: 'Kernel Size',
        description: 'Size of 1D convolution kernel',
        default: 3,
        validation: { min: 1, max: 100 },
        conditional: { showWhen: { layer_type: ['Conv1D'] } },
        ui: { tooltip: 'e.g., 3 for 3-point kernel' }
      },
      {
        key: 'activation',
        type: 'select',
        label: 'Activation',
        description: 'Activation function to use',
        default: 'linear',
        options: ACTIVATION_OPTIONS,
        conditional: { showWhen: { layer_type: ['Dense', 'Conv1D', 'Conv2D', 'Activation'] } }
      },
      {
        key: 'dropout_rate',
        type: 'number',
        label: 'Dropout Rate',
        description: 'Fraction of input units to drop',
        default: 0.5,
        validation: { min: 0, max: 1 },
        conditional: { showWhen: { layer_type: ['Dropout'] } },
        ui: { tooltip: 'Between 0 and 1, e.g., 0.5 drops 50% of inputs' }
      }
    ],
    validateInputs: (inputShapes, params) => {
      void params; // Explicitly mark as intentionally unused
      if (inputShapes.length !== 1) {
        return { isValid: false, errorMessage: 'TimeDistributed layer requires exactly one input' }
      }
      const inputShape = inputShapes[0]
      if (inputShape.length < 2) {
        return { isValid: false, errorMessage: 'TimeDistributed layer requires at least 2D input (time_steps, features...)' }
      }
      return { isValid: true }
    },
    computeShape: (inputShapes, params) => {
      if (inputShapes.length !== 1) return null
      const inputShape = inputShapes[0]
      if (inputShape.length < 2) return null
      
      const [timeSteps] = inputShape
      const layerType = String(params.layer_type) || 'Dense'
      
      switch (layerType) {
        case 'Dense': {
          const units = Number(params.units) || 32
          return [timeSteps, units]
        }
        case 'Conv1D': {
          if (inputShape.length !== 3) return null // [time_steps, sequence_length, features]
          const filters = Number(params.units) || 32
          const sequenceLength = inputShape[1]
          return [timeSteps, sequenceLength, filters]
        }
        case 'Conv2D': {
          if (inputShape.length !== 4) return null // [time_steps, height, width, channels]
          const filters = Number(params.units) || 32
          const height = inputShape[1]
          const width = inputShape[2]
          return [timeSteps, height, width, filters]
        }
        case 'Activation':
        case 'Dropout': {
          return inputShape // Same shape
        }
        default:
          return inputShape
      }
    },
    generateCode: {
      keras: (params) => {
        const layerType = String(params.layer_type) || 'Dense'
        
        let wrappedLayerCode = ''
        
        switch (layerType) {
          case 'Dense': {
            const units = Number(params.units) || 32
            const activation = params.activation ? String(params.activation) : 'linear'
            wrappedLayerCode = `Dense(${units}`
            if (activation !== 'linear') {
              wrappedLayerCode += `, activation='${activation}'`
            }
            wrappedLayerCode += ')'
            break
          }
          case 'Conv1D': {
            const filters = Number(params.units) || 32
            const kernelSize = Number(params.kernel_size_1d) || 3
            const activation = params.activation ? String(params.activation) : 'linear'
            wrappedLayerCode = `Conv1D(${filters}, kernel_size=${kernelSize}`
            if (activation !== 'linear') {
              wrappedLayerCode += `, activation='${activation}'`
            }
            wrappedLayerCode += ')'
            break
          }
          case 'Conv2D': {
            const filters = Number(params.units) || 32
            const kernelSize = String(params.kernel_size) || '(3,3)'
            const activation = params.activation ? String(params.activation) : 'linear'
            wrappedLayerCode = `Conv2D(${filters}, kernel_size=${kernelSize}`
            if (activation !== 'linear') {
              wrappedLayerCode += `, activation='${activation}'`
            }
            wrappedLayerCode += ')'
            break
          }
          case 'Activation': {
            const activation = params.activation ? String(params.activation) : 'relu'
            wrappedLayerCode = `Activation('${activation}')`
            break
          }
          case 'Dropout': {
            const rate = Number(params.dropout_rate) || 0.5
            wrappedLayerCode = `Dropout(${rate})`
            break
          }
          default:
            wrappedLayerCode = `Dense(32)`
        }
        
        return `TimeDistributed(${wrappedLayerCode})`
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
  },

  // SEPARABLE CONVOLUTIONAL LAYERS
  // ============================================================================
  
  SeparableConv2D: {
    metadata: {
      category: 'convolutional',
      icon: '🔳',
      description: 'Depthwise separable 2D convolution layer',
      tags: ['convolution', 'cnn', '2d', 'separable', 'efficient'],
      performance: {
        complexity: 'O(H*W*C*K² + H*W*C*F) - more efficient than standard Conv2D',
        memory: 'Lower than Conv2D due to factorized computation',
        usage: 'Efficient feature extraction with fewer parameters'
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
        key: 'depth_multiplier',
        type: 'number',
        label: 'Depth Multiplier',
        description: 'Number of depthwise convolution output channels for each input channel',
        default: 1,
        validation: { min: 1, max: 16 },
        ui: { tooltip: 'Usually 1, higher values increase model capacity' }
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
        return { isValid: false, errorMessage: 'SeparableConv2D layer requires exactly one input' }
      }
      const inputShape = inputShapes[0]
      if (inputShape.length !== 3) {
        return { isValid: false, errorMessage: 'SeparableConv2D layer requires 3D input (height, width, channels)' }
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
        const depthMultiplier = Number(params.depth_multiplier) || 1
        const activation = String(params.activation) || 'linear'
        
        let code = `SeparableConv2D(${filters}, kernel_size=${kernelSize}, strides=${strides}, padding='${padding}'`
        if (depthMultiplier !== 1) {
          code += `, depth_multiplier=${depthMultiplier}`
        }
        if (activation !== 'linear') {
          code += `, activation='${activation}'`
        }
        code += ')'
        
        return code
      }
    },
    supportsMultiplier: true,
    supportsActivation: true
  }
}

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


