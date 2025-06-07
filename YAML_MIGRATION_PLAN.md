# BlockDL YAML Migration Plan - Complete System Overhaul

## Overview
This plan outlines the complete migration from the current hybrid YAML/TypeScript system to a fully YAML-driven architecture using the enhanced schema. The goal is to eliminate all hardcoded layer definitions and enable complete modularity.

## Current State Analysis

### Files That Need Major Changes:
1. **`src/lib/yaml-layer-loader.ts`** - Update to use enhanced schema
2. **`src/lib/layer-defs.ts`** - Simplify to pure YAML interface
3. **`src/components/LayerNode.tsx`** - Update color mapping and parameter handling
4. **`src/components/BlockPalette.tsx`** - Update category loading
5. **`src/lib/code-generation.ts`** - Update to use YAML templates
6. **`src/lib/shape-computation.ts`** - Integrate with YAML shape computation references
7. **`src/App.tsx`** - Add YAML initialization
8. **`src/main.tsx`** - Add startup YAML loading

### Files That Need Minor Updates:
9. **`src/components/CanvasEditor.tsx`** - Update imports
10. **`src/components/CodeViewer.tsx`** - Update imports
11. **`src/lib/flow-store.ts`** - No changes needed
12. **`src/lib/dag-parser.ts`** - No changes needed

## Detailed Migration Plan

### Phase 1: Update YAML Loader and Schema Integration

#### 1.1 Update `src/lib/yaml-layer-loader.ts`
**Changes Needed:**
- Replace old Zod schemas with imports from `yaml-schema.ts`
- Update `loadLayersFromYAML` to handle enhanced schema
- Add support for new parameter types (color, range)
- Add conditional parameter handling
- Update template processing for new template engine
- Add multi-framework support
- Change from `/layers.yaml` to `/layers-enhanced.yaml`
- Update category loading for enhanced categories

**Key Functions to Update:**
- `convertParameter()` - Handle new parameter types and conditional display
- `convertYAMLLayer()` - Use enhanced layer schema
- `TemplateProcessor.generateCode()` - Support advanced templates
- `loadCategoriesWithLayers()` - Use enhanced category structure
- `initializeLayerDefs()` - Load from `layers-enhanced.yaml`

#### 1.2 Update `src/lib/layer-defs.ts`
**Changes Needed:**
- Simplify interface, remove hardcoded layer logic
- Update `LayerFormField` interface for new parameter types
- Add support for conditional parameter display
- Update `LayerDef` interface for enhanced features
- Remove hardcoded layer definitions (all will come from YAML)

### Phase 2: Update Component Layer

#### 2.1 Update `src/components/LayerNode.tsx`
**Changes Needed:**
- Remove hardcoded `getLayerCategoryColor()` function
- Load colors dynamically from YAML categories
- Update parameter form rendering for new types (color, range)
- Add conditional parameter visibility logic
- Update validation handling
- Add UI hints and tooltips from YAML

#### 2.2 Update `src/components/BlockPalette.tsx`
**Changes Needed:**
- Update category loading to use enhanced structure
- Handle category icons and enhanced styling
- Update search functionality for new metadata
- Add category ordering support

### Phase 3: Update Core Logic

#### 3.1 Update `src/lib/code-generation.ts`
**Changes Needed:**
- Remove hardcoded layer code generation
- Use YAML template system exclusively
- Update import generation to use framework-specific imports
- Add multi-framework support framework
- Update to use enhanced template processing

#### 3.2 Update `src/lib/shape-computation.ts`
**Changes Needed:**
- Integrate with YAML shape computation references
- Add formula-based computation engine
- Support shape references from YAML
- Add validation against YAML input_shapes

### Phase 4: Application Initialization

#### 4.1 Update `src/App.tsx`
**Changes Needed:**
- Add YAML initialization loading state
- Handle YAML loading errors
- Show loading spinner while YAML loads

#### 4.2 Update `src/main.tsx`
**Changes Needed:**
- Initialize YAML loader before rendering app
- Add error boundary for YAML loading failures

## Implementation Order

### Step 1: Core Schema Integration
1. Update `yaml-layer-loader.ts` to use enhanced schema
2. Update `layer-defs.ts` interfaces
3. Test YAML loading with enhanced file

### Step 2: Template Engine
1. Implement advanced template processing
2. Add conditional template logic
3. Add multi-framework template support
4. Test code generation

### Step 3: UI Components
1. Update LayerNode for new parameter types
2. Add conditional parameter display
3. Update category loading in BlockPalette
4. Test UI with new YAML structure

### Step 4: Shape Computation
1. Integrate YAML shape computation references
2. Add formula-based computation
3. Test shape computation with enhanced YAML

### Step 5: Application Bootstrap
1. Add YAML initialization to app startup
2. Add loading states and error handling
3. Test complete application flow

## Breaking Changes

### Removed Features:
- Hardcoded layer definitions in TypeScript
- Fixed category colors in components
- Static import lists in code generation

### New Features:
- Complete YAML configurability
- Advanced parameter types (color, range)
- Conditional parameter visibility
- Multi-framework support structure
- Formula-based shape computation
- Enhanced validation and error messages

## Testing Strategy

### Unit Tests:
- YAML schema validation
- Template processing
- Shape computation formulas
- Parameter conditional logic

### Integration Tests:
- Full YAML loading and layer creation
- Code generation with new templates
- UI parameter form generation
- Category and layer loading

### End-to-End Tests:
- Complete application flow from YAML to generated code
- Multi-layer model creation
- Parameter validation and error handling

## Risk Mitigation

### Backward Compatibility:
- No backward compatibility maintained (as requested)
- Complete migration to new system

### Error Handling:
- Comprehensive YAML validation
- Graceful degradation for invalid YAML
- Clear error messages for users
- Loading state management

### Performance:
- YAML caching for repeated access
- Lazy loading of heavy computations
- Efficient template processing

## Success Criteria

1. ✅ All layer definitions loaded from `layers-enhanced.yaml`
2. ✅ Zero hardcoded layer logic in TypeScript
3. ✅ All parameter types working (number, text, select, boolean, color, range)
4. ✅ Conditional parameter display functioning
5. ✅ Categories loaded dynamically with correct styling
6. ✅ Code generation using YAML templates
7. ✅ Shape computation using YAML references
8. ✅ Complete application functionality maintained
9. ✅ Enhanced features working (tooltips, validation, etc.)
10. ✅ Multi-framework structure in place for future expansion

## File-by-File Changes Summary

| File | Change Type | Priority | Dependencies |
|------|-------------|----------|--------------|
| `yaml-layer-loader.ts` | Major Rewrite | High | `yaml-schema.ts` |
| `layer-defs.ts` | Major Refactor | High | `yaml-layer-loader.ts` |
| `LayerNode.tsx` | Major Update | Medium | `layer-defs.ts` |
| `BlockPalette.tsx` | Medium Update | Medium | `yaml-layer-loader.ts` |
| `code-generation.ts` | Major Update | Medium | `yaml-layer-loader.ts` |
| `shape-computation.ts` | Medium Update | Low | `yaml-layer-loader.ts` |
| `App.tsx` | Minor Update | Low | `yaml-layer-loader.ts` |
| `main.tsx` | Minor Update | Low | `App.tsx` |

This plan ensures a systematic migration that maintains functionality while achieving complete YAML-driven modularity.
