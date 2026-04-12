---
estimated_steps: 1
estimated_files: 5
skills_used: []
---

# T01: IFS engine, types, presets, and point cloud renderer

1. Define IFS types: IFSTransform (a,b,c,d,e,f affine coefficients + probability + optional color), IFSPreset (name, transforms, defaultPoints), IFSPoint (x, y, transformIndex)\n2. Implement chaos game engine: iterate N points starting from (0,0), randomly select transform weighted by probability, apply affine transform, record point with transform index\n3. Create 5+ IFS presets: Barnsley Fern, Sierpiński Triangle, Dragon IFS, Maple Leaf, Koch Curve IFS, Spiral\n4. Implement point cloud Canvas renderer that handles 100k+ points efficiently (use fillRect 1px or putImageData)\n5. Implement point cloud SVG generator (circle elements or tiny rects)

## Inputs

- `src/lib/engine/types.ts`
- `src/lib/engine/random.ts`
- `src/lib/renderer/canvas.ts`

## Expected Output

- `src/lib/engine/ifs-types.ts`
- `src/lib/engine/ifs.ts`
- `src/lib/presets/ifs-presets.ts`
- `src/lib/renderer/canvas-points.ts`
- `src/lib/export/svg-points.ts`

## Verification

npx tsc --noEmit
