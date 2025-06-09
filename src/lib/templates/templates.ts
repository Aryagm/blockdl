/**
 * Pre-built Neural Network Templates
 * 
 * Collection of common neural network architectures that can be
 * dragged onto the canvas as complete networks.
 */

import type { NetworkTemplate } from './index'

export const templates: NetworkTemplate[] = [
  // CLASSIFICATION TEMPLATES
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
  },

  {
    id: 'deep-classifier',
    name: 'Deep Classifier',
    description: 'Multi-layer dense network with batch normalization',
    icon: '🎯',
    tags: ['intermediate', 'deep', 'batch-norm'],
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
        params: { units: 256, activation: 'relu' },
        position: { x: 100, y: 200 }
      },
      {
        id: 'batch-norm-1',
        type: 'BatchNormalization',
        params: {},
        position: { x: 100, y: 300 }
      },
      {
        id: 'dropout-1',
        type: 'Dropout',
        params: { rate: 0.3 },
        position: { x: 100, y: 400 }
      },
      {
        id: 'dense-2',
        type: 'Dense',
        params: { units: 128, activation: 'relu' },
        position: { x: 100, y: 500 }
      },
      {
        id: 'batch-norm-2', 
        type: 'BatchNormalization',
        params: {},
        position: { x: 100, y: 600 }
      },
      {
        id: 'dropout-2',
        type: 'Dropout',
        params: { rate: 0.3 },
        position: { x: 100, y: 700 }
      },
      {
        id: 'dense-3',
        type: 'Dense',
        params: { units: 64, activation: 'relu' },
        position: { x: 100, y: 800 }
      },
      {
        id: 'output-1',
        type: 'Output',
        params: { outputType: 'multiclass', numClasses: 10 },
        position: { x: 100, y: 900 }
      }
    ],
    connections: [
      { source: 'input-1', target: 'dense-1' },
      { source: 'dense-1', target: 'batch-norm-1' },
      { source: 'batch-norm-1', target: 'dropout-1' },
      { source: 'dropout-1', target: 'dense-2' },
      { source: 'dense-2', target: 'batch-norm-2' },
      { source: 'batch-norm-2', target: 'dropout-2' },
      { source: 'dropout-2', target: 'dense-3' },
      { source: 'dense-3', target: 'output-1' }
    ],
    metadata: {
      inputShape: [784],
      outputClasses: 10,
      complexity: 'intermediate',
      useCase: 'Complex classification tasks, improved stability',
      performance: {
        trainTime: '10-15 minutes',
        accuracy: '~97%',
        parameters: '~300K'
      }
    }
  },

  // CNN TEMPLATES
  {
    id: 'basic-cnn',
    name: 'Basic CNN',
    description: 'Simple convolutional network for image classification',
    icon: '🖼️',
    tags: ['beginner', 'cnn', 'images'],
    category: 'cnn',
    layers: [
      {
        id: 'input-1',
        type: 'Input',
        params: { inputType: 'image_grayscale', height: 28, width: 28 },
        position: { x: 100, y: 100 }
      },
      {
        id: 'conv-1',
        type: 'Conv2D',
        params: { filters: 32, kernel_size: '(3,3)', activation: 'relu' },
        position: { x: 100, y: 200 }
      },
      {
        id: 'pool-1',
        type: 'MaxPool2D',
        params: { pool_size: '(2,2)' },
        position: { x: 100, y: 300 }
      },
      {
        id: 'conv-2',
        type: 'Conv2D',
        params: { filters: 64, kernel_size: '(3,3)', activation: 'relu' },
        position: { x: 100, y: 400 }
      },
      {
        id: 'pool-2',
        type: 'MaxPool2D',
        params: { pool_size: '(2,2)' },
        position: { x: 100, y: 500 }
      },
      {
        id: 'flatten-1',
        type: 'Flatten',
        params: {},
        position: { x: 100, y: 600 }
      },
      {
        id: 'dense-1',
        type: 'Dense',
        params: { units: 64, activation: 'relu' },
        position: { x: 100, y: 700 }
      },
      {
        id: 'output-1',
        type: 'Output',
        params: { outputType: 'multiclass', numClasses: 10 },
        position: { x: 100, y: 800 }
      }
    ],
    connections: [
      { source: 'input-1', target: 'conv-1' },
      { source: 'conv-1', target: 'pool-1' },
      { source: 'pool-1', target: 'conv-2' },
      { source: 'conv-2', target: 'pool-2' },
      { source: 'pool-2', target: 'flatten-1' },
      { source: 'flatten-1', target: 'dense-1' },
      { source: 'dense-1', target: 'output-1' }
    ],
    metadata: {
      inputShape: [28, 28, 1],
      outputClasses: 10,
      complexity: 'beginner',
      useCase: 'MNIST, CIFAR-10, basic image classification',
      performance: {
        trainTime: '5-10 minutes',
        accuracy: '~98%',
        parameters: '~100K'
      }
    }
  },

  {
    id: 'modern-cnn',
    name: 'Modern CNN',
    description: 'CNN with batch normalization and modern techniques',
    icon: '🖼️',
    tags: ['intermediate', 'cnn', 'batch-norm', 'modern'],
    category: 'cnn',
    layers: [
      {
        id: 'input-1',
        type: 'Input',
        params: { inputType: 'image_color', height: 32, width: 32 },
        position: { x: 100, y: 100 }
      },
      {
        id: 'conv-1',
        type: 'Conv2D',
        params: { filters: 32, kernel_size: '(3,3)', activation: 'relu' },
        position: { x: 100, y: 200 }
      },
      {
        id: 'batch-norm-1',
        type: 'BatchNormalization',
        params: {},
        position: { x: 100, y: 300 }
      },
      {
        id: 'conv-2',
        type: 'Conv2D',
        params: { filters: 32, kernel_size: '(3,3)', activation: 'relu' },
        position: { x: 100, y: 400 }
      },
      {
        id: 'pool-1',
        type: 'MaxPool2D',
        params: { pool_size: '(2,2)' },
        position: { x: 100, y: 500 }
      },
      {
        id: 'dropout-1',
        type: 'Dropout',
        params: { rate: 0.25 },
        position: { x: 100, y: 600 }
      },
      {
        id: 'conv-3',
        type: 'Conv2D',
        params: { filters: 64, kernel_size: '(3,3)', activation: 'relu' },
        position: { x: 100, y: 700 }
      },
      {
        id: 'batch-norm-2',
        type: 'BatchNormalization',
        params: {},
        position: { x: 100, y: 800 }
      },
      {
        id: 'conv-4',
        type: 'Conv2D',
        params: { filters: 64, kernel_size: '(3,3)', activation: 'relu' },
        position: { x: 100, y: 900 }
      },
      {
        id: 'pool-2',
        type: 'MaxPool2D',
        params: { pool_size: '(2,2)' },
        position: { x: 100, y: 1000 }
      },
      {
        id: 'dropout-2',
        type: 'Dropout',
        params: { rate: 0.25 },
        position: { x: 100, y: 1100 }
      },
      {
        id: 'flatten-1',
        type: 'Flatten',
        params: {},
        position: { x: 100, y: 1200 }
      },
      {
        id: 'dense-1',
        type: 'Dense',
        params: { units: 512, activation: 'relu' },
        position: { x: 100, y: 1300 }
      },
      {
        id: 'dropout-3',
        type: 'Dropout',
        params: { rate: 0.5 },
        position: { x: 100, y: 1400 }
      },
      {
        id: 'output-1',
        type: 'Output',
        params: { outputType: 'multiclass', numClasses: 10 },
        position: { x: 100, y: 1500 }
      }
    ],
    connections: [
      { source: 'input-1', target: 'conv-1' },
      { source: 'conv-1', target: 'batch-norm-1' },
      { source: 'batch-norm-1', target: 'conv-2' },
      { source: 'conv-2', target: 'pool-1' },
      { source: 'pool-1', target: 'dropout-1' },
      { source: 'dropout-1', target: 'conv-3' },
      { source: 'conv-3', target: 'batch-norm-2' },
      { source: 'batch-norm-2', target: 'conv-4' },
      { source: 'conv-4', target: 'pool-2' },
      { source: 'pool-2', target: 'dropout-2' },
      { source: 'dropout-2', target: 'flatten-1' },
      { source: 'flatten-1', target: 'dense-1' },
      { source: 'dense-1', target: 'dropout-3' },
      { source: 'dropout-3', target: 'output-1' }
    ],
    metadata: {
      inputShape: [32, 32, 3],
      outputClasses: 10,
      complexity: 'intermediate',
      useCase: 'CIFAR-10, general image classification',
      performance: {
        trainTime: '15-30 minutes',
        accuracy: '~85%',
        parameters: '~1.2M'
      }
    }
  },

  // RNN TEMPLATES
  {
    id: 'basic-lstm',
    name: 'Basic LSTM',
    description: 'Simple LSTM network for sequence processing',
    icon: '🔄',
    tags: ['beginner', 'lstm', 'sequence'],
    category: 'rnn',
    layers: [
      {
        id: 'input-1',
        type: 'Input',
        params: { inputType: 'sequence', seqLength: 100, features: 50 },
        position: { x: 100, y: 100 }
      },
      {
        id: 'lstm-1',
        type: 'LSTM',
        params: { units: 64, return_sequences: 'true' },
        position: { x: 100, y: 200 }
      },
      {
        id: 'dropout-1',
        type: 'Dropout',
        params: { rate: 0.2 },
        position: { x: 100, y: 300 }
      },
      {
        id: 'lstm-2',
        type: 'LSTM',
        params: { units: 32, return_sequences: 'false' },
        position: { x: 100, y: 400 }
      },
      {
        id: 'dense-1',
        type: 'Dense',
        params: { units: 32, activation: 'relu' },
        position: { x: 100, y: 500 }
      },
      {
        id: 'output-1',
        type: 'Output',
        params: { outputType: 'multiclass', numClasses: 5 },
        position: { x: 100, y: 600 }
      }
    ],
    connections: [
      { source: 'input-1', target: 'lstm-1' },
      { source: 'lstm-1', target: 'dropout-1' },
      { source: 'dropout-1', target: 'lstm-2' },
      { source: 'lstm-2', target: 'dense-1' },
      { source: 'dense-1', target: 'output-1' }
    ],
    metadata: {
      inputShape: [100, 50],
      outputClasses: 5,
      complexity: 'beginner',
      useCase: 'Text classification, sentiment analysis, time series',
      performance: {
        trainTime: '10-20 minutes',
        accuracy: '~80-90%',
        parameters: '~50K'
      }
    }
  },

  {
    id: 'bidirectional-lstm',
    name: 'Bidirectional LSTM',
    description: 'Bidirectional LSTM for improved sequence understanding',
    icon: '🔄',
    tags: ['intermediate', 'bidirectional', 'lstm'],
    category: 'rnn',
    layers: [
      {
        id: 'input-1',
        type: 'Input',
        params: { inputType: 'sequence', seqLength: 100, features: 100 },
        position: { x: 100, y: 100 }
      },
      {
        id: 'embedding-1',
        type: 'Embedding',
        params: { input_dim: 10000, output_dim: 128 },
        position: { x: 100, y: 200 }
      },
      {
        id: 'bidirectional-1',
        type: 'Bidirectional',
        params: { layer_type: 'LSTM', units: 64, return_sequences: 'true' },
        position: { x: 100, y: 300 }
      },
      {
        id: 'dropout-1',
        type: 'Dropout',
        params: { rate: 0.3 },
        position: { x: 100, y: 400 }
      },
      {
        id: 'bidirectional-2',
        type: 'Bidirectional',
        params: { layer_type: 'LSTM', units: 32, return_sequences: 'false' },
        position: { x: 100, y: 500 }
      },
      {
        id: 'dense-1',
        type: 'Dense',
        params: { units: 64, activation: 'relu' },
        position: { x: 100, y: 600 }
      },
      {
        id: 'dropout-2',
        type: 'Dropout',
        params: { rate: 0.5 },
        position: { x: 100, y: 700 }
      },
      {
        id: 'output-1',
        type: 'Output',
        params: { outputType: 'binary' },
        position: { x: 100, y: 800 }
      }
    ],
    connections: [
      { source: 'input-1', target: 'embedding-1' },
      { source: 'embedding-1', target: 'bidirectional-1' },
      { source: 'bidirectional-1', target: 'dropout-1' },
      { source: 'dropout-1', target: 'bidirectional-2' },
      { source: 'bidirectional-2', target: 'dense-1' },
      { source: 'dense-1', target: 'dropout-2' },
      { source: 'dropout-2', target: 'output-1' }
    ],
    metadata: {
      inputShape: [100, 100],
      outputClasses: 2,
      complexity: 'intermediate',
      useCase: 'NLP tasks, sentiment analysis, text classification',
      performance: {
        trainTime: '20-40 minutes',
        accuracy: '~85-92%',
        parameters: '~200K'
      }
    }
  },

  // REGRESSION TEMPLATES
  {
    id: 'simple-regressor',
    name: 'Simple Regressor',
    description: 'Basic network for regression tasks',
    icon: '📈',
    tags: ['beginner', 'regression', 'dense'],
    category: 'regression',
    layers: [
      {
        id: 'input-1',
        type: 'Input',
        params: { inputType: 'flat_data', flatSize: 10 },
        position: { x: 100, y: 100 }
      },
      {
        id: 'dense-1',
        type: 'Dense',
        params: { units: 64, activation: 'relu' },
        position: { x: 100, y: 200 }
      },
      {
        id: 'dense-2',
        type: 'Dense',
        params: { units: 32, activation: 'relu' },
        position: { x: 100, y: 300 }
      },
      {
        id: 'output-1',
        type: 'Output',
        params: { outputType: 'regression', units: 1 },
        position: { x: 100, y: 400 }
      }
    ],
    connections: [
      { source: 'input-1', target: 'dense-1' },
      { source: 'dense-1', target: 'dense-2' },
      { source: 'dense-2', target: 'output-1' }
    ],
    metadata: {
      inputShape: [10],
      complexity: 'beginner',
      useCase: 'House prices, stock prediction, continuous values',
      performance: {
        trainTime: '< 5 minutes',
        accuracy: 'MSE dependent',
        parameters: '~3K'
      }
    }
  },

  // AUTOENCODER TEMPLATES
  {
    id: 'basic-autoencoder',
    name: 'Basic Autoencoder',
    description: 'Simple autoencoder for dimensionality reduction',
    icon: '🔄',
    tags: ['intermediate', 'autoencoder', 'unsupervised'],
    category: 'autoencoder',
    layers: [
      {
        id: 'input-1',
        type: 'Input',
        params: { inputType: 'flat_data', flatSize: 784 },
        position: { x: 100, y: 100 }
      },
      {
        id: 'encoder-1',
        type: 'Dense',
        params: { units: 128, activation: 'relu' },
        position: { x: 100, y: 200 }
      },
      {
        id: 'encoder-2',
        type: 'Dense',
        params: { units: 64, activation: 'relu' },
        position: { x: 100, y: 300 }
      },
      {
        id: 'bottleneck',
        type: 'Dense',
        params: { units: 32, activation: 'relu' },
        position: { x: 100, y: 400 }
      },
      {
        id: 'decoder-1',
        type: 'Dense',
        params: { units: 64, activation: 'relu' },
        position: { x: 100, y: 500 }
      },
      {
        id: 'decoder-2',
        type: 'Dense',
        params: { units: 128, activation: 'relu' },
        position: { x: 100, y: 600 }
      },
      {
        id: 'output-1',
        type: 'Dense',
        params: { units: 784, activation: 'sigmoid' },
        position: { x: 100, y: 700 }
      }
    ],
    connections: [
      { source: 'input-1', target: 'encoder-1' },
      { source: 'encoder-1', target: 'encoder-2' },
      { source: 'encoder-2', target: 'bottleneck' },
      { source: 'bottleneck', target: 'decoder-1' },
      { source: 'decoder-1', target: 'decoder-2' },
      { source: 'decoder-2', target: 'output-1' }
    ],
    metadata: {
      inputShape: [784],
      complexity: 'intermediate',
      useCase: 'Dimensionality reduction, feature learning, denoising',
      performance: {
        trainTime: '10-15 minutes',
        accuracy: 'Reconstruction loss',
        parameters: '~160K'
      }
    }
  }
]
