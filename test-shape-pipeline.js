/**
 * Test the full shape computation pipeline with a network that should produce errors
 */

import { computeShapes } from './src/lib/shape-computation.js';

function testShapeComputationPipeline() {
  console.log('Testing shape computation pipeline...\n');
  
  // Create a simple DAG that should produce a shape error
  // Input (28x28x1) -> Dense (should fail)
  const dag = {
    orderedNodes: [
      {
        id: 'input1',
        type: 'Input',
        params: { inputType: 'image_grayscale', height: 28, width: 28 }
      },
      {
        id: 'dense1', 
        type: 'Dense',
        params: { units: 128 }
      }
    ],
    edgeMap: new Map([
      ['dense1', ['input1']] // dense1 gets input from input1
    ])
  };
  
  const result = computeShapes(dag, '(28, 28, 1)');
  
  console.log('Network: Input(28x28x1) -> Dense(128)');
  console.log('Expected: Should produce validation error for Dense layer\n');
  
  if (result.errors.length > 0) {
    console.log('✅ Correctly detected errors:');
    result.errors.forEach(error => {
      console.log(`  - Node ${error.nodeId}: ${error.message}`);
    });
  } else {
    console.log('❌ No errors detected - this should have failed!');
  }
  
  console.log('\nNode shapes computed:');
  for (const [nodeId, shape] of result.nodeShapes.entries()) {
    console.log(`  - ${nodeId}: [${shape.join(', ')}]`);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test a correct network: Input -> Flatten -> Dense
  const correctDag = {
    orderedNodes: [
      {
        id: 'input1',
        type: 'Input', 
        params: { inputType: 'image_grayscale', height: 28, width: 28 }
      },
      {
        id: 'flatten1',
        type: 'Flatten',
        params: {}
      },
      {
        id: 'dense1',
        type: 'Dense',
        params: { units: 128 }
      }
    ],
    edgeMap: new Map([
      ['flatten1', ['input1']],  // flatten1 gets input from input1
      ['dense1', ['flatten1']]   // dense1 gets input from flatten1
    ])
  };
  
  const correctResult = computeShapes(correctDag, '(28, 28, 1)');
  
  console.log('Network: Input(28x28x1) -> Flatten -> Dense(128)');
  console.log('Expected: Should work without errors\n');
  
  if (correctResult.errors.length === 0) {
    console.log('✅ No errors detected - working correctly!');
  } else {
    console.log('❌ Unexpected errors:');
    correctResult.errors.forEach(error => {
      console.log(`  - Node ${error.nodeId}: ${error.message}`);
    });
  }
  
  console.log('\nNode shapes computed:');
  for (const [nodeId, shape] of correctResult.nodeShapes.entries()) {
    console.log(`  - ${nodeId}: [${shape.join(', ')}]`);
  }
}

testShapeComputationPipeline();
