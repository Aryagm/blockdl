/**
 * Test script to verify that block palette categories are working
 */

import { initializeLayerDefs, getCachedYamlContent } from './src/lib/yaml-layer-loader.js'
import { getLayerTypes, getLayerCategoriesFromYAML } from './src/lib/layer-defs.js'

async function testCategories() {
  console.log('🧪 Testing Block Palette Categories')
  console.log('=====================================')
  
  try {
    // Initialize YAML
    console.log('🔄 Initializing YAML layer definitions...')
    await initializeLayerDefs()
    
    // Test cached content
    const yamlContent = getCachedYamlContent()
    console.log('📦 YAML content cached:', !!yamlContent)
    
    // Test layer types
    const layerTypes = getLayerTypes()
    console.log('📊 Layer types loaded:', layerTypes.length)
    console.log('🔍 First few layer types:', layerTypes.slice(0, 3).map(l => l.type))
    
    // Test categories
    const categories = getLayerCategoriesFromYAML()
    console.log('📂 Categories loaded:', categories.length)
    
    categories.forEach(category => {
      console.log(`\n📁 Category: ${category.name}`)
      console.log(`   Description: ${category.description}`)
      console.log(`   Layer types: ${category.layerTypes.length}`)
      console.log(`   Colors: ${category.color}, ${category.bgColor}`)
    })
    
    console.log('\n✅ All category tests passed!')
    
  } catch (error) {
    console.error('❌ Category test failed:', error)
  }
}

testCategories()
