/**
 * Keras code generation utilities for both Sequential and Functional API
 */

import type { DAGResult, LayerObject } from './dag-parser'
import { generateLayerCode, getUsedKerasImports } from './layer-definitions'
import { getLayerDefinition } from './layer-definitions'

/**
 * Common compilation and summary code for both Sequential and Functional API
 */
const COMPILATION_TEMPLATE = [
  '', '# Compile the model', 'model.compile(',
  "    optimizer='adam',", "    loss='categorical_crossentropy',",
  "    metrics=['accuracy']", ')', '', '# Display model summary', 'model.summary()'
] as const

/**
 * Helper function to format layer code for Sequential API
 */
function formatSequentialLayer(layerCode: string, isLastLayer: boolean): string[] {
  const lines = layerCode.split('\n')
  
  if (lines.length === 1) {
    // Single line - add indentation and comma if needed
    const needsComma = !isLastLayer && !layerCode.trim().endsWith(',')
    return [`    ${layerCode}${needsComma ? ',' : ''}`]
  }
  
  // Multi-line - handle each line appropriately
  return lines.map((line, index) => {
    if (index === 0) {
      return `    ${line}` // Comment line with indentation
    }
    
    const trimmed = line.trim()
    if (index === lines.length - 1 && !isLastLayer && !trimmed.endsWith(',')) {
      return `${line},` // Add comma to last line if needed
    }
    return line
  })
}

/**
 * Generates Keras Sequential model code from ordered layers
 */
export function generateKerasCode(layers: LayerObject[]): string {
  if (layers.length === 0) {
    return '# No layers to generate code for'
  }

  // Generate imports
  const usedLayerTypes = layers.map(layer => layer.type)
  const kerasImports = getUsedKerasImports(usedLayerTypes)
  const imports = [
    'import tensorflow as tf',
    'from tensorflow.keras.models import Sequential',
    `from tensorflow.keras.layers import ${kerasImports.join(', ')}`
  ]

  // Generate model creation
  const modelLines: string[] = ['', '# Create the model', 'model = Sequential([']

  // Process each layer
  layers.forEach((layer, index) => {
    const layerCode = generateLayerCode(layer.type, layer.params)
    if (!layerCode) return

    const isLastLayer = index === layers.length - 1
    const formattedLines = formatSequentialLayer(layerCode, isLastLayer)
    modelLines.push(...formattedLines)
  })

  modelLines.push('])')

  return [...imports, ...modelLines, ...COMPILATION_TEMPLATE].join('\n')
}

/**
 * Processes a layer for Functional API code generation
 */
function processLayer(layer: LayerObject, inputNodes: string[], codeLines: string[], layerVariables: Map<string, string>): void {
  const { id, varName } = layer
  const layerCode = generateLayerCode(layer.type, layer.params)
  
  if (!layerCode) {
    codeLines.push(`# Error: Could not generate code for ${layer.type}`)
    return
  }

  // Handle multiplier layers (multi-line code with special syntax)
  if (layerCode.includes('\n')) {
    processMultiplierLayer(layer, layerCode, inputNodes, codeLines, layerVariables)
    return
  }

  // Handle single layers
  if (inputNodes.length === 0) {
    codeLines.push(`# Warning: ${varName} has no inputs`)
    codeLines.push(`${varName} = ${layerCode}`)
  } else if (inputNodes.length === 1) {
    codeLines.push(`${varName} = ${layerCode}(${inputNodes[0]})`)
  } else {
    // Multiple inputs
    codeLines.push(`${varName} = ${layerCode}([${inputNodes.join(', ')}])`)
  }
  
  layerVariables.set(id, varName)
}

/**
 * Processes multiplier layers with better readability for Functional API
 */
