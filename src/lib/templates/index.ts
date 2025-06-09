/**
 * Neural Network Templates System
 *
 * Pre-built network architectures that can be dragged onto the canvas
 * as complete networks rather than individual layers.
 *
 * Templates now use the same JSON format as the existing export/import system.
 */

import type { Node, Edge } from "@xyflow/react";

export interface NetworkTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  tags: string[];
  category:
    | "classification"
    | "regression"
    | "cnn"
    | "rnn"
    | "autoencoder"
    | "gan"
    | "transformer";
  // Use the same structure as exported projects
  network: {
    nodes: Node[];
    edges: Edge[];
  };
  metadata: {
    inputShape?: number[];
    outputClasses?: number;
    useCase: string;
    performance: {
      trainTime: string;
      parameters: string;
    };
    version: string;
    createdAt: string;
  };
}

export interface TemplateCategory {
  name: string;
  color: string;
  description: string;
  icon: string;
}

// Template categories
export const templateCategories: Record<string, TemplateCategory> = {
  classification: {
    name: "Classification",
    color: "green",
    description: "Networks for classification tasks",
    icon: "🎯",
  },
  regression: {
    name: "Regression",
    color: "blue",
    description: "Networks for regression tasks",
    icon: "📈",
  },
  cnn: {
    name: "CNN",
    color: "purple",
    description: "Convolutional neural networks for images",
    icon: "🖼️",
  },
  rnn: {
    name: "RNN",
    color: "cyan",
    description: "Recurrent networks for sequences",
    icon: "🔄",
  },
  autoencoder: {
    name: "Autoencoder",
    color: "orange",
    description: "Networks for dimensionality reduction",
    icon: "🔄",
  },
  gan: {
    name: "GAN",
    color: "red",
    description: "Generative adversarial networks",
    icon: "🎨",
  },
  transformer: {
    name: "Transformer",
    color: "indigo",
    description: "Attention-based architectures",
    icon: "🤖",
  },
};

