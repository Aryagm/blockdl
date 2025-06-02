/**
 * Test file for sequence layers (Embedding, LSTM, GRU)
 * This verifies that the new sequence layers are properly integrated
 */

import { getLayerTypes, getKerasImports, generateLayerCode } from './layer-defs'

console.log('=== Sequence Layers Integration Test ===')

// Test 1: Check if sequence layers are in layer definitions
const layerTypes = getLayerTypes()
const sequenceLayerTypes = ['Embedding', 'LSTM', 'GRU']

console.log('\n1. Checking layer definitions:')
sequenceLayerTypes.forEach(type => {
  const layer = layerTypes.find(l => l.type === type)
  if (layer) {
    console.log(`✅ ${type}: ${layer.description}`)
    console.log(`   Icon: ${layer.icon}, Keras Import: ${layer.kerasImport}`)
  } else {
    console.log(`❌ ${type}: Not found`)
  }
})

// Test 2: Check Keras imports
console.log('\n2. Checking Keras imports:')
const imports = getKerasImports()
console.log('All Keras imports:', imports)

const sequenceImports = ['Embedding', 'LSTM', 'GRU']
sequenceImports.forEach(imp => {
  if (imports.includes(imp)) {
    console.log(`✅ ${imp} import: Included`)
  } else {
    console.log(`❌ ${imp} import: Missing`)
  }
})

// Test 3: Test code generation
console.log('\n3. Testing code generation:')

// Test Embedding
const embeddingCode = generateLayerCode('Embedding', { 
  input_dim: 10000, 
  output_dim: 128, 
  input_length: 100 
})
console.log(`Embedding code: ${embeddingCode}`)

// Test LSTM with return_sequences=false
const lstmCode = generateLayerCode('LSTM', { 
  units: 128, 
  return_sequences: false 
})
console.log(`LSTM code: ${lstmCode}`)

// Test GRU with return_sequences=true
const gruCode = generateLayerCode('GRU', { 
  units: 64, 
  return_sequences: true 
})
console.log(`GRU code: ${gruCode}`)

console.log('\n=== Test Complete ===')
