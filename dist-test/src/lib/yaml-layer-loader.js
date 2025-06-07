/**
 * Enhanced YAML Layer Configuration Loader
 * Loads layer definitions from the enhanced YAML configuration using the new schema
 */
import yaml from 'js-yaml';
import { layerDefs } from './layer-defs';
import { validateYAMLConfig } from './yaml-schema';
/**
 * Convert enhanced YAML parameter to LayerFormField format
 */
function convertParameter(key, param) {
    // Map enhanced YAML parameter types to LayerFormField types
    const typeMapping = {
        'number': 'number',
        'text': 'text',
        'select': 'select',
        'boolean': 'select', // Convert boolean to select with true/false options
        'color': 'text', // Convert color to text input
        'range': 'number' // Convert range to number input
    };
    const mappedType = typeMapping[param.type] || 'text';
    const field = {
        key,
        label: param.label,
        type: mappedType,
        ...(param.validation?.min !== undefined && { min: param.validation.min }),
        ...(param.validation?.max !== undefined && { max: param.validation.max }),
        ...(param.validation?.step !== undefined && { step: param.validation.step })
    };
    // Handle options - either from original options or convert boolean to select
    if (param.options && param.options.length > 0) {
        field.options = param.options;
    }
    else if (param.type === 'boolean') {
        field.options = [
            { value: 'true', label: 'True' },
            { value: 'false', label: 'False' }
        ];
    }
    // Convert show_when conditions to show function
    if (param.conditional?.show_when) {
        field.show = (params) => {
            return Object.entries(param.conditional.show_when).some(([paramKey, values]) => {
                if (Array.isArray(values)) {
                    return values.includes(String(params[paramKey]));
                }
                // Handle complex conditional logic here if needed
                return false;
            });
        };
    }
    return field;
}
/**
 * Shape computation utilities
 */
const ShapeComputers = {
    computeInputShape(params) {
        const inputType = params.inputType || 'image_grayscale';
        const computations = {
            image_grayscale: () => `(${Number(params.height) || 28}, ${Number(params.width) || 28}, 1)`,
            image_color: () => `(${Number(params.height) || 28}, ${Number(params.width) || 28}, 3)`,
            image_custom: () => `(${Number(params.height) || 28}, ${Number(params.width) || 28}, ${Number(params.channels) || 1})`,
            flat_data: () => `(${Number(params.flatSize) || 784},)`,
            sequence: () => `(${Number(params.seqLength) || 100}, ${Number(params.features) || 128})`,
            custom: () => String(params.customShape) || '(784,)'
        };
        return computations[String(inputType)]?.() || '(784,)';
    },
    computeOutputUnits(params) {
        const outputType = params.outputType || 'multiclass';
        const computations = {
            multiclass: () => Number(params.numClasses) || 10,
            binary: () => 1,
            regression: () => Number(params.units) || 1,
            multilabel: () => Number(params.units) || 10,
            custom: () => Number(params.units) || 10
        };
        return computations[String(outputType)]?.() || 10;
    },
    computeOutputActivation(params) {
        const outputType = params.outputType || 'multiclass';
        const activations = {
            multiclass: 'softmax',
            binary: 'sigmoid',
            regression: 'linear',
            multilabel: 'sigmoid',
            custom: String(params.activation) || 'softmax'
        };
        return activations[String(outputType)] || 'softmax';
    }
};
/**
 * Template processing utilities
 */
