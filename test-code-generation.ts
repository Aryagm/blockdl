#!/usr/bin/env npx tsx
/**
 * Test code generation from YAML templates
 */

import { loadLayersFromYAML } from './src/lib/yaml-layer-loader'
import fs from 'fs'
import { join } from 'path'

async function testCodeGeneration() {
  console.log('🧪 Testing Code Generation...')
  
  try {
    // Load the enhanced YAML file
    const yamlPath = join(process.cwd(), 'public', 'layers-enhanced.yaml')
    const yamlContent = fs.readFileSync(yamlPath, 'utf-8')
    
    const layerDefsRecord = await loadLayersFromYAML(yamlContent)
    const layerDefs = Object.values(layerDefsRecord)
    console.log('✅ YAML layers loaded')
    
    // Test Conv2D code generation
    const conv2d = layerDefs.find(layer => layer.type === 'Conv2D')
    if (conv2d) {
      console.log('\n🔲 Testing Conv2D code generation...')
      
      const testParams = {
        filters: 32,
        kernel_size: 3,
        strides: 1,
        padding: 'same',
        multiplier: 1
      }
      
      const generatedCode = conv2d.codeGen(testParams)
      console.log('Generated code:', generatedCode)
      
      // Test with multiplier
      const testParamsWithMultiplier = {
        ...testParams,
        multiplier: 3
      }
      
      const generatedCodeMultiplied = conv2d.codeGen(testParamsWithMultiplier)
      console.log('Generated code with multiplier (3):', generatedCodeMultiplied)
    }
    
    // Test Dense layer code generation
    const dense = layerDefs.find(layer => layer.type === 'Dense')
    if (dense) {
      console.log('\n🔗 Testing Dense code generation...')
      
      const testParams = {
        units: 128,
        activation: 'relu',
        multiplier: 1
      }
      
      const generatedCode = dense.codeGen(testParams)
      console.log('Generated code:', generatedCode)
    }
    
    // Test Merge layer code generation
    const merge = layerDefs.find(layer => layer.type === 'Merge')
    if (merge) {
      console.log('\n🔀 Testing Merge code generation...')
      
      const testParams = {
        mode: 'concatenate',
        axis: -1
      }
      
      const generatedCode = merge.codeGen(testParams)
      console.log('Generated code (concatenate):', generatedCode)
      
      // Test with different mode
      const testParams2 = {
        mode: 'add'
      }
      
      const generatedCode2 = merge.codeGen(testParams2)
      console.log('Generated code (add):', generatedCode2)
    }
    
    // Test Dropout with conditional parameters
    const dropout = layerDefs.find(layer => layer.type === 'Dropout')
    if (dropout) {
      console.log('\n🎲 Testing Dropout code generation...')
      
      const testParams = {
        rate: 0.2,
        seed: 42
      }
      
      const generatedCode = dropout.codeGen(testParams)
      console.log('Generated code (with seed):', generatedCode)
      
      // Test without optional parameters
      const testParams2 = {
        rate: 0.3
      }
      
      const generatedCode2 = dropout.codeGen(testParams2)
      console.log('Generated code (without seed):', generatedCode2)
    }
    
    console.log('\n🎉 Code generation test completed!')
    
  } catch (error) {
    console.error('❌ Error during code generation test:', error)
  }
}

testCodeGeneration()
