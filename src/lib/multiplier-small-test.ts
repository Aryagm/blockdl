// Test the fix for multiplier <= 5 in Functional API
import { generateFunctionalKerasCode, processNetworkForDAG } from './graph-utils'
import { LayerObject } from './shape-utils'

console.log('=== Testing Multiplier <= 5 Fix in Functional API ===')

// Test case: Multiple Dense layers with small multipliers
const testLayers: LayerObject[] = [
  {
    id: 'input-1',
    type: 'Input',
    params: { shape: '(784,)' }
  },
  {
    id: 'input-2', 
    type: 'Input',
    params: { shape: '(784,)' }
  },
  {
    id: 'input-3',
    type: 'Input', 
    params: { shape: '(784,)' }
  },
  {
    id: 'conv2d-1',
    type: 'Conv2D',
    params: { filters: 32, kernel_size: '(3,3)', multiplier: 1 }
  },
  {
    id: 'dense-1',
    type: 'Dense',
    params: { units: 128, activation: 'relu', multiplier: 6 }
  },
  {
    id: 'dense-2', 
    type: 'Dense',
    params: { units: 128, multiplier: 8 }
  },
  {
    id: 'flatten-1',
    type: 'Flatten',
    params: {}
  },
  {
    id: 'dropout-1',
    type: 'Dropout',
    params: { rate: 0.2 }
  },
  {
    id: 'dense-3',
    type: 'Dense',
    params: { units: 128, activation: 'tanh', multiplier: 1 }
  },
  {
    id: 'merge-1',
    type: 'Merge',
    params: { mode: 'concatenate' }
  },
  {
    id: 'dense-4',
    type: 'Dense', 
    params: { units: 128, multiplier: 1 }
  },
  {
    id: 'merge-2',
    type: 'Merge',
    params: { mode: 'concatenate' }
  },
  {
    id: 'output-1',
    type: 'Output',
    params: { units: 10, activation: 'softmax' }
  }
]

const testEdges = [
  { source: 'input-1', target: 'conv2d-1' },
  { source: 'input-2', target: 'dense-1' },
  { source: 'input-3', target: 'dense-2' },
  { source: 'conv2d-1', target: 'flatten-1' },
  { source: 'dense-1', target: 'dropout-1' },
  { source: 'dropout-1', target: 'merge-1' },
  { source: 'dense-3', target: 'merge-1' },
  { source: 'dense-2', target: 'dense-4' },
  { source: 'dense-4', target: 'merge-2' },
  { source: 'merge-1', target: 'merge-2' },
  { source: 'merge-2', target: 'output-1' }
]

const dagResult = processNetworkForDAG(testLayers, testEdges)
console.log(generateFunctionalKerasCode(dagResult))
