"use strict";
/**
 * Comprehensive test of the YAML-driven BlockDL system (simplified)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const code_generation_1 = require("./src/lib/code-generation");
const dag_parser_1 = require("./src/lib/dag-parser");
const shape_computation_1 = require("./src/lib/shape-computation");
const yaml_layer_loader_1 = require("./src/lib/yaml-layer-loader");
const layer_defs_1 = require("./src/lib/layer-defs");
// Mock fetch for YAML loading in Node.js environment
global.fetch = async (input) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url === '/layers-enhanced.yaml') {
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const path = await Promise.resolve().then(() => __importStar(require('path')));
        const { fileURLToPath } = await Promise.resolve().then(() => __importStar(require('url')));
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
    const dag = (0, dag_parser_1.parseGraphToDAG)(sequentialNodes, sequentialEdges);
    console.log(`✅ DAG parsing: ${dag.isValid ? 'SUCCESS' : 'FAILED'}`);
    if (!dag.isValid) {
        console.log('❌ DAG errors:', dag.errors);
        return;
    }
    // Test code generation
    const sequentialCode = (0, code_generation_1.generateKerasCode)(dag.orderedNodes);
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
    const dag = (0, dag_parser_1.parseGraphToDAG)(functionalNodes, functionalEdges);
    console.log(`✅ DAG parsing: ${dag.isValid ? 'SUCCESS' : 'FAILED'}`);
    if (!dag.isValid) {
        console.log('❌ DAG errors:', dag.errors);
        return;
    }
    // Test functional code generation
    try {
        const functionalCode = await (0, code_generation_1.generateFunctionalKerasCode)(dag);
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
    const dag = (0, dag_parser_1.parseGraphToDAG)(nodes, edges);
    if (dag.isValid) {
        try {
            const result = await (0, shape_computation_1.computeShapes)(dag, '(28, 28, 1)');
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
        // Initialize layer definitions from YAML first
        await (0, yaml_layer_loader_1.initializeLayerDefs)();
        console.log(`✅ Loaded ${Object.keys(layer_defs_1.layerDefs).length} layer definitions from YAML\n`);
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
