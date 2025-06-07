#!/usr/bin/env npx tsx
/**
 * Debug conditional processing
 */

// Test regex patterns for conditional processing
function testRegexPatterns() {
  console.log('🧪 Testing Regex Patterns...')
  
  const template = "Dropout({{rate}}{% if noise_shape %}, noise_shape={{noise_shape}}{% endif %}{% if seed is not none %}, seed={{seed}}{% endif %})"
  console.log('Original template:', template)
  
  // Test "is not none" pattern with improved regex
  const isNotNonePattern = /\{%\s*if\s+(\w+)\s+is\s+not\s+none\s*%\}((?:(?!\{%\s*endif\s*%\}).)*)?\{%\s*endif\s*%\}/g
  const isNotNoneMatches = [...template.matchAll(isNotNonePattern)]
  console.log('Is not none matches:', isNotNoneMatches.length)
  isNotNoneMatches.forEach((match, i) => {
    console.log(`  Match ${i + 1}:`, match[0])
    console.log(`  Variable:`, match[1])
    console.log(`  Content:`, match[2])
  })
  
  // Test variable existence pattern with improved regex
  const varExistencePattern = /\{%\s*if\s+(\w+)\s*%\}((?:(?!\{%\s*endif\s*%\}).)*)?\{%\s*endif\s*%\}/g
  const varExistenceMatches = [...template.matchAll(varExistencePattern)]
  console.log('Variable existence matches:', varExistenceMatches.length)
  varExistenceMatches.forEach((match, i) => {
    console.log(`  Match ${i + 1}:`, match[0])
    console.log(`  Variable:`, match[1])
    console.log(`  Content:`, match[2])
  })
  
  // Test manual processing
  console.log('\n🔧 Manual Processing Test...')
  
  let result = template.trim()
  
  // Process "is not none" first
  result = result.replace(isNotNonePattern, (_, varName, content) => {
    console.log(`Processing "is not none": ${varName}, content: "${content}"`)
    const testParams = { seed: 42 }
    const value = testParams[varName]
    return value !== null && value !== undefined && value !== '' ? content.trim() : ''
  })
  
  console.log('After "is not none":', result)
  
  // Process variable existence
  result = result.replace(varExistencePattern, (_, varName, content) => {
    console.log(`Processing variable existence: ${varName}, content: "${content}"`)
    const testParams = { noise_shape: null }
    const value = testParams[varName]
    return value && value !== '' && value !== null && value !== undefined ? content.trim() : ''
  })
  
  console.log('Final result:', result)
}

testRegexPatterns()
