# Visual Feedback Testing Guide

This guide shows you exactly which blocks to place and connect in the CanvasEditor to test the visual feedback system for shape errors.

## How to Test

1. **Start the development server**:
   ```bash
   cd /home/aryagm/code/blockdl/blockdl && npm run dev
   ```

2. **Open your browser** to the local development URL (usually `http://localhost:5173`)

3. **Try the test scenarios below** by dragging blocks from the palette and connecting them as described.

## Test Scenario 1: Shape Mismatch Error (EASIEST TO SEE)

**What to do:**
1. Drag an **Input** block to the canvas
2. Drag a **Conv2D** block below it
3. Drag a **Dense** block below the Conv2D
4. Connect them: Input → Conv2D → Dense

**Expected behavior:**
- The **Dense** block should show a red border and warning icon ⚠️
- The error message should appear in the Dense block saying something like "Dense layer expects 1D input, got 3D shape"
- Hover over the Dense block to see the full error tooltip
- The handles on the Dense block should be red instead of blue/green

**Why this causes an error:**
Conv2D outputs a 3D shape (height, width, channels) but Dense expects a 1D input. You need a Flatten layer between them.

## Test Scenario 2: Fix the Error

**What to do:**
1. Using the same setup from Scenario 1
2. Drag a **Flatten** block between Conv2D and Dense
3. Connect: Input → Conv2D → Flatten → Dense

**Expected behavior:**
- All red borders should disappear
- All blocks should return to normal blue/gray borders
- No error messages should be visible
- Handles should return to normal colors (blue for input, green for output)

## Test Scenario 3: Invalid Kernel Size

**What to do:**
1. Drag an **Input** block (default shape: 28x28x1)
2. Drag a **Conv2D** block below it
3. Double-click the Conv2D block to edit parameters
4. Change the kernel_size to `(50, 50)` (larger than the 28x28 input)
5. Connect Input → Conv2D

**Expected behavior:**
- The **Conv2D** block should show error styling
- Error message about kernel size being larger than input dimensions

## Test Scenario 4: Multiple Errors

**What to do:**
1. Create this network structure:
   ```
   Input (28,28,1)
      ↓
   Conv2D (kernel_size: 50,50)  ← Error: kernel too large
      ↓
   Dense (no flatten)           ← Error: expects 1D input
   ```

**Expected behavior:**
- Both Conv2D and Dense blocks should show red error styling
- Each should display their specific error messages
- Multiple error indicators should be visible simultaneously

## Test Scenario 5: Merge Layer Errors

**What to do:**
1. Create two parallel paths:
   ```
   Input1 (784,) → Dense1 (128 units)
                                    ↘
                                   Merge
                                    ↗
   Input2 (28,28,1) → Dense2 (64 units)
   ```

**Expected behavior:**
- The **Merge** block should show error styling
- Error about incompatible input shapes for merging
- Different shapes: [128] vs [64] can't be merged with 'add' mode

## Visual Indicators to Look For

### ✅ Normal (No Errors)
- Blue/gray borders on blocks
- Blue input handles (top)
- Green output handles (bottom)
- No warning icons
- Clean parameter display

### ❌ Error State
- **Red borders** around the entire block
- **Red input/output handles**
- **Warning icon (⚠️)** in the block title
- **Red error message box** inside the block content
- **Red text color** for the layer type name
- **Tooltip on hover** showing full error details

## Common Error Types You'll See

1. **Dimension Mismatch**: "Dense layer expects 1D input, got 3D shape [28, 28, 32]"
2. **Invalid Parameters**: "Invalid kernel size (50, 50) for input shape [28, 28, 1]"
3. **Missing Connections**: "Node Conv2D has no input connections"
4. **Incompatible Merge**: "Cannot merge shapes [128] and [64] with mode 'add'"
5. **Invalid Shape Format**: "Invalid input shape format: not-a-tuple"

## Debugging Tips

1. **Check the browser console** for additional error information
2. **Hover over error blocks** to see full error messages
3. **Double-click blocks** to check their parameters
4. **Try different connection patterns** to see how errors change
5. **Add/remove Flatten layers** to fix dimension mismatches

## Advanced Testing

Once basic errors work, try these complex scenarios:

### Branching Network with Merge
```
Input → Conv2D → MaxPool2D → Flatten → Dense1
    ↘                                      ↓
     Conv2D → GlobalAvgPool → Dense2 → Merge
```

### Invalid Parameter Values
- Set Conv2D filters to 0 or negative
- Set Dense units to a string instead of number
- Use invalid padding modes
- Try malformed kernel_size tuples

The visual feedback system should catch and highlight all these issues in real-time as you build your network!
