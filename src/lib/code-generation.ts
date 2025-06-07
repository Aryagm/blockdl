/**
 * Keras code generation utilities for both Sequential and Functional API
 */

import type { DAGResult, LayerObject } from './dag-parser'
import { generateLayerCode, getUsedKerasImports } from './layer-defs'
import { computeInputShape } from './input-layer-utils'

/**
 * Common compilation and summary code for both Sequential and Functional API
 */
const COMPILATION_TEMPLATE = [
  '', '# Compile the model', 'model.compile(',
  "    optimizer='adam',", "    loss='categorical_crossentropy',",
  "    metrics=['accuracy']", ')', '', '# Display model summary', 'model.summary()'
] as const

/**
 * Helper function to add commas to layer code lines
 */
function formatLayerLine(line: string, isLastLayer: boolean): string {
  const trimmed = line.trim()
  if (trimmed.startsWith('*[') && trimmed.endsWith(']')) {
    // Spread operator syntax - add comma unless it's the last layer
    return `${line}${isLastLayer ? '' : ','}`
  }
  
  // Regular layer code - add comma unless it already has one or it's the last layer
  const hasComma = trimmed.endsWith(',')
  const needsComma = !hasComma && !isLastLayer
  return `${line}${needsComma ? ',' : ''}`
}

/**
 * Helper function to process multi-line layer code
 */
function processMultiLineLayerCode(layerCode: string, isLastLayer: boolean): string[] {
  const lines = layerCode.split('\n')
  const result: string[] = []
  
  lines.forEach((line, index) => {
    if (index === 0) {
      // First line is typically a comment
      result.push(`    ${line}`)
    } else {
      result.push(formatLayerLine(line, isLastLayer))
    }
  })
  
  return result
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
    const lines = layerCode.split('\n')

    if (lines.length > 1) {
      modelLines.push(...processMultiLineLayerCode(layerCode, isLastLayer))
    } else {
      modelLines.push(`    ${formatLayerLine(layerCode, isLastLayer)}`)
    }
  })

  modelLines.push('])')

  return [...imports, ...modelLines, ...COMPILATION_TEMPLATE].join('\n')
}

/**
 * Helper interface for layer processing context
 */
interface LayerContext {
  layer: LayerObject
  inputNodes: string[]
  codeLines: string[]
  layerVariables: Map<string, string>
}

/**
 * Processes multiplier layers with better readability for Functional API
 */
function processMultiplierLayer(context: LayerContext, layerCode: string): void {
  const { layer, inputNodes, codeLines, layerVariables } = context
  const { id, varName } = layer
  const lines = layerCode.split('\n')

  if (lines[0].trim().startsWith('#')) {
    // High multiplier case - use loop for better readability
    const spreadLine = lines[1]
    const match = spreadLine.match(/\*\[(.+?) for _ in range\((\d+)\)\]/)
    
    codeLines.push(lines[0]) // Add comment
    
    if (match && inputNodes.length === 1) {
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
    // Low multiplier case - chain individual layers
    const individualLayers = layerCode.split(',\n    ').map(l => l.trim())
    
    if (inputNodes.length === 1) {
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
      if (individualLayers.length > 1) {
        const finalVar = `${varName}_${individualLayers.length - 1}`
        layerVariables.set(id, finalVar)
        return // Don't set varName again below
      }
    } else {
      // Multiple inputs - use first layer only
      const inputs = inputNodes.length > 0 ? `([${inputNodes.join(', ')}])` : ''
      codeLines.push(`${varName} = ${individualLayers[0]}${inputs}`)
    }
  }
  
  layerVariables.set(id, varName)
}

/**
 * Processes a single layer for Functional API
 */
function processSingleLayer(context: LayerContext, layerCode: string): void {
  const { layer, inputNodes, codeLines, layerVariables } = context
  const { id, varName } = layer
  
  if (inputNodes.length === 0) {
    codeLines.push(`# Warning: ${varName} has no inputs`)
    codeLines.push(`${varName} = ${layerCode}`)
  } else if (inputNodes.length === 1) {
    codeLines.push(`${varName} = ${layerCode}(${inputNodes[0]})`)
  } else {
    // Multiple inputs
    const inputs = `([${inputNodes.join(', ')}])`
    codeLines.push(`${varName} = ${layerCode}${inputs}`)
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
  
  orderedNodes.forEach(layer => {
    const variable = layerVariables.get(layer.id)
    if (!variable) return
    
    if (layer.type === 'Input') {
      inputVars.push(variable)
    }
    
    // Check if this is an output node (no outgoing edges)
    const hasOutgoing = edgeMap.has(layer.id) && edgeMap.get(layer.id)!.length > 0
    if (!hasOutgoing) {
      outputVars.push(variable)
    }
  })
  
  return { inputVars, outputVars }
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
      const layerCode = generateLayerCode(type, params)
      const inputNodes = findInputNodes(id, edgeMap, layerVariables)
      
      const context: LayerContext = { layer, inputNodes, codeLines, layerVariables }
      
      if (layerCode.includes('\n')) {
        processMultiplierLayer(context, layerCode)
      } else {
        processSingleLayer(context, layerCode)
      }
    }
  }

  // Generate model creation
  const { inputVars, outputVars } = findTerminalNodes(orderedNodes, edgeMap, layerVariables)
  
  codeLines.push('')
  if (inputVars.length === 1 && outputVars.length === 1) {
    codeLines.push(`model = Model(inputs=${inputVars[0]}, outputs=${outputVars[0]})`)
  } else {
    const inputs = inputVars.length === 1 ? inputVars[0] : `[${inputVars.join(', ')}]`
    const outputs = outputVars.length === 1 ? outputVars[0] : `[${outputVars.join(', ')}]`
    codeLines.push(`model = Model(inputs=${inputs}, outputs=${outputs})`)
  }

  return [...codeLines, ...COMPILATION_TEMPLATE].join('\n')
}
