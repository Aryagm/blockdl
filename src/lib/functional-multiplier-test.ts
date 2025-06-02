// Test the Functional API multiplier fix
import { generateFunctionalKerasCode } from './graph-utils'
import { LayerObject } from './shape-utils'
import { processNetworkForDAG } from './graph-utils'

// Test case: Dense layer with large multiplier in Functional API
const testLayers: LayerObject[] = [
  {
    id: 'input-1',
    type: 'Input',
    params: { shape: '(784,)' }
  },
  {
    id: 'dense-1',
    type: 'Dense', 
    params: { units: 128, multiplier: 12 }
  },
  {
    id: 'output-1',
    type: 'Output',
    params: { units: 10, activation: 'softmax' }
  }
]

const testEdges = [
  { source: 'input-1', target: 'dense-1' },
  { source: 'dense-1', target: 'output-1' }
]

console.log('=== Testing Functional API Multiplier Fix ===')
const dagResult = processNetworkForDAG(testLayers, testEdges)
console.log(generateFunctionalKerasCode(dagResult))

console.log('\n=== Test case with Conv2D multiplier ===')

const testLayersConv: LayerObject[] = [
  {
    id: 'input-1',
    type: 'Input',
    params: { shape: '(28, 28, 1)' }
  },
  {
    id: 'conv-1',
    type: 'Conv2D',
    params: { filters: 32, kernel_size: '(3,3)', multiplier: 8 }
  },
  {
    id: 'flatten-1',
    type: 'Flatten',
    params: {}
  },
  {
    id: 'output-1',
    type: 'Output',
    params: { units: 10, activation: 'softmax' }
  }
]

const testEdgesConv = [
  { source: 'input-1', target: 'conv-1' },
  { source: 'conv-1', target: 'flatten-1' },
  { source: 'flatten-1', target: 'output-1' }
]

const dagResultConv = processNetworkForDAG(testLayersConv, testEdgesConv)
console.log(generateFunctionalKerasCode(dagResultConv))
