---
id: S03
parent: M005
milestone: M005
provides:
  - Depth gradient, jitter, and custom rules available for all downstream slices
requires:
  []
affects:
  []
key_files:
  - src/lib/engine/color.ts
  - src/lib/engine/random.ts
  - src/lib/engine/types.ts
  - src/lib/engine/turtle.ts
  - src/lib/renderer/canvas.ts
  - src/lib/export/svg-generator.ts
  - src/components/ControlPanel.tsx
  - src/components/FractalCanvas.tsx
  - src/components/ExportPanel.tsx
  - src/components/CustomRuleEditor.tsx
  - src/app/page.tsx
key_decisions:
  - (none)
patterns_established:
  - HSL color interpolation for depth-based effects
  - Seeded PRNG for deterministic randomness
  - Custom L-system rule parsing and validation
observability_surfaces:
  - none
drill_down_paths:
  []
duration: ""
verification_result: passed
completed_at: 2026-04-10T22:24:22.947Z
blocker_discovered: false
---

# S03: Color, Style, Jitter + Custom L-System Rules

**Added depth-based color gradient, angle/length jitter with seeded PRNG, and custom L-system rule editor — transforming the tool from preset viewer to creative design instrument**

## What Happened

S03 added three creative capabilities. T01 implemented depth-based color gradients with HSL interpolation, dual color pickers, gradient preview bar, and per-depth coloring in both Canvas renderer and SVG export. T02 added angle and length jitter using a mulberry32 seeded PRNG for deterministic randomness, with percentage-based sliders and a seed randomize button. T03 built a custom L-system rule editor with axiom input, multi-line rule parsing, validation, command reference, and full integration with the rendering pipeline. All features work together — users can now create a custom fractal, apply organic jitter, color it with a gradient, and export a fully-optimized SVG.

## Verification

Depth gradient renders correctly on Fractal Tree (green→purple). 15% angle jitter produces organic variation. Custom rules (F=G[+F]-F, G=GG) generate valid fractals. All features compose correctly. No console errors. TypeScript compiles cleanly throughout.

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

None.
