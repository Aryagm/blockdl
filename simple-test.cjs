/**
 * Simple test to check MaxPool2D shape computation
 */

// Import using require for CommonJS compatibility
const fs = require('fs');
const path = require('path');

// Simple test data
const testLayers = [
  {
    type: 'Input',
    params: { inputType: 'image_grayscale', height: 28, width: 28 }
  },
  {
    type: 'Conv2D', 
    params: { filters: 32, kernelSize: 3, activation: 'relu' }
  },
  {
    type: 'MaxPool2D',
    params: { poolSize: 2, strides: 2 }
  },
  {
    type: 'Flatten',
    params: {}
  },
  {
    type: 'Dense',
    params: { units: 128, activation: 'relu' }
  }
];

console.log('🧪 Testing Shape Computation for Sequential Layers');
console.log('=' .repeat(60));

// First let me check the current state of shape computation registry
const registryPath = path.join(__dirname, 'src', 'lib', 'shape-computation-registry.ts');
console.log('📁 Reading shape computation registry...');

try {
  const registryContent = fs.readFileSync(registryPath, 'utf-8');
  console.log('✅ Registry file found');
  
  // Look for MaxPool2D implementation
  if (registryContent.includes('maxpool2d_layer')) {
    console.log('✅ MaxPool2D shape computation found in registry');
    
    // Extract the MaxPool2D function (simple string parsing)
    const maxPoolMatch = registryContent.match(/maxpool2d_layer:\s*\([^}]+\}/s);
    if (maxPoolMatch) {
      console.log('📝 MaxPool2D implementation:');
      console.log(maxPoolMatch[0]);
    }
  } else {
    console.log('❌ MaxPool2D shape computation NOT found in registry');
  }
  
} catch (error) {
  console.error('❌ Error reading registry:', error.message);
}
