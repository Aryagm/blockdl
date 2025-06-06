/**
 * Input layer utilities for handling different input types and computing shapes
 */

export interface InputShapeResult {
  shape: string
  dimensions: number[]
}

/**
 * Computes shape string from input layer parameters
 */
export function computeInputShape(params: Record<string, any>): string {
  if (params.inputType) {
    // New input layer structure - compute shape from input type
    const inputType = params.inputType;
    switch (inputType) {
      case 'image_grayscale':
        const h1 = params.height || 28;
        const w1 = params.width || 28;
        return `(${h1}, ${w1}, 1)`;
      case 'image_color':
        const h2 = params.height || 28;
        const w2 = params.width || 28;
        return `(${h2}, ${w2}, 3)`;
      case 'image_custom':
        const h3 = params.height || 28;
        const w3 = params.width || 28;
        const c3 = params.channels || 1;
        return `(${h3}, ${w3}, ${c3})`;
      case 'flat_data':
        const size = params.flatSize || 784;
        return `(${size},)`;
      case 'sequence':
        const seqLen = params.seqLength || 100;
        const features = params.features || 128;
        return `(${seqLen}, ${features})`;
      case 'custom':
        return params.customShape || '(784,)';
      default:
        return '(784,)';
    }
  } else if (params.shape) {
    // Legacy input layer with shape parameter
    return params.shape;
  }
  
  return '(784,)'; // Default fallback
}

/**
 * Gets display shape for input layers in the UI
 */
export function getInputDisplayShape(params: Record<string, any>): string {
  const inputType = params.inputType || 'image_grayscale';
  
  switch (inputType) {
    case 'image_grayscale': {
      const h1 = params.height || 28;
      const w1 = params.width || 28;
      return `${h1}×${w1}×1`;
    }
    case 'image_color': {
      const h2 = params.height || 28;
      const w2 = params.width || 28;
      return `${h2}×${w2}×3`;
    }
    case 'image_custom': {
      const h3 = params.height || 28;
      const w3 = params.width || 28;
      const c3 = params.channels || 1;
      return `${h3}×${w3}×${c3}`;
    }
    case 'flat_data': {
      const size = params.flatSize || 784;
      return `${size}`;
    }
    case 'sequence': {
      const seqLen = params.seqLength || 100;
      const features = params.features || 128;
      return `${seqLen}×${features}`;
    }
    case 'custom': {
      return params.customShape || '784';
    }
    default: {
      return '28×28×1';
    }
  }
}

/**
 * Gets input type label for display
 */
export function getInputTypeLabel(inputType: string): string {
  const inputTypeLabels: Record<string, string> = {
    'image_grayscale': 'Grayscale',
    'image_color': 'Color', 
    'image_custom': 'Custom Image',
    'flat_data': 'Flattened',
    'sequence': 'Sequence',
    'custom': 'Custom'
  };
  
  return inputTypeLabels[inputType] || inputType;
}
