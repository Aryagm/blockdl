import type { Node, Edge } from '@xyflow/react'
import { generateLayerCode, getKerasImports } from './layer-defs'

export interface LayerObject {
  id: string
  type: string
  params: Record<string, any>
  varName: string
}

export interface DAGResult {
  orderedNodes: LayerObject[]
  edgeMap: Map<string, string[]>
  isValid: boolean
  errors: string[]
}

/**
 * Parses a graph into a DAG structure with unique variable names for code generation.
 * Returns ordered nodes, edge map, and validation information.
 */
export function parseGraphToDAG(nodes: Node[], edges: Edge[]): DAGResult {
  const errors: string[] = []
  
  if (nodes.length === 0) {
    return {
      orderedNodes: [],
      edgeMap: new Map(),
      isValid: false,
      errors: ['Network must have at least one layer']
    }
  }

  // Convert nodes to a map for easy lookup
  const nodeMap = new Map<string, Node>()
  nodes.forEach(node => nodeMap.set(node.id, node))

  // Build adjacency lists
  const outgoing = new Map<string, string[]>()
  const incoming = new Map<string, string[]>()
  
  // Initialize maps
  nodes.forEach(node => {
    outgoing.set(node.id, [])
    incoming.set(node.id, [])
  })

  // Populate adjacency lists
  edges.forEach(edge => {
    const sourceConnections = outgoing.get(edge.source) || []
    sourceConnections.push(edge.target)
    outgoing.set(edge.source, sourceConnections)

    const targetConnections = incoming.get(edge.target) || []
    targetConnections.push(edge.source)
    incoming.set(edge.target, targetConnections)
  })

  // Find input nodes (nodes with no incoming edges)
  const inputNodes = nodes.filter(node => {
    const incomingEdges = incoming.get(node.id) || []
    return incomingEdges.length === 0
  })

  // Find output nodes (nodes with no outgoing edges)
  const outputNodes = nodes.filter(node => {
    const outgoingEdges = outgoing.get(node.id) || []
    return outgoingEdges.length === 0
  })

  // Validate input/output structure
  if (inputNodes.length === 0) {
    errors.push('Network must have at least one Input layer')
  }
  if (outputNodes.length === 0) {
    errors.push('Network must have at least one Output layer')
  }

  // Check for cycles using DFS
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  
  function hasCycle(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) {
      return true // Back edge found - cycle detected
    }
    if (visited.has(nodeId)) {
      return false // Already processed
    }

    visited.add(nodeId)
    recursionStack.add(nodeId)

    const neighbors = outgoing.get(nodeId) || []
    for (const neighbor of neighbors) {
      if (hasCycle(neighbor)) {
        return true
      }
    }

    recursionStack.delete(nodeId)
    return false
  }

  // Check for cycles starting from all unvisited nodes
  for (const node of nodes) {
    if (!visited.has(node.id) && hasCycle(node.id)) {
      errors.push('Network contains cycles - DAG structure required')
      break
    }
  }

  // If there are validation errors, return early
  if (errors.length > 0) {
    return {
      orderedNodes: [],
      edgeMap: new Map(),
      isValid: false,
      errors
    }
  }

  // Perform topological sort using Kahn's algorithm
  const orderedNodes: LayerObject[] = []
  const inDegree = new Map<string, number>()
  const queue: string[] = []
  
  // Initialize in-degree count
  nodes.forEach(node => {
    const incomingEdges = incoming.get(node.id) || []
    inDegree.set(node.id, incomingEdges.length)
    if (incomingEdges.length === 0) {
      queue.push(node.id)
    }
  })

  // Generate unique variable names
  const typeCounters = new Map<string, number>()
  
  function generateVarName(type: string): string {
    const counter = typeCounters.get(type) || 0
    typeCounters.set(type, counter + 1)
    
    if (counter === 0) {
      return type.toLowerCase()
    }
    return `${type.toLowerCase()}_${counter}`
  }

  // Process nodes in topological order
  while (queue.length > 0) {
    const nodeId = queue.shift()!
    const node = nodeMap.get(nodeId)!
    
    // Create layer object with unique variable name
    const layerObject: LayerObject = {
      id: node.id,
      type: (node.data as any).type,
      params: (node.data as any).params || {},
      varName: generateVarName((node.data as any).type)
    }
    
    orderedNodes.push(layerObject)

    // Update in-degrees of neighboring nodes
    const neighbors = outgoing.get(nodeId) || []
    for (const neighbor of neighbors) {
      const currentInDegree = inDegree.get(neighbor)!
      inDegree.set(neighbor, currentInDegree - 1)
      
      if (currentInDegree - 1 === 0) {
        queue.push(neighbor)
      }
    }
  }

  // Verify all nodes were processed (no cycles)
  if (orderedNodes.length !== nodes.length) {
    errors.push('Unable to create topological ordering - network may contain cycles')
    return {
      orderedNodes: [],
      edgeMap: new Map(),
      isValid: false,
      errors
    }
  }

  return {
    orderedNodes,
    edgeMap: outgoing,
    isValid: true,
    errors: []
  }
}

/**
 * Legacy function for backward compatibility - returns only ordered layers for linear paths
 */
export function getOrderedLayers(nodes: Node[], edges: Edge[]): LayerObject[] {
  const result = parseGraphToDAG(nodes, edges)
  
  // For backward compatibility, only return ordered nodes if it's a valid linear path
  if (!result.isValid) {
    return []
  }
  
  // Check if it's a linear path (each node has at most one outgoing connection)
  for (const [_nodeId, targets] of result.edgeMap.entries()) {
    if (targets.length > 1) {
      return [] // Not a linear path
    }
  }
  
  return result.orderedNodes
}

/**
 * Validates if the current graph structure represents a valid neural network DAG
 */
export function validateNetworkStructure(nodes: Node[], edges: Edge[]): {
  isValid: boolean
  errors: string[]
} {
  const result = parseGraphToDAG(nodes, edges)
  return {
    isValid: result.isValid,
    errors: result.errors
  }
}

/**
 * Generates Keras/TensorFlow Python code from a DAG structure
 */
export function generateKerasCode(layers: LayerObject[]): string {
  if (layers.length === 0) {
    return '# No layers to generate code for'
  }

  // For now, we'll generate Sequential model code for backward compatibility
  // TODO: Add support for Functional API for complex DAG structures
  
  // Generate imports using the centralized function
  const kerasImports = getKerasImports()
  const imports = [
    'import tensorflow as tf',
    'from tensorflow.keras.models import Sequential',
    `from tensorflow.keras.layers import ${kerasImports.join(', ')}`
  ]

  // Generate model creation
  const modelLines: string[] = ['', '# Create the model', 'model = Sequential([']

  // Generate layer code
  layers.forEach((layer) => {
    const layerCode = generateLayerCode(layer.type, layer.params)
    if (layerCode) {
      modelLines.push(`    ${layerCode},`)
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

  // Generate imports
  const kerasImports = getKerasImports()
  const imports = [
    'import tensorflow as tf',
    'from tensorflow.keras.models import Model',
    'from tensorflow.keras.layers import Input',
    `from tensorflow.keras.layers import ${kerasImports.filter(imp => imp !== 'Input').join(', ')}`
  ]

  const codeLines: string[] = [...imports, '']

  // Track variable assignments
  const layerVariables = new Map<string, string>()

  // Generate layer definitions
  orderedNodes.forEach((layer) => {
    const { id, type, params, varName } = layer
    
    if (type === 'Input') {
      // Handle input layers
      const shape = params.shape || '(784,)'
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
