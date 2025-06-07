/**
 * Comprehensive test of the YAML-driven BlockDL system (simplified)
 */
import { generateKerasCode, generateFunctionalKerasCode } from './src/lib/code-generation';
import { parseGraphToDAG } from './src/lib/dag-parser';
import { computeShapes } from './src/lib/shape-computation';
// Mock fetch for YAML loading in Node.js environment
global.fetch = async (input) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url === '/layers-enhanced.yaml') {
        const fs = await import('fs/promises');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        const currentDir = path.dirname(fileURLToPath(import.meta.url));
        const yamlPath = path.join(currentDir, 'public', 'layers-enhanced.yaml');
        const yamlContent = await fs.readFile(yamlPath, 'utf-8');
        return new Response(yamlContent, { status: 200 });
    }
    throw new Error(`Mock fetch: URL not supported: ${url}`);
};
async function testSequentialModel() {
    console.log('🧪 TEST 1: Sequential Model Code Generation');
    console.log('='.repeat(60));
    const sequentialNodes = [
        { id: 'input1', position: { x: 0, y: 0 }, data: { type: 'Input', params: { inputType: 'flat_data', flatSize: 784 } } },
        { id: 'dense1', position: { x: 0, y: 100 }, data: { type: 'Dense', params: { units: 128, activation: 'relu' } } },
        { id: 'dense2', position: { x: 0, y: 200 }, data: { type: 'Dense', params: { units: 64, activation: 'relu' } } },
        { id: 'output1', position: { x: 0, y: 300 }, data: { type: 'Output', params: { outputType: 'multiclass', numClasses: 10 } } }
    ];
    const sequentialEdges = [
        { id: 'e1', source: 'input1', target: 'dense1' },
        { id: 'e2', source: 'dense1', target: 'dense2' },
        { id: 'e3', source: 'dense2', target: 'output1' }
    ];
    // Test DAG parsing
    const dag = parseGraphToDAG(sequentialNodes, sequentialEdges);
    console.log(`✅ DAG parsing: ${dag.isValid ? 'SUCCESS' : 'FAILED'}`);
    if (!dag.isValid) {
        console.log('❌ DAG errors:', dag.errors);
        return;
    }
    // Test code generation
    const sequentialCode = generateKerasCode(dag.orderedNodes);
    console.log('✅ Sequential code generation: SUCCESS');
    console.log('\nGenerated Sequential Code:');
    console.log(sequentialCode);
}
async function testFunctionalModel() {
    console.log('\n🧪 TEST 2: Functional Model Code Generation');
    console.log('='.repeat(60));
    const functionalNodes = [
        { id: 'input1', position: { x: 0, y: 0 }, data: { type: 'Input', params: { inputType: 'image_color', height: 32, width: 32 } } },
        { id: 'conv1', position: { x: 0, y: 100 }, data: { type: 'Conv2D', params: { filters: 32, kernel_size: '(3,3)', strides: '(1,1)', padding: 'same' } } },
        { id: 'pool1', position: { x: 0, y: 200 }, data: { type: 'MaxPool2D', params: { pool_size: '(2,2)', padding: 'valid' } } },
        { id: 'flatten1', position: { x: 0, y: 300 }, data: { type: 'Flatten', params: {} } },
        { id: 'dense1', position: { x: 0, y: 400 }, data: { type: 'Dense', params: { units: 64, activation: 'relu' } } },
        { id: 'output1', position: { x: 0, y: 500 }, data: { type: 'Output', params: { outputType: 'multiclass', numClasses: 10 } } }
    ];
    const functionalEdges = [
        { id: 'e1', source: 'input1', target: 'conv1' },
        { id: 'e2', source: 'conv1', target: 'pool1' },
        { id: 'e3', source: 'pool1', target: 'flatten1' },
        { id: 'e4', source: 'flatten1', target: 'dense1' },
        { id: 'e5', source: 'dense1', target: 'output1' }
    ];
    // Test DAG parsing
    const dag = parseGraphToDAG(functionalNodes, functionalEdges);
    console.log(`✅ DAG parsing: ${dag.isValid ? 'SUCCESS' : 'FAILED'}`);
    if (!dag.isValid) {
        console.log('❌ DAG errors:', dag.errors);
        return;
    }
    // Test functional code generation
    try {
        const functionalCode = await generateFunctionalKerasCode(dag);
        console.log('✅ Functional code generation: SUCCESS');
        console.log('\nGenerated Functional Code:');
        console.log(functionalCode);
    }
    catch (error) {
        console.log('❌ Functional code generation failed:', error);
    }
}
async function testShapeComputation() {
    console.log('\n🧪 TEST 3: Shape Computation');
    console.log('='.repeat(60));
    const nodes = [
        { id: 'input1', position: { x: 0, y: 0 }, data: { type: 'Input', params: { inputType: 'image_grayscale', height: 28, width: 28 } } },
        { id: 'conv1', position: { x: 0, y: 100 }, data: { type: 'Conv2D', params: { filters: 32, kernel_size: '(3,3)', strides: '(1,1)', padding: 'same' } } },
        { id: 'pool1', position: { x: 0, y: 200 }, data: { type: 'MaxPool2D', params: { pool_size: '(2,2)', padding: 'valid' } } },
        { id: 'flatten1', position: { x: 0, y: 300 }, data: { type: 'Flatten', params: {} } },
        { id: 'dense1', position: { x: 0, y: 400 }, data: { type: 'Dense', params: { units: 128 } } }
    ];
    const edges = [
        { id: 'e1', source: 'input1', target: 'conv1' },
        { id: 'e2', source: 'conv1', target: 'pool1' },
        { id: 'e3', source: 'pool1', target: 'flatten1' },
        { id: 'e4', source: 'flatten1', target: 'dense1' }
    ];
    // Test shape computation
    const dag = parseGraphToDAG(nodes, edges);
    if (dag.isValid) {
        try {
            const result = await computeShapes(dag, '(28, 28, 1)');
            console.log(`✅ Shape computation: ${result.errors.length === 0 ? 'SUCCESS' : 'PARTIAL'}`);
            if (result.errors.length > 0) {
                console.log('⚠️ Shape computation errors:');
                result.errors.forEach(error => {
                    console.log(`  - ${error.nodeId}: ${error.message}`);
                });
            }
            console.log('\nComputed shapes:');
            for (const [nodeId, shape] of result.nodeShapes.entries()) {
                console.log(`  - ${nodeId}: [${shape.join(', ')}]`);
            }
        }
        catch (error) {
            console.log('❌ Shape computation failed:', error);
        }
    }
    else {
        console.log('❌ Cannot test shape computation due to invalid DAG');
    }
}
async function runAllTests() {
    console.log('🚀 Running Comprehensive YAML-driven BlockDL Tests');
    console.log('='.repeat(80));
    try {
        await testSequentialModel();
        await testFunctionalModel();
        await testShapeComputation();
        console.log('\n🎉 All tests completed!');
        console.log('='.repeat(80));
    }
    catch (error) {
        console.error('❌ Test suite failed:', error);
    }
}
runAllTests().catch(console.error);
