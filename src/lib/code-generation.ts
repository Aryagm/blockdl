/**
 * Code generation utilities for both Keras and PyTorch frameworks
 */

import type { DAGResult, LayerObject } from "./dag-parser";
import {
  generateLayerCode,
  getUsedKerasImports,
  getMergeLayerImports,
  getLayerDefinition,
  layerDefinitions,
} from "./layer-definitions";

/**
 * Calculate output shape for Conv2D layer
 */
function calculateConv2DShape(
  inputShape: number[],
  filters: number,
  kernelSize: string,
  strides: string,
  padding: string
): number[] {
  if (inputShape.length !== 3) return inputShape; // Invalid input shape
  
  const [, height, width] = inputShape; // First element is channels (not needed for calculation)
  
  // Parse kernel size
  const kernelMatch = kernelSize.match(/\((\d+),(\d+)\)/);
  const kernelH = kernelMatch ? Number(kernelMatch[1]) : 3;
  const kernelW = kernelMatch ? Number(kernelMatch[2]) : 3;
  
  // Parse strides
  const strideMatch = strides.match(/\((\d+),(\d+)\)/);
  const strideH = strideMatch ? Number(strideMatch[1]) : 1;
  const strideW = strideMatch ? Number(strideMatch[2]) : 1;
  
  let outHeight: number;
  let outWidth: number;
  
  if (padding === "same") {
    outHeight = Math.ceil(height / strideH);
    outWidth = Math.ceil(width / strideW);
  } else { // valid padding
    outHeight = Math.floor((height - kernelH) / strideH) + 1;
    outWidth = Math.floor((width - kernelW) / strideW) + 1;
  }
  
  return [filters, outHeight, outWidth];
}

/**
 * Calculate output shape for pooling layers
 */
function calculatePoolingShape(
  inputShape: number[],
  poolSize: string,
  strides: string,
  padding: string
): number[] {
  if (inputShape.length !== 3) return inputShape; // Invalid input shape
  
  const [channels, height, width] = inputShape;
  
  // Parse pool size
  const poolMatch = poolSize.match(/\((\d+),(\d+)\)/);
  const poolH = poolMatch ? Number(poolMatch[1]) : 2;
  const poolW = poolMatch ? Number(poolMatch[2]) : 2;
  
  // Parse strides (defaults to pool size if empty)
  let strideH = poolH;
  let strideW = poolW;
  
  if (strides && strides.trim() !== "") {
    const strideMatch = strides.match(/\((\d+),(\d+)\)/);
    if (strideMatch) {
      strideH = Number(strideMatch[1]);
      strideW = Number(strideMatch[2]);
    }
  }
  
  let outHeight: number;
  let outWidth: number;
  
  if (padding === "same") {
    outHeight = Math.ceil(height / strideH);
    outWidth = Math.ceil(width / strideW);
  } else { // valid padding
    outHeight = Math.floor((height - poolH) / strideH) + 1;
    outWidth = Math.floor((width - poolW) / strideW) + 1;
  }
  
  return [channels, outHeight, outWidth];
}

/**
 * Common compilation and summary code for both Sequential and Functional API
 */
const COMPILATION_TEMPLATE = [
  "",
  "# Compile the model",
  "model.compile(",
  "    optimizer='adam',",
  "    loss='categorical_crossentropy',",
  "    metrics=['accuracy']",
  ")",
  "",
  "# Display model summary",
  "model.summary()",
] as const;

/**
 * Helper function to format layer code for Sequential API
 */
function formatSequentialLayer(
  layerCode: string,
  isLastLayer: boolean
): string[] {
  const lines = layerCode.split("\n");

  if (lines.length === 1) {
    // Single line - add indentation and comma if needed
    const needsComma = !isLastLayer && !layerCode.trim().endsWith(",");
    return [`    ${layerCode}${needsComma ? "," : ""}`];
  }

  // Multi-line - handle each line appropriately
  return lines.map((line, index) => {
    if (index === 0) {
      return `    ${line}`; // Comment line with indentation
    }

    const trimmed = line.trim();
    if (index === lines.length - 1 && !isLastLayer && !trimmed.endsWith(",")) {
      return `${line},`; // Add comma to last line if needed
    }
    return line;
  });
}

/**
 * Generates Keras Sequential model code from ordered layers
 */
