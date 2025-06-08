/**
 * Test  // Test a broken network: Input -> Dense (should fail validation)
  const brokenDag: { orderedNodes: LayerObject[], edgeMap: Map<string, string[]> } = {
    orderedNodes: [
      {
        id: 'input1',
        type: 'Input', 
        params: { inputType: 'image_grayscale', height: 28, width: 28 },
        varName: 'input1'
      },
      {
        id: 'dense1',
        type: 'Dense',
        params: { units: 128 },
        varName: 'dense1'
      }
    ],
    edgeMap: new Map([
      ['input1', ['dense1']]  // input1 connects to dense1
    ])
  };utation pipeline with a network that should produce errors
 */

import { computeShapes } from './src/lib/shape-computation.ts';
import type { LayerObject } from './src/lib/dag-parser.ts';

function testShapeComputationPipeline() {
  console.log('Testing shape computation pipeline...\n');
  
  // Create a simple DAG that should produce a shape error
  // Input (28x28x1) -> Dense (should fail)
  const dag: { orderedNodes: LayerObject[], edgeMap: Map<string, string[]> } = {
    orderedNodes: [
      {
        id: 'input1',
        type: 'Input',
        params: { inputType: 'image_grayscale', height: 28, width: 28 },
        varName: 'input1'
      },
      {
        id: 'dense1', 
        type: 'Dense',
        params: { units: 128 },
        varName: 'dense1'
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
  
  // Test a network with proper connections but incompatible shapes: Input -> Dense (bypassing shape validation)
  const shapeErrorDag: { orderedNodes: LayerObject[], edgeMap: Map<string, string[]> } = {
    orderedNodes: [
      {
        id: 'input1',
        type: 'Input', 
        params: { inputType: 'image_grayscale', height: 28, width: 28 },
        varName: 'input1'
      },
      {
        id: 'dense1',
        type: 'Dense',
        params: { units: 128 },
        varName: 'dense1'
      }
    ],
    edgeMap: new Map([
      ['input1', ['dense1']]  // input1 connects to dense1 - this should fail shape validation
    ])
  };
  
  const shapeResult = computeShapes(shapeErrorDag, '(28, 28, 1)');
  
  console.log('Network: Input(28x28x1) -> Dense(128) [with connections]');
  console.log('Expected: Should produce shape validation error for Dense layer\n');
  
  if (shapeResult.errors.length > 0) {
    console.log('✅ Correctly detected shape validation errors:');
    shapeResult.errors.forEach(error => {
      console.log(`  - Node ${error.nodeId}: ${error.message}`);
    });
  } else {
    console.log('❌ No errors detected - this should have failed shape validation!');
  }
  
  console.log('\nNode shapes computed:');
  for (const [nodeId, shape] of shapeResult.nodeShapes.entries()) {
    console.log(`  - ${nodeId}: [${shape.join(', ')}]`);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test a correct network: Input -> Flatten -> Dense
  const correctDag: { orderedNodes: LayerObject[], edgeMap: Map<string, string[]> } = {
    orderedNodes: [
      {
        id: 'input1',
        type: 'Input', 
        params: { inputType: 'image_grayscale', height: 28, width: 28 },
        varName: 'input1'
      },
      {
        id: 'flatten1',
        type: 'Flatten',
        params: {},
        varName: 'flatten1'
      },
      {
        id: 'dense1',
        type: 'Dense',
        params: { units: 128 },
        varName: 'dense1'
      }
    ],
    edgeMap: new Map([
      ['input1', ['flatten1']],  // input1 connects to flatten1
      ['flatten1', ['dense1']]   // flatten1 connects to dense1
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
