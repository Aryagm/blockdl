/**
 * Keras code generation utilities for both Sequential and Functional API
 */

import type { DAGResult, LayerObject } from './dag-parser'
import { generateLayerCode, getUsedKerasImports } from './layer-defs'
import { computeInputShape } from './input-layer-utils'

/**
 * Generates Keras/TensorFlow Python code from a DAG structure
 */
export function generateKerasCode(layers: LayerObject[]): string {
  if (layers.length === 0) {
    return '# No layers to generate code for'
  }

  // For now, we'll generate Sequential model code for backward compatibility
  // TODO: Add support for Functional API for complex DAG structures
  
  // Generate imports using only the layers that are actually used
  const usedLayerTypes = layers.map(layer => layer.type)
  const kerasImports = getUsedKerasImports(usedLayerTypes)
  const imports = [
    'import tensorflow as tf',
    'from tensorflow.keras.models import Sequential',
    `from tensorflow.keras.layers import ${kerasImports.join(', ')}`
  ]

  // Generate model creation
  const modelLines: string[] = [
    '',
    '# Create the model',
    'model = Sequential(['
  ]

  // Generate layer code
  layers.forEach((layer, index) => {
    const layerCode = generateLayerCode(layer.type, layer.params)
    if (layerCode) {
      const isLastLayer = index === layers.length - 1
      
      // Handle multi-line layer code (for multiplier > 5)
      const lines = layerCode.split('\n')
      if (lines.length > 1) {
        // Multi-line code: add comment first, then the layer code
        lines.forEach((line, lineIndex) => {
          if (lineIndex === 0) {
            // First line is the comment
            modelLines.push(`    ${line}`)
          } else {
            // Subsequent lines - check if it's spread operator syntax
            const trimmedLine = line.trim()
            if (trimmedLine.startsWith('*[') && trimmedLine.endsWith(']')) {
              // Spread operator syntax - add comma unless it's the last layer
              modelLines.push(`${line}${isLastLayer ? '' : ','}`)
            } else {
              // Regular layer code - add comma only if it doesn't already end with one
              const hasComma = trimmedLine.endsWith(',')
              const needsComma = !hasComma && !isLastLayer
              modelLines.push(`${line}${needsComma ? ',' : ''}`)
            }
          }
        })
      } else {
        // Single line code - check if it's spread operator syntax
        const trimmedCode = layerCode.trim()
        if (trimmedCode.startsWith('*[') && trimmedCode.endsWith(']')) {
          // Spread operator syntax - add comma unless it's the last layer
          modelLines.push(`    ${layerCode}${isLastLayer ? '' : ','}`)
        } else {
          // Regular layer code - add comma unless it's the last layer
          modelLines.push(`    ${layerCode}${isLastLayer ? '' : ','}`)
        }
      }
    }
  })

  modelLines.push('])')

  // Generate compilation and summary
  const compilationLines: string[] = [
    '',
    '# Compile the model',
    'model.compile(',
    "    optimizer='adam',",
    "    loss='categorical_crossentropy',",
    "    metrics=['accuracy']",
    ')',
    '',
    '# Display model summary',
    'model.summary()'
  ]

  return [...imports, ...modelLines, ...compilationLines].join('\n')
}

/**
 * Generates Keras Functional API code for complex DAG structures
 */
