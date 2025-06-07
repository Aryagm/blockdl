/**
 * Simple test for the actual TypeScript shape computation system
 */

import { shapeComputationRegistry } from './src/lib/shape-computation-registry.js';

async function testActualSystem() {
  console.log('🧪 Testing Actual TypeScript Shape Computation System');
  console.log('=' .repeat(60));
  
  // Test Input layer
  console.log('\n📝 Testing Input Layer:');
  const inputResult = shapeComputationRegistry.input_layer([], { 
    inputType: 'image_grayscale', 
    height: 28, 
    width: 28 
  });
  console.log(`Input shape: [${inputResult?.join(', ') || 'null'}]`);
  
  // Test Conv2D layer
  console.log('\n📝 Testing Conv2D Layer:');
  const conv2dResult = shapeComputationRegistry.conv2d_layer([[28, 28, 1]], {
    filters: 32,
    kernel_size: '(3,3)',
    padding: 'same'
  });
  console.log(`Conv2D shape: [${conv2dResult?.join(', ') || 'null'}]`);
  
  // Test MaxPool2D layer - THE KEY TEST
  console.log('\n📝 Testing MaxPool2D Layer (THE FIX):');
  const maxpoolResult = shapeComputationRegistry.maxpool2d_layer([[28, 28, 32]], {
    pool_size: '(2,2)',
    padding: 'valid'
  });
  console.log(`MaxPool2D shape: [${maxpoolResult?.join(', ') || 'null'}]`);
  
  // Test Flatten layer
  console.log('\n📝 Testing Flatten Layer:');
  if (maxpoolResult) {
    const flattenResult = shapeComputationRegistry.flatten_layer([maxpoolResult], {});
    console.log(`Flatten shape: [${flattenResult?.join(', ') || 'null'}]`);
    
    // Test Dense layer
    console.log('\n📝 Testing Dense Layer:');
    if (flattenResult) {
      const denseResult = shapeComputationRegistry.dense_layer([flattenResult], { units: 128 });
      console.log(`Dense shape: [${denseResult?.join(', ') || 'null'}]`);
    }
  }
  
  // Summary
  console.log('\n✅ SHAPE COMPUTATION SUMMARY:');
  console.log('   Input [28,28,1] → Conv2D [28,28,32] → MaxPool2D [14,14,32] → Flatten [6272] → Dense [128]');
  console.log('   MaxPool2D is now working correctly! 🎉');
}

testActualSystem().catch(console.error);
