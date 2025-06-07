/**
 * Debug MaxPool2D shape computation
 */

const fs = require('fs');
const path = require('path');

// Create a simple test for MaxPool2D shape computation
function testMaxPool2DShapeComputation() {
  console.log('🧪 DEBUG: MaxPool2D Shape Computation');
  console.log('=' .repeat(60));
  
  // First, let me manually implement and test the parsing functions
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
  
  // Test the parsing functions
  console.log('📝 Testing parseKernelSize function:');
  console.log('  "(2,2)" →', parseKernelSize('(2,2)'));
  console.log('  "2,2" →', parseKernelSize('2,2'));
  console.log('  "(3,3)" →', parseKernelSize('(3,3)'));
  console.log('  "invalid" →', parseKernelSize('invalid'));
  
  // Test MaxPool2D computation manually
  function testMaxPool2D(inputShape, params) {
    console.log(`\n🔬 Testing MaxPool2D with input shape [${inputShape.join(', ')}] and params:`, params);
    
    if (inputShape.length !== 3) {
      console.log('❌ Input shape must be 3D [height, width, channels]');
      return null;
    }
    
    const [inputHeight, inputWidth, channels] = inputShape;
    const poolSize = parseKernelSize(String(params.pool_size) || '(2,2)');
    const strides = parseKernelSize(String(params.strides) || String(params.pool_size) || '(2,2)');
    const padding = String(params.padding) || 'valid';
    
    console.log('  📊 Parsed parameters:');
    console.log('    poolSize:', poolSize);
    console.log('    strides:', strides);
    console.log('    padding:', padding);
    
    if (!poolSize || !strides) {
      console.log('❌ Failed to parse poolSize or strides');
      return null;
    }
    
    let outputHeight, outputWidth;
    
    if (padding === 'same') {
      outputHeight = Math.ceil(inputHeight / strides[0]);
      outputWidth = Math.ceil(inputWidth / strides[1]);
    } else { // 'valid'
      outputHeight = Math.floor((inputHeight - poolSize[0]) / strides[0]) + 1;
      outputWidth = Math.floor((inputWidth - poolSize[1]) / strides[1]) + 1;
    }
    
    const result = [outputHeight, outputWidth, channels];
    console.log(`  ✅ Computed output shape: [${result.join(', ')}]`);
    return result;
  }
  
  // Test cases
  console.log('\n🧪 Test Cases:');
  
  // Case 1: Conv2D output [28, 28, 32] → MaxPool2D
  testMaxPool2D([28, 28, 32], { pool_size: '(2,2)', padding: 'valid' });
  
  // Case 2: Different pool size
  testMaxPool2D([28, 28, 32], { pool_size: '(3,3)', padding: 'valid' });
  
  // Case 3: With strides
  testMaxPool2D([28, 28, 32], { pool_size: '(2,2)', strides: '(1,1)', padding: 'valid' });
  
  // Case 4: Same padding
  testMaxPool2D([28, 28, 32], { pool_size: '(2,2)', padding: 'same' });
}

testMaxPool2DShapeComputation();
