---
estimated_steps: 7
estimated_files: 3
skills_used: []
---

# T01: IFS-style defs/use structural optimization for self-similar fractals

Extend svg-generator to detect repeated subtree patterns in fractal geometry and emit SVG defs/use elements. For fractals with recursive self-similarity (trees, Sierpinski), identical subtrees at the same depth can be defined once and referenced multiple times, dramatically reducing file size. Add a detectSelfSimilarity function that groups segments by transformation equivalence, and a generateOptimizedSvgWithDefs function that emits defs/use when beneficial.

Steps:
1. Add subtree detection in svg-generator: hash segment groups by relative geometry
2. Build defs/use emitter for matched subtrees
3. Add size comparison — only use defs/use when it actually saves bytes
4. Wire into the existing optimized export mode
5. Verify file size reduction on Fractal Tree and Sierpinski presets

## Inputs

- `src/lib/export/svg-generator.ts`
- `src/lib/engine/types.ts`

## Expected Output

- `src/lib/export/svg-generator.ts (updated with defs/use support)`

## Verification

Export Fractal Tree depth 6 in optimized mode. Compare file size with and without defs/use. Verify SVG renders correctly in browser. Target 40%+ size reduction for tree-like fractals.
