# Project

## What This Is

A web application for generating creative fractal patterns with fine-grained control over visual parameters. Supports two fractal engines: L-systems (turtle graphics) and IFS (Iterated Function Systems / chaos game). Outputs optimized SVG files designed for import into Figma and use in design workflows. Client-side only — all generation happens in the browser.

## Core Value

Generate visually compelling fractal patterns and export them as clean, optimized SVGs that import cleanly into Figma with minimal file size and editable vector paths.

## Current State

Fully functional with two fractal engines. The app ships with:
- **L-system engine**: 10 presets, Canvas 2D preview, optimized SVG export (85-95% size reduction), depth-based color gradients, angle/length jitter with seeded PRNG, custom L-system rule editor, N-fold radial symmetry, grid tiling, background controls
- **IFS engine**: 7 presets (Barnsley Fern, Sierpiński Triangle, Dragon, Maple Leaf, Koch Curve, Spiral, Crystal), chaos game algorithm, per-transform coloring, ImageData point renderer (100k+ points), SVG circle export
- **Animation system**: Keyframe capture, parameter interpolation with 4 easing functions, real-time playback with timeline scrubber, play/pause/speed/loop controls
- **URL state sharing**: Compact serialization of all parameters

## Architecture / Key Patterns

- Next.js (App Router, client components for interactive UI)
- All processing client-side — no API routes needed
- Dual engine architecture: L-system (turtle graphics → segment arrays) and IFS (chaos game → point arrays)
- GeometryResult union type routes rendering to segment-based or point-based Canvas renderer
- Canvas 2D for real-time preview (line segments for L-system, ImageData pixel writes for IFS)
- SVG string building for export (path chaining + defs/use for L-system, circle groups for IFS)
- Animation engine: keyframe store → parameter interpolation (numeric lerp, HSL color blending, midpoint snap) → requestAnimationFrame loop
- Mulberry32 seeded PRNG for deterministic jitter and IFS generation
- URL state serialization with compact keys and non-default-only values

## Milestone Sequence

- [x] M005: Fractal Pattern Generator — L-system engine, 10 presets, Canvas renderer, SVG export, color gradients, jitter, custom rules, symmetry, tiling, URL sharing
- [x] M006: Animation & Parameter Morphing — Keyframe capture, parameter interpolation with easing, real-time playback with timeline UI
- [x] M007: IFS Engine — Chaos game algorithm, 7 presets, point cloud renderer, per-transform coloring, SVG export, dual engine UI
