/**
 * Test file for computeShapes utility function
 * This demonstrates how to use the computeShapes function with different layer types
 */

import { computeShapes, parseGraphToDAG, type ShapeError } from './graph-utils'
import type { Node, Edge } from '@xyflow/react'

// Helper function to create a test node
function createTestNode(id: string, type: string, params: Record<string, any> = {}): Node {
  return {
    id,
    type: 'layer',
    position: { x: 0, y: 0 },
    data: {
      type,
      params
    }
  }
}

// Helper function to create a test edge
function createTestEdge(source: string, target: string): Edge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    type: 'default'
  }
}

// Test 1: Simple Dense network
console.log('=== Test 1: Simple Dense Network ===')
const denseNodes: Node[] = [
  createTestNode('input1', 'Input', { inputType: 'flat_data', flatSize: 784 }),
  createTestNode('dense1', 'Dense', { units: 128 }),
  createTestNode('dense2', 'Dense', { units: 64 }),
  createTestNode('output1', 'Output', { units: 10, activation: 'softmax' })
]

const denseEdges: Edge[] = [
  createTestEdge('input1', 'dense1'),
  createTestEdge('dense1', 'dense2'),
  createTestEdge('dense2', 'output1')
]

const denseDAG = parseGraphToDAG(denseNodes, denseEdges)
if (denseDAG.isValid) {
  const denseResult = computeShapes(denseDAG, '(784,)')
  console.log('Dense network errors:', denseResult.errors)
  console.log('Dense network shapes:', Array.from(denseResult.nodeShapes.entries()))
  console.log('Dense network nodes:', denseDAG.orderedNodes.map(n => ({ id: n.id, type: n.type })))
} else {
  console.log('Dense DAG invalid:', denseDAG.errors)
}

// Test 2: CNN network
console.log('\n=== Test 2: CNN Network ===')
const cnnNodes: Node[] = [
  createTestNode('input2', 'Input', { inputType: 'image_grayscale', height: 28, width: 28 }),
  createTestNode('conv1', 'Conv2D', { filters: 32, kernel_size: '(3,3)', padding: 'same' }),
  createTestNode('pool1', 'MaxPool2D', { pool_size: '(2,2)' }),
  createTestNode('conv2', 'Conv2D', { filters: 64, kernel_size: '(3,3)', padding: 'same' }),
  createTestNode('pool2', 'MaxPool2D', { pool_size: '(2,2)' }),
  createTestNode('flatten1', 'Flatten'),
  createTestNode('dense3', 'Dense', { units: 128 }),
  createTestNode('output2', 'Output', { units: 10, activation: 'softmax' })
]

const cnnEdges: Edge[] = [
  createTestEdge('input2', 'conv1'),
  createTestEdge('conv1', 'pool1'),
  createTestEdge('pool1', 'conv2'),
  createTestEdge('conv2', 'pool2'),
  createTestEdge('pool2', 'flatten1'),
  createTestEdge('flatten1', 'dense3'),
  createTestEdge('dense3', 'output2')
]

const cnnDAG = parseGraphToDAG(cnnNodes, cnnEdges)
if (cnnDAG.isValid) {
  const cnnResult = computeShapes(cnnDAG, '(28, 28, 1)')
  console.log('CNN network errors:', cnnResult.errors)
  console.log('CNN network shapes:', Array.from(cnnResult.nodeShapes.entries()))
  console.log('CNN network nodes:', cnnDAG.orderedNodes.map(n => ({ id: n.id, type: n.type })))
} else {
  console.log('CNN DAG invalid:', cnnDAG.errors)
}

// Test 3: Network with merge layer
console.log('\n=== Test 3: Network with Merge Layer ===')
const mergeNodes: Node[] = [
  createTestNode('input3a', 'Input', { inputType: 'flat_data', flatSize: 64 }),
  createTestNode('input3b', 'Input', { inputType: 'flat_data', flatSize: 64 }),
  createTestNode('dense4', 'Dense', { units: 32 }),
  createTestNode('dense5', 'Dense', { units: 32 }),
  createTestNode('merge1', 'Merge', { mode: 'concat' }),
  createTestNode('output3', 'Output', { units: 1, activation: 'sigmoid' })
]

const mergeEdges: Edge[] = [
  createTestEdge('input3a', 'dense4'),
  createTestEdge('input3b', 'dense5'),
  createTestEdge('dense4', 'merge1'),
  createTestEdge('dense5', 'merge1'),
  createTestEdge('merge1', 'output3')
]

const mergeDAG = parseGraphToDAG(mergeNodes, mergeEdges)
if (mergeDAG.isValid) {
  const mergeResult = computeShapes(mergeDAG, '(64,)')
  console.log('Merge network errors:', mergeResult.errors)
  console.log('Merge network shapes:', Array.from(mergeResult.nodeShapes.entries()))
  console.log('Merge network nodes:', mergeDAG.orderedNodes.map(n => ({ id: n.id, type: n.type })))
} else {
  console.log('Merge DAG invalid:', mergeDAG.errors)
}

// Test 4: Invalid shape network
console.log('\n=== Test 4: Invalid Shape Network ===')
const invalidNodes: Node[] = [
  createTestNode('input4', 'Input', { inputType: 'custom', customShape: '(invalid)' }),
  createTestNode('dense6', 'Dense', { units: 10 })
]

const invalidEdges: Edge[] = [
  createTestEdge('input4', 'dense6')
]

const invalidDAG = parseGraphToDAG(invalidNodes, invalidEdges)
if (invalidDAG.isValid) {
  const invalidResult = computeShapes(invalidDAG, '(invalid)')
  console.log('Invalid network errors:', invalidResult.errors)
} else {
  console.log('Invalid DAG invalid:', invalidDAG.errors)
}

export { }
