# S03: Color, Style, Jitter + Custom L-System Rules

**Goal:** Add color gradient by depth, angle/length jitter with seeded PRNG, and a custom L-system rule editor. This transforms the tool from a preset viewer into a creative design instrument.
**Demo:** User applies a blue-to-purple depth gradient to a fractal tree with 15% angle jitter, producing an organic-looking result. Power user enters custom L-system rules and generates a novel pattern.

## Must-Haves

- Depth-based color gradient from color A to color B, interpolated in HSL space
- Angle jitter (0-100%) adds randomness to branch angles, with deterministic seed
- Custom L-system editor allows entering axiom, rules, and angle to generate novel fractals
- All new controls integrate cleanly with existing Canvas rendering and SVG export
- Jitter produces visually organic results while keeping structure recognizable

## Proof Level

- This slice proves: browser verification

## Integration Closure

Color gradient flows through to SVG export (per-depth stroke color). Jitter seeds are deterministic for reproducible exports. Custom rules produce geometry that renders and exports identically to presets.

## Verification

- Segment count in header reflects actual generated geometry. Export panel shows correct file size with per-depth color paths.

## Tasks

- [x] **T01: Depth-based color gradient with HSL interpolation** `est:35min`
  Add color gradient support: two color pickers (start/end color), HSL interpolation between them based on segment depth. Update Canvas renderer to use per-segment color. Update SVG generator to emit per-depth-group stroke colors.

Steps:
1. Add startColor, endColor fields to FractalParams
2. Implement HSL interpolation utility
3. Update Canvas renderer to color segments by depth
4. Update SVG generator to use per-depth stroke colors in optimized mode
5. Add color picker controls to ControlPanel
6. Verify gradient renders on Fractal Tree
  - Files: `src/lib/engine/types.ts`, `src/lib/renderer/canvas.ts`, `src/lib/export/svg-generator.ts`, `src/components/ControlPanel.tsx`, `src/app/page.tsx`
  - Verify: Select Fractal Tree, set gradient from blue to purple. Canvas shows depth-based color gradient. SVG export preserves per-depth colors.

- [x] **T02: Angle and length jitter with seeded PRNG** `est:30min`
  Add angle jitter and length jitter parameters. Use a seeded PRNG (mulberry32) so jitter is deterministic for a given seed. Add jitter controls to the UI.

Steps:
1. Implement mulberry32 seeded PRNG
2. Add angleJitter, lengthJitter, seed fields to FractalParams
3. Modify turtle interpreter to apply jitter during interpretation
4. Add jitter sliders and seed field to ControlPanel
5. Verify jitter produces organic-looking results on Fractal Tree
  - Files: `src/lib/engine/turtle.ts`, `src/lib/engine/types.ts`, `src/components/ControlPanel.tsx`, `src/app/page.tsx`
  - Verify: Apply 15% angle jitter to Fractal Tree. Result looks organic. Same seed produces identical output on re-render.

- [x] **T03: Custom L-system rule editor** `est:30min`
  Add a custom L-system editor mode where users can enter their own axiom, production rules, and angle. Include a 'Custom' preset button that activates the editor.

Steps:
1. Add 'custom' mode state to params
2. Create a CustomRuleEditor component with axiom input, rule inputs, angle input
3. Wire custom rules into the L-system generation pipeline
4. Add validation (non-empty axiom, at least one rule)
5. Verify custom rules generate valid fractals
  - Files: `src/components/CustomRuleEditor.tsx`, `src/components/ControlPanel.tsx`, `src/app/page.tsx`, `src/lib/engine/types.ts`
  - Verify: Enter custom axiom 'F', rule 'F=F+F-F-F+F' at 90 degrees. Produces a valid fractal. Export works correctly.

## Files Likely Touched

- src/lib/engine/types.ts
- src/lib/renderer/canvas.ts
- src/lib/export/svg-generator.ts
- src/components/ControlPanel.tsx
- src/app/page.tsx
- src/lib/engine/turtle.ts
- src/components/CustomRuleEditor.tsx
