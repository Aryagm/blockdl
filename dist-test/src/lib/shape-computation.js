/**
 * Shape computation utilities for neural network layers
 */
import { computeInputShape } from './input-layer-utils';
import { computeYAMLDrivenShape } from './yaml-shape-loader';
/**
 * Parses a tuple string like "(28, 28, 1)" or "(784,)" into a number array
 */
function parseShape(shapeStr) {
    try {
        // Remove whitespace and extract numbers from tuple format
        const cleaned = shapeStr.trim();
        if (!cleaned.startsWith('(') || !cleaned.endsWith(')')) {
            return null;
        }
        const content = cleaned.slice(1, -1).trim();
        if (content === '')
            return [];
        return content.split(',').map(s => {
            const num = parseInt(s.trim());
            return isNaN(num) ? null : num;
        }).filter(n => n !== null);
    }
    catch {
        return null;
    }
}
/**
 * Walks the DAG, computes output shapes for each node, and returns computed shapes and errors
 */
export async function computeShapes(dag, inputShape) {
    const errors = [];
    const nodeShapes = new Map();
    // Parse the input shape
    const parsedInputShape = parseShape(inputShape);
    if (!parsedInputShape) {
        errors.push({
            nodeId: 'input',
            message: `Invalid input shape format: ${inputShape}. Expected format like "(784,)" or "(28, 28, 1)"`
        });
        return { errors, nodeShapes };
    }
    // Process nodes in topological order
    for (const node of dag.orderedNodes) {
        let outputShape = null;
        try {
            if (node.type === 'Input') {
                // Input layer defines the initial shape
                const computedShape = await computeInputShape(node.params);
                const nodeInputShape = parseShape(computedShape);
                if (!nodeInputShape) {
                    errors.push({
                        nodeId: node.id,
                        message: `Invalid input shape in Input layer: ${computedShape}`
                    });
                    continue;
                }
                outputShape = nodeInputShape;
            }
            else {
                // Get input shapes for this node
                const inputNodeIds = [];
                // Find all nodes that connect to this node
                for (const [sourceId, targets] of dag.edgeMap.entries()) {
                    if (targets.includes(node.id)) {
                        inputNodeIds.push(sourceId);
                    }
                }
                if (inputNodeIds.length === 0) {
                    errors.push({
                        nodeId: node.id,
                        message: `Node ${node.type} has no input connections`
                    });
                    continue;
                }
                // Get input shapes
                const inputShapes = inputNodeIds.map(id => nodeShapes.get(id)).filter(shape => shape !== undefined);
                if (inputShapes.length !== inputNodeIds.length) {
                    errors.push({
                        nodeId: node.id,
                        message: `Could not determine input shapes for ${node.type} layer`
                    });
                    continue;
                }
                // Compute output shape using YAML-driven shape computation
                const shapeResult = await computeYAMLDrivenShape(node.type, inputShapes, node.params);
                if (shapeResult.error || shapeResult.shape === null) {
                    errors.push({
                        nodeId: node.id,
                        message: shapeResult.error || `Could not compute output shape for ${node.type} layer`
                    });
                    continue;
                }
                outputShape = shapeResult.shape;
            }
            if (outputShape === null) {
                errors.push({
                    nodeId: node.id,
                    message: `Could not compute output shape for ${node.type} layer`
                });
                continue;
            }
            // Store the computed shape
            nodeShapes.set(node.id, outputShape);
        }
        catch (error) {
            errors.push({
                nodeId: node.id,
                message: `Error computing shape for ${node.type}: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    }
    return { errors, nodeShapes };
}
