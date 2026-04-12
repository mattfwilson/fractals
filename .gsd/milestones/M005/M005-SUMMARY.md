---
id: M005
title: "Fractal Pattern Generator"
status: complete
completed_at: 2026-04-10T22:39:35.632Z
key_decisions:
  - L-system engine with turtle graphics as primary fractal generator
  - Canvas 2D for real-time preview, SVG string building for export
  - Defs/use only for branches with 5+ segments (below threshold, overhead exceeds savings)
  - Mulberry32 seeded PRNG for deterministic jitter
  - URL state serialization with compact keys and non-default-only values
  - Mount-time URL reading via useEffect to avoid SSR hydration mismatch
key_files:
  - src/lib/engine/lsystem.ts
  - src/lib/engine/turtle.ts
  - src/lib/engine/types.ts
  - src/lib/engine/symmetry.ts
  - src/lib/engine/tiling.ts
  - src/lib/engine/color.ts
  - src/lib/engine/random.ts
  - src/lib/export/svg-generator.ts
  - src/lib/export/svg-optimizer.ts
  - src/lib/export/defs-optimizer.ts
  - src/lib/renderer/canvas.ts
  - src/lib/sharing/url-state.ts
  - src/lib/presets/index.ts
  - src/components/ControlPanel.tsx
  - src/components/FractalCanvas.tsx
  - src/components/ExportPanel.tsx
  - src/components/SvgPreview.tsx
  - src/components/CustomRuleEditor.tsx
  - src/components/Slider.tsx
  - src/app/page.tsx
lessons_learned:
  - Defs/use SVG optimization has diminishing returns when path chaining is already highly effective — only worthwhile for branches with 5+ segments
  - SSR hydration mismatches from performance.now() and window.location.search require mount-time initialization patterns
  - L-system string explosion requires safety caps — 2M character limit prevents browser freezing
---

# M005: Fractal Pattern Generator

**Delivered a complete web-based fractal pattern generator with L-system engine, 10 presets, designer controls, SVG export with structural optimization, color gradients, jitter, custom rules, symmetry, tiling, and URL sharing**

## What Happened

M005 built the Fractal Lab application from scratch across 5 slices. S01 established the foundation: L-system string rewriting engine, turtle graphics interpreter, 10 fractal presets, Canvas 2D renderer with DPR-aware scaling, control panel with sliders, and basic SVG export with dual modes (optimized/expanded). S02 hardened the export pipeline with defs/use structural optimization for branching fractals (detecting repeated subtrees, normalizing geometry, emitting shared definitions), inline SVG preview, generation timing, and cross-preset validation showing 85-95% file size reductions. S03 added creative controls: depth-based HSL color gradients, angle/length jitter with seeded PRNG for organic patterns, and a custom L-system rule editor with validation. S04 added geometry transforms: N-fold radial symmetry (creating mandalas) and grid tiling (creating wallpaper patterns). S05 added background controls, URL state sharing with compact serialization, and verified a clean production build.

## Success Criteria Results



## Definition of Done Results



## Requirement Outcomes



## Deviations

None.

## Follow-ups

None.
