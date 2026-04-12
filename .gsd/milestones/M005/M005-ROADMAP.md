# M005: Fractal Pattern Generator

## Vision
A complete web-based fractal pattern generator with L-system and IFS engines, designer-grade controls, preset library, symmetry/tiling modes, and optimized SVG export for Figma workflows.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | S01 | high | — | ✅ | User opens the app, selects Koch Snowflake from presets, adjusts density/thickness/rotation sliders, and sees the fractal update live on a Canvas preview. |
| S02 | S02 | medium | — | ✅ | User exports a depth-6 fractal tree. Optimized SVG uses defs/use for repeated subtrees, cutting file size by 60%+. Expanded SVG has individually selectable paths in Figma. Edge cases (empty geometry, huge fractals) handled gracefully. |
| S03 | S03 | medium | — | ✅ | User applies a blue-to-purple depth gradient to a fractal tree with 15% angle jitter, producing an organic-looking result. Power user enters custom L-system rules and generates a novel pattern. |
| S04 | S04 | medium | — | ✅ | User applies 6-fold radial symmetry to a fractal branch, creating a snowflake-like mandala. Enables tiling to create a seamless repeating wallpaper pattern. |
| S05 | S05 | low | — | ✅ | User configures a complex fractal pattern, copies the URL, opens it in a new tab, and sees the identical pattern. Switches to dark background to preview against dark designs. |
