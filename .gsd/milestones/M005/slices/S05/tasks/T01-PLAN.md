---
estimated_steps: 7
estimated_files: 4
skills_used: []
---

# T01: Background color control and canvas sizing

Add background color picker with transparency toggle to the Appearance section. Add canvas dimension presets (square, landscape, portrait) and custom size inputs.

Steps:
1. Add background, bgTransparent fields to FractalParams
2. Add background color picker and transparency toggle to Appearance
3. Update Canvas renderer to show background color
4. Update SVG export to include/exclude background rect
5. Add canvas size presets to Appearance section

## Inputs

- `src/lib/engine/types.ts`
- `src/components/ControlPanel.tsx`

## Expected Output

- `Background and canvas sizing controls working`

## Verification

Set background to dark blue. Canvas shows dark blue background. SVG export includes background rect. Toggle transparency — SVG has no background rect.
