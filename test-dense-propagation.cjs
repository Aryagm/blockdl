// Test shape propagation with Dense layer flattening
const { computeEnhancedLayerShape } = require('./src/lib/enhanced-shape-computation.js');

console.log('🧪 Testing Dense Layer Shape Propagation');
console.log('=' .repeat(50));

// Test 1: Dense layer with 3D input (should flatten)
console.log('\n📏 Test 1: Dense layer with 3D input');
const denseResult = computeEnhancedLayerShape(
  'Dense', 
  [[28, 28, 3]], // 3D input shape 
  { units: 128 }
);

console.log('Input shape:', [28, 28, 3]);
console.log('Dense result:', {
  shape: denseResult.shape,
  warning: denseResult.warning,
  error: denseResult.error
});

// Test 2: Simulate downstream layer receiving Dense output
console.log('\n📏 Test 2: Conv2D receiving Dense output (should fail)');
const conv2dResult = computeEnhancedLayerShape(
  'Conv2D',
  [denseResult.shape], // Use Dense output as Conv2D input
  { filters: 32, kernel_size: '(3,3)' }
);

console.log('Dense output shape:', denseResult.shape);
console.log('Conv2D result:', {
  shape: conv2dResult.shape,
  warning: conv2dResult.warning,
  error: conv2dResult.error
});

// Test 3: Dense receiving Dense output (should work)
console.log('\n📏 Test 3: Dense receiving Dense output');
const dense2Result = computeEnhancedLayerShape(
  'Dense',
  [denseResult.shape], // Use Dense output as next Dense input
  { units: 64 }
);

console.log('Previous Dense output:', denseResult.shape);
console.log('Next Dense result:', {
  shape: dense2Result.shape,
  warning: dense2Result.warning,
  error: dense2Result.error
});

console.log('\n✅ Test completed');
