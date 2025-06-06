// Test the formatter with the problematic code
const testCode = `# Add 6 Dense layers
dense_2 = input_2
for _ in range(6):
    dense_2 = Dense(128, activation='relu')(dense_2)
    dropout = Dropout(0.2)(dense_2)
    merge = Concatenate()([dense__2, dropout])
    dense_3 = Dense(128)(merge)
    merge_1 = Concatenate()([dense, dense_3])
    output = Dense(10, activation='softmax')(merge_1)

model = Model(inputs=[input, input_1, input_2], outputs=output)`;

function formatKerasSpecific(code) {
  const lines = code.split('\n')
  const result = []
  let currentIndentLevel = 0
  let insideLoop = false
  let loopIndentLevel = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()
    
    console.log(`Line ${i}: "${trimmedLine}", insideLoop: ${insideLoop}, currentIndentLevel: ${currentIndentLevel}`)
    
    // Skip empty lines but preserve them
    if (trimmedLine === '') {
      result.push('')
      continue
    }
    
    // Track loop structures
    if (trimmedLine.startsWith('for ') && trimmedLine.endsWith(':')) {
      insideLoop = true
      loopIndentLevel = currentIndentLevel
      result.push('    '.repeat(currentIndentLevel) + trimmedLine)
      currentIndentLevel++
      continue
    }
    
    // Detect lines that should end the loop and be at root level
    const shouldEndLoop = insideLoop && (
      // Model creation and compilation
      trimmedLine.startsWith('model = Model(') ||
      trimmedLine.startsWith('model.compile(') ||
      trimmedLine.startsWith('model.summary()') ||
      // Comments indicating new sections
      trimmedLine.startsWith('# Compile') ||
      trimmedLine.startsWith('# Display') ||
      // Input layer definitions (new model sections)
      trimmedLine.match(/^[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*Input\(/) ||
      // Layer operations that aren't simple Dense repetitions
      (trimmedLine.includes(' = ') && (
        trimmedLine.includes('Dropout(') ||
        trimmedLine.includes('Concatenate(') ||
        trimmedLine.includes('Add(') ||
        trimmedLine.includes('Multiply(') ||
        trimmedLine.includes('Average(') ||
        trimmedLine.includes('Maximum(') ||
        trimmedLine.includes('Conv2D(') ||
        trimmedLine.includes('Flatten(') ||
        trimmedLine.includes('Input(') ||
        trimmedLine.startsWith('output = ') ||
        trimmedLine.startsWith('merge')
      ))
    )
    
    console.log(`  shouldEndLoop: ${shouldEndLoop}`)
    
    if (shouldEndLoop) {
      insideLoop = false
      currentIndentLevel = loopIndentLevel
      console.log(`  Ending loop, setting currentIndentLevel to ${currentIndentLevel}`)
    }
    
    // Apply proper indentation
    const indent = '    '.repeat(currentIndentLevel)
    result.push(indent + trimmedLine)
    console.log(`  Added: "${indent + trimmedLine}"`)
  }
  
  return result.join('\n')
}

console.log('Input code:')
console.log(testCode)
console.log('\nFormatting...')
const formatted = formatKerasSpecific(testCode)
console.log('\nFormatted code:')
console.log(formatted)