export function generateFunctionalKerasCode(dagResult: DAGResult): string {
  if (!dagResult.isValid || dagResult.orderedNodes.length === 0) {
    return '# Invalid DAG structure - cannot generate code'
  }

  const { orderedNodes, edgeMap } = dagResult

  // Generate imports using only the layers that are actually used
  const usedLayerTypes = orderedNodes.map(layer => layer.type)
  const kerasImports = getUsedKerasImports(usedLayerTypes.filter(type => type !== 'Input'))
  const imports = [
    'import tensorflow as tf',
    'from tensorflow.keras.models import Model',
    'from tensorflow.keras.layers import Input',
    `from tensorflow.keras.layers import ${kerasImports.join(', ')}`
  ]

  const codeLines: string[] = [...imports, '']

  // Track variable assignments
  const layerVariables = new Map<string, string>()

  // Generate layer definitions
  orderedNodes.forEach((layer) => {
    const { id, type, params, varName } = layer
    
    if (type === 'Input') {
      // Handle input layers - compute shape from inputType and dimensions
      const shape = computeInputShape(params)
      codeLines.push(`${varName} = Input(shape=${shape})`)
      layerVariables.set(id, varName)
    } else {
      // Handle other layers
      const layerCode = generateLayerCode(type, params)
      const inputNodes = []
      
      // Find input connections for this layer
      for (const [sourceId, targets] of edgeMap.entries()) {
        if (targets.includes(id)) {
          const inputVar = layerVariables.get(sourceId)
          if (inputVar) {
            inputNodes.push(inputVar)
          }
        }
      }
      
      // Check if this is multi-line layer code 
      const lines = layerCode.split('\n')
      const isMultiLine = lines.length > 1
      
      if (isMultiLine) {
        // Check if it's multiplier > 5 (starts with comment) or multiplier <= 5 (comma-separated layers)
        const firstLine = lines[0].trim()
        const isCommentMultiplier = firstLine.startsWith('#')
        const isCommaSeparatedMultiplier = layerCode.includes(',\n    ')
        
        if (isCommentMultiplier) {
          // Handle multiplier > 5 case for Functional API with condensed approach
          const commentLine = lines[0]
          const spreadLine = lines[1]
          
          codeLines.push(`${commentLine}`)
          
          if (inputNodes.length === 0) {
            codeLines.push(`# Warning: ${varName} has no inputs`)
            codeLines.push(`${varName} = ${spreadLine}`)
          } else if (inputNodes.length === 1) {
            // Use a more readable loop approach
            const match = spreadLine.match(/\*\[(.+?) for _ in range\((\d+)\)\]/)
            if (match) {
              const layerConstructor = match[1]
              const count = parseInt(match[2])
              
              // Generate a for loop for better readability
              codeLines.push(`${varName} = ${inputNodes[0]}`)
              codeLines.push(`for _ in range(${count}):`)
              codeLines.push(`    ${varName} = ${layerConstructor}(${varName})`)
            } else {
              // Fallback to original
              codeLines.push(`${varName} = ${spreadLine}(${inputNodes[0]})`)
            }
          } else {
            // Multiple inputs - might need merge layer
            if (type === 'Merge') {
              codeLines.push(`${varName} = ${spreadLine}([${inputNodes.join(', ')}])`)
            } else {
              codeLines.push(`${varName} = ${spreadLine}([${inputNodes.join(', ')}])`)
            }
          }
        } else if (isCommaSeparatedMultiplier) {
          // Handle multiplier <= 5 case - chain individual layers
          const individualLayers = layerCode.split(',\n    ').map(layer => layer.trim())
          
          if (inputNodes.length === 0) {
            codeLines.push(`# Warning: ${varName} has no inputs`)
            codeLines.push(`${varName} = ${individualLayers[0]}`)
          } else if (inputNodes.length === 1) {
            // Chain individual layers
            let currentVar = inputNodes[0]
            individualLayers.forEach((layer, index) => {
              if (index === 0) {
                codeLines.push(`${varName} = ${layer}(${currentVar})`)
                currentVar = varName
              } else {
                const nextVarName = `${varName.replace(/\d+$/, '')}_${index}`
                codeLines.push(`${nextVarName} = ${layer}(${currentVar})`)
                currentVar = nextVarName
                layerVariables.set(`${id}_${index}`, nextVarName)
              }
            })
            // Update the final variable name
            if (individualLayers.length > 1) {
              const finalVarName = `${varName.replace(/\d+$/, '')}_${individualLayers.length - 1}`
              layerVariables.set(id, finalVarName)
            }
          } else {
            // Multiple inputs - handle as single layer for now
            codeLines.push(`${varName} = ${individualLayers[0]}([${inputNodes.join(', ')}])`)
          }
        }
        
        if (!isCommaSeparatedMultiplier) {
          layerVariables.set(id, varName)
        }
      } else {
        // Single line layer code - handle normally
        if (inputNodes.length === 0) {
          codeLines.push(`# Warning: ${varName} has no inputs`)
          codeLines.push(`${varName} = ${layerCode}`)
        } else if (inputNodes.length === 1) {
          codeLines.push(`${varName} = ${layerCode}(${inputNodes[0]})`)
        } else {
          // Multiple inputs - might need merge layer
          if (type === 'Merge') {
            codeLines.push(`${varName} = ${layerCode}([${inputNodes.join(', ')}])`)
          } else {
            codeLines.push(`${varName} = ${layerCode}([${inputNodes.join(', ')}])`)
          }
        }
        layerVariables.set(id, varName)
      }
    }
  })

  // Find output nodes
  const outputVars: string[] = []
  orderedNodes.forEach((layer) => {
    const hasOutgoing = edgeMap.has(layer.id) && edgeMap.get(layer.id)!.length > 0
    if (!hasOutgoing) {
      const outputVar = layerVariables.get(layer.id)
      if (outputVar) {
        outputVars.push(outputVar)
      }
    }
  })

  // Find input nodes
  const inputVars: string[] = []
  orderedNodes.forEach((layer) => {
    if (layer.type === 'Input') {
      const inputVar = layerVariables.get(layer.id)
      if (inputVar) {
        inputVars.push(inputVar)
      }
    }
  })

  // Generate model creation
  codeLines.push('')
  if (inputVars.length === 1 && outputVars.length === 1) {
    codeLines.push(`model = Model(inputs=${inputVars[0]}, outputs=${outputVars[0]})`)
  } else {
    const inputsStr = inputVars.length === 1 ? inputVars[0] : `[${inputVars.join(', ')}]`
    const outputsStr = outputVars.length === 1 ? outputVars[0] : `[${outputVars.join(', ')}]`
    codeLines.push(`model = Model(inputs=${inputsStr}, outputs=${outputsStr})`)
  }

  // Generate compilation and summary
  const compilationLines: string[] = [
    '',
    '# Compile the model',
    'model.compile(',
    "    optimizer='adam',",
    "    loss='categorical_crossentropy',",
    "    metrics=['accuracy']",
    ')',
    '',
    '# Display model summary',
    'model.summary()'
  ]

  return [...codeLines, ...compilationLines].join('\n')
}
