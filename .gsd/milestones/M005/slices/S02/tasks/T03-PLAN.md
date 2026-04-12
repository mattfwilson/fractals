---
estimated_steps: 7
estimated_files: 1
skills_used: []
---

# T03: Export validation and cross-preset verification

Verify SVG export across all 10 presets at various iteration depths. Validate SVG structure (well-formed XML, correct namespace, viewBox). Add automated size comparison logging. Fix any edge cases found.

Steps:
1. Build a test harness that exports all presets and validates SVG structure
2. Run optimized and expanded exports for each preset
3. Verify file sizes are reasonable (not empty, not exploding)
4. Test rotation export
5. Browser-verify representative exports render correctly

## Inputs

- `src/lib/export/svg-generator.ts`
- `src/lib/presets/index.ts`

## Expected Output

- `Verification evidence of all presets exporting correctly`

## Verification

All 10 presets export valid SVG in both optimized and expanded modes. No console errors. File sizes logged and reasonable.
