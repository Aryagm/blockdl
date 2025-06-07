/**
 * Input layer utilities for handling different input types and computing shapes
 */
import { computeYAMLDrivenShape } from './yaml-shape-loader';
/**
 * Computes shape string from input layer parameters using YAML-driven computation
 */
export async function computeInputShape(params) {
    try {
        // Use YAML-driven shape computation for Input layer
        const shapeResult = await computeYAMLDrivenShape('Input', [], params);
        if (shapeResult.shape) {
            // Convert shape array to string format
            return `(${shapeResult.shape.join(', ')})`;
        }
    }
    catch (error) {
        console.warn('YAML-driven shape computation failed, using fallback:', error);
    }
    // Fallback to legacy behavior if YAML computation fails
    if (params.shape && typeof params.shape === 'string') {
        return params.shape;
    }
    return '(784,)'; // Default fallback
}
/**
 * Gets display shape for input layers in the UI using YAML-driven computation
 */
export async function getInputDisplayShape(params) {
    try {
        // Use YAML-driven shape computation for Input layer
        const shapeResult = await computeYAMLDrivenShape('Input', [], params);
        if (shapeResult.shape) {
            // Convert shape array to display format using × separator
            return shapeResult.shape.join('×');
        }
    }
    catch (error) {
        console.warn('YAML-driven shape computation failed for display, using fallback:', error);
    }
    // Fallback to default if YAML computation fails
    return '28×28×1';
}
/**
 * Gets input type label for display
 */
export function getInputTypeLabel(inputType) {
    const inputTypeLabels = {
        'image_grayscale': 'Grayscale',
        'image_color': 'Color',
        'image_custom': 'Custom Image',
        'flat_data': 'Flattened',
        'sequence': 'Sequence',
        'custom': 'Custom'
    };
    return inputTypeLabels[inputType] || inputType;
}
