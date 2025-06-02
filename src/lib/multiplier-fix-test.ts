// Test the multiplier comment positioning fix
import { generateKerasCode } from './graph-utils'
import { LayerObject } from './shape-utils'

// Test case: Dense layer with large multiplier
const testLayers: LayerObject[] = [
  {
    id: 'input-1',
    type: 'Input',
    params: { shape: '(784,)' }
  },
  {
    id: 'dense-1',
    type: 'Dense', 
    params: { units: 128, multiplier: 10 }
  },
  {
    id: 'output-1',
    type: 'Output',
    params: { units: 10, activation: 'softmax' }
  }
]

console.log('=== Testing Multiplier Comment Fix ===')
console.log(generateKerasCode(testLayers))
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
    id: 'output-1',
    type: 'Output',
    params: { units: 10, activation: 'softmax' }
  }
]

console.log(generateKerasCode(testLayersConv))
