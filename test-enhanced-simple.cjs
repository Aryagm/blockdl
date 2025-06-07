/**
 * Simple test of enhanced shape computation functions
 */

// Enhanced shape computation result interface
class ShapeComputationResult {
  constructor(shape, error, warning) {
    this.shape = shape;
    this.error = error;
    this.warning = warning;
  }
}

// Enhanced Dense layer computation with proper validation
function enhanced_dense_layer(inputShapes, params) {
  if (inputShapes.length !== 1) {
    return new ShapeComputationResult(
      null,
      `Dense layer expects exactly 1 input, but received ${inputShapes.length} inputs`
    );
  }
  
  const inputShape = inputShapes[0];
  const units = Number(params.units) || Number(params.numClasses) || 128;
  
  // Check if input is compatible with Dense layer
  if (inputShape.length > 2) {
    // Multi-dimensional input - Dense can handle this but we should warn
    const totalElements = inputShape.reduce((acc, dim) => acc * dim, 1);
    return new ShapeComputationResult(
      [units],
      null,
      `Dense layer receiving ${inputShape.length}D input [${inputShape.join(', ')}] will be automatically flattened to ${totalElements} features. Consider adding an explicit Flatten layer for clarity.`
    );
  }
  
  if (inputShape.length === 2 || inputShape.length === 1) {
    // 2D or 1D input is fine for Dense layers
    return new ShapeComputationResult([units]);
  }
  
  // 0D input is invalid
  return new ShapeComputationResult(
    null,
    `Dense layer cannot process 0-dimensional input`
  );
}

// Enhanced Conv2D layer computation
function enhanced_conv2d_layer(inputShapes, params) {
  if (inputShapes.length !== 1) {
    return new ShapeComputationResult(
      null,
      `Conv2D layer expects exactly 1 input, but received ${inputShapes.length} inputs`
    );
  }
  
  const inputShape = inputShapes[0];
  
  // Conv2D requires exactly 3D input (height, width, channels)
  if (inputShape.length !== 3) {
    const shapeStr = JSON.stringify(inputShape);
    if (inputShape.length === 1) {
      return new ShapeComputationResult(
        null,
        `Conv2D layer expects 3D input (height, width, channels), but received 1D input ${shapeStr}. Consider using Dense layers for 1D data, or reshape your data to 3D.`
      );
    } else if (inputShape.length === 2) {
      return new ShapeComputationResult(
        null,
        `Conv2D layer expects 3D input (height, width, channels), but received 2D input ${shapeStr}. If this is sequence data, consider using Conv1D or LSTM layers. If this is image data, specify the channel dimension.`
      );
    } else {
      return new ShapeComputationResult(
        null,
        `Conv2D layer expects 3D input (height, width, channels), but received ${inputShape.length}D input ${shapeStr}.`
      );
    }
  }
  
  const [inputHeight, inputWidth] = inputShape;
  const filters = Number(params.filters) || 32;
  
  // Simplified calculation for demo
  const outputHeight = inputHeight; // Assuming 'same' padding
  const outputWidth = inputWidth;
  
  return new ShapeComputationResult([outputHeight, outputWidth, filters]);
}

// Test cases
console.log('🧪 Testing Enhanced Shape Computation with Detailed Error Messages');
console.log('=' .repeat(80));

const testCases = [
  {
    name: 'Dense layer with 3D image input (should warn)',
    func: enhanced_dense_layer,
    inputShapes: [[28, 28, 3]], // RGB image
    params: { units: 128 }
  },
  {
    name: 'Dense layer with 1D input (should work)',
    func: enhanced_dense_layer,
    inputShapes: [[784]], // Flattened input
    params: { units: 128 }
  },
  {
    name: 'Conv2D with 1D input (should error)',
    func: enhanced_conv2d_layer,
    inputShapes: [[784]], // Wrong dimensionality
    params: { filters: 32, kernel_size: '(3,3)' }
  },
  {
    name: 'Conv2D with 3D input (should work)',
    func: enhanced_conv2d_layer,
    inputShapes: [[28, 28, 1]], // Correct dimensionality
    params: { filters: 32, kernel_size: '(3,3)' }
  },
  {
    name: 'Dense after Conv2D without Flatten (problematic)',
    func: enhanced_dense_layer,
    inputShapes: [[14, 14, 32]], // Output from conv/pool layers
    params: { units: 128 }
  }
];

console.log('Running test cases...\n');

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`Input shapes: ${JSON.stringify(testCase.inputShapes)}`);
  
  try {
    const result = testCase.func(testCase.inputShapes, testCase.params);
    
    if (result.shape) {
      console.log(`✅ Output shape: [${result.shape.join(', ')}]`);
      if (result.warning) {
        console.log(`⚠️  Warning: ${result.warning}`);
      }
    } else {
      console.log(`❌ Error: ${result.error}`);
    }
    
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
console.log('\nThis addresses the user\'s concern about Dense layers accepting');
console.log('incompatible 3D inputs without proper validation warnings.');
