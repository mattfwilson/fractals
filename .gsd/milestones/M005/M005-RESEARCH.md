# M005 — Research

**Date:** 2026-04-10

## Summary

Research covered three areas: fractal generation techniques suitable for SVG output, SVG optimization strategies for Figma import, and competitive analysis of existing fractal tools.

L-systems emerged as the clear primary engine — they produce the widest variety of vector-friendly patterns via turtle graphics, and the string-rewriting model maps cleanly to both Canvas rendering and SVG path generation. IFS (Iterated Function Systems) are a secondary technique useful specifically for SVG optimization: repeated affine transforms map to SVG defs/use for exponential file compression. Escape-time fractals (Mandelbrot, Julia) were ruled out as they produce fundamentally raster output unsuitable for vector design workflows.

SVG optimization research identified four high-impact techniques: relative path commands (30-50% reduction), precision control (2 decimals sufficient), attribute grouping via g elements, and defs/use for self-similar structures. SVGO is the industry standard for automated optimization but may be overkill for generated SVGs where we control the output directly.

## Recommendation

Build an L-system engine with turtle graphics as the primary fractal generator. Use Canvas 2D for real-time preview (fast, no DOM overhead) and SVG string building for export (direct optimization control). Offer dual-mode SVG export: optimized (small file) and expanded (Figma-editable). Skip SVGO integration — since we generate the SVG ourselves, we can build optimization into the generator directly, avoiding the complexity of an in-browser SVGO dependency.

## Implementation Landscape

### Key Files

- `src/lib/engine/lsystem.ts` — L-system string rewriting engine
- `src/lib/engine/turtle.ts` — turtle graphics interpreter (string to geometry)
- `src/lib/engine/types.ts` — parameter model and geometry types
- `src/lib/presets/index.ts` — preset fractal configurations
- `src/lib/renderer/canvas.ts` — Canvas 2D rendering
- `src/lib/export/svg-generator.ts` — SVG string generation
- `src/lib/export/svg-optimizer.ts` — structural optimization (defs/use)
- `src/lib/engine/symmetry.ts` — symmetry transforms
- `src/lib/engine/tiling.ts` — seamless tiling
- `src/lib/sharing/url-state.ts` — URL parameter serialization
- `src/components/` — React UI components

### Build Order

1. L-system engine + turtle interpreter (core math, no UI dependency)
2. Preset library (validates engine against known-correct fractals)
3. Parameter model + control panel (UI layer over engine)
4. Canvas renderer (connects engine to visual output)
5. SVG generator + optimizer (export pipeline)
6. Color/style/jitter extensions
7. Symmetry + tiling
8. Canvas sizing, sharing, polish

### Verification Approach

- Engine: unit-level — segment counts for known fractals at known depths
- Rendering: visual — browser inspection of Canvas output
- SVG: file size comparison, XML validity, manual Figma import test
- Parameters: round-trip URL sharing test
- Performance: console.time measurements, target <100ms for depth-5 fractals

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Seeded PRNG | Simple mulberry32 or similar | Fast, deterministic, fits in 10 lines — no library needed |
| Color interpolation | HSL interpolation | Built into CSS/Canvas, no library needed |
| URL encoding | base64 + JSON.stringify | Browser-native APIs sufficient |

## Common Pitfalls

- **L-system string explosion** — A 4-rule system at depth 8 can produce millions of characters. Must cap iteration depth and estimate output size before generating.
- **SVG element count** — Fractal with 4 branches at depth 7 = 16,384 paths. Canvas handles this fine but SVG DOM would choke. String building (not DOM) avoids this for export.
- **Figma defs/use handling** — Figma flattens use references on import, so defs/use optimization helps file size during transfer but doesn't affect Figma's internal representation. Both modes produce the same Figma result; optimized mode just downloads faster.
- **Canvas scaling** — Fractal geometry coordinates can span huge ranges. Must normalize to canvas viewport with auto-fit, not assume fixed coordinate space.

## Sources

- L-system formal definition and turtle graphics commands (source: Wikipedia L-system article)
- SVG IFS fractals using defs/use with affine transforms (source: goessner.net SVG fractals article)
- SVG optimization: relative paths cut 30-50%, 2-decimal precision sufficient (source: VectoSolve SVG optimization guide)
- SVGO as industry standard optimizer (source: SVGO GitHub repository)
- Science vs Magic fractal tool — good controls but no SVG export (source: sciencevsmagic.net)
- Fractal Play — SVG fractals with mouse controls, good UX reference (source: Elm discourse)
