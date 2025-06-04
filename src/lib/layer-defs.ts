/**
 * Centralized layer definitions registry for BlockDL
 * Layer definitions are loaded from YAML configuration at startup
 */

export interface LayerFormField {
  key: string
  label: string
  type: 'number' | 'text' | 'select'
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  step?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  show?: (params: Record<string, any>) => boolean
}

export interface LayerDef {
  type: string
  icon: string
  description: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultParams: Record<string, any>
  formSpec: LayerFormField[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  codeGen: (params: Record<string, any>) => string
  kerasImport?: string
  supportsMultiplier?: boolean
}

// Layer definitions - populated from YAML at startup
// eslint-disable-next-line prefer-const
export let layerDefs: Record<string, LayerDef> = {}

// Utility functions for accessing layer definitions

/**
 * Get layer definition by type
 */
export function getLayerDef(type: string): LayerDef | undefined {
  return layerDefs[type]
}

/**
 * Get default parameters for a layer type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDefaultParams(type: string): Record<string, any> {
  const layerDef = layerDefs[type]
  return layerDef?.defaultParams || {}
}

/**
 * Get icon for a layer type
 */
export function getLayerIcon(type: string): string {
  const layerDef = layerDefs[type]
  return layerDef?.icon || '🔧'
}

/**
 * Get all available layer types
 */
export function getLayerTypes(): Array<{ type: string; icon: string; description: string }> {
  return Object.entries(layerDefs).map(([type, def]) => ({
    type,
    icon: def.icon,
    description: def.description
  }))
}

/**
 * Generate code for a layer with given parameters
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateLayerCode(type: string, params: Record<string, any>): string {
  const layerDef = layerDefs[type]
  if (!layerDef) {
    return `# Unknown layer type: ${type}`
  }
  return layerDef.codeGen(params)
}

/**
 * Get used Keras imports from a list of layer types
 */
export function getUsedKerasImports(layerTypes: string[]): string[] {
  const imports = new Set<string>()
  
  layerTypes.forEach(type => {
    const layerDef = layerDefs[type]
    if (layerDef?.kerasImport) {
      // Split by comma in case multiple imports are specified
      layerDef.kerasImport.split(',').forEach(imp => {
        imports.add(imp.trim())
      })
    }
  })
  
  return Array.from(imports)
}