export function generateKerasCode(layers: LayerObject[]): string {
  if (layers.length === 0) {
    return "# No layers to generate code for";
  }

  // Generate imports
  const usedLayerTypes = layers.map((layer) => layer.type);
  const kerasImports = getUsedKerasImports(usedLayerTypes);
  const mergeImports = getMergeLayerImports(layers);

  // Combine and deduplicate imports
  const allImports = [...new Set([...kerasImports, ...mergeImports])];

  const imports = [
    "import tensorflow as tf",
    "from tensorflow.keras.models import Sequential",
    `from tensorflow.keras.layers import ${allImports.join(", ")}`,
  ];

  // Generate model creation
  const modelLines: string[] = [
    "",
    "# Create the model",
    "model = Sequential([",
  ];

  // Process each layer
  layers.forEach((layer, index) => {
    const layerCode = generateLayerCode(layer.type, layer.params);
    if (!layerCode) return;

    const isLastLayer = index === layers.length - 1;
    const formattedLines = formatSequentialLayer(layerCode, isLastLayer);
    modelLines.push(...formattedLines);
  });

  modelLines.push("])");

  return [...imports, ...modelLines, ...COMPILATION_TEMPLATE].join("\n");
}

/**
 * Processes a layer for Functional API code generation
 */
function processLayer(
  layer: LayerObject,
  inputNodes: string[],
  codeLines: string[],
  layerVariables: Map<string, string>
): void {
  const { id, varName } = layer;
  const layerCode = generateLayerCode(layer.type, layer.params);

  if (!layerCode) {
    codeLines.push(`# Error: Could not generate code for ${layer.type}`);
    return;
  }

  // Handle multiplier layers (multi-line code with special syntax)
  if (layerCode.includes("\n")) {
    processMultiplierLayer(
      layer,
      layerCode,
      inputNodes,
      codeLines,
      layerVariables
    );
    return;
  }

  // Handle single layers
  if (inputNodes.length === 0) {
    codeLines.push(`# Warning: ${varName} has no inputs`);
    codeLines.push(`${varName} = ${layerCode}`);
  } else if (inputNodes.length === 1) {
    codeLines.push(`${varName} = ${layerCode}(${inputNodes[0]})`);
  } else {
    // Multiple inputs
    codeLines.push(`${varName} = ${layerCode}([${inputNodes.join(", ")}])`);
  }

  layerVariables.set(id, varName);
}

/**
 * Processes multiplier layers with better readability for Functional API
 */
function processMultiplierLayer(
  layer: LayerObject,
  layerCode: string,
  inputNodes: string[],
  codeLines: string[],
  layerVariables: Map<string, string>
): void {
  const { id, varName } = layer;
  const lines = layerCode.split("\n");

  if (lines[0].trim().startsWith("#") && inputNodes.length === 1) {
    // High multiplier case - use loop for better readability
    const spreadLine = lines[1];
    const match = spreadLine.match(/\*\[(.+?) for _ in range\((\d+)\)\]/);

    codeLines.push(lines[0]); // Add comment

    if (match) {
      const [, layerConstructor, count] = match;
      codeLines.push(`${varName} = ${inputNodes[0]}`);
      codeLines.push(`for _ in range(${count}):`);
      codeLines.push(`    ${varName} = ${layerConstructor}(${varName})`);
    } else {
      // Fallback for complex cases
      const inputs = inputNodes.length > 0 ? `(${inputNodes.join(", ")})` : "";
      codeLines.push(`${varName} = ${spreadLine}${inputs}`);
    }
  } else {
    // Low multiplier case or multiple inputs
    const individualLayers = layerCode.split(",\n    ").map((l) => l.trim());

    if (inputNodes.length === 1 && individualLayers.length > 1) {
      // Chain individual layers
      let currentVar = inputNodes[0];
      individualLayers.forEach((layer, index) => {
        if (index === 0) {
          codeLines.push(`${varName} = ${layer}(${currentVar})`);
          currentVar = varName;
        } else {
          const nextVar = `${varName}_${index}`;
          codeLines.push(`${nextVar} = ${layer}(${currentVar})`);
          currentVar = nextVar;
          layerVariables.set(`${id}_${index}`, nextVar);
        }
      });

      // Update final variable reference
      const finalVar = `${varName}_${individualLayers.length - 1}`;
      layerVariables.set(id, finalVar);
      return;
    } else {
      // Use first layer only for multiple inputs or single layer
      const inputs =
        inputNodes.length > 0 ? `([${inputNodes.join(", ")}])` : "";
      codeLines.push(`${varName} = ${individualLayers[0]}${inputs}`);
    }
  }

  layerVariables.set(id, varName);
}

