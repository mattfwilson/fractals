# M007: IFS (Iterated Function System) Engine

## Vision
Add a second fractal generation engine based on Iterated Function Systems. IFS fractals (Barnsley Fern, Sierpiński Triangle, etc.) use affine transformations with probabilities to generate point clouds that converge to attractors. The IFS engine renders as a point cloud on canvas and integrates with the existing color system, symmetry, export, and animation features.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | S01 | medium | — | ✅ | User can switch between L-system and IFS modes, select IFS presets (Barnsley Fern, Sierpiński Triangle, etc.), see point cloud rendering on canvas, adjust point count and colors, export as SVG, and animate between IFS parameter states |
