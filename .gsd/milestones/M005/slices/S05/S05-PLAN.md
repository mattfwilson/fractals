# S05: Canvas Sizing, Background, URL Sharing + Polish

**Goal:** Add canvas sizing controls, background color/transparency toggle, URL-based state sharing for reproducible patterns, and final polish including responsive layout adjustments.
**Demo:** User configures a complex fractal pattern, copies the URL, opens it in a new tab, and sees the identical pattern. Switches to dark background to preview against dark designs.

## Must-Haves

- Canvas dimensions configurable (e.g., 800x800, 1200x800, custom)
- Background color picker with transparency option for SVG export
- URL sharing: all params serialized to URL, opening URL restores exact pattern
- No console errors across all presets and feature combinations

## Proof Level

- This slice proves: browser verification

## Integration Closure

All features integrated and accessible. URL sharing enables reproducible pattern sharing.

## Verification

- URL state visible in browser address bar. Console logs for any performance warnings.

## Tasks

- [x] **T01: Background color control and canvas sizing** `est:20min`
  Add background color picker with transparency toggle to the Appearance section. Add canvas dimension presets (square, landscape, portrait) and custom size inputs.

Steps:
1. Add background, bgTransparent fields to FractalParams
2. Add background color picker and transparency toggle to Appearance
3. Update Canvas renderer to show background color
4. Update SVG export to include/exclude background rect
5. Add canvas size presets to Appearance section
  - Files: `src/lib/engine/types.ts`, `src/components/ControlPanel.tsx`, `src/components/FractalCanvas.tsx`, `src/app/page.tsx`
  - Verify: Set background to dark blue. Canvas shows dark blue background. SVG export includes background rect. Toggle transparency — SVG has no background rect.

- [x] **T02: URL state sharing for reproducible patterns** `est:25min`
  Serialize all fractal params to URL query string. Parse URL params on load to restore state. Use compact encoding for efficiency.

Steps:
1. Create url-state.ts with serialize/deserialize functions
2. Update page.tsx to sync params ↔ URL
3. Add 'Copy Link' button to the header or export panel
4. Verify round-trip: configure pattern → copy URL → open in new tab → identical pattern
  - Files: `src/lib/sharing/url-state.ts`, `src/app/page.tsx`
  - Verify: Configure a complex pattern (custom preset, jitter, gradient, symmetry). Copy URL. Open in new tab. Verify identical pattern renders.

- [x] **T03: Final polish and verification** `est:15min`
  Final pass: verify all features compose correctly, fix any edge cases, ensure no console errors across all presets. Add any missing polish.

Steps:
1. Test all 10 presets with gradient + jitter + symmetry + tiling
2. Test custom rules with all features
3. Test SVG export with all features
4. Fix any issues found
5. Verify responsive behavior on smaller viewports
  - Files: `src/app/page.tsx`, `src/components/ControlPanel.tsx`
  - Verify: No console errors across all presets with all features enabled. Export works correctly with all features.

## Files Likely Touched

- src/lib/engine/types.ts
- src/components/ControlPanel.tsx
- src/components/FractalCanvas.tsx
- src/app/page.tsx
- src/lib/sharing/url-state.ts