/**
 * Finds input nodes for a given layer
 */
function findInputNodes(
  layerId: string,
  edgeMap: Map<string, string[]>,
  layerVariables: Map<string, string>
): string[] {
  const inputNodes: string[] = [];

  for (const [sourceId, targets] of edgeMap.entries()) {
    if (targets.includes(layerId)) {
      const inputVar = layerVariables.get(sourceId);
      if (inputVar) {
        inputNodes.push(inputVar);
      }
    }
  }

  return inputNodes;
}

/**
 * Finds terminal nodes (input/output) in the DAG
 */
function findTerminalNodes(
  orderedNodes: LayerObject[],
  edgeMap: Map<string, string[]>,
  layerVariables: Map<string, string>
) {
  const inputVars: string[] = [];
  const outputVars: string[] = [];

  for (const layer of orderedNodes) {
    const variable = layerVariables.get(layer.id);
    if (!variable) continue;

    if (layer.type === "Input") {
      inputVars.push(variable);
    }

    // Check if this is an output node (no outgoing edges)
    if (!edgeMap.has(layer.id) || edgeMap.get(layer.id)!.length === 0) {
      outputVars.push(variable);
    }
  }

  return { inputVars, outputVars };
}

/**
 * Helper function to compute Input layer shape for code generation
 */
async function computeInputShape(
  params: Record<string, unknown>
): Promise<string> {
  const layerDef = getLayerDefinition("Input");
  if (!layerDef) {
    return "(784,)";
  }

  const shape = layerDef.computeShape([], params);
  if (!shape) {
    return "(784,)";
  }

  return `(${shape.join(", ")})`;
}

/**
 * Generates Keras Functional API code for complex DAG structures
 */
export async function generateFunctionalKerasCode(
  dagResult: DAGResult
): Promise<string> {
  if (!dagResult.isValid || dagResult.orderedNodes.length === 0) {
    return "# Invalid DAG structure - cannot generate code";
  }

  const { orderedNodes, edgeMap } = dagResult;

  // Generate imports
  const usedLayerTypes = orderedNodes
    .map((layer) => layer.type)
    .filter((type) => type !== "Input");
  const kerasImports = getUsedKerasImports(usedLayerTypes);
  const mergeImports = getMergeLayerImports(orderedNodes);

  // Combine and deduplicate imports
  const allImports = [...new Set([...kerasImports, ...mergeImports])];

  const imports = [
    "import tensorflow as tf",
    "from tensorflow.keras.models import Model",
    "from tensorflow.keras.layers import Input",
    `from tensorflow.keras.layers import ${allImports.join(", ")}`,
  ];

  const codeLines: string[] = [...imports, ""];
  const layerVariables = new Map<string, string>();

  // Process each layer
  for (const layer of orderedNodes) {
    const { id, type, params, varName } = layer;

    if (type === "Input") {
      const shape = await computeInputShape(params);
      codeLines.push(`${varName} = Input(shape=${shape})`);
      layerVariables.set(id, varName);
    } else {
      const inputNodes = findInputNodes(id, edgeMap, layerVariables);
      processLayer(layer, inputNodes, codeLines, layerVariables);
    }
  }

  // Generate model creation
  const { inputVars, outputVars } = findTerminalNodes(
    orderedNodes,
    edgeMap,
    layerVariables
  );

  codeLines.push("");

  // Format inputs and outputs for the Model constructor
  const inputs =
    inputVars.length === 1 ? inputVars[0] : `[${inputVars.join(", ")}]`;
  const outputs =
    outputVars.length === 1 ? outputVars[0] : `[${outputVars.join(", ")}]`;

  codeLines.push(`model = Model(inputs=${inputs}, outputs=${outputs})`);

  return [...codeLines, ...COMPILATION_TEMPLATE].join("\n");
}

// ============================================================================
// PYTORCH CODE GENERATION
// ============================================================================

/**
 * Generate PyTorch model code from ordered layers
 */
