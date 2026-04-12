---
estimated_steps: 8
estimated_files: 4
skills_used: []
---

# T01: Radial symmetry engine and Canvas/SVG integration

Implement N-fold radial symmetry by duplicating and rotating the base geometry. Add symmetry controls to the UI. Integrate with Canvas renderer and SVG export.

Steps:
1. Create symmetry.ts with applyRadialSymmetry(segments, folds) function
2. Add symmetryFolds param (1=off, 2-12 for symmetry)
3. Apply symmetry transform in page.tsx after geometry generation
4. Add symmetry slider/selector to ControlPanel
5. Verify 6-fold symmetry on a fractal branch creates mandala pattern
6. Verify SVG export preserves symmetry

## Inputs

- `src/lib/engine/types.ts`
- `src/app/page.tsx`

## Expected Output

- `src/lib/engine/symmetry.ts`
- `Symmetry working in Canvas and SVG`

## Verification

6-fold symmetry on Fractal Tree branch creates snowflake mandala. SVG export matches Canvas. All presets work with symmetry.
