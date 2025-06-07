import fs from 'fs'
import { join } from 'path'
import { loadLayersFromYAML, loadCategoriesWithLayers } from './src/lib/yaml-layer-loader'

async function testEnhancedYAMLLoader() {
  console.log('🧪 Testing Enhanced YAML Loader...')
  
  try {
    // Load the enhanced YAML file
    const yamlPath = join(process.cwd(), 'public', 'layers-enhanced.yaml')
    const yamlContent = fs.readFileSync(yamlPath, 'utf-8')
    
    console.log('✅ Enhanced YAML file loaded')
    
    // Test layer loading
    console.log('\n📋 Testing layer loading...')
    const layers = await loadLayersFromYAML(yamlContent)
    
    console.log(`✅ Successfully loaded ${Object.keys(layers).length} layers`)
    
    // List loaded layers
    console.log('\n🔗 Loaded layers:')
    Object.keys(layers).forEach(layerName => {
      const layer = layers[layerName]
      console.log(`- ${layerName}: ${layer.icon} "${layer.description}"`)
    })
    
    // Test category loading
    console.log('\n📂 Testing category loading...')
    const categories = loadCategoriesWithLayers(yamlContent)
    
    console.log(`✅ Successfully loaded ${categories.length} categories`)
    
    // List categories with layer counts
    console.log('\n📊 Categories with layer counts:')
    categories.forEach(category => {
      console.log(`- ${category.name}: ${category.layerTypes.length} layers`)
      category.layerTypes.forEach(layerType => {
        console.log(`  - ${layerType}`)
      })
    })
    
    // Test specific layer details
    console.log('\n🔍 Testing specific layer details...')
    
    const denseLayer = layers.Dense
    if (denseLayer) {
      console.log('✅ Dense layer loaded successfully')
      console.log(`- Parameters: ${denseLayer.formSpec.length} fields`)
      console.log(`- Default params: ${Object.keys(denseLayer.defaultParams).join(', ')}`)
      console.log(`- Supports multiplier: ${denseLayer.supportsMultiplier}`)
      
      // Test code generation
      const testParams = { units: 128, activation: 'relu' }
      const generatedCode = denseLayer.codeGen(testParams)
      console.log(`- Generated code: ${generatedCode}`)
    }
    
    const conv2dLayer = layers.Conv2D
    if (conv2dLayer) {
      console.log('✅ Conv2D layer loaded successfully')
      console.log(`- Parameters: ${conv2dLayer.formSpec.length} fields`)
      console.log(`- Supports multiplier: ${conv2dLayer.supportsMultiplier}`)
    }
    
    console.log('\n🎉 Enhanced YAML loader test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
      console.error('Stack trace:', error.stack)
    }
    process.exit(1)
  }
}

testEnhancedYAMLLoader()
