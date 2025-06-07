/**
 * Test the fixed MaxPool2D computation
 */

const fs = require('fs');

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

function testFixedMaxPool2D(inputShape, params) {
  console.log(`\n🔬 Testing FIXED MaxPool2D with input shape [${inputShape.join(', ')}] and params:`, params);
  
  if (inputShape.length !== 3) {
    console.log('❌ Input shape must be 3D [height, width, channels]');
    return null;
  }
  
  const [inputHeight, inputWidth, channels] = inputShape;
  const poolSize = parseKernelSize(String(params.pool_size) || '(2,2)');
  // Fixed: Default strides to pool_size if not provided
  const stridesParam = params.strides || params.pool_size || '(2,2)';
  const strides = parseKernelSize(String(stridesParam));
  const padding = String(params.padding) || 'valid';
  
  console.log('  📊 Parsed parameters:');
  console.log('    poolSize:', poolSize);
  console.log('    stridesParam:', stridesParam);
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

console.log('🧪 Testing FIXED MaxPool2D Shape Computation');
console.log('=' .repeat(60));

// Test the cases that were failing before
testFixedMaxPool2D([28, 28, 32], { pool_size: '(2,2)', padding: 'valid' });
testFixedMaxPool2D([28, 28, 32], { pool_size: '(3,3)', padding: 'valid' });
testFixedMaxPool2D([28, 28, 32], { pool_size: '(2,2)', padding: 'same' });
