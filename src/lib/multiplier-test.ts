/**
 * Test file for the new multiplier feature
 * This verifies that layers with multipliers generate correct code
 */

import { generateLayerCode } from './layer-defs'

console.log('=== Multiplier Feature Test ===')

// Test 1: Dense layer with multiplier
console.log('\n1. Testing Dense layer with multiplier:')
const denseCode1 = generateLayerCode('Dense', { units: 128, activation: 'relu', multiplier: 1 })
console.log(`Dense x1: ${denseCode1}`)

const denseCode3 = generateLayerCode('Dense', { units: 128, activation: 'relu', multiplier: 3 })
console.log(`Dense x3:\n${denseCode3}`)

// Test 2: Conv2D layer with multiplier
console.log('\n2. Testing Conv2D layer with multiplier:')
const convCode1 = generateLayerCode('Conv2D', { filters: 32, kernel_size: '(3,3)', multiplier: 1 })
console.log(`Conv2D x1: ${convCode1}`)

const convCode2 = generateLayerCode('Conv2D', { filters: 64, kernel_size: '(3,3)', multiplier: 2 })
console.log(`Conv2D x2:\n${convCode2}`)

// Test 3: LSTM layer with multiplier
console.log('\n3. Testing LSTM layer with multiplier:')
const lstmCode1 = generateLayerCode('LSTM', { units: 128, return_sequences: true, multiplier: 1 })
console.log(`LSTM x1: ${lstmCode1}`)

const lstmCode2 = generateLayerCode('LSTM', { units: 64, return_sequences: true, multiplier: 2 })
console.log(`LSTM x2:\n${lstmCode2}`)

// Test 4: Layer without multiplier support (should not have multiplier in params)
console.log('\n4. Testing layer without multiplier support:')
const flattenCode = generateLayerCode('Flatten', {})
console.log(`Flatten: ${flattenCode}`)

console.log('\n=== Test Complete ===')
