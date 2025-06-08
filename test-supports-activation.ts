import { getLayerDefinition } from './src/lib/layer-definitions.ts';

console.log('Testing supportsActivation property:');

const dense = getLayerDefinition('Dense');
console.log('Dense layer supportsActivation:', dense?.supportsActivation);

const conv2d = getLayerDefinition('Conv2D');
console.log('Conv2D layer supportsActivation:', conv2d?.supportsActivation);

const flatten = getLayerDefinition('Flatten');
console.log('Flatten layer supportsActivation:', flatten?.supportsActivation);

const activation = getLayerDefinition('Activation');
console.log('Activation layer supportsActivation:', activation?.supportsActivation);

const dropout = getLayerDefinition('Dropout');
console.log('Dropout layer supportsActivation:', dropout?.supportsActivation);
