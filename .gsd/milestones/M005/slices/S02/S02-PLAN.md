# S02: SVG Export Hardening + IFS Structural Optimization

**Goal:** Harden SVG export with IFS-style defs/use structural optimization for self-similar fractals, export edge case handling, and SVG preview before download. The core SVG generator exists from S01 — this slice adds structural compression and polish.
**Demo:** User exports a depth-6 fractal tree. Optimized SVG uses defs/use for repeated subtrees, cutting file size by 60%+. Expanded SVG has individually selectable paths in Figma. Edge cases (empty geometry, huge fractals) handled gracefully.

## Must-Haves

- Optimized SVG for Fractal Tree at depth 6 uses defs/use, reducing file size by 40%+ vs naive path generation
- Empty geometry produces valid empty SVG without errors
- SVG preview renders in the export panel before download
- All 10 presets export valid SVG that renders identically in browser
- Export of high-segment fractals (5000+ segments) completes in under 500ms

## Proof Level

- This slice proves: browser + file validation

## Integration Closure

SVG export pipeline fully functional with structural optimization; S04 (symmetry) can extend the geometry pipeline without touching export internals

## Verification

- Export panel shows file size comparison between optimized/expanded modes; performance warning logged if SVG generation exceeds 500ms

## Tasks

- [x] **T01: IFS-style defs/use structural optimization for self-similar fractals** `est:45min`
  Extend svg-generator to detect repeated subtree patterns in fractal geometry and emit SVG defs/use elements. For fractals with recursive self-similarity (trees, Sierpinski), identical subtrees at the same depth can be defined once and referenced multiple times, dramatically reducing file size. Add a detectSelfSimilarity function that groups segments by transformation equivalence, and a generateOptimizedSvgWithDefs function that emits defs/use when beneficial.

Steps:
1. Add subtree detection in svg-generator: hash segment groups by relative geometry
2. Build defs/use emitter for matched subtrees
3. Add size comparison — only use defs/use when it actually saves bytes
4. Wire into the existing optimized export mode
5. Verify file size reduction on Fractal Tree and Sierpinski presets
  - Files: `src/lib/export/svg-generator.ts`, `src/lib/export/svg-optimizer.ts`, `src/lib/engine/types.ts`
  - Verify: Export Fractal Tree depth 6 in optimized mode. Compare file size with and without defs/use. Verify SVG renders correctly in browser. Target 40%+ size reduction for tree-like fractals.

- [x] **T02: SVG inline preview and edge case hardening** `est:30min`
  Add an inline SVG preview in the ExportPanel so users can see the exact SVG output before downloading. Handle edge cases: empty geometry, single-segment geometry, extremely large exports (show warning), and invalid parameters. Add a preview toggle that renders the SVG string as an inline element.

Steps:
1. Add SVG preview component that renders the SVG string via dangerouslySetInnerHTML in a contained div
2. Add preview toggle button in ExportPanel
3. Handle empty geometry gracefully (show placeholder message)
4. Add warning when segment count exceeds 10000
5. Add performance timing to SVG generation and show in export stats
  - Files: `src/components/ExportPanel.tsx`, `src/components/SvgPreview.tsx`
  - Verify: Toggle SVG preview on/off. Verify preview matches Canvas output. Test empty preset (0 iterations). Test high-iteration fractal shows warning.

- [x] **T03: Export validation and cross-preset verification** `est:20min`
  Verify SVG export across all 10 presets at various iteration depths. Validate SVG structure (well-formed XML, correct namespace, viewBox). Add automated size comparison logging. Fix any edge cases found.

Steps:
1. Build a test harness that exports all presets and validates SVG structure
2. Run optimized and expanded exports for each preset
3. Verify file sizes are reasonable (not empty, not exploding)
4. Test rotation export
5. Browser-verify representative exports render correctly
  - Files: `src/lib/export/svg-generator.ts`
  - Verify: All 10 presets export valid SVG in both optimized and expanded modes. No console errors. File sizes logged and reasonable.

## Files Likely Touched

- src/lib/export/svg-generator.ts
- src/lib/export/svg-optimizer.ts
- src/lib/engine/types.ts
- src/components/ExportPanel.tsx
- src/components/SvgPreview.tsx
