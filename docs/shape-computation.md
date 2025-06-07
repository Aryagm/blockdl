# Shape Computation Utilities

This document explains how to use the `computeShapes` utility function to compute output shapes for neural network layers in a DAG (Directed Acyclic Graph) structure.

## Overview

The `computeShapes` function walks through a neural network DAG in topological order, computes the output shape for each layer based on its input shapes and parameters, and returns both any errors encountered and a map of computed shapes.

## Supported Layer Types

The function supports the following layer types with their respective shape computations:

### 1. Input Layer
- **Type**: `Input`
- **Shape Logic**: Uses the shape specified in the layer's `shape` parameter
- **Example**: `Input(shape='(784,)')` outputs shape `[784]`

### 2. Dense (Fully Connected) Layer
- **Type**: `Dense`, `Output`
- **Shape Logic**: Output shape is `[units]` where `units` is the layer parameter
- **Example**: `Dense(units=128)` with input `[784]` outputs `[128]`

### 3. Conv2D Layer
- **Type**: `Conv2D`
- **Shape Logic**: Computes output dimensions based on:
  - Input shape: `[height, width, channels]`
  - Filters: number of output channels
  - Kernel size: `(kernel_h, kernel_w)`
  - Strides: `(stride_h, stride_w)`
  - Padding: `'same'` or `'valid'`
- **Example**: `Conv2D(filters=32, kernel_size='(3,3)', padding='same')` with input `[28, 28, 1]` outputs `[28, 28, 32]`

### 4. MaxPool2D Layer
- **Type**: `MaxPool2D`
- **Shape Logic**: Reduces spatial dimensions by pool size
  - Input: `[height, width, channels]`
  - Output: `[height//pool_h, width//pool_w, channels]`
- **Example**: `MaxPool2D(pool_size='(2,2)')` with input `[28, 28, 32]` outputs `[14, 14, 32]`

### 5. Flatten Layer
- **Type**: `Flatten`
- **Shape Logic**: Flattens all dimensions into a single dimension
- **Example**: Input `[7, 7, 64]` outputs `[3136]` (7×7×64=3136)

### 6. Merge Layer
- **Type**: `Merge`
- **Shape Logic**: Depends on merge mode:
  - `'concat'`: Concatenates along last dimension
  - `'add'`, `'multiply'`, `'average'`, `'maximum'`: Requires identical input shapes
- **Example**: Concat two inputs `[128]` and `[128]` outputs `[256]`

### 7. Shape-Preserving Layers
- **Types**: `BatchNorm`, `Activation`, `Dropout`
- **Shape Logic**: Preserve input shape exactly
- **Special Case**: `GlobalAvgPool` reduces spatial dimensions to keep only channel dimension

## Usage Examples

### Basic Usage

```typescript
import { parseGraphToDAG } from './lib/dag-parser'
import { computeShapes } from './lib/shape-computation'
import type { Node, Edge } from '@xyflow/react'

// Create nodes and edges representing your neural network
const nodes: Node[] = [
  { id: 'input1', data: { type: 'Input', params: { shape: '(784,)' } } },
  { id: 'dense1', data: { type: 'Dense', params: { units: 128 } } },
  { id: 'output1', data: { type: 'Output', params: { units: 10 } } }
]

const edges: Edge[] = [
  { id: 'e1', source: 'input1', target: 'dense1' },
  { id: 'e2', source: 'dense1', target: 'output1' }
]

// Parse the graph into a DAG
const dag = parseGraphToDAG(nodes, edges)

if (dag.isValid) {
  // Compute shapes
  const result = computeShapes(dag, '(784,)')
  
  if (result.errors.length === 0) {
    console.log('All shapes computed successfully!')
    
    // Access computed shapes
    for (const [nodeId, shape] of result.nodeShapes.entries()) {
      console.log(`Node ${nodeId}: shape = [${shape.join(', ')}]`)
    }
  } else {
    console.log('Shape computation errors:')
    result.errors.forEach(error => {
      console.log(`${error.nodeId}: ${error.message}`)
    })
  }
}
```

### CNN Example

```typescript
const cnnNodes: Node[] = [
  { id: 'input', data: { type: 'Input', params: { shape: '(28, 28, 1)' } } },
  { id: 'conv1', data: { type: 'Conv2D', params: { filters: 32, kernel_size: '(3,3)' } } },
  { id: 'pool1', data: { type: 'MaxPool2D', params: { pool_size: '(2,2)' } } },
  { id: 'flatten', data: { type: 'Flatten', params: {} } },
  { id: 'dense', data: { type: 'Dense', params: { units: 10 } } }
]

// Expected shape flow:
// input: [28, 28, 1]
// conv1: [28, 28, 32] (with 'same' padding)
// pool1: [14, 14, 32]
// flatten: [6272] (14×14×32)
// dense: [10]
```

