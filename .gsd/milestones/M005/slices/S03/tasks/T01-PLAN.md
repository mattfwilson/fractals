---
estimated_steps: 8
estimated_files: 5
skills_used: []
---

# T01: Depth-based color gradient with HSL interpolation

Add color gradient support: two color pickers (start/end color), HSL interpolation between them based on segment depth. Update Canvas renderer to use per-segment color. Update SVG generator to emit per-depth-group stroke colors.

Steps:
1. Add startColor, endColor fields to FractalParams
2. Implement HSL interpolation utility
3. Update Canvas renderer to color segments by depth
4. Update SVG generator to use per-depth stroke colors in optimized mode
5. Add color picker controls to ControlPanel
6. Verify gradient renders on Fractal Tree

## Inputs

- `src/lib/engine/types.ts`
- `src/lib/renderer/canvas.ts`
- `src/components/ControlPanel.tsx`

## Expected Output

- `Color gradient visible on Canvas`
- `SVG export with per-depth colors`

## Verification

Select Fractal Tree, set gradient from blue to purple. Canvas shows depth-based color gradient. SVG export preserves per-depth colors.
