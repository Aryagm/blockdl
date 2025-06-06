/**
 * Simple and reliable Python/Keras code formatter
 */

export interface CodeFormatOptions {
  indentSize?: number
}

const DEFAULT_FORMAT_OPTIONS: Required<CodeFormatOptions> = {
  indentSize: 4
}

/**
 * Formats Python/Keras code with proper indentation and spacing
 */
export function formatPythonCode(code: string, options: CodeFormatOptions = {}): string {
  const opts = { ...DEFAULT_FORMAT_OPTIONS, ...options }
  const lines = code.split('\n')
  const formattedLines: string[] = []
  
  let indentLevel = 0
  let insideSequential = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()
    
    // Skip empty lines but preserve them
    if (trimmedLine === '') {
      formattedLines.push('')
      continue
    }
    
    // Adjust indent level before processing the line
    if (trimmedLine === ']' || trimmedLine === '])') {
      indentLevel = Math.max(0, indentLevel - 1)
      insideSequential = false
    }
    
    if (trimmedLine === ')') {
      indentLevel = Math.max(0, indentLevel - 1)
    }
    
    // Apply proper indentation
    const indent = ' '.repeat(indentLevel * opts.indentSize)
    formattedLines.push(`${indent}${trimmedLine}`)
    
    // Adjust indent level after processing the line
    if (trimmedLine.endsWith('Sequential([')) {
      indentLevel++
      insideSequential = true
    } else if (trimmedLine.endsWith('[') && !insideSequential) {
      indentLevel++
    } else if (trimmedLine.endsWith('(') && 
               (trimmedLine.includes('model.compile') || trimmedLine.includes('Model('))) {
      indentLevel++
    } else if (trimmedLine.endsWith(':')) {
      // Python control structures
      indentLevel++
    }
  }
  
  return cleanupSpacing(formattedLines.join('\n'))
}

/**
 * Cleans up spacing in the formatted code
 */
function cleanupSpacing(code: string): string {
  const lines = code.split('\n')
  const cleanedLines: string[] = []
  let previousLineWasEmpty = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()
    
    if (trimmedLine === '') {
      // Don't add multiple consecutive empty lines
      if (!previousLineWasEmpty) {
        cleanedLines.push('')
        previousLineWasEmpty = true
      }
    } else {
      // Add spacing before section headers
      if (shouldAddSpacingBefore(trimmedLine) && 
          cleanedLines.length > 0 && 
          cleanedLines[cleanedLines.length - 1].trim() !== '') {
        cleanedLines.push('')
      }
      
      cleanedLines.push(line)
      previousLineWasEmpty = false
      
      // Add spacing after certain lines
      if (shouldAddSpacingAfter(trimmedLine) && i < lines.length - 1) {
        const nextLine = lines[i + 1]?.trim()
        if (nextLine && nextLine !== '') {
          cleanedLines.push('')
        }
      }
    }
  }
  
  // Remove trailing empty lines
  while (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1].trim() === '') {
    cleanedLines.pop()
  }
  
  return cleanedLines.join('\n')
}

/**
 * Determines if spacing should be added before certain lines
 */
function shouldAddSpacingBefore(line: string): boolean {
  return (
    line.startsWith('# Create the model') ||
    line.startsWith('# Compile the model') ||
    line.startsWith('# Display model summary') ||
    line.startsWith('model = Model(')
  )
}

/**
 * Determines if spacing should be added after certain lines
 */
function shouldAddSpacingAfter(line: string): boolean {
  return (
    line === ')' ||
    line === '])'
  )
}

/**
 * Formats Keras model code specifically
 */
export function formatKerasCode(code: string, options: CodeFormatOptions = {}): string {
  // Apply Python formatting first
  let formatted = formatPythonCode(code, options)
  
  // Apply Keras-specific improvements
  formatted = formatKerasSpecific(formatted)
  
  return formatted
}

/**
 * Applies Keras-specific formatting improvements
 */
function formatKerasSpecific(code: string): string {
  const lines = code.split('\n')
  const result: string[] = []
  let currentIndentLevel = 0
  let insideLoop = false
  let loopIndentLevel = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()
    
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
    
    if (shouldEndLoop) {
      insideLoop = false
      currentIndentLevel = loopIndentLevel
    }
    
    // Special handling for statements that should always be at root level
    if (trimmedLine.startsWith('import ') || 
        trimmedLine.startsWith('from ') ||
        trimmedLine.startsWith('model = Model(') ||
        trimmedLine.startsWith('# Compile') ||
        trimmedLine.startsWith('model.compile(') ||
        trimmedLine.startsWith('# Display') ||
        trimmedLine.startsWith('model.summary()')) {
      currentIndentLevel = 0
      insideLoop = false
    }
    
    // Handle variable assignments that should be at root level
    if (trimmedLine.match(/^[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*Input\(/)) {
      currentIndentLevel = 0
      insideLoop = false
    }
    
    // Handle comments that indicate sections
    if (trimmedLine.startsWith('# Add ') && trimmedLine.includes('layers')) {
      currentIndentLevel = 0
      insideLoop = false
    }
    
    // Apply proper indentation
    const indent = '    '.repeat(currentIndentLevel)
    result.push(indent + trimmedLine)
    
    // Adjust indent for multi-line constructs
    if (trimmedLine.endsWith('(') && 
        (trimmedLine.includes('model.compile') || trimmedLine.includes('Model('))) {
      currentIndentLevel++
    } else if (trimmedLine === ')') {
      currentIndentLevel = Math.max(0, currentIndentLevel - 1)
    }
  }
  
  return result.join('\n')
}
