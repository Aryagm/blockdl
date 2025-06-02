/**
 * Test file to verify that multiplier comments are positioned correctly
 */

import { generateLayerCode } from './layer-defs'
import { generateKerasCode } from './graph-utils'

// Test case 1: Dense layer with multiplier <= 5 (should generate individual layers)
console.log('=== Test 1: Dense layer with multiplier = 3 ===')
const denseSmall = generateLayerCode('Dense', { units: 128, multiplier: 3 })
console.log(denseSmall)

// Test case 2: Dense layer with multiplier > 5 (should generate loop with comment)
console.log('\n=== Test 2: Dense layer with multiplier = 10 ===')
const denseLarge = generateLayerCode('Dense', { units: 128, multiplier: 10 })
console.log(denseLarge)

// Test case 3: Conv2D layer with multiplier > 5
console.log('\n=== Test 3: Conv2D layer with multiplier = 8 ===')
const conv2dLarge = generateLayerCode('Conv2D', { filters: 32, multiplier: 8 })
console.log(conv2dLarge)

// Test case 4: LSTM layer with multiplier > 5
console.log('\n=== Test 4: LSTM layer with multiplier = 7 ===')
const lstmLarge = generateLayerCode('LSTM', { units: 64, multiplier: 7 })
console.log(lstmLarge)

// Test case 5: Full Sequential model with multiplier layers
console.log('\n=== Test 5: Full Sequential model with multiplier layers ===')
const testLayers = [
  { id: '1', type: 'Dense', params: { units: 128, multiplier: 3 } },
  { id: '2', type: 'Dense', params: { units: 64, multiplier: 10 } },
  { id: '3', type: 'Conv2D', params: { filters: 32, multiplier: 6 } },
  { id: '4', type: 'Dense', params: { units: 10 } }
]

const fullCode = generateKerasCode(testLayers)
console.log(fullCode)
