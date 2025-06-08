/**
 * Simple test to verify Dense layer validation is working correctly
 */

// Using ES module syntax with TypeScript source (will transpile on-the-fly)
import { getLayerDefinition } from './src/lib/layer-definitions.ts';

function testDenseValidation() {
  console.log('Testing Dense layer validation...\n');
  
  const denseLayer = getLayerDefinition('Dense');
  if (!denseLayer) {
    console.error('❌ Dense layer definition not found');
    return;
  }
  
  // Test 1: Valid 1D input (flat data)
  const result1 = denseLayer.validateInputs([[784]], {});
  console.log('Test 1 - 1D input [784]:', result1.isValid ? '✅ Valid' : `❌ ${result1.errorMessage}`);
  
  // Test 2: Valid 2D input (with batch dimension)
  const result2 = denseLayer.validateInputs([[32, 784]], {});
  console.log('Test 2 - 2D input [32, 784]:', result2.isValid ? '✅ Valid' : `❌ ${result2.errorMessage}`);
  
  // Test 3: Invalid 3D input (image-like)
  const result3 = denseLayer.validateInputs([[28, 28, 1]], {});
  console.log('Test 3 - 3D input [28, 28, 1]:', result3.isValid ? '❌ Should be invalid!' : `✅ Correctly rejected: ${result3.errorMessage}`);
  
  // Test 4: Invalid 4D input (batch + image)
  const result4 = denseLayer.validateInputs([[32, 28, 28, 1]], {});
  console.log('Test 4 - 4D input [32, 28, 28, 1]:', result4.isValid ? '❌ Should be invalid!' : `✅ Correctly rejected: ${result4.errorMessage}`);
  
  // Test 5: Test shape computation with valid input
  const shape1 = denseLayer.computeShape([[784]], { units: 128 });
  console.log('Test 5 - Shape computation with [784] → units=128:', shape1 ? `✅ [${shape1.join(', ')}]` : '❌ Failed');
  
  // Test 6: Test shape computation with invalid input (should return null)
  const shape2 = denseLayer.computeShape([[28, 28, 1]], { units: 128 });
  console.log('Test 6 - Shape computation with [28, 28, 1]:', shape2 === null ? '✅ Correctly returned null' : `❌ Should return null, got [${shape2.join(', ')}]`);
  
  console.log('\nDense layer validation test complete!');
}

testDenseValidation();