const TemplateProcessor = {
    handleComputedValue(varName, params) {
        const computations = {
            computed_shape: () => ShapeComputers.computeInputShape(params),
            computed_units: () => ShapeComputers.computeOutputUnits(params).toString(),
            computed_activation: () => ShapeComputers.computeOutputActivation(params)
        };
        return computations[varName]?.() || `{{${varName}}}`;
    },
    handleMultiplier(code, params, layerName) {
        const multiplier = Number(params.multiplier) || 1;
        if (multiplier <= 1)
            return code.trim();
        const baseCode = code.trim();
        return multiplier <= 5
            ? Array(multiplier).fill(baseCode).join(',\n    ')
            : `# Add ${multiplier} ${layerName} layers\n    *[${baseCode} for _ in range(${multiplier})]`;
    },
    processConditionals(code, params) {
        // Handle all Jinja2-like conditional statements
        let result = code.trim();
        // Handle "is not none" checks first (most specific)
        result = result.replace(/\{%\s*if\s+(\w+)\s+is\s+not\s+none\s*%\}((?:(?!\{%\s*endif\s*%\}).)*)?\{%\s*endif\s*%\}/g, (_, varName, content) => {
            const value = params[varName];
            return value !== null && value !== undefined && value !== '' ? content.trim() : '';
        });
        // Handle "is defined" checks
        result = result.replace(/\{%\s*if\s+(\w+)\s+is\s+defined\s*%\}((?:(?!\{%\s*endif\s*%\}).)*)?\{%\s*endif\s*%\}/g, (_, varName, content) => {
            const value = params[varName];
            return value !== undefined ? content.trim() : '';
        });
        // Handle specific conditional patterns with mode comparisons
        result = result.replace(/\{%\s*if\s+mode\s*==\s*["'](\w+)["']\s*%\}((?:(?!\{%\s*endif\s*%\}).)*)?\{%\s*endif\s*%\}/g, (_, conditionMode, content) => {
            const mode = params.mode || 'concat';
            return mode === conditionMode ? content.trim() : '';
        });
        // Handle elif chain patterns by processing them sequentially
        result = result.replace(/\{%\s*if\s+mode\s*==\s*["'](\w+)["']\s*%\}((?:(?!\{%\s*elif)(?!\{%\s*endif\s*%\}).)*)?\{%\s*elif\s+mode\s*==\s*["'](\w+)["']\s*%\}((?:(?!\{%\s*endif\s*%\}).)*)?\{%\s*endif\s*%\}/g, (_, mode1, content1, mode2, content2) => {
            const mode = params.mode || 'concat';
            if (mode === mode1)
                return content1.trim();
            if (mode === mode2)
                return content2.trim();
            return '';
        });
        // Handle variable existence checks like {% if noise_shape %} (least specific, comes last)
        result = result.replace(/\{%\s*if\s+(\w+)\s*%\}((?:(?!\{%\s*endif\s*%\}).)*)?\{%\s*endif\s*%\}/g, (_, varName, content) => {
            const value = params[varName];
            return value && value !== '' && value !== null && value !== undefined ? content.trim() : '';
        });
        return result.split('\n').filter(line => line.trim() !== '').join('\n').trim();
    },
    processVariables(code, params) {
        return code.replace(/{{\s*(\w+)\s*}}/g, (_, varName) => {
            if (varName.startsWith('computed_')) {
                return this.handleComputedValue(varName, params);
            }
            if (varName === 'activation_suffix') {
                const activation = params.activation;
                return activation && activation !== 'none' ? `, activation='${activation}'` : '';
            }
            const value = params[varName];
            return value !== undefined ? value.toString() : `{{${varName}}}`;
        });
    },
    generateCode(template, params, layerName) {
        let code = this.processConditionals(template, params);
        code = this.processVariables(code, params);
        return this.handleMultiplier(code, params, layerName);
    }
};
/**
 * Convert enhanced YAML layer to LayerDef format using validated schema
 */
function convertYAMLLayer(layerName, yamlLayer) {
    const { metadata, parameters, frameworks, features } = yamlLayer;
    // Convert parameters to formSpec and extract defaults
    const formSpec = Object.entries(parameters).map(([key, param]) => convertParameter(key, param));
    const defaultParams = Object.fromEntries(Object.entries(parameters)
        .filter(([, param]) => param.default !== undefined)
        .map(([key, param]) => [key, param.default]));
    // Use Keras framework by default (enhanced YAML uses frameworks structure)
    const kerasFramework = frameworks.keras;
    if (!kerasFramework) {
        throw new Error(`Layer ${layerName} missing Keras framework definition`);
    }
    return {
        type: layerName,
        icon: metadata.icon,
        description: metadata.description,
        category: metadata.category, // Include category from metadata
        defaultParams,
        formSpec,
        codeGen: (params) => TemplateProcessor.generateCode(typeof kerasFramework.template === 'string' ? kerasFramework.template : kerasFramework.template.base, params, layerName),
        kerasImport: Array.isArray(kerasFramework.import) ? kerasFramework.import[0] : kerasFramework.import,
        supportsMultiplier: features?.supports_multiplier || false
    };
}
/**
 * Load layer definitions from enhanced YAML file with validation
 */
export async function loadLayersFromYAML(yamlContent) {
    try {
        const rawConfig = yaml.load(yamlContent);
        const config = validateYAMLConfig(rawConfig);
        return Object.fromEntries(Object.entries(config.layers).map(([layerName, yamlLayer]) => [
            layerName,
            convertYAMLLayer(layerName, yamlLayer)
        ]));
    }
    catch (error) {
        if (error instanceof Error) {
            console.error('YAML validation errors:', error.message);
            throw new Error(`Invalid YAML configuration: ${error.message}`);
        }
        console.error('Error loading YAML configuration:', error);
        throw error;
    }
}
// Store the YAML content for later use
let cachedYamlContent = null;
/**
 * Load layer categories from enhanced YAML with validation
 */
export function loadCategoriesFromYAML(yamlContent) {
    try {
        const rawConfig = yaml.load(yamlContent);
        const config = validateYAMLConfig(rawConfig);
        return config.categories;
    }
    catch (error) {
        if (error instanceof Error) {
            console.error('YAML validation errors:', error.message);
            throw new Error(`Invalid YAML configuration: ${error.message}`);
        }
        console.error('Error loading categories from YAML:', error);
        throw error;
    }
}
/**
 * Load categories with their associated layers with validation
 */
export function loadCategoriesWithLayers(yamlContent) {
    try {
        const rawConfig = yaml.load(yamlContent);
        const config = validateYAMLConfig(rawConfig);
        // Create category-layer mapping
        const categoryLayerMap = Object.fromEntries(Object.keys(config.categories).map(categoryKey => [categoryKey, []]));
        // Map layers to their categories
        Object.entries(config.layers).forEach(([layerName, layerDef]) => {
            const categoryKey = layerDef.metadata.category;
            if (categoryLayerMap[categoryKey]) {
                categoryLayerMap[categoryKey].push(layerName);
            }
        });
        // Transform to BlockPalette format
        return Object.entries(config.categories).map(([categoryKey, categoryDef]) => ({
            name: categoryDef.name,
            color: categoryDef.color,
            bgColor: categoryDef.bg_color,
            borderColor: categoryDef.border_color,
            textColor: categoryDef.text_color,
            description: categoryDef.description,
            layerTypes: categoryLayerMap[categoryKey] || []
        }));
    }
    catch (error) {
        if (error instanceof Error) {
            console.error('YAML validation errors:', error.message);
            throw new Error(`Invalid YAML configuration: ${error.message}`);
        }
        console.error('Error loading categories with layers from YAML:', error);
        throw error;
    }
}
/**
 * Get the cached YAML content
 */
export function getCachedYamlContent() {
    return cachedYamlContent;
}
/**
 * Initialize layer definitions by loading from enhanced YAML file and populating layerDefs
 */
export async function initializeLayerDefs() {
    try {
        // Load enhanced YAML from public directory
        const response = await fetch('/layers-enhanced.yaml');
        if (!response.ok) {
            throw new Error(`Failed to fetch layers-enhanced.yaml: ${response.status} ${response.statusText}`);
        }
        const yamlContent = await response.text();
        cachedYamlContent = yamlContent; // Cache the content
        const loadedLayerDefs = await loadLayersFromYAML(yamlContent);
        // Clear existing definitions and add loaded ones
        Object.keys(layerDefs).forEach(key => delete layerDefs[key]);
        Object.assign(layerDefs, loadedLayerDefs);
        console.log(`Successfully loaded ${Object.keys(layerDefs).length} layer definitions from enhanced YAML`);
    }
    catch (error) {
        console.error('Failed to initialize layer definitions from enhanced YAML:', error);
        throw error;
    }
}
