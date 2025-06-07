/**
 * Centralized layer definitions registry for BlockDL
 * Layer definitions are loaded from YAML configuration at startup
 */
import { loadCategoriesWithLayers, getCachedYamlContent } from './yaml-layer-loader';
// Layer definitions - populated from YAML at startup
export const layerDefs = {};
// Utility functions for accessing layer definitions
/**
 * Get layer definition by type
 */
export function getLayerDef(type) {
    return layerDefs[type];
}
/**
 * Get default parameters for a layer type
 */
export function getDefaultParams(type) {
    return layerDefs[type]?.defaultParams || {};
}
/**
 * Get icon for a layer type
 */
export function getLayerIcon(type) {
    return layerDefs[type]?.icon || '🔧';
}
/**
 * Get all available layer types
 */
export function getLayerTypes() {
    return Object.entries(layerDefs).map(([type, def]) => ({
        type,
        icon: def.icon,
        description: def.description
    }));
}
/**
 * Generate code for a layer with given parameters
 */
export function generateLayerCode(type, params) {
    const layerDef = layerDefs[type];
    if (!layerDef) {
        return `# Unknown layer type: ${type}`;
    }
    return layerDef.codeGen(params);
}
/**
 * Get used Keras imports from a list of layer types
 */
export function getUsedKerasImports(layerTypes) {
    const imports = new Set();
    layerTypes.forEach(type => {
        const layerDef = layerDefs[type];
        if (layerDef?.kerasImport) {
            // Split by comma in case multiple imports are specified
            layerDef.kerasImport.split(',').forEach(imp => {
                imports.add(imp.trim());
            });
        }
    });
    return Array.from(imports);
}
/**
 * Get layer categories with their associated layers from YAML
 */
export function getLayerCategoriesFromYAML() {
    const yamlContent = getCachedYamlContent();
    if (!yamlContent) {
        console.warn('YAML content not loaded yet, returning empty categories');
        return [];
    }
    try {
        return loadCategoriesWithLayers(yamlContent);
    }
    catch (error) {
        console.error('Error getting categories from YAML:', error);
        return [];
    }
}
