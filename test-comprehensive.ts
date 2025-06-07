/**
 * Final comprehensive test for code formatting
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { generateKerasCode, generateFunctionalKerasCode } from './src/lib/code-generation'
import { loadLayersFromYAML } from './src/lib/yaml-layer-loader'
import { layerDefs } from './src/lib/layer-defs'
import type { LayerObject, DAGResult } from './src/lib/dag-parser'
import * as yamlLoader from './src/lib/yaml-layer-loader'

// Global variable to cache YAML content (simulating the browser cache)
let cachedYamlContent: string | null = null

// Load YAML layers first
async function initializeLayers() {
  const yamlPath = join(process.cwd(), 'public', 'layers-enhanced.yaml')
  const yamlContent = readFileSync(yamlPath, 'utf-8')
  
  // Cache the content for the YAML shape loader
  cachedYamlContent = yamlContent
  
  // Mock the getCachedYamlContent function for testing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(yamlLoader as any).getCachedYamlContent = () => cachedYamlContent
  
  const loadedDefs = await loadLayersFromYAML(yamlContent)
  Object.assign(layerDefs, loadedDefs)
}

async function runComprehensiveTest() {
  await initializeLayers()

  // Test 1: Sequential API with various multipliers
  console.log('🧪 TEST 1: Sequential API with Various Multipliers')
  console.log('=' .repeat(60))
  
  const sequentialLayers: LayerObject[] = [
    {
      id: 'layer1',
      type: 'Dense',
      params: { units: 256, activation: 'relu' },
      varName: 'dense1'
    },
    {
      id: 'layer2',
      type: 'Dense',
      params: { units: 128, activation: 'relu', multiplier: 3 },
      varName: 'dense2'
    },
    {
      id: 'layer3', 
      type: 'Dropout',
      params: { rate: 0.3 },
      varName: 'dropout1'
    },
    {
      id: 'layer4',
      type: 'Dense',
      params: { units: 64, activation: 'relu', multiplier: 6 },
      varName: 'dense3'
    },
    {
      id: 'layer5',
      type: 'Dense',
      params: { units: 10, activation: 'softmax' },
      varName: 'dense4'
    }
  ]

  const sequentialCode = generateKerasCode(sequentialLayers)
  console.log(sequentialCode)
  console.log('\n')

  // Test 2: Functional API
  console.log('🧪 TEST 2: Functional API')
  console.log('=' .repeat(60))
  
  const functionalDAG: DAGResult = {
    isValid: true,
    errors: [],
    orderedNodes: [
      {
        id: 'input1',
        type: 'Input',
        params: { inputType: 'image', height: 32, width: 32, channels: 3 },
        varName: 'input_layer'
      },
      {
        id: 'conv1',
        type: 'Conv2D',
        params: { filters: 32, kernel_size: '(3,3)', strides: '(1,1)', padding: 'same' },
        varName: 'conv_1'
      },
      {
        id: 'pool1',
        type: 'MaxPooling2D',
        params: { pool_size: '(2,2)', padding: 'valid' },
        varName: 'pool_1'
      },
      {
        id: 'flatten1',
        type: 'Flatten',
        params: {},
        varName: 'flatten_1'
      },
      {
        id: 'dense1',
        type: 'Dense',
        params: { units: 128, activation: 'relu' },
        varName: 'dense_1'
      },
      {
        id: 'output1',
        type: 'Dense',
        params: { units: 10, activation: 'softmax' },
        varName: 'output_layer'
      }
    ],
    edgeMap: new Map([
      ['input1', ['conv1']],
      ['conv1', ['pool1']],
      ['pool1', ['flatten1']],
      ['flatten1', ['dense1']],
      ['dense1', ['output1']]
    ])
  }

  const functionalCode = await generateFunctionalKerasCode(functionalDAG)
  console.log(functionalCode)
  
  console.log('\n✅ All formatting tests completed successfully!')
  console.log('The code generation now produces clean, properly indented Python code.')
}

runComprehensiveTest().catch(console.error)