## Error Handling

The function returns detailed error information for various scenarios:

- **Invalid input shape format**: When the input shape string cannot be parsed
- **Missing input connections**: When a layer has no incoming edges
- **Incompatible shapes**: When layer requirements don't match input shapes
- **Invalid parameters**: When layer parameters are missing or invalid
- **Unknown layer types**: When encountering unsupported layer types

## Integration with UI

To integrate shape computation with the visual editor:

```typescript
import { parseGraphToDAG } from './lib/dag-parser'
import { computeShapes } from './lib/shape-computation'

// In your React component
const handleShapeComputation = async () => {
  // Parse the graph into a DAG
  const dagResult = parseGraphToDAG(nodes, edges)
  
  if (!dagResult.isValid) {
    // Display DAG validation errors
    setShapeErrors(dagResult.errors.map(error => ({ nodeId: 'graph', message: error })))
    return
  }
  
  // Compute shapes for each node
  const result = await computeShapes(dagResult, '(784,)')
  
  if (result.errors.length === 0) {
    // Update UI to show computed shapes - convert to display format
    const nodeShapes = new Map<string, string>()
    for (const [nodeId, shape] of result.nodeShapes.entries()) {
      nodeShapes.set(nodeId, `(${shape.join(', ')})`)
    }
    setNodeShapes(nodeShapes)
  } else {
    // Display errors to user
    setShapeErrors(result.errors)
  }
}
```

## Shape String Format

All shapes are represented as tuple strings:
- `'(784,)'` for 1D shape with 784 elements
- `'(28, 28, 1)'` for 3D shape (height=28, width=28, channels=1)
- `'()'` for scalar (0-dimensional)

## Performance Considerations

- The function processes nodes in topological order, ensuring O(V+E) complexity
- Shape computations are lightweight mathematical operations
- Memory usage scales linearly with the number of nodes
- For large networks, consider batching shape updates in the UI

## Extending Support

To add support for new layer types:

1. Add a new case to the switch statement in `computeShapes`
2. Implement the shape computation logic for the new layer
3. Add appropriate error handling for invalid parameters
4. Update this documentation with the new layer's behavior

## Common Issues

1. **Mismatched dimensions**: Ensure Conv2D layers receive 3D inputs
2. **Invalid merge inputs**: Merge layers need compatible input shapes
3. **Parse errors**: Verify shape strings follow the tuple format
4. **Disconnected nodes**: All layers except Input must have incoming connections

## Visual Feedback System

The shape computation system is integrated with the visual editor to provide immediate feedback about shape errors:

### Error Highlighting

Nodes with shape errors are visually distinguished by:

1. **Card Styling**:
   - Red border instead of the default blue/gray
   - Red hover effects and shadow colors
   - Error-specific styling states

2. **Visual Indicators**:
   - Warning emoji (⚠️) in the node title
   - Red text color for the layer type
   - Red-colored input/output handles (instead of blue/green)

3. **Error Messages**:
   - Inline error message displayed in the node content
   - Detailed error description in a red-bordered box
   - Tooltip on hover showing the full error message

### Real-time Updates

The visual feedback system automatically updates when:
- New nodes are added to the canvas
- Existing nodes are modified
- Connections between nodes change
- Node parameters are updated through the editor

### Implementation Details

The visual feedback is implemented through:

1. **CanvasEditor Integration**: 
   - Automatic shape computation on graph changes
   - Error state propagation to node data
   - Real-time error detection and highlighting

2. **LayerNode Enhancement**:
   - Conditional styling based on error state
   - Error message display components
   - Interactive tooltips for error details

3. **Shape Computation Pipeline**:
   - DAG validation and traversal
   - Layer-specific shape calculations
   - Comprehensive error reporting

### Usage Example

```typescript
// The visual feedback happens automatically in the CanvasEditor
// Node data is automatically enhanced with error information:
interface LayerNodeData {
  type: string
  params: Record<string, any>
  hasShapeError?: boolean        // Added by shape computation
  shapeErrorMessage?: string     // Added by shape computation
}
```

### Testing Visual Feedback

Use the test examples in `visual-feedback-test.ts` to verify the error highlighting:

1. **networkWithShapeError**: Demonstrates incompatible layer connections
2. **networkWithValidShapes**: Shows correct shape flow without errors
3. **networkWithMultipleErrors**: Complex network with various error types

The visual feedback provides immediate visual cues to help users identify and fix shape mismatches in their neural network architectures.
