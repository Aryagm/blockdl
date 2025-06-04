# Code Style Guide for Contributors

## Clean Code Principles for Open Source

**"Make code easy to read, modify, and understand - not just functional."**

### Essential Improvements

1. **Minimal Documentation**
   - Brief component header explaining purpose
   - Inline comments only for non-obvious "why" logic
   - Avoid commenting obvious code

2. **Clean Organization**
   - Extract magic numbers → `FLOW_CONFIG.BACKGROUND.GAP`
   - Group related constants in objects with `as const`
   - Import order: React → External → Local

3. **Clear Naming**
   - Use descriptive names: `handleUserDrop` not `onDrop`
   - Boolean variables: `isValid`, `hasConnection`, `canDelete`
   - Event handlers: `handle` + Action + Subject

4. **Modern Patterns**
   - Use `cn()` for className concatenation
   - Strict TypeScript (no `any`)
   - `useCallback`/`useMemo` for performance
   - Remove unused imports/props

5. **Keep It Simple**
   - Self-documenting code through good naming
   - Consistent formatting
   - No backward compatibility cruft

### Example: Before vs After

**Before (verbose):**
```tsx
/**
 * Handle drop events when dragging layers from the palette.
 * Creates new layer nodes at the drop position with default parameters.
 */
const onDrop = useCallback((event: React.DragEvent) => {
  // Validate that we have a valid layer type
  if (!layerType) {
    return;
  }
  // Convert screen coordinates to flow coordinates
  // ... more comments
}, [])
```

**After (clean):**
```tsx
const handleDrop = useCallback((event: React.DragEvent) => {
  event.preventDefault()
  if (!reactFlowInstance || !layerType) return
  // ... clean implementation
}, [])
```

**Goal: Code that explains itself without excessive documentation.**
