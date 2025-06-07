/**
 * Enhanced YAML Schema for BlockDL
 * 
 * This file defines comprehensive TypeScript types for the new modular YAML structure
 * that will enable fully YAML-driven layer definitions, moving away from hardcoded
 * TypeScript logic to a completely configurable system.
 * 
 * Key enhancements:
 * - Added 'info' parameter in layer metadata for educational documentation links
 * - Formula-based shape computation definitions
 * - Advanced template engine specifications
 * - Multi-framework support structure
 * - Comprehensive validation schemas
 * 
 * @version 2.0.0
 * @author BlockDL Team
 */

import { z } from 'zod'

// =============================================================================
// CORE TYPE DEFINITIONS
// =============================================================================

/**
 * Supported parameter types for layer configuration
 */
export type ParameterType = 'number' | 'text' | 'select' | 'boolean' | 'color' | 'range'

/**
 * Supported framework targets for code generation
 */
export type FrameworkTarget = 'keras' | 'pytorch' | 'onnx' | 'jax' | 'tensorflow'

/**
 * Mathematical operators supported in formula expressions
 */
export type FormulaOperator = '+' | '-' | '*' | '/' | 'max' | 'min' | 'ceil' | 'floor' | 'round'

// =============================================================================
// ENHANCED PARAMETER SCHEMA
// =============================================================================

/**
 * Enhanced parameter validation options
 */
export const ParameterValidationSchema = z.object({
  required: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  pattern: z.string().optional(), // Regex pattern for text validation
  custom_validator: z.string().optional(), // Custom validation formula
  error_message: z.string().optional() // Custom error message
})

/**
 * Conditional visibility rules for parameters
 */
