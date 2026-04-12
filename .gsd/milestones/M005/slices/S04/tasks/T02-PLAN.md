---
estimated_steps: 7
estimated_files: 4
skills_used: []
---

# T02: Tiling mode with seamless edge wrapping

Add tiling mode that repeats the fractal pattern in a grid. The pattern should wrap seamlessly at edges for use as wallpaper/texture.

Steps:
1. Add tiling.ts with applyTiling(segments, cols, rows, width, height) function
2. Add tiling toggle and grid size control to params and UI
3. Apply tiling transform after symmetry in page.tsx
4. Verify seamless tiling on Koch pattern
5. Verify SVG export includes tiled copies

## Inputs

- `src/lib/engine/types.ts`
- `src/app/page.tsx`

## Expected Output

- `src/lib/engine/tiling.ts`
- `Tiling working in Canvas and SVG`

## Verification

2x2 tiling of Koch Snowflake shows seamless repeating pattern. SVG export includes all tiles.
