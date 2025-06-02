/**
 * Visual Feedback Test Examples
 * 
 * This file demonstrates the visual feedback system for shape errors in the CanvasEditor.
 * The system will highlight nodes with shape errors using:
 * - Red border on the node card
 * - Red handle colors 
 * - Warning icon in the node title
 * - Error message displayed in the node content
 * - Tooltip with error details on hover
 */

import type { Node, Edge } from '@xyflow/react'

/**
 * Example 1: Network with shape mismatch
 * This creates a simple network where a Conv2D layer receives incompatible input
 */
export const networkWithShapeError: { nodes: Node[], edges: Edge[] } = {
  nodes: [
    {
      id: 'input-1',
      type: 'layerNode',
      position: { x: 100, y: 50 },
      data: {
        type: 'Input',
        params: { shape: '(28, 28, 1)' } // MNIST-like input
      }
    },
    {
      id: 'conv2d-1',
      type: 'layerNode', 
      position: { x: 100, y: 150 },
      data: {
        type: 'Conv2D',
        params: { 
          filters: 32,
          kernel_size: '(5, 5)', // Large kernel that might cause issues
          strides: '(1, 1)',
          padding: 'valid'
        }
      }
    },
    {
      id: 'dense-1',
      type: 'layerNode',
      position: { x: 100, y: 250 },
      data: {
        type: 'Dense',
        params: { units: 128 }
      }
    }
  ],
  edges: [
    {
      id: 'e1-2',
      source: 'input-1',
      target: 'conv2d-1'
    },
    {
      id: 'e2-3', 
      source: 'conv2d-1',
      target: 'dense-1' // This should cause a shape error - Conv2D output can't go directly to Dense
    }
  ]
}

/**
 * Example 2: Network with valid shapes
 * This creates a network that should compute shapes correctly without errors
 */
export const networkWithValidShapes: { nodes: Node[], edges: Edge[] } = {
  nodes: [
    {
      id: 'input-1',
      type: 'layerNode',
      position: { x: 100, y: 50 },
      data: {
        type: 'Input',
        params: { shape: '(28, 28, 1)' }
      }
    },
    {
      id: 'conv2d-1',
      type: 'layerNode',
      position: { x: 100, y: 150 },
      data: {
        type: 'Conv2D', 
        params: {
          filters: 32,
          kernel_size: '(3, 3)',
          strides: '(1, 1)',
          padding: 'same'
        }
      }
    },
    {
      id: 'flatten-1',
      type: 'layerNode',
      position: { x: 100, y: 250 },
      data: {
        type: 'Flatten',
        params: {}
      }
    },
    {
      id: 'dense-1',
      type: 'layerNode',
      position: { x: 100, y: 350 },
      data: {
        type: 'Dense',
        params: { units: 128 }
      }
    }
  ],
  edges: [
    {
      id: 'e1-2',
      source: 'input-1', 
      target: 'conv2d-1'
    },
    {
      id: 'e2-3',
      source: 'conv2d-1',
      target: 'flatten-1'
    },
    {
      id: 'e3-4',
      source: 'flatten-1',
      target: 'dense-1'
    }
  ]
}

/**
 * Example 3: Complex network with multiple error types
 */
export const networkWithMultipleErrors: { nodes: Node[], edges: Edge[] } = {
  nodes: [
    {
      id: 'input-1',
      type: 'layerNode',
      position: { x: 50, y: 50 },
      data: {
        type: 'Input',
        params: { shape: '(32, 32, 3)' }
      }
    },
    {
      id: 'conv2d-1',
      type: 'layerNode',
      position: { x: 50, y: 150 },
      data: {
        type: 'Conv2D',
        params: {
          filters: 64,
          kernel_size: '(33, 33)', // Kernel larger than input - should cause error
          strides: '(1, 1)',
          padding: 'valid'
        }
      }
    },
    {
      id: 'dense-1',
      type: 'layerNode',
      position: { x: 200, y: 150 },
      data: {
        type: 'Dense',
        params: { units: 'invalid' } // Invalid parameter - should cause error
      }
    },
    {
      id: 'merge-1',
      type: 'layerNode',
      position: { x: 125, y: 250 },
      data: {
        type: 'Merge',
        params: { mode: 'concat' }
      }
    }
  ],
  edges: [
    {
      id: 'e1-2',
      source: 'input-1',
      target: 'conv2d-1'
    },
    {
      id: 'e1-3',
      source: 'input-1', 
      target: 'dense-1' // Input can't go directly to Dense - shape error
    },
    {
      id: 'e2-4',
      source: 'conv2d-1',
      target: 'merge-1'
    },
    {
      id: 'e3-4',
      source: 'dense-1',
      target: 'merge-1' // Incompatible shapes for merge
    }
  ]
}

/**
 * Visual feedback features implemented:
 * 
 * 1. **Node Visual Indicators:**
 *    - Red border instead of default blue/gray
 *    - Red title text color
 *    - Warning emoji (⚠️) in the title
 *    - Red error message box in node content
 *    - Tooltip on hover showing error details
 * 
 * 2. **Handle Visual Indicators:**
 *    - Input handles turn red instead of blue
 *    - Output handles turn red instead of green
 * 
 * 3. **Error Information:**
 *    - Detailed error messages explaining the shape mismatch
 *    - Context about expected vs actual shapes
 *    - Clear indication of which layer has the problem
 * 
 * 4. **Interactive Features:**
 *    - Hover tooltips show full error messages
 *    - Error state persists until the underlying issue is fixed
 *    - Real-time updates when nodes/edges change
 */
