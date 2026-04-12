---
estimated_steps: 7
estimated_files: 2
skills_used: []
---

# T02: SVG inline preview and edge case hardening

Add an inline SVG preview in the ExportPanel so users can see the exact SVG output before downloading. Handle edge cases: empty geometry, single-segment geometry, extremely large exports (show warning), and invalid parameters. Add a preview toggle that renders the SVG string as an inline element.

Steps:
1. Add SVG preview component that renders the SVG string via dangerouslySetInnerHTML in a contained div
2. Add preview toggle button in ExportPanel
3. Handle empty geometry gracefully (show placeholder message)
4. Add warning when segment count exceeds 10000
5. Add performance timing to SVG generation and show in export stats

## Inputs

- `src/components/ExportPanel.tsx`

## Expected Output

- `src/components/SvgPreview.tsx`
- `src/components/ExportPanel.tsx (updated)`

## Verification

Toggle SVG preview on/off. Verify preview matches Canvas output. Test empty preset (0 iterations). Test high-iteration fractal shows warning.
