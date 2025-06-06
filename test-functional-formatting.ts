/**
 * Test script to check Functional API formatting
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { generateFunctionalKerasCode } from './src/lib/code-generation'
import { loadLayersFromYAML } from './src/lib/yaml-layer-loader'
import { layerDefs } from './src/lib/layer-defs'
import type { DAGResult } from './src/lib/dag-parser'

// Load YAML layers first
async function initializeLayers() {
  const yamlPath = join(process.cwd(), 'public', 'layers.yaml')
  const yamlContent = readFileSync(yamlPath, 'utf-8')
  const loadedDefs = await loadLayersFromYAML(yamlContent)
  
  // Populate the layerDefs object
  Object.assign(layerDefs, loadedDefs)
}

async function runTest() {
  await initializeLayers()

  // Create test DAG result
  const testDAG: DAGResult = {
    isValid: true,
    orderedNodes: [
      {
        id: 'input1',
        type: 'Input',
        params: { inputType: 'image', height: 28, width: 28, channels: 1 },
        varName: 'input_layer'
      },
      {
        id: 'dense1',
        type: 'Dense',
        params: { units: 128, activation: 'relu' },
        varName: 'dense_1'
      },
      {
        id: 'dropout1',
        type: 'Dropout',
        params: { rate: 0.5 },
        varName: 'dropout_1'
      },
      {
        id: 'dense2',
        type: 'Dense',
        params: { units: 10, activation: 'softmax' },
        varName: 'dense_2'
      }
    ],
    edgeMap: new Map([
      ['input1', ['dense1']],
      ['dense1', ['dropout1']],
      ['dropout1', ['dense2']]
    ])
  }

  console.log('Generated Functional API Keras Code:')
  console.log('=' .repeat(50))
  const generatedCode = generateFunctionalKerasCode(testDAG)
  console.log(generatedCode)
  console.log('=' .repeat(50))
}

runTest().catch(console.error)