// Template data - now uses existing JSON format
export const templates: NetworkTemplate[] = [
  {
    id: "simple-classifier",
    name: "Simple Classifier",
    description: "Basic dense network for classification tasks",
    icon: "🎯",
    tags: ["dense", "classification"],
    category: "classification",
    network: {
      nodes: [
        {
          id: "input-1749491752697",
          type: "layerNode",
          position: {
            x: -187.44190332092185,
            y: 1227.583828427421,
          },
          data: {
            type: "Input",
            params: {
              inputType: "flat_data",
              height: 28,
              width: 28,
              channels: 1,
              flatSize: 784,
              seqLength: 100,
              features: 128,
            },
            hasShapeError: false,
          },
          measured: {
            width: 177,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "dense-1749491760981",
          type: "layerNode",
          position: {
            x: -156.89092681355828,
            y: 1379.8617623680034,
          },
          data: {
            type: "Dense",
            params: {
              units: 64,
              activation: "relu",
              multiplier: 2,
            },
            hasShapeError: false,
          },
          measured: {
            width: 160,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "dropout-1749491778062",
          type: "layerNode",
          position: {
            x: -262.1517344301547,
            y: 1513.9611474138044,
          },
          data: {
            type: "Dropout",
            params: {
              rate: 0.3,
            },
            hasShapeError: false,
          },
          measured: {
            width: 160,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "dense-1749491793608",
          type: "layerNode",
          position: {
            x: -223.21965490072859,
            y: 1656.7121056883668,
          },
          data: {
            type: "Dense",
            params: {
              units: 32,
              activation: "relu",
              multiplier: 1,
            },
            hasShapeError: false,
          },
          measured: {
            width: 160,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "output-1749491816961",
          type: "layerNode",
          position: {
            x: -205.91650844320594,
            y: 1800.904992834389,
          },
          data: {
            type: "Output",
            params: {
              outputType: "multiclass",
              numClasses: 10,
              units: 1,
            },
            hasShapeError: false,
          },
          measured: {
            width: 165,
            height: 79,
          },
          selected: true,
          dragging: false,
        },
      ],
      edges: [
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "input-1749491752697",
          target: "dense-1749491760981",
          id: "xy-edge__input-1749491752697-dense-1749491760981",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "dense-1749491760981",
          target: "dropout-1749491778062",
          id: "xy-edge__dense-1749491760981-dropout-1749491778062",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "dropout-1749491778062",
          target: "dense-1749491793608",
          id: "xy-edge__dropout-1749491778062-dense-1749491793608",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "dense-1749491793608",
          target: "output-1749491816961",
          id: "xy-edge__dense-1749491793608-output-1749491816961",
        },
      ],
    },
    metadata: {
      inputShape: [784],
      outputClasses: 10,
      useCase: "MNIST digit classification, simple tabular data",
      performance: {
        trainTime: "< 5 minutes",
        parameters: "~110K",
      },
      version: "1.0.0",
      createdAt: "2024-01-01T00:00:00Z",
    },
  },

  // 🟩 Image Classifier (LeNet-style CNN)
  {
    id: "image-classifier-lenet",
    name: "Image Classifier (LeNet)",
    description:
      'Classic CNN for image classification - the "Hello World" of computer vision',
    icon: "🖼️",
    tags: ["cnn", "vision", "beginner", "classic"],
    category: "cnn",
    network: {
      nodes: [
        {
          id: "input-1749490665346",
          type: "layerNode",
          position: {
            x: -169.1447096876748,
            y: 715.3392189301302,
          },
          data: {
            type: "Input",
            params: {
              inputType: "image_grayscale",
              height: 28,
              width: 28,
              channels: 1,
              flatSize: 784,
              seqLength: 100,
              features: 128,
            },
            hasShapeError: false,
          },
          measured: {
            width: 185,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "conv2d-1749490673004",
          type: "layerNode",
          position: {
            x: -245.5577585473244,
            y: 876.7752376476997,
          },
          data: {
            type: "Conv2D",
            params: {
              filters: 32,
              kernel_size: "(5,5)",
              strides: "(1,1)",
              padding: "same",
              activation: "relu",
              multiplier: 1,
            },
            hasShapeError: false,
          },
          measured: {
            width: 245,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "maxpool2d-1749490699760",
          type: "layerNode",
          position: {
            x: -214.3467949285943,
            y: 1019.9151742439448,
          },
          data: {
            type: "MaxPool2D",
            params: {
              pool_size: "(2,2)",
              strides: "",
              padding: "valid",
            },
            hasShapeError: false,
          },
          measured: {
            width: 160,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "conv2d-1749490713302",
          type: "layerNode",
          position: {
            x: -179.90711093551278,
            y: 1166.2838312145411,
          },
          data: {
            type: "Conv2D",
            params: {
              filters: 64,
              kernel_size: "(5,5)",
              strides: "(1,1)",
              padding: "same",
              activation: "relu",
              multiplier: 1,
            },
            hasShapeError: false,
          },
          measured: {
            width: 245,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "maxpool2d-1749490736358",
          type: "layerNode",
          position: {
            x: -236.85579173017874,
            y: 1311.4851362544919,
          },
          data: {
            type: "MaxPool2D",
            params: {
              pool_size: "(2,2)",
              strides: "",
              padding: "valid",
            },
            hasShapeError: false,
          },
          measured: {
            width: 160,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "flatten-1749490748050",
          type: "layerNode",
          position: {
            x: -266.07381377839147,
            y: 1452.509288555456,
          },
          data: {
            type: "Flatten",
            params: {},
            hasShapeError: false,
          },
          measured: {
            width: 160,
            height: 51,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "dense-1749490758953",
          type: "layerNode",
          position: {
            x: -245.67462723307602,
            y: 1573.3352396315556,
          },
          data: {
            type: "Dense",
            params: {
              units: 120,
              activation: "relu",
              multiplier: 1,
            },
            hasShapeError: false,
          },
          measured: {
            width: 160,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "dense-1749490772252",
          type: "layerNode",
          position: {
            x: -262.93547738680456,
            y: 1725.5445546235248,
          },
          data: {
            type: "Dense",
            params: {
              units: 84,
              activation: "relu",
              multiplier: 1,
            },
            hasShapeError: false,
          },
          measured: {
            width: 160,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "output-1749490789053",
          type: "layerNode",
          position: {
            x: -230.00171144018893,
            y: 1899.0501536799916,
          },
          data: {
            type: "Output",
            params: {
              outputType: "multiclass",
              numClasses: 10,
              units: 1,
            },
            hasShapeError: false,
          },
          measured: {
            width: 165,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
      ],
      edges: [
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "input-1749490665346",
          target: "conv2d-1749490673004",
          id: "xy-edge__input-1749490665346-conv2d-1749490673004",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "conv2d-1749490673004",
          target: "maxpool2d-1749490699760",
          id: "xy-edge__conv2d-1749490673004-maxpool2d-1749490699760",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "maxpool2d-1749490699760",
          target: "conv2d-1749490713302",
          id: "xy-edge__maxpool2d-1749490699760-conv2d-1749490713302",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "conv2d-1749490713302",
          target: "maxpool2d-1749490736358",
          id: "xy-edge__conv2d-1749490713302-maxpool2d-1749490736358",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "maxpool2d-1749490736358",
          target: "flatten-1749490748050",
          id: "xy-edge__maxpool2d-1749490736358-flatten-1749490748050",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "flatten-1749490748050",
          target: "dense-1749490758953",
          id: "xy-edge__flatten-1749490748050-dense-1749490758953",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "dense-1749490758953",
          target: "dense-1749490772252",
          id: "xy-edge__dense-1749490758953-dense-1749490772252",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "dense-1749490772252",
          target: "output-1749490789053",
          id: "xy-edge__dense-1749490772252-output-1749490789053",
        },
      ],
    },
    metadata: {
      inputShape: [32, 32, 1],
      outputClasses: 10,
      useCase: "CIFAR-10, MNIST, basic image classification",
      performance: {
        trainTime: "10-15 minutes",
        parameters: "~60K",
      },
      version: "1.0.0",
      createdAt: "2024-01-01T00:00:00Z",
    },
  },

  // 🟦 Text Classifier (Embedding + LSTM)
  {
    id: "text-classifier-lstm",
    name: "Text Classifier (LSTM)",
    description:
      "Sequence modeling for text classification with embeddings and LSTM",
    icon: "📝",
    tags: ["nlp", "lstm", "embedding", "sequence"],
    category: "rnn",
    network: {
      nodes: [
        {
          id: "input-1749494278363",
          type: "layerNode",
          position: {
            x: 41,
            y: 32.400001525878906,
          },
          data: {
            type: "Input",
            params: {
              inputType: "sequence_indices",
              height: 28,
              width: 28,
              channels: 1,
              flatSize: 784,
              seqLength: 100,
              features: 128,
              seqIndicesLength: 784,
            },
            hasShapeError: false,
          },
          measured: {
            width: 192,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "embedding-1749494294126",
          type: "layerNode",
          position: {
            x: 24.454408405586577,
            y: 222.754830309758,
          },
          data: {
            type: "Embedding",
            params: {
              input_dim: 10000,
              output_dim: 128,
              input_length: 100,
              mask_zero: "false",
            },
            hasShapeError: false,
          },
          measured: {
            width: 160,
            height: 51,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "lstm-1749494303764",
          type: "layerNode",
          position: {
            x: 60.00941934712807,
            y: 338.00210715475464,
          },
          data: {
            type: "LSTM",
            params: {
              units: 128,
              activation: "tanh",
              recurrent_activation: "sigmoid",
              return_sequences: "true",
              return_state: "false",
              dropout: 0,
              recurrent_dropout: 0,
            },
            hasShapeError: false,
          },
          measured: {
            width: 210,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "lstm-1749494329751",
          type: "layerNode",
          position: {
            x: 93.48156359142294,
            y: 483.65876203531934,
          },
          data: {
            type: "LSTM",
            params: {
              units: 64,
              activation: "tanh",
              recurrent_activation: "sigmoid",
              return_sequences: "false",
              return_state: "false",
              dropout: 0.5,
              recurrent_dropout: 0,
            },
            hasShapeError: false,
          },
          measured: {
            width: 204,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "dense-1749494364771",
          type: "layerNode",
          position: {
            x: 23.84835379977841,
            y: 630.0737947075415,
          },
          data: {
            type: "Dense",
            params: {
              units: 64,
              activation: "relu",
              multiplier: 1,
            },
            hasShapeError: false,
          },
          measured: {
            width: 160,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "output-1749494382226",
          type: "layerNode",
          position: {
            x: 76.46335263902662,
            y: 777.1259709505688,
          },
          data: {
            type: "Output",
            params: {
              outputType: "binary",
              numClasses: 1,
              units: 1,
            },
            hasShapeError: false,
          },
          measured: {
            width: 160,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
      ],
      edges: [
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "input-1749494278363",
          target: "embedding-1749494294126",
          id: "xy-edge__input-1749494278363-embedding-1749494294126",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "embedding-1749494294126",
          target: "lstm-1749494303764",
          id: "xy-edge__embedding-1749494294126-lstm-1749494303764",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "lstm-1749494303764",
          target: "lstm-1749494329751",
          id: "xy-edge__lstm-1749494303764-lstm-1749494329751",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "lstm-1749494329751",
          target: "dense-1749494364771",
          id: "xy-edge__lstm-1749494329751-dense-1749494364771",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "dense-1749494364771",
          target: "output-1749494382226",
          id: "xy-edge__dense-1749494364771-output-1749494382226",
        },
      ],
    },
    metadata: {
      inputShape: [100],
      outputClasses: 1,
      useCase:
        "Sentiment analysis, text classification, document categorization",
      performance: {
        trainTime: "15-30 minutes",
        parameters: "~1.3M",
      },
      version: "1.0.0",
      createdAt: "2024-01-01T00:00:00Z",
    },
  },

  // 🟨 Tabular MLP
  {
    id: "tabular-mlp",
    name: "Tabular MLP",
    description: "Multi-layer perceptron for structured tabular data",
    icon: "📊",
    tags: ["tabular", "mlp", "dense", "structured"],
    category: "regression",
    network: {
      nodes: [
        {
          id: "input-1749496606010",
          type: "layerNode",
          position: {
            x: 36.8746795826206,
            y: 89.55177701251623,
          },
          data: {
            type: "Input",
            params: {
              inputType: "flat_data",
              height: 28,
              width: 28,
              channels: 1,
              flatSize: 784,
              seqLength: 100,
              features: 128,
              seqIndicesLength: 784,
            },
            hasShapeError: false,
          },
          measured: {
            width: 177,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "dense-1749496622300",
          type: "layerNode",
          position: {
            x: 85.46525643070625,
            y: 242.26501853507114,
          },
          data: {
            type: "Dense",
            params: {
              units: 64,
              use_bias: "false",
              activation: "linear",
              multiplier: 1,
            },
            hasShapeError: false,
          },
          measured: {
            width: 160,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "batchnormalization-1749496635304",
          type: "layerNode",
          position: {
            x: -7.088223279933061,
            y: 388.03674907932805,
          },
          data: {
            type: "BatchNormalization",
            params: {
              axis: -1,
              momentum: 0.99,
              epsilon: 0.001,
              center: true,
              scale: true,
            },
            hasShapeError: false,
          },
          measured: {
            width: 191,
            height: 51,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "activation-1749496650926",
          type: "layerNode",
          position: {
            x: 101.36049673613675,
            y: 506.2089730796703,
          },
          data: {
            type: "Activation",
            params: {
              activation_function: "relu",
            },
            hasShapeError: false,
          },
          measured: {
            width: 160,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "dropout-1749496663374",
          type: "layerNode",
          position: {
            x: -34.854267193124855,
            y: 652.971084751033,
          },
          data: {
            type: "Dropout",
            params: {
              rate: 0.3,
            },
            hasShapeError: false,
          },
          measured: {
            width: 160,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "dense-1749496681536",
          type: "layerNode",
          position: {
            x: -18.42433734633861,
            y: 803.7101856858802,
          },
          data: {
            type: "Dense",
            params: {
              units: 64,
              use_bias: "false",
              activation: "linear",
              multiplier: 1,
            },
            hasShapeError: false,
          },
          measured: {
            width: 160,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "batchnormalization-1749496704167",
          type: "layerNode",
          position: {
            x: -9.825064056588644,
            y: 959.4022915634584,
          },
          data: {
            type: "BatchNormalization",
            params: {
              axis: -1,
              momentum: 0.99,
              epsilon: 0.001,
              center: true,
              scale: true,
            },
            hasShapeError: false,
          },
          measured: {
            width: 191,
            height: 51,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "merge-1749496716267",
          type: "layerNode",
          position: {
            x: 165.78114838672604,
            y: 1069.8350643370893,
          },
          data: {
            type: "Merge",
            params: {
              mode: "add",
              axis: -1,
            },
            hasShapeError: false,
          },
          measured: {
            width: 160,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "activation-1749496740122",
          type: "layerNode",
          position: {
            x: 117.6379764879662,
            y: 1206.877250509152,
          },
          data: {
            type: "Activation",
            params: {
              activation_function: "relu",
            },
            hasShapeError: false,
          },
          measured: {
            width: 160,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "output-1749496762503",
          type: "layerNode",
          position: {
            x: 147.7749542605917,
            y: 1350.4710857787202,
          },
          data: {
            type: "Output",
            params: {
              outputType: "binary",
              numClasses: 10,
              units: 1,
            },
            hasShapeError: false,
          },
          measured: {
            width: 160,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
      ],
      edges: [
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "input-1749496606010",
          target: "dense-1749496622300",
          id: "xy-edge__input-1749496606010-dense-1749496622300",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "dense-1749496622300",
          target: "batchnormalization-1749496635304",
          id: "xy-edge__dense-1749496622300-batchnormalization-1749496635304",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "batchnormalization-1749496635304",
          target: "activation-1749496650926",
          id: "xy-edge__batchnormalization-1749496635304-activation-1749496650926",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "activation-1749496650926",
          target: "dropout-1749496663374",
          id: "xy-edge__activation-1749496650926-dropout-1749496663374",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "dropout-1749496663374",
          target: "dense-1749496681536",
          id: "xy-edge__dropout-1749496663374-dense-1749496681536",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "dense-1749496681536",
          target: "batchnormalization-1749496704167",
          id: "xy-edge__dense-1749496681536-batchnormalization-1749496704167",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "batchnormalization-1749496704167",
          target: "merge-1749496716267",
          id: "xy-edge__batchnormalization-1749496704167-merge-1749496716267",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "activation-1749496650926",
          target: "merge-1749496716267",
          id: "xy-edge__activation-1749496650926-merge-1749496716267",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "merge-1749496716267",
          target: "activation-1749496740122",
          id: "xy-edge__merge-1749496716267-activation-1749496740122",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "activation-1749496740122",
          target: "output-1749496762503",
          id: "xy-edge__activation-1749496740122-output-1749496762503",
        },
      ],
    },
    metadata: {
      inputShape: [20],
      outputClasses: 1,
      useCase: "House prices, sales prediction, feature-based regression",
      performance: {
        trainTime: "5-10 minutes",
        parameters: "~2K",
      },
      version: "1.0.0",
      createdAt: "2024-01-01T00:00:00Z",
    },
  },

  // 🟥 Autoencoder (Dense Bottleneck)
  {
    id: "dense-autoencoder",
    name: "Dense Autoencoder",
    description:
      "Symmetrical encoder-decoder for dimensionality reduction and reconstruction",
    icon: "🔄",
    tags: ["autoencoder", "unsupervised", "reconstruction", "bottleneck"],
    category: "autoencoder",
    network: {
      nodes: [
        {
          id: "input-1749497047226",
          type: "layerNode",
          position: {
            x: 119,
            y: 13.400001525878906,
          },
          data: {
            type: "Input",
            params: {
              inputType: "flat_data",
              height: 28,
              width: 28,
              channels: 1,
              flatSize: 784,
              seqLength: 100,
              features: 128,
              seqIndicesLength: 784,
            },
            hasShapeError: false,
          },
          measured: {
            width: 177,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "dense-1749497058616",
          type: "layerNode",
          position: {
            x: 118.02286900373502,
            y: 160.27835099723472,
          },
          data: {
            type: "Dense",
            params: {
              units: 128,
              use_bias: "true",
              activation: "relu",
              multiplier: 1,
            },
            hasShapeError: false,
          },
          measured: {
            width: 207,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "dense-1749497097561",
          type: "layerNode",
          position: {
            x: 74.07781365413283,
            y: 305.6621944951724,
          },
          data: {
            type: "Dense",
            params: {
              units: 64,
              use_bias: "true",
              activation: "relu",
              multiplier: 1,
            },
            hasShapeError: false,
          },
          measured: {
            width: 200,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "dense-1749497112718",
          type: "layerNode",
          position: {
            x: 155.5046033214638,
            y: 457.41212069338025,
          },
          data: {
            type: "Dense",
            params: {
              units: 32,
              use_bias: "true",
              activation: "relu",
              multiplier: 1,
            },
            hasShapeError: false,
          },
          measured: {
            width: 200,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "dense-1749497126960",
          type: "layerNode",
          position: {
            x: 103.10352381094552,
            y: 600.147684862411,
          },
          data: {
            type: "Dense",
            params: {
              units: 64,
              use_bias: "true",
              activation: "relu",
              multiplier: 1,
            },
            hasShapeError: false,
          },
          measured: {
            width: 200,
            height: 79,
          },
          selected: true,
          dragging: false,
        },
        {
          id: "dense-1749497135204",
          type: "layerNode",
          position: {
            x: 164.84291526913864,
            y: 744.6441329560546,
          },
          data: {
            type: "Dense",
            params: {
              units: 128,
              use_bias: "true",
              activation: "relu",
              multiplier: 1,
            },
            hasShapeError: false,
          },
          measured: {
            width: 207,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "output-1749497151789",
          type: "layerNode",
          position: {
            x: 76.83144233937398,
            y: 890.4541851232766,
          },
          data: {
            type: "Output",
            params: {
              outputType: "multilabel",
              numClasses: 10,
              units: 784,
            },
            hasShapeError: false,
          },
          measured: {
            width: 167,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
      ],
      edges: [
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "input-1749497047226",
          target: "dense-1749497058616",
          id: "xy-edge__input-1749497047226-dense-1749497058616",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "dense-1749497058616",
          target: "dense-1749497097561",
          id: "xy-edge__dense-1749497058616-dense-1749497097561",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "dense-1749497097561",
          target: "dense-1749497112718",
          id: "xy-edge__dense-1749497097561-dense-1749497112718",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "dense-1749497112718",
          target: "dense-1749497126960",
          id: "xy-edge__dense-1749497112718-dense-1749497126960",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "dense-1749497126960",
          target: "dense-1749497135204",
          id: "xy-edge__dense-1749497126960-dense-1749497135204",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "dense-1749497135204",
          target: "output-1749497151789",
          id: "xy-edge__dense-1749497135204-output-1749497151789",
        },
      ],
    },
    metadata: {
      inputShape: [784],
      outputClasses: 784,
      useCase: "Dimensionality reduction, feature learning, anomaly detection",
      performance: {
        trainTime: "10-20 minutes",
        parameters: "~1.2M",
      },
      version: "1.0.0",
      createdAt: "2024-01-01T00:00:00Z",
    },
  },

  // 🟪 ResNet Block Mini (with Skip Connection)
  {
    id: "resnet-mini",
    name: "ResNet Mini Block",
    description:
      "Residual network with skip connections demonstrating functional architecture",
    icon: "🔗",
    tags: ["resnet", "skip-connection", "residual", "functional"],
    category: "cnn",
    network: {
      nodes: [
        {
          id: "input-1749497358409",
          type: "layerNode",
          position: {
            x: 132.5,
            y: -76.5999984741211,
          },
          data: {
            type: "Input",
            params: {
              inputType: "image_color",
              height: 32,
              width: 32,
              channels: 1,
              flatSize: 784,
              seqLength: 100,
              features: 128,
              seqIndicesLength: 784,
            },
            hasShapeError: false,
          },
          measured: {
            width: 164,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "conv2d-1749497385185",
          type: "layerNode",
          position: {
            x: -115.27979923055543,
            y: 77.42881056647647,
          },
          data: {
            type: "Conv2D",
            params: {
              filters: 64,
              kernel_size: "(3,3)",
              strides: "(1,1)",
              padding: "same",
              use_bias: "false",
              activation: "linear",
              multiplier: 1,
            },
            hasShapeError: false,
          },
          measured: {
            width: 244,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "batchnormalization-1749497403374",
          type: "layerNode",
          position: {
            x: -68.33930042049872,
            y: 240.7336475710342,
          },
          data: {
            type: "BatchNormalization",
            params: {
              axis: -1,
              momentum: 0.99,
              epsilon: 0.001,
              center: true,
              scale: true,
            },
            hasShapeError: false,
          },
          measured: {
            width: 191,
            height: 51,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "activation-1749497413546",
          type: "layerNode",
          position: {
            x: -22.452455644793645,
            y: 374.95969189928627,
          },
          data: {
            type: "Activation",
            params: {
              activation_function: "relu",
            },
            hasShapeError: false,
          },
          measured: {
            width: 160,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "conv2d-1749497432150",
          type: "layerNode",
          position: {
            x: -41.44011023133706,
            y: 525.3884967609598,
          },
          data: {
            type: "Conv2D",
            params: {
              filters: 64,
              kernel_size: "(3,3)",
              strides: "(1,1)",
              padding: "same",
              use_bias: "false",
              activation: "linear",
              multiplier: 1,
            },
            hasShapeError: false,
          },
          measured: {
            width: 244,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "batchnormalization-1749497451718",
          type: "layerNode",
          position: {
            x: -16.014577503335744,
            y: 682.9785601481476,
          },
          data: {
            type: "BatchNormalization",
            params: {
              axis: -1,
              momentum: 0.99,
              epsilon: 0.001,
              center: true,
              scale: true,
            },
            hasShapeError: false,
          },
          measured: {
            width: 191,
            height: 51,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "globalaveragepooling2d-1749497552831",
          type: "layerNode",
          position: {
            x: 157.06784202845648,
            y: 990.0045569269213,
          },
          data: {
            type: "GlobalAveragePooling2D",
            params: {},
            hasShapeError: false,
          },
          measured: {
            width: 224,
            height: 51,
          },
          selected: true,
          dragging: false,
        },
        {
          id: "output-1749497579148",
          type: "layerNode",
          position: {
            x: 162.97997998538725,
            y: 1176.4291216411696,
          },
          data: {
            type: "Output",
            params: {
              outputType: "multiclass",
              numClasses: 10,
              units: 1,
            },
            hasShapeError: false,
          },
          measured: {
            width: 165,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "merge-1749497649316",
          type: "layerNode",
          position: {
            x: 190.30946264689692,
            y: 842.6569856405731,
          },
          data: {
            type: "Merge",
            params: {
              mode: "concat",
              axis: -1,
            },
            hasShapeError: false,
          },
          measured: {
            width: 160,
            height: 79,
          },
          selected: false,
          dragging: false,
        },
      ],
      edges: [
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "input-1749497358409",
          target: "conv2d-1749497385185",
          id: "xy-edge__input-1749497358409-conv2d-1749497385185",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "conv2d-1749497385185",
          target: "batchnormalization-1749497403374",
          id: "xy-edge__conv2d-1749497385185-batchnormalization-1749497403374",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "batchnormalization-1749497403374",
          target: "activation-1749497413546",
          id: "xy-edge__batchnormalization-1749497403374-activation-1749497413546",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "activation-1749497413546",
          target: "conv2d-1749497432150",
          id: "xy-edge__activation-1749497413546-conv2d-1749497432150",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "conv2d-1749497432150",
          target: "batchnormalization-1749497451718",
          id: "xy-edge__conv2d-1749497432150-batchnormalization-1749497451718",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "globalaveragepooling2d-1749497552831",
          target: "output-1749497579148",
          id: "xy-edge__globalaveragepooling2d-1749497552831-output-1749497579148",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "input-1749497358409",
          target: "merge-1749497649316",
          id: "xy-edge__input-1749497358409-merge-1749497649316",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "batchnormalization-1749497451718",
          target: "merge-1749497649316",
          id: "xy-edge__batchnormalization-1749497451718-merge-1749497649316",
        },
        {
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
          source: "merge-1749497649316",
          target: "globalaveragepooling2d-1749497552831",
          id: "xy-edge__merge-1749497649316-globalaveragepooling2d-1749497552831",
        },
      ],
    },
    metadata: {
      inputShape: [32, 32, 3],
      outputClasses: 10,
      useCase:
        "CIFAR-10, demonstrating residual connections and functional API",
      performance: {
        trainTime: "20-30 minutes",
        parameters: "~50K",
      },
      version: "1.0.0",
      createdAt: "2024-01-01T00:00:00Z",
    },
  },
];

// Utility functions
export function getTemplatesByCategory(category: string): NetworkTemplate[] {
  return templates.filter(
    (template: NetworkTemplate) => template.category === category
  );
}

export function getAllTemplates(): NetworkTemplate[] {
  return templates;
}

export function getTemplateById(id: string): NetworkTemplate | undefined {
  return templates.find((template: NetworkTemplate) => template.id === id);
}

export function getTemplateCategoryColors(category: string): {
  bg: string;
  border: string;
  text: string;
  hover: string;
} {
  const categoryColorMap: Record<
    string,
    { bg: string; border: string; text: string; hover: string }
  > = {
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-700",
      hover: "hover:border-green-300 hover:shadow-green-200/50",
    },
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      hover: "hover:border-blue-300 hover:shadow-blue-200/50",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-700",
      hover: "hover:border-purple-300 hover:shadow-purple-200/50",
    },
    cyan: {
      bg: "bg-cyan-50",
      border: "border-cyan-200",
      text: "text-cyan-700",
      hover: "hover:border-cyan-300 hover:shadow-cyan-200/50",
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-700",
      hover: "hover:border-orange-300 hover:shadow-orange-200/50",
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      hover: "hover:border-red-300 hover:shadow-red-200/50",
    },
    indigo: {
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      text: "text-indigo-700",
      hover: "hover:border-indigo-300 hover:shadow-indigo-200/50",
    },
  };

  const categoryInfo = templateCategories[category];
  if (!categoryInfo?.color) {
    return categoryColorMap.blue; // fallback
  }

  return categoryColorMap[categoryInfo.color] || categoryColorMap.blue;
}