export const ConditionalDisplaySchema = z.object({
  show_when: z.record(z.union([
    z.array(z.string()), // Simple value matching
    z.object({
      operator: z.enum(['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'in', 'not_in']),
      value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
    })
  ])).optional(),
  hide_when: z.record(z.union([
    z.array(z.string()),
    z.object({
      operator: z.enum(['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'in', 'not_in']),
      value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
    })
  ])).optional()
})

/**
 * Enhanced parameter definition with full configurability
 */
export const ParameterSchema = z.object({
  type: z.enum(['number', 'text', 'select', 'boolean', 'color', 'range']),
  label: z.string(),
  description: z.string().optional(),
  default: z.union([z.string(), z.number(), z.boolean()]).optional(),
  
  // Enhanced options for select type
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
    description: z.string().optional(),
    disabled: z.boolean().optional()
  })).optional(),
  
  // Enhanced validation
  validation: ParameterValidationSchema.optional(),
  
  // Conditional display
  conditional: ConditionalDisplaySchema.optional(),
  
  // UI hints
  ui: z.object({
    placeholder: z.string().optional(),
    tooltip: z.string().optional(),
    icon: z.string().optional(),
    group: z.string().optional(), // For parameter grouping in UI
    order: z.number().optional(), // Display order within group
    width: z.enum(['full', 'half', 'third', 'quarter']).optional()
  }).optional()
})

// =============================================================================
// FORMULA-BASED SHAPE COMPUTATION
// =============================================================================

/**
 * Mathematical expression for shape computation
 */
export const FormulaExpressionSchema = z.object({
  type: z.literal('formula'),
  expression: z.string(), // Mathematical expression string
  variables: z.record(z.string()).optional(), // Variable definitions
  description: z.string().optional()
})

/**
 * Conditional shape computation based on parameter values
 */
export const ConditionalShapeSchema = z.object({
  type: z.literal('conditional'),
  conditions: z.array(z.object({
    when: z.record(z.union([z.string(), z.number(), z.boolean()])),
    then: z.union([FormulaExpressionSchema, z.string()]), // Can be formula or reference
    description: z.string().optional()
  })),
  default: z.union([FormulaExpressionSchema, z.string()]),
  description: z.string().optional()
})

/**
 * Reference to a predefined shape computation function
 */
export const ShapeReferenceSchema = z.object({
  type: z.literal('reference'),
  function: z.string(), // Reference to predefined function
  parameters: z.record(z.union([z.string(), z.number()])).optional(),
  description: z.string().optional()
})

/**
 * Comprehensive shape computation definition
 */
export const ShapeComputationSchema = z.union([
  FormulaExpressionSchema,
  ConditionalShapeSchema,
  ShapeReferenceSchema,
  z.string() // Simple string reference for backward compatibility
])

// =============================================================================
// ADVANCED TEMPLATE ENGINE
// =============================================================================

/**
 * Template variable definition with type and transformation
 */
export const TemplateVariableSchema = z.object({
  source: z.string(), // Parameter name or computed value
  type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
  transform: z.string().optional(), // Transformation function
  default: z.union([z.string(), z.number(), z.boolean()]).optional(),
  description: z.string().optional()
})

/**
 * Conditional template blocks
 */
export const TemplateConditionalSchema = z.object({
  condition: z.string(), // Boolean expression
  template: z.string(), // Template to use when condition is true
  else_template: z.string().optional(), // Template for else case
  description: z.string().optional()
})

/**
 * Advanced template definition with full control
 */
export const TemplateSchema = z.object({
  base: z.string(), // Base template string
  variables: z.record(TemplateVariableSchema).optional(),
  conditionals: z.array(TemplateConditionalSchema).optional(),
  imports: z.array(z.string()).optional(), // Required imports
  preprocessing: z.string().optional(), // Pre-processing script
  postprocessing: z.string().optional(), // Post-processing script
  description: z.string().optional()
})

// =============================================================================
// MULTI-FRAMEWORK SUPPORT
// =============================================================================

/**
 * Framework-specific code generation
 */
export const FrameworkDefinitionSchema = z.object({
  import: z.union([z.string(), z.array(z.string())]),
  template: z.union([z.string(), TemplateSchema]),
  shape_computation: ShapeComputationSchema.optional(),
  dependencies: z.array(z.string()).optional(), // Additional dependencies
  version_constraints: z.object({
    min: z.string().optional(),
    max: z.string().optional()
  }).optional(),
  notes: z.string().optional()
})

// =============================================================================
// ENHANCED METADATA WITH INFO PARAMETER
// =============================================================================

/**
 * Enhanced metadata section with educational documentation support
 */
export const LayerMetadataSchema = z.object({
  category: z.string(),
  icon: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  
  // NEW: Educational documentation link
  info: z.string().optional(), // Path to markdown file with educational content
  
  // Enhanced metadata
  version: z.string().optional(),
  author: z.string().optional(),
  license: z.string().optional(),
  deprecated: z.boolean().optional(),
  experimental: z.boolean().optional(),
  
  // Related layers and alternatives
  related: z.array(z.string()).optional(),
  alternatives: z.array(z.object({
    layer: z.string(),
    reason: z.string()
  })).optional(),
  
  // Performance and usage hints
  performance: z.object({
    computational_complexity: z.string().optional(),
    memory_usage: z.string().optional(),
    recommended_use: z.string().optional()
  }).optional()
})

// =============================================================================
// VISUAL CONFIGURATION
// =============================================================================

/**
 * Enhanced visual configuration with more styling options
 */
export const VisualConfigSchema = z.object({
  handles: z.object({
    input: z.boolean(),
    output: z.boolean(),
    input_multiple: z.boolean().optional(), // Supports multiple inputs
    output_multiple: z.boolean().optional() // Supports multiple outputs
  }),
  
  // Size and layout
  default_size: z.tuple([z.number(), z.number()]).optional(),
  min_size: z.tuple([z.number(), z.number()]).optional(),
  max_size: z.tuple([z.number(), z.number()]).optional(),
  resizable: z.boolean().optional(),
  
  // Advanced styling
  style: z.object({
    background: z.string().optional(),
    border: z.string().optional(),
    text_color: z.string().optional(),
    custom_css: z.string().optional()
  }).optional(),
  
  // Connection constraints
  connections: z.object({
    max_inputs: z.number().optional(),
    max_outputs: z.number().optional(),
    input_types: z.array(z.string()).optional(), // Allowed input layer types
    output_types: z.array(z.string()).optional() // Allowed output layer types
  }).optional()
})

// =============================================================================
// ENHANCED LAYER DEFINITION
// =============================================================================

/**
 * Complete enhanced layer definition schema
 */
export const EnhancedLayerSchema = z.object({
  metadata: LayerMetadataSchema,
  visual: VisualConfigSchema,
  parameters: z.record(ParameterSchema),
  
  // Enhanced features
  features: z.object({
    supports_multiplier: z.boolean().optional(),
    supports_batch_processing: z.boolean().optional(),
    supports_gradient_checkpointing: z.boolean().optional(),
    supports_mixed_precision: z.boolean().optional(),
    trainable: z.boolean().optional()
  }).optional(),
  
  // Multi-framework support
  frameworks: z.record(FrameworkDefinitionSchema),
  
  // Validation and testing
  validation: z.object({
    input_shapes: z.array(z.array(z.number())).optional(), // Valid input shapes for testing
    parameter_combinations: z.array(z.record(z.union([z.string(), z.number(), z.boolean()]))).optional(),
    unit_tests: z.array(z.string()).optional() // Test case references
  }).optional()
})

// =============================================================================
// CATEGORY DEFINITIONS
// =============================================================================

/**
 * Enhanced category definition with more styling and organizational options
 */
export const CategorySchema = z.object({
  name: z.string(),
  description: z.string(),
  
  // Visual styling
  color: z.string(),
  bg_color: z.string(),
  border_color: z.string(),
  text_color: z.string(),
  icon: z.string().optional(),
  
  // Organization
  order: z.number().optional(),
  parent: z.string().optional(), // For nested categories
  collapsed: z.boolean().optional(), // Default collapsed state
  
  // Enhanced metadata
  tags: z.array(z.string()).optional()
})

// =============================================================================
// GLOBAL CONFIGURATION
// =============================================================================

/**
 * Enhanced global metadata
 */
export const GlobalMetadataSchema = z.object({
  version: z.string(),
  description: z.string(),
  framework: z.string(),
  created: z.string(),
  updated: z.string().optional(),
  
  // Enhanced metadata
  author: z.string().optional(),
  license: z.string().optional(),
  repository: z.string().optional(),
  documentation_url: z.string().optional(),
  
  // Configuration options
  settings: z.object({
    strict_validation: z.boolean().optional(),
    allow_experimental: z.boolean().optional(),
    default_framework: z.string().optional(),
    code_style: z.string().optional()
  }).optional()
})

// =============================================================================
// COMPLETE CONFIGURATION SCHEMA
// =============================================================================

/**
 * Complete enhanced YAML configuration schema
 */
export const EnhancedYAMLConfigSchema = z.object({
  metadata: GlobalMetadataSchema,
  categories: z.record(CategorySchema),
  layers: z.record(EnhancedLayerSchema),
  
  // Global definitions
  global_templates: z.record(TemplateSchema).optional(),
  global_formulas: z.record(FormulaExpressionSchema).optional(),
  global_validators: z.record(z.string()).optional()
})

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type ParameterDefinition = z.infer<typeof ParameterSchema>
export type ParameterValidation = z.infer<typeof ParameterValidationSchema>
export type ConditionalDisplay = z.infer<typeof ConditionalDisplaySchema>

export type FormulaExpression = z.infer<typeof FormulaExpressionSchema>
export type ConditionalShape = z.infer<typeof ConditionalShapeSchema>
export type ShapeReference = z.infer<typeof ShapeReferenceSchema>
export type ShapeComputation = z.infer<typeof ShapeComputationSchema>

export type TemplateVariable = z.infer<typeof TemplateVariableSchema>
export type TemplateConditional = z.infer<typeof TemplateConditionalSchema>
export type Template = z.infer<typeof TemplateSchema>

export type FrameworkDefinition = z.infer<typeof FrameworkDefinitionSchema>
export type LayerMetadata = z.infer<typeof LayerMetadataSchema>
export type VisualConfig = z.infer<typeof VisualConfigSchema>
export type EnhancedLayer = z.infer<typeof EnhancedLayerSchema>
export type Category = z.infer<typeof CategorySchema>
export type GlobalMetadata = z.infer<typeof GlobalMetadataSchema>
export type EnhancedYAMLConfig = z.infer<typeof EnhancedYAMLConfigSchema>

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate an enhanced YAML configuration
 */
export function validateYAMLConfig(config: unknown): EnhancedYAMLConfig {
  return EnhancedYAMLConfigSchema.parse(config)
}

/**
 * Validate a single layer definition
 */
export function validateLayerDefinition(layer: unknown): EnhancedLayer {
  return EnhancedLayerSchema.parse(layer)
}

/**
 * Validate parameter definitions
 */
export function validateParameters(parameters: unknown): Record<string, ParameterDefinition> {
  return z.record(ParameterSchema).parse(parameters)
}

/**
 * Check if a configuration uses the enhanced schema
 */
export function isEnhancedConfig(config: unknown): boolean {
  try {
    const configObj = config as Record<string, unknown>
    
    // Check for presence of enhanced features in layers only
    const layers = configObj.layers as Record<string, unknown> | undefined
    const hasLayerInfoParameter = layers ? Object.values(layers).some((layer) => {
      const layerObj = layer as Record<string, unknown>
      const metadata = layerObj.metadata as Record<string, unknown> | undefined
      return metadata?.info !== undefined
    }) : false
    
    const hasFrameworksSection = layers ? Object.values(layers).some((layer) => {
      const layerObj = layer as Record<string, unknown>
      return layerObj.frameworks !== undefined
    }) : false
    
    return hasLayerInfoParameter || hasFrameworksSection
  } catch {
    return false
  }
}
