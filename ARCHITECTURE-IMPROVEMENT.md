# BlockDL Backend Architecture Improvement Plan

## Current Problems
1. **Unclear separation**: YAML + TypeScript code mixed confusingly
2. **Over-engineering**: 3 shape computation systems for 1 job  
3. **Poor DX**: Adding layers requires touching 4-5 files
4. **Complex debugging**: Hard to trace where behavior comes from

## Proposed Simplified Architecture

### Option 1: Pure TypeScript Approach (Recommended)
Move everything to TypeScript for better type safety and developer experience:

```typescript
// src/lib/layer-definitions.ts
export const layerDefinitions = {
  Dense: {
    metadata: {
      category: 'dense',
      icon: '🔗',
      description: 'Fully connected layer'
    },
    parameters: [
      {
        key: 'units',
        type: 'number',
        label: 'Units',
        default: 128,
        validation: { min: 1, max: 10000 }
      }
    ],
    computeShape: (inputShapes: number[][], params: any) => {
      // Shape computation logic inline
      if (inputShapes.length !== 1) return null
      return [params.units || 128]
    },
    generateCode: (params: any) => `Dense(${params.units})`
  }
  // ... other layers
}
```

**Benefits:**
- Single source of truth
- Full TypeScript type safety
- Easy to debug and extend
- Faster development cycle

### Option 2: YAML for Configuration + TypeScript for Logic
Keep YAML for UI configuration but move all logic to TypeScript:

```yaml
# layers.yaml - Only UI configuration
Dense:
  metadata:
    category: dense
    icon: 🔗
    description: Fully connected layer
  parameters:
    units:
      type: number
      label: Units
      default: 128
```

```typescript
// shape-computation.ts - All logic in TypeScript
export const shapeComputations = {
  Dense: (inputShapes: number[][], params: any) => [params.units || 128],
  Conv2D: (inputShapes: number[][], params: any) => {
    // Conv2D logic
  }
}

export const codeGenerators = {
  Dense: (params: any) => `Dense(${params.units})`,
  Conv2D: (params: any) => `Conv2D(${params.filters}, ${params.kernel_size})`
}
```

**Benefits:**
- Clear separation: YAML = config, TypeScript = logic
- Easier to understand and debug
- Simpler file structure

### Option 3: Minimal YAML Approach  
Drastically simplify the YAML to only essential configuration:

```yaml
# minimal-layers.yaml
layers:
  Dense:
    icon: 🔗
    category: dense
    description: Fully connected layer
  Conv2D:
    icon: 🔲
    category: convolutional
    description: 2D convolution layer
```

All parameters, shape computation, and code generation moves to TypeScript.

## Implementation Plan

### Phase 1: Consolidate Shape Computation (1-2 days)
1. Remove `enhanced-shape-computation.ts` and `yaml-shape-loader.ts`
2. Keep only `shape-computation-registry.ts` 
3. Update all references to use single registry

### Phase 2: Simplify YAML (2-3 days)
1. Choose Option 1, 2, or 3 above
2. Migrate layer definitions to chosen approach
3. Update loader logic to match new structure

### Phase 3: Improve Developer Experience (1 day)
1. Create helper functions for adding new layers
2. Add comprehensive TypeScript types
3. Improve error messages and debugging

### Phase 4: Documentation (1 day)
1. Document the new architecture clearly
2. Create examples for adding new layers
3. Migration guide for any custom layers

## File Structure After Cleanup

```
src/lib/
├── layer-definitions.ts          # Single source of truth for layers
├── shape-computation.ts          # All shape logic 
├── code-generation.ts           # All code generation logic
├── flow-store.ts               # React Flow state management
└── utils.ts                    # Utility functions

public/
└── layers.yaml                 # Minimal UI configuration (if Option 2/3)
```

## Benefits of Cleanup
- **Faster development**: Add new layers in one place
- **Better debugging**: Clear where logic lives  
- **Type safety**: Full TypeScript benefits
- **Easier maintenance**: Less code, clearer structure
- **Better performance**: Remove unnecessary abstraction layers
