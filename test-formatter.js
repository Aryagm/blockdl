// Quick test of the formatter using simple JavaScript version

function formatKerasCode(code) {
    const lines = code.split('\n')
    const formattedLines = []
    
    let indentLevel = 0
    const indentSize = 4
    
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
        }
        
        if (trimmedLine === ')') {
            indentLevel = Math.max(0, indentLevel - 1)
        }
        
        // Apply proper indentation
        const indent = ' '.repeat(indentLevel * indentSize)
        formattedLines.push(`${indent}${trimmedLine}`)
        
        // Adjust indent level after processing the line
        if (trimmedLine.endsWith('Sequential([')) {
            indentLevel++
        } else if (trimmedLine.endsWith('[')) {
            indentLevel++
        } else if (trimmedLine.endsWith('(') && 
                   (trimmedLine.includes('model.compile') || trimmedLine.includes('Model('))) {
            indentLevel++
        } else if (trimmedLine.endsWith(':')) {
            indentLevel++
        }
    }
    
    // Clean up spacing
    const result = []
    let previousLineWasEmpty = false
    
    for (let i = 0; i < formattedLines.length; i++) {
        const line = formattedLines[i]
        const trimmedLine = line.trim()
        
        if (trimmedLine === '') {
            if (!previousLineWasEmpty) {
                result.push('')
                previousLineWasEmpty = true
            }
        } else {
            // Add spacing before section headers
            if ((trimmedLine.startsWith('# Create the model') || 
                 trimmedLine.startsWith('# Compile the model') ||
                 trimmedLine.startsWith('# Display model summary')) &&
                result.length > 0 && result[result.length - 1].trim() !== '') {
                result.push('')
            }
            
            result.push(line)
            previousLineWasEmpty = false
            
            // Add spacing after certain lines
            if ((trimmedLine.startsWith('import ') || 
                 trimmedLine.startsWith('from ') ||
                 trimmedLine === ')' || 
                 trimmedLine === '])') && 
                i < formattedLines.length - 1) {
                const nextLine = formattedLines[i + 1]?.trim()
                if (nextLine && nextLine !== '') {
                    result.push('')
                }
            }
        }
    }
    
    // Remove trailing empty lines
    while (result.length > 0 && result[result.length - 1].trim() === '') {
        result.pop()
    }
    
    return result.join('\n')
}

const testCode = `import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Conv2D

# Create the model
    model = Sequential([
        Input(shape=(28, 28, 1)),
        Conv2D(32, kernel_size=(3,3), strides=(1,1), padding='same'),
        Conv2D(32, kernel_size=(3,3), strides=(1,1), padding='same'),
        Conv2D(32, kernel_size=(3,3), strides=(1,1), padding='same'),
])

# Compile the model
model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Display model summary
model.summary()`

console.log('BEFORE:')
console.log(testCode)
console.log('\n' + '='.repeat(50) + '\n')
console.log('AFTER:')
console.log(formatKerasCode(testCode))
