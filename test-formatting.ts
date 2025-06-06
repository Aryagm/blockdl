/**
 * Test script to check current code generation formatting
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { generateKerasCode } from './src/lib/code-generation'
import { loadLayersFromYAML } from './src/lib/yaml-layer-loader'
import { layerDefs } from './src/lib/layer-defs'
import type { LayerObject } from './src/lib/dag-parser'

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

  // Create test layers including multiplier
  const testLayers: LayerObject[] = [
    {
      id: 'layer1',
      type: 'Dense',
      params: { units: 128, activation: 'relu', multiplier: 3 },
      varName: 'dense1'
    },
    {
      id: 'layer2', 
      type: 'Dropout',
      params: { rate: 0.5 },
      varName: 'dropout1'
    },
    {
      id: 'layer3',
      type: 'Dense', 
      params: { units: 64, activation: 'relu', multiplier: 8 },
      varName: 'dense2'
    },
    {
      id: 'layer4',
      type: 'Dense', 
      params: { units: 10, activation: 'softmax' },
      varName: 'dense3'
    }
  ]

  console.log('Generated Keras Code:')
  console.log('=' .repeat(50))
  const generatedCode = generateKerasCode(testLayers)
  console.log(generatedCode)
  console.log('=' .repeat(50))
}

runTest().catch(console.error)
