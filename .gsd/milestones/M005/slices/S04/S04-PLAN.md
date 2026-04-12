# S04: Symmetry Modes + Tiling

**Goal:** Add radial symmetry modes (2-12 fold) and seamless tiling support. Symmetry duplicates the base fractal with rotational transforms. Tiling repeats the pattern in a grid with edge-wrapping for seamless boundaries.
**Demo:** User applies 6-fold radial symmetry to a fractal branch, creating a snowflake-like mandala. Enables tiling to create a seamless repeating wallpaper pattern.

## Must-Haves

- N-fold radial symmetry (2-12) renders correctly on Canvas and exports to SVG
- 6-fold symmetry on a fractal branch creates a snowflake-like mandala
- Tiling mode creates a seamless repeating pattern (2x2 or 3x3 grid visible)
- Symmetry and tiling compose correctly with gradients and jitter
- SVG export preserves symmetry/tiling structure

## Proof Level

- This slice proves: browser verification

## Integration Closure

Symmetry transforms are applied post-geometry, pre-rendering — both Canvas and SVG pipelines handle the transformed segment arrays.

## Verification

- Segment count in header shows total after symmetry multiplication

## Tasks

- [x] **T01: Radial symmetry engine and Canvas/SVG integration** `est:30min`
  Implement N-fold radial symmetry by duplicating and rotating the base geometry. Add symmetry controls to the UI. Integrate with Canvas renderer and SVG export.

Steps:
1. Create symmetry.ts with applyRadialSymmetry(segments, folds) function
2. Add symmetryFolds param (1=off, 2-12 for symmetry)
3. Apply symmetry transform in page.tsx after geometry generation
4. Add symmetry slider/selector to ControlPanel
5. Verify 6-fold symmetry on a fractal branch creates mandala pattern
6. Verify SVG export preserves symmetry
  - Files: `src/lib/engine/symmetry.ts`, `src/lib/engine/types.ts`, `src/components/ControlPanel.tsx`, `src/app/page.tsx`
  - Verify: 6-fold symmetry on Fractal Tree branch creates snowflake mandala. SVG export matches Canvas. All presets work with symmetry.

- [x] **T02: Tiling mode with seamless edge wrapping** `est:25min`
  Add tiling mode that repeats the fractal pattern in a grid. The pattern should wrap seamlessly at edges for use as wallpaper/texture.

Steps:
1. Add tiling.ts with applyTiling(segments, cols, rows, width, height) function
2. Add tiling toggle and grid size control to params and UI
3. Apply tiling transform after symmetry in page.tsx
4. Verify seamless tiling on Koch pattern
5. Verify SVG export includes tiled copies
  - Files: `src/lib/engine/tiling.ts`, `src/lib/engine/types.ts`, `src/components/ControlPanel.tsx`, `src/app/page.tsx`
  - Verify: 2x2 tiling of Koch Snowflake shows seamless repeating pattern. SVG export includes all tiles.

## Files Likely Touched

- src/lib/engine/symmetry.ts
- src/lib/engine/types.ts
- src/components/ControlPanel.tsx
- src/app/page.tsx
- src/lib/engine/tiling.ts