export function generatePyTorchCode(layers: LayerObject[]): string {
  if (layers.length === 0) {
    return "# No layers to generate code for";
  }

  // Filter out Input layers for PyTorch (they're implicit)
  const modelLayers = layers.filter(layer => layer.type !== "Input");
  
  // Get input shape from Input layer if it exists
  const inputLayer = layers.find(layer => layer.type === "Input");
  let currentShape: number[] = [1]; // Default to [1] if no input layer
  
  if (inputLayer) {
    const inputType = String(inputLayer.params.inputType);
    switch (inputType) {
      case "image_grayscale":
        currentShape = [1, Number(inputLayer.params.height) || 28, Number(inputLayer.params.width) || 28];
        break;
      case "image_color":
        currentShape = [3, Number(inputLayer.params.height) || 28, Number(inputLayer.params.width) || 28];
        break;
      case "image_custom":
        currentShape = [Number(inputLayer.params.channels) || 1, Number(inputLayer.params.height) || 28, Number(inputLayer.params.width) || 28];
        break;
      case "flat_data":
        currentShape = [Number(inputLayer.params.flatSize) || 784];
        break;
      case "sequence":
        currentShape = [Number(inputLayer.params.seqLength) || 100, Number(inputLayer.params.features) || 128];
        break;
      case "sequence_indices":
        currentShape = [Number(inputLayer.params.seqIndicesLength) || 100];
        break;
      default:
        currentShape = [1];
    }
  }
  
  // Generate imports
  const imports = [
    "import torch",
    "import torch.nn as nn",
    "import torch.nn.functional as F",
  ];

  // Generate class definition
  const classLines = [
    "",
    "class NeuralNetwork(nn.Module):",
    "    def __init__(self):",
    "        super(NeuralNetwork, self).__init__()",
  ];

  // Process each layer for __init__ method and track shapes
  const layerMapping: Map<number, number> = new Map(); // Original index -> module index
  let moduleIndex = 1;
  
  // Store the initial input shape for skip connections
  const initialInputShape = [...currentShape];
  
  modelLayers.forEach((layer, index) => {
    // Skip layers that are handled in forward() method
    if (layer.type === "Flatten" || layer.type === "Activation" || layer.type === "Merge") {
      // Update shape for these layers
      if (layer.type === "Flatten") {
        if (currentShape.length > 1) {
          currentShape = [currentShape.reduce((a, b) => a * b, 1)];
        }
      } else if (layer.type === "Merge") {
        // For merge layers, calculate the concatenated shape
        const mode = String(layer.params.mode) || "concat";
        if (mode === "concat") {
          const axis = Number(layer.params.axis) || -1;
          if (axis === -1 || axis === 1) { // Channel concatenation
            // Concatenate with input shape: current channels + input channels
            const currentChannels = currentShape[0];
            const inputChannels = initialInputShape[0];
            currentShape[0] = currentChannels + inputChannels; // Update channel count
          }
        } else if (mode === "add") {
          // Addition doesn't change shape, but inputs must be compatible
          // Keep current shape
        }
        // Other merge modes (multiply, average, etc.) also keep the shape
      }
      return;
    }

    const layerCode = generateLayerCode(layer.type, layer.params, 'pytorch');
    if (!layerCode || layerCode.startsWith('#')) {
      classLines.push(`        # ${layerCode || 'Layer not supported'}`);
      return;
    }

    // Handle multipliers for PyTorch
    const multiplier = Number(layer.params.multiplier) || 1;
    const layerDefinition = layerDefinitions[layer.type];
    
    if (multiplier > 1 && layerDefinition?.supportsMultiplier) {
      // Create multiple instances of the layer
      for (let i = 0; i < multiplier; i++) {
        // Handle dynamic input sizes
        let processedCode = layerCode;
        if (layer.type === "Dense") {
          const inFeatures = currentShape[currentShape.length - 1];
          processedCode = processedCode.replace("in_features", String(inFeatures));
          if (i === multiplier - 1) {
            // Only update shape after the last layer
            currentShape = [Number(layer.params.units) || 128];
          }
        } else if (layer.type === "Conv2D") {
          const inChannels = currentShape[0];
          processedCode = processedCode.replace("in_channels", String(inChannels));
          if (i === multiplier - 1) {
            // Update shape after convolution
            const filters = Number(layer.params.filters) || 32;
            const kernelSize = String(layer.params.kernel_size) || "(3,3)";
            const strides = String(layer.params.strides) || "(1,1)";
            const padding = String(layer.params.padding) || "same";
            
            currentShape = calculateConv2DShape(currentShape, filters, kernelSize, strides, padding);
          }
        }

        layerMapping.set(index * 1000 + i, moduleIndex); // Use unique mapping for each instance
        classLines.push(`        self.layer${moduleIndex} = ${processedCode}`);
        moduleIndex++;
      }
    } else {
      // Handle dynamic input sizes and shape tracking
      let processedCode = layerCode;
      
      if (layer.type === "Dense") {
        const inFeatures = currentShape[currentShape.length - 1];
        processedCode = processedCode.replace("in_features", String(inFeatures));
        currentShape = [Number(layer.params.units) || 128];
      } else if (layer.type === "Conv2D") {
        const inChannels = currentShape[0];
        processedCode = processedCode.replace("in_channels", String(inChannels));
        
        // Update shape after convolution
        const filters = Number(layer.params.filters) || 32;
        const kernelSize = String(layer.params.kernel_size) || "(3,3)";
        const strides = String(layer.params.strides) || "(1,1)";
        const padding = String(layer.params.padding) || "same";
        
        currentShape = calculateConv2DShape(currentShape, filters, kernelSize, strides, padding);
      } else if (layer.type === "MaxPool2D" || layer.type === "AveragePooling2D") {
        // Update shape after pooling
        const poolSize = String(layer.params.pool_size) || "(2,2)";
        const strides = String(layer.params.strides) || poolSize;
        const padding = String(layer.params.padding) || "valid";
        
        currentShape = calculatePoolingShape(currentShape, poolSize, strides, padding);
      } else if (layer.type === "BatchNormalization") {
        // Handle BatchNormalization - choose correct variant and replace NUM_FEATURES
        let batchNormType;
        let numFeatures;
        
        if (currentShape.length === 1) {
          // 1D input: use BatchNorm1d, features = shape[0]
          batchNormType = "nn.BatchNorm1d";
          numFeatures = currentShape[0];
        } else if (currentShape.length === 3) {
          // 3D input (channels, height, width): use BatchNorm2d, features = channels
          batchNormType = "nn.BatchNorm2d";
          numFeatures = currentShape[0];
        } else if (currentShape.length === 4) {
          // 4D input (channels, depth, height, width): use BatchNorm3d, features = channels
          batchNormType = "nn.BatchNorm3d";
          numFeatures = currentShape[0];
        } else {
          // Default to 1d for other cases
          batchNormType = "nn.BatchNorm1d";
          numFeatures = currentShape[currentShape.length - 1];
        }
        
        // Replace both the BatchNorm type and NUM_FEATURES
        processedCode = processedCode.replace("nn.BatchNorm2d", batchNormType);
        processedCode = processedCode.replace("NUM_FEATURES", String(numFeatures));
      } else if (layer.type === "GlobalAveragePooling2D") {
        // After global average pooling, shape becomes [channels]
        if (currentShape.length === 3) {
          currentShape = [currentShape[0]]; // Keep only channels
        }
      } else if (layer.type === "Output") {
        const inFeatures = currentShape[currentShape.length - 1];
        processedCode = processedCode.replace("in_features", String(inFeatures));
        
        const outputType = String(layer.params.outputType) || "multiclass";
        if (outputType === "multiclass") {
          currentShape = [Number(layer.params.numClasses) || 10];
        } else {
          currentShape = [Number(layer.params.units) || 1];
        }
      } else if (layer.type === "LSTM" || layer.type === "GRU") {
        // Handle RNN layers - replace input_size placeholder
        const inputSize = currentShape[currentShape.length - 1]; // Last dimension is features
        processedCode = processedCode.replace("input_size=input_size", `input_size=${inputSize}`);
        
        // Update shape after RNN
        const units = Number(layer.params.units) || 50;
        const returnSequences = String(layer.params.return_sequences) === "true";
        
        if (returnSequences) {
          currentShape = [currentShape[0], units]; // [seq_length, hidden_size]
        } else {
          currentShape = [units]; // [hidden_size]
        }
      } else if (layer.type === "Embedding") {
        // After embedding, shape changes from [seq_length] to [seq_length, embedding_dim]
        const outputDim = Number(layer.params.output_dim) || 128;
        if (currentShape.length === 1) {
          currentShape = [currentShape[0], outputDim];
        }
      }

      layerMapping.set(index, moduleIndex);
      classLines.push(`        self.layer${moduleIndex} = ${processedCode}`);
      moduleIndex++;
    }
  });

  // Generate forward method with improved activation handling
  const forwardLines = [
    "",
    "    def forward(self, x):",
  ];

  // Check if we have any merge layers that would need residual connections
  const hasMergeLayers = modelLayers.some(layer => layer.type === "Merge");
  let residualStored = false; // Track if we've stored the residual

  // Helper function to check if next layer is BatchNorm
  const isNextLayerBatchNorm = (currentIndex: number): boolean => {
    const nextLayer = modelLayers[currentIndex + 1];
    return nextLayer?.type === "BatchNormalization";
  };

  // Helper function to check if we should defer activation
  const shouldDeferActivation = (layer: LayerObject, index: number): boolean => {
    const activation = String(layer.params.activation || "linear");
    return activation !== "linear" && 
           layer.type !== "Output" && 
           isNextLayerBatchNorm(index);
  };

  modelLayers.forEach((layer, index) => {
    const activation = String(layer.params.activation || "linear");
    
    // Smart residual storage: store residual when we reach a compatible shape for later merge
    if (hasMergeLayers && !residualStored) {
      // Find the merge layer to determine when to store residual
      const mergeIndex = modelLayers.findIndex(l => l.type === "Merge");
      if (mergeIndex > index) {
        // Check if this is a good point to store residual (after activation, before merge)
        const isAfterActivation = layer.type === "Activation" || 
                                 (activation !== "linear" && !shouldDeferActivation(layer, index));
        
        // Store residual after we've reached a stable shape and applied activation
        if (isAfterActivation && index < mergeIndex - 1) {
          forwardLines.push(`        # Store residual for skip connection`);
          forwardLines.push(`        residual = x`);
          forwardLines.push(``);
          residualStored = true;
        }
      }
    }
    
    if (layer.type === "Flatten") {
      forwardLines.push(`        x = torch.flatten(x, 1)`);
    } else if (layer.type === "Activation") {
      const activationFunc = String(layer.params.activation_function || "relu");
      forwardLines.push(`        x = F.${activationFunc}(x)`);
    } else if (layer.type === "Merge") {
      // Handle merge operations - skip connections and multi-input scenarios
      const mode = String(layer.params.mode) || "concat";
      
      if (mode === "add") {
        // ResNet-style residual connection: x = x + residual
        forwardLines.push(`        # ResNet skip connection: add residual`);
        forwardLines.push(`        # WARNING: Ensure tensors have compatible shapes for addition`);
        forwardLines.push(`        x = x + residual`);
      } else if (mode === "concat") {
        // Concatenation-based skip connection or multi-input merge
        const axis = Number(layer.params.axis) || -1;
        // Convert Keras axis to PyTorch: -1 (features) becomes 1 (channels) for 4D tensors
        const pytorchAxis = axis === -1 ? 1 : axis;
        forwardLines.push(`        # Skip connection: concatenate with residual`);
        forwardLines.push(`        x = torch.cat([residual, x], dim=${pytorchAxis})`);
      } else {
        // Other merge operations
        forwardLines.push(`        # Merge operation: ${mode}`);
        forwardLines.push(`        # WARNING: Ensure tensors have compatible shapes`);
        switch (mode) {
          case "multiply":
            forwardLines.push(`        x = x * residual`);
            break;
          case "average":
            forwardLines.push(`        x = (x + residual) / 2`);
            break;
          case "maximum":
            forwardLines.push(`        x = torch.maximum(x, residual)`);
            break;
          case "minimum":
            forwardLines.push(`        x = torch.minimum(x, residual)`);
            break;
          case "subtract":
            forwardLines.push(`        x = residual - x`);
            break;
          default:
            forwardLines.push(`        x = torch.cat([residual, x], dim=-1)`);
        }
      }
    } else {
      // Handle multipliers in forward pass
      const multiplier = Number(layer.params.multiplier) || 1;
      const layerDefinition = layerDefinitions[layer.type];
      
      if (multiplier > 1 && layerDefinition?.supportsMultiplier) {
        // Apply each multiplied layer sequentially
        for (let i = 0; i < multiplier; i++) {
          const moduleIdx = layerMapping.get(index * 1000 + i);
          if (moduleIdx) {
            const layerVar = `self.layer${moduleIdx}`;
            
            forwardLines.push(`        x = ${layerVar}(x)`);
            
            // Handle special cases
            if (layer.type === "GlobalAveragePooling2D") {
              forwardLines.push(`        x = torch.flatten(x, 1)`);
            } else if (layer.type === "LSTM" || layer.type === "GRU") {
              // RNN layers return (output, hidden_state), we only want output
              forwardLines.pop(); // Remove the previous x = layer(x) line
              
              const returnSequences = String(layer.params.return_sequences) === "true";
              if (!returnSequences) {
                forwardLines.push(`        x, _ = ${layerVar}(x)`);
                forwardLines.push(`        x = x[:, -1, :]  # Take last timestep`);
              } else {
                forwardLines.push(`        x, _ = ${layerVar}(x)`);
              }
            }
            
            // Apply activation after the last multiplied layer, unless deferred
            if (i === multiplier - 1) {
              if (layer.type === "Output") {
                const outputType = String(layer.params.outputType || "multiclass");
                if (outputType === "multiclass") {
                  forwardLines.push(`        x = F.log_softmax(x, dim=1)`);
                } else if (outputType === "binary" || outputType === "multilabel") {
                  forwardLines.push(`        x = torch.sigmoid(x)`);
                }
              } else if (activation !== "linear" && !shouldDeferActivation(layer, index) && 
                         layer.type !== "LSTM" && layer.type !== "GRU") {
                // Skip manual activation for RNN layers as they have built-in activations
                forwardLines.push(`        x = F.${activation}(x)`);
              }
            }
          }
        }
      } else {
        // Handle single layer
        const moduleIdx = layerMapping.get(index);
        if (moduleIdx) {
          const layerVar = `self.layer${moduleIdx}`;
          
          forwardLines.push(`        x = ${layerVar}(x)`);
          
          // Handle special cases
          if (layer.type === "GlobalAveragePooling2D") {
            forwardLines.push(`        x = torch.flatten(x, 1)`);
          } else if (layer.type === "LSTM" || layer.type === "GRU") {
            // RNN layers return (output, hidden_state) or (output, (hidden, cell))
            // We only want the output for the forward pass
            forwardLines.pop(); // Remove the previous x = layer(x) line
            
            const returnSequences = String(layer.params.return_sequences) === "true";
            if (!returnSequences) {
              // For last output only, take the last timestep
              forwardLines.push(`        x, _ = ${layerVar}(x)`);
              forwardLines.push(`        x = x[:, -1, :]  # Take last timestep`);
            } else {
              // For sequence output, keep all timesteps
              forwardLines.push(`        x, _ = ${layerVar}(x)`);
            }
          }
          
          // Handle activation and output
          if (layer.type === "Output") {
            const outputType = String(layer.params.outputType || "multiclass");
            if (outputType === "multiclass") {
              forwardLines.push(`        x = F.log_softmax(x, dim=1)`);
            } else if (outputType === "binary" || outputType === "multilabel") {
              forwardLines.push(`        x = torch.sigmoid(x)`);
            }
          } else if (layer.type === "BatchNormalization") {
            // Check if previous layer had deferred activation
            const prevLayer = modelLayers[index - 1];
            if (prevLayer && shouldDeferActivation(prevLayer, index - 1)) {
              const prevActivation = String(prevLayer.params.activation || "linear");
              if (prevActivation !== "linear") {
                forwardLines.push(`        x = F.${prevActivation}(x)`);
              }
            }
          } else if (activation !== "linear" && !shouldDeferActivation(layer, index) && 
                     layer.type !== "LSTM" && layer.type !== "GRU") {
            // Skip manual activation for RNN layers as they have built-in activations
            forwardLines.push(`        x = F.${activation}(x)`);
          }
        }
      }
    }
  });

  forwardLines.push("        return x");

  // Generate model instantiation and summary
  const instantiationLines = [
    "",
    "# Create model instance",
    "model = NeuralNetwork()",
    "",
    "# Print model summary",
    "print(model)",
    "",
    "criterion = nn.CrossEntropyLoss()  # Use appropriate loss for your task",
    "optimizer = torch.optim.Adam(model.parameters(), lr=0.001)",
  ];

  return [
    ...imports,
    ...classLines,
    ...forwardLines,
    ...instantiationLines,
  ].join("\n");
}
