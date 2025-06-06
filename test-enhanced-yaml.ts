import yaml from 'js-yaml'
import fs from 'fs'
import { validateYAMLConfig, isEnhancedConfig } from './src/lib/yaml-schema'

try {
  // Load the enhanced YAML file
  const yamlContent = fs.readFileSync('./public/layers-enhanced.yaml', 'utf8')
  const parsedYaml = yaml.load(yamlContent)
  
  console.log('🔍 Testing enhanced YAML validation...')
  
  // Test if it's detected as enhanced
  const isEnhanced = isEnhancedConfig(parsedYaml)
  console.log('✅ Is enhanced config:', isEnhanced)
  
  // Validate against schema
  const validatedConfig = validateYAMLConfig(parsedYaml)
  console.log('✅ Schema validation passed!')
  
  // Test specific enhanced features
  console.log('\n📋 Enhanced features found:')
  console.log('- Global metadata version:', validatedConfig.metadata.version)
  console.log('- Framework support:', validatedConfig.metadata.framework)
  console.log('- Settings configured:', !!validatedConfig.metadata.settings)
  
  console.log('\n📚 Layer info parameters:')
  Object.entries(validatedConfig.layers).forEach(([name, layer]) => {
    if (layer.metadata.info) {
      console.log(`- ${name}: ${layer.metadata.info}`)
    }
  })
  
  console.log('\n🛠️ Framework definitions:')
  Object.entries(validatedConfig.layers).forEach(([name, layer]) => {
    const frameworks = Object.keys(layer.frameworks)
    console.log(`- ${name}: ${frameworks.join(', ')}`)
  })
  
  console.log('\n🌐 Global definitions:')
  console.log('- Templates:', Object.keys(validatedConfig.global_templates || {}).length)
  console.log('- Formulas:', Object.keys(validatedConfig.global_formulas || {}).length)
  console.log('- Validators:', Object.keys(validatedConfig.global_validators || {}).length)
  
  console.log('\n🎉 Enhanced YAML validation completed successfully!')
  
} catch (error) {
  console.error('❌ Validation failed:', error.message)
  if (error.issues) {
    console.error('Zod validation issues:')
    error.issues.forEach((issue: any, index: number) => {
      console.error(`  ${index + 1}. ${issue.path.join('.')}: ${issue.message}`)
    })
  }
  process.exit(1)
}
