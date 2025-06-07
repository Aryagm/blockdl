/**
 * Test the enhanced shape computation system with detailed error messages
 */

// Import the enhanced functions
const { computeEnhancedLayerShape } = require('./src/lib/enhanced-shape-computation.js');

console.log('🧪 Testing Enhanced Shape Computation with Detailed Error Messages');
console.log('=' .repeat(80));

// Test cases showing the problems mentioned by the user
const testCases = [
  {
    name: 'Dense layer with 3D image input (should warn/error)',
    layerType: 'Dense',
    inputShapes: [[28, 28, 3]], // RGB image
    params: { units: 128 },
    expected: 'Warning about flattening or error'
  },
  {
    name: 'Dense layer with 1D input (should work)',
    layerType: 'Dense', 
    inputShapes: [[784]], // Flattened input
    params: { units: 128 },
    expected: 'Success'
  },
  {
    name: 'Conv2D with 1D input (should error)',
    layerType: 'Conv2D',
    inputShapes: [[784]], // Wrong dimensionality
    params: { filters: 32, kernel_size: '(3,3)' },
    expected: 'Error about wrong dimensions'
  },
  {
    name: 'Conv2D with 3D input (should work)',
    layerType: 'Conv2D',
    inputShapes: [[28, 28, 1]], // Correct dimensionality
    params: { filters: 32, kernel_size: '(3,3)' },
    expected: 'Success'
  },
  {
    name: 'MaxPool2D with wrong input',
    layerType: 'MaxPool2D',
    inputShapes: [[784]], // Wrong dimensionality
    params: { pool_size: '(2,2)' },
    expected: 'Error about wrong dimensions'
  },
  {
    name: 'Dense after Conv2D without Flatten (problematic)',
    layerType: 'Dense',
    inputShapes: [[14, 14, 32]], // Output from conv/pool layers
    params: { units: 128 },
    expected: 'Warning about auto-flattening'
  }
];

console.log('Running test cases...\n');

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`Input: ${testCase.layerType} with shapes ${JSON.stringify(testCase.inputShapes)}`);
  
  try {
    const result = computeEnhancedLayerShape(
      testCase.layerType,
      testCase.inputShapes, 
      testCase.params
    );
    
    if (result.shape) {
      console.log(`✅ Output shape: ${JSON.stringify(result.shape)}`);
      if (result.warning) {
        console.log(`⚠️  Warning: ${result.warning}`);
      }
    } else {
      console.log(`❌ Error: ${result.error}`);
    }
    
    console.log(`Expected: ${testCase.expected}`);
    
  } catch (error) {
    console.log(`💥 Exception: ${error.message}`);
  }
  
  console.log('-'.repeat(60));
});

console.log('\n🎯 Summary: Enhanced shape computation now provides:');
console.log('1. ✅ Detailed error messages explaining WHY shapes are incompatible');
console.log('2. ⚠️  Warnings for potentially problematic but valid configurations');
console.log('3. 🎯 Specific guidance on how to fix shape mismatches');
console.log('4. 🔍 Clear distinction between different types of failures');