function processMultiplierLayer(
  layer: LayerObject, 
  layerCode: string, 
  inputNodes: string[], 
  codeLines: string[], 
  layerVariables: Map<string, string>
): void {
  const { id, varName } = layer
  const lines = layerCode.split('\n')

  if (lines[0].trim().startsWith('#') && inputNodes.length === 1) {
    // High multiplier case - use loop for better readability
    const spreadLine = lines[1]
    const match = spreadLine.match(/\*\[(.+?) for _ in range\((\d+)\)\]/)
    
    codeLines.push(lines[0]) // Add comment
    
    if (match) {
      const [, layerConstructor, count] = match
      codeLines.push(`${varName} = ${inputNodes[0]}`)
      codeLines.push(`for _ in range(${count}):`)
      codeLines.push(`    ${varName} = ${layerConstructor}(${varName})`)
    } else {
      // Fallback for complex cases
      const inputs = inputNodes.length > 0 ? `(${inputNodes.join(', ')})` : ''
      codeLines.push(`${varName} = ${spreadLine}${inputs}`)
    }
  } else {
    // Low multiplier case or multiple inputs
    const individualLayers = layerCode.split(',\n    ').map(l => l.trim())
    
    if (inputNodes.length === 1 && individualLayers.length > 1) {
      // Chain individual layers
      let currentVar = inputNodes[0]
      individualLayers.forEach((layer, index) => {
        if (index === 0) {
          codeLines.push(`${varName} = ${layer}(${currentVar})`)
          currentVar = varName
        } else {
          const nextVar = `${varName}_${index}`
          codeLines.push(`${nextVar} = ${layer}(${currentVar})`)
          currentVar = nextVar
          layerVariables.set(`${id}_${index}`, nextVar)
        }
      })
      
      // Update final variable reference
      const finalVar = `${varName}_${individualLayers.length - 1}`
      layerVariables.set(id, finalVar)
      return
    } else {
      // Use first layer only for multiple inputs or single layer
      const inputs = inputNodes.length > 0 ? `([${inputNodes.join(', ')}])` : ''
      codeLines.push(`${varName} = ${individualLayers[0]}${inputs}`)
    }
  }
  
  layerVariables.set(id, varName)
}

/**
 * Finds input nodes for a given layer
 */
function findInputNodes(layerId: string, edgeMap: Map<string, string[]>, layerVariables: Map<string, string>): string[] {
  const inputNodes: string[] = []
  
  for (const [sourceId, targets] of edgeMap.entries()) {
    if (targets.includes(layerId)) {
      const inputVar = layerVariables.get(sourceId)
      if (inputVar) {
        inputNodes.push(inputVar)
      }
    }
  }
  
  return inputNodes
}

/**
 * Finds terminal nodes (input/output) in the DAG
 */
function findTerminalNodes(orderedNodes: LayerObject[], edgeMap: Map<string, string[]>, layerVariables: Map<string, string>) {
  const inputVars: string[] = []
  const outputVars: string[] = []
  
  for (const layer of orderedNodes) {
    const variable = layerVariables.get(layer.id)
    if (!variable) continue
    
    if (layer.type === 'Input') {
      inputVars.push(variable)
    }
    
    // Check if this is an output node (no outgoing edges)
    if (!edgeMap.has(layer.id) || edgeMap.get(layer.id)!.length === 0) {
      outputVars.push(variable)
    }
  }
  
  return { inputVars, outputVars }
}

/**
 * Helper function to compute Input layer shape for code generation
 */
async function computeInputShape(params: Record<string, unknown>): Promise<string> {
  const layerDef = getLayerDefinition('Input')
  if (!layerDef) {
    return '(784,)'
  }
  
  const shape = layerDef.computeShape([], params)
  if (!shape) {
    return '(784,)'
  }
  
  return `(${shape.join(', ')})`
}

/**
 * Generates Keras Functional API code for complex DAG structures
 */
export async function generateFunctionalKerasCode(dagResult: DAGResult): Promise<string> {
  if (!dagResult.isValid || dagResult.orderedNodes.length === 0) {
    return '# Invalid DAG structure - cannot generate code'
  }

  const { orderedNodes, edgeMap } = dagResult

  // Generate imports
  const usedLayerTypes = orderedNodes.map(layer => layer.type).filter(type => type !== 'Input')
  const kerasImports = getUsedKerasImports(usedLayerTypes)
  const imports = [
    'import tensorflow as tf',
    'from tensorflow.keras.models import Model',
    'from tensorflow.keras.layers import Input',
    `from tensorflow.keras.layers import ${kerasImports.join(', ')}`
  ]

  const codeLines: string[] = [...imports, '']
  const layerVariables = new Map<string, string>()

  // Process each layer
  for (const layer of orderedNodes) {
    const { id, type, params, varName } = layer
    
    if (type === 'Input') {
      const shape = await computeInputShape(params)
      codeLines.push(`${varName} = Input(shape=${shape})`)
      layerVariables.set(id, varName)
    } else {
      const inputNodes = findInputNodes(id, edgeMap, layerVariables)
      processLayer(layer, inputNodes, codeLines, layerVariables)
    }
  }

  // Generate model creation
  const { inputVars, outputVars } = findTerminalNodes(orderedNodes, edgeMap, layerVariables)
  
  codeLines.push('')
  
  // Format inputs and outputs for the Model constructor
  const inputs = inputVars.length === 1 ? inputVars[0] : `[${inputVars.join(', ')}]`
  const outputs = outputVars.length === 1 ? outputVars[0] : `[${outputVars.join(', ')}]`
  
  codeLines.push(`model = Model(inputs=${inputs}, outputs=${outputs})`)

  return [...codeLines, ...COMPILATION_TEMPLATE].join('\n')
}
