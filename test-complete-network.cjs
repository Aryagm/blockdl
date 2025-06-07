/**
 * Test the complete shape computation system with MaxPool2D fix
 */

const fs = require('fs');
const path = require('path');

// Simulate the shape computation system
const shapeComputationRegistry = {
  input_layer: function(inputShapes, params) {
    const inputType = params.inputType || 'image_grayscale';
    
    switch (inputType) {
      case 'image_grayscale':
        return [Number(params.height) || 28, Number(params.width) || 28, 1];
      case 'image_color':
        return [Number(params.height) || 28, Number(params.width) || 28, 3];
      case 'flat_data':
        return [Number(params.flatSize) || 784];
      default:
        return [784];
    }
  },
  
  conv2d_layer: function(inputShapes, params) {
    if (inputShapes.length !== 1) return null;
    const inputShape = inputShapes[0];
    
    if (inputShape.length !== 3) return null;
    
    const [inputHeight, inputWidth] = inputShape;
    const filters = Number(params.filters) || 32;
    
    // Simple calculation (assuming same padding and stride 1)
    const padding = String(params.padding) || 'same';
    
    if (padding === 'same') {
      return [inputHeight, inputWidth, filters];
    } else {
      // For valid padding, subtract kernel size - 1
      const kernelSize = 3; // default
      return [inputHeight - kernelSize + 1, inputWidth - kernelSize + 1, filters];
    }
  },
  
  maxpool2d_layer: function(inputShapes, params) {
    if (inputShapes.length !== 1) return null;
    const inputShape = inputShapes[0];
    
    if (inputShape.length !== 3) return null;
    
    const [inputHeight, inputWidth, channels] = inputShape;
    
    // Parse pool_size
    function parseKernelSize(sizeStr) {
      try {
        const cleaned = sizeStr.replace(/[()]/g, '').trim();
        const parts = cleaned.split(',').map(s => parseInt(s.trim()));
        
        if (parts.length === 2 && !parts.some(isNaN)) {
          return [parts[0], parts[1]];
        }
      } catch {
        // ignore
      }
      return null;
    }
    
    const poolSize = parseKernelSize(String(params.pool_size) || '(2,2)');
    // Fixed: Default strides to pool_size if not provided
    const stridesParam = params.strides || params.pool_size || '(2,2)';
    const strides = parseKernelSize(String(stridesParam));
    const padding = String(params.padding) || 'valid';
    
    if (!poolSize || !strides) return null;
    
    let outputHeight, outputWidth;
    
    if (padding === 'same') {
      outputHeight = Math.ceil(inputHeight / strides[0]);
      outputWidth = Math.ceil(inputWidth / strides[1]);
    } else { // 'valid'
      outputHeight = Math.floor((inputHeight - poolSize[0]) / strides[0]) + 1;
      outputWidth = Math.floor((inputWidth - poolSize[1]) / strides[1]) + 1;
    }
    
    return [outputHeight, outputWidth, channels];
  },
  
  flatten_layer: function(inputShapes, params) {
    if (inputShapes.length !== 1) return null;
    const inputShape = inputShapes[0];
    
    const totalElements = inputShape.reduce((acc, dim) => acc * dim, 1);
    return [totalElements];
  },
  
  dense_layer: function(inputShapes, params) {
    if (inputShapes.length !== 1) return null;
    
    const units = Number(params.units) || 128;
    return [units];
  }
};

function computeLayerShape(layerType, inputShapes, params, shapeComputationName) {
  const computationName = shapeComputationName || layerType.toLowerCase() + '_layer';
  const computeFunction = shapeComputationRegistry[computationName];
  
  if (!computeFunction) {
    return { shape: null, error: `No computation function for ${computationName}` };
  }
  
  try {
    const shape = computeFunction(inputShapes, params);
    return { shape };
  } catch (error) {
    return { shape: null, error: error.message };
  }
}

// Test the complete CNN pipeline
function testCompleteNetwork() {
  console.log('🧪 Testing Complete CNN Network with MaxPool2D');
  console.log('=' .repeat(60));
  
  const layers = [
    { type: 'Input', params: { inputType: 'image_grayscale', height: 28, width: 28 }, shapeComputation: 'input_layer' },
    { type: 'Conv2D', params: { filters: 32, kernel_size: '(3,3)', padding: 'same' }, shapeComputation: 'conv2d_layer' },
    { type: 'MaxPool2D', params: { pool_size: '(2,2)', padding: 'valid' }, shapeComputation: 'maxpool2d_layer' },
    { type: 'Flatten', params: {}, shapeComputation: 'flatten_layer' },
    { type: 'Dense', params: { units: 128 }, shapeComputation: 'dense_layer' },
    { type: 'Dense', params: { units: 10 }, shapeComputation: 'dense_layer' }
  ];
  
  let currentShapes = [];
  
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const inputShapes = i === 0 ? [] : [currentShapes];
    
    console.log(`\n📝 Layer ${i + 1}: ${layer.type}`);
    console.log(`   Input shapes: ${i === 0 ? 'N/A (input layer)' : JSON.stringify(inputShapes)}`);
    console.log(`   Parameters:`, layer.params);
    
    const result = computeLayerShape(layer.type, inputShapes, layer.params, layer.shapeComputation);
    
    if (result.shape) {
      currentShapes = result.shape;
      console.log(`   ✅ Output shape: [${result.shape.join(', ')}]`);
    } else {
      console.log(`   ❌ Shape computation failed: ${result.error}`);
      break;
    }
  }
  
  console.log('\n🎯 Network Summary:');
  console.log('   Input: [28, 28, 1] (28x28 grayscale image)');
  console.log('   Conv2D: [28, 28, 32] (same padding)');
  console.log('   MaxPool2D: [14, 14, 32] (2x2 pooling, valid padding)');
  console.log('   Flatten: [6272] (14*14*32)');
  console.log('   Dense1: [128] (hidden layer)');
  console.log('   Dense2: [10] (output layer)');
}

testCompleteNetwork();
