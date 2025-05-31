import type { Node, Edge } from '@xyflow/react'

export interface LayerObject {
  id: string
  type: string
  params: Record<string, any>
}

/**
 * Returns an array of layer objects topologically sorted (assumes single linear path).
 * Validates that first node is 'Input' and last is 'Output'; returns [] if invalid.
 */
export function getOrderedLayers(nodes: Node[], edges: Edge[]): LayerObject[] {
  if (nodes.length === 0) {
    return []
  }

  // Convert nodes to a map for easy lookup
  const nodeMap = new Map<string, Node>()
  nodes.forEach(node => nodeMap.set(node.id, node))

  // Build adjacency list for outgoing edges
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

  // Find the start node (node with no incoming edges)
  const startNodes = nodes.filter(node => {
    const incomingEdges = incoming.get(node.id) || []
    return incomingEdges.length === 0
  })

  // Find the end node (node with no outgoing edges)
  const endNodes = nodes.filter(node => {
    const outgoingEdges = outgoing.get(node.id) || []
    return outgoingEdges.length === 0
  })

  // Validate structure: should have exactly one start and one end node
  if (startNodes.length !== 1 || endNodes.length !== 1) {
    return []
  }

  const startNode = startNodes[0]
  const endNode = endNodes[0]

  // Validate that first node is 'Input' and last is 'Output'
  if ((startNode.data as any).type !== 'Input' || (endNode.data as any).type !== 'Output') {
    return []
  }

  // Perform topological sort using DFS
  const result: LayerObject[] = []
  const visited = new Set<string>()

  function dfs(nodeId: string): boolean {
    if (visited.has(nodeId)) {
      // Cycle detected
      return false
    }

    visited.add(nodeId)
    const node = nodeMap.get(nodeId)
    
    if (!node) {
      return false
    }

    // Add current node to result
    result.push({
      id: node.id,
      type: (node.data as any).type as string,
      params: (node.data as any).params || {}
    })

    // Visit all outgoing nodes
    const nextNodes = outgoing.get(nodeId) || []
    
    // For linear path validation, each node should have at most one outgoing edge
    if (nextNodes.length > 1) {
      return false
    }

    for (const nextNodeId of nextNodes) {
      if (!dfs(nextNodeId)) {
        return false
      }
    }

    return true
  }

  // Start DFS from the start node
  const success = dfs(startNode.id)
  
  if (!success) {
    return []
  }

  // Validate that we visited all nodes (ensures single connected component)
  if (result.length !== nodes.length) {
    return []
  }

  // Additional validation: ensure linear path
  // Each node (except the last) should have exactly one outgoing edge
  // Each node (except the first) should have exactly one incoming edge
  for (let i = 0; i < result.length; i++) {
    const nodeId = result[i].id
    const incomingEdges = incoming.get(nodeId) || []
    const outgoingEdges = outgoing.get(nodeId) || []

    if (i === 0) {
      // First node should have no incoming edges and exactly one outgoing edge (unless it's the only node)
      if (incomingEdges.length !== 0 || (result.length > 1 && outgoingEdges.length !== 1)) {
        return []
      }
    } else if (i === result.length - 1) {
      // Last node should have exactly one incoming edge and no outgoing edges
      if (incomingEdges.length !== 1 || outgoingEdges.length !== 0) {
        return []
      }
    } else {
      // Middle nodes should have exactly one incoming and one outgoing edge
      if (incomingEdges.length !== 1 || outgoingEdges.length !== 1) {
        return []
      }
    }
  }

  return result
}

/**
 * Validates if the current graph structure represents a valid neural network
 */
export function validateNetworkStructure(nodes: Node[], edges: Edge[]): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (nodes.length === 0) {
    errors.push('Network must have at least one layer')
    return { isValid: false, errors }
  }

  const orderedLayers = getOrderedLayers(nodes, edges)
  
  if (orderedLayers.length === 0) {
    errors.push('Invalid network structure')
    
    // More specific error checking
    const inputNodes = nodes.filter(node => (node.data as any).type === 'Input')
    const outputNodes = nodes.filter(node => (node.data as any).type === 'Output')
    
    if (inputNodes.length === 0) {
      errors.push('Network must have exactly one Input layer')
    } else if (inputNodes.length > 1) {
      errors.push('Network must have exactly one Input layer')
    }
    
    if (outputNodes.length === 0) {
      errors.push('Network must have exactly one Output layer')
    } else if (outputNodes.length > 1) {
      errors.push('Network must have exactly one Output layer')
    }
    
    return { isValid: false, errors }
  }

  return { isValid: true, errors: [] }
}

/**
 * Generates Keras/TensorFlow Python code from ordered layers
 */
export function generateKerasCode(layers: LayerObject[]): string {
  if (layers.length === 0) {
    return '# No layers to generate code for'
  }

  // Generate imports
  const imports = [
    'import tensorflow as tf',
    'from tensorflow.keras.models import Sequential',
    'from tensorflow.keras.layers import Dense, Activation, Dropout, Input'
  ]

  // Generate model creation
  const modelLines: string[] = ['', '# Create the model', 'model = Sequential([']

  // Generate layer code
  layers.forEach((layer) => {
    const layerCode = generateLayerCode(layer)
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
 * Generates code for a single layer
 */
function generateLayerCode(layer: LayerObject): string {
  const { type, params } = layer

  switch (type) {
    case 'Input':
      // Input layer is handled differently in Keras Sequential
      return `Input(shape=${params.shape || '(784,)'})`

    case 'Dense':
      const units = params.units || 128
      const activation = params.activation ? `, activation='${params.activation}'` : ''
      return `Dense(${units}${activation})`

    case 'Activation':
      const activationType = params.type || 'relu'
      return `Activation('${activationType}')`

    case 'Dropout':
      const rate = params.rate || 0.2
      return `Dropout(${rate})`

    case 'Output':
      const outputUnits = params.units || 10
      const outputActivation = params.activation ? `, activation='${params.activation}'` : ''
      return `Dense(${outputUnits}${outputActivation})`

    default:
      return `# Unknown layer type: ${type}`
  }
}
