# S01: IFS Engine, Renderer, Presets & UI Integration

**Goal:** Build the complete IFS feature: engine, renderer, presets, UI integration, custom editor, color support, SVG export, and animation compatibility
**Demo:** User can switch between L-system and IFS modes, select IFS presets (Barnsley Fern, Sierpiński Triangle, etc.), see point cloud rendering on canvas, adjust point count and colors, export as SVG, and animate between IFS parameter states

## Must-Haves

- Not provided.

## Proof Level

- This slice proves: Not provided.

## Integration Closure

Not provided.

## Verification

- Not provided.

## Tasks

- [x] **T01: IFS engine, types, presets, and point cloud renderer** `est:35min`
  1. Define IFS types: IFSTransform (a,b,c,d,e,f affine coefficients + probability + optional color), IFSPreset (name, transforms, defaultPoints), IFSPoint (x, y, transformIndex)\n2. Implement chaos game engine: iterate N points starting from (0,0), randomly select transform weighted by probability, apply affine transform, record point with transform index\n3. Create 5+ IFS presets: Barnsley Fern, Sierpiński Triangle, Dragon IFS, Maple Leaf, Koch Curve IFS, Spiral\n4. Implement point cloud Canvas renderer that handles 100k+ points efficiently (use fillRect 1px or putImageData)\n5. Implement point cloud SVG generator (circle elements or tiny rects)
  - Files: `src/lib/engine/ifs-types.ts`, `src/lib/engine/ifs.ts`, `src/lib/presets/ifs-presets.ts`, `src/lib/renderer/canvas-points.ts`, `src/lib/export/svg-points.ts`
  - Verify: npx tsc --noEmit

- [x] **T02: UI integration — engine mode selector, IFS controls, custom editor, animation** `est:45min`
  1. Add engineMode to FractalParams: 'lsystem' | 'ifs'\n2. Add IFS-specific params: ifsPreset, ifsPoints, ifsCustomTransforms\n3. Add engine mode selector at top of ControlPanel (L-System / IFS toggle)\n4. Create IFSControlPanel component with preset selector, point count slider, custom transform editor\n5. Update page.tsx: when engineMode is 'ifs', compute IFS point cloud instead of L-system segments, render with point cloud renderer\n6. Update FractalCanvas to handle both segment and point rendering\n7. Update ExportPanel to handle point cloud SVG export\n8. Update animation interpolation for new IFS params\n9. Update URL serialization for IFS params
  - Files: `src/lib/engine/types.ts`, `src/components/ControlPanel.tsx`, `src/components/IFSControlPanel.tsx`, `src/components/FractalCanvas.tsx`, `src/app/page.tsx`, `src/components/ExportPanel.tsx`, `src/lib/animation/interpolate.ts`, `src/lib/sharing/url-state.ts`
  - Verify: npm run build && manual browser verification that IFS presets render correctly and animation works

## Files Likely Touched

- src/lib/engine/ifs-types.ts
- src/lib/engine/ifs.ts
- src/lib/presets/ifs-presets.ts
- src/lib/renderer/canvas-points.ts
- src/lib/export/svg-points.ts
- src/lib/engine/types.ts
- src/components/ControlPanel.tsx
- src/components/IFSControlPanel.tsx
- src/components/FractalCanvas.tsx
- src/app/page.tsx
- src/components/ExportPanel.tsx
- src/lib/animation/interpolate.ts
- src/lib/sharing/url-state.ts
