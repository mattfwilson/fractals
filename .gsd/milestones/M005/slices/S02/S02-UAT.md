# S02: SVG Export Hardening + IFS Structural Optimization — UAT

**Milestone:** M005
**Written:** 2026-04-10T22:15:14.482Z

## SVG Export UAT

### Test 1: Optimized export file size
1. Select Koch Snowflake preset at depth 4
2. Open Export SVG panel
3. Verify Optimized mode shows ~6.6 KB with -92% vs expanded
4. ✅ Pass

### Test 2: Defs/use structural optimization
1. Select Fractal Bush preset at depth 4
2. Export in Optimized mode
3. Verify Elements shows "paths + defs/use" label
4. ✅ Pass

### Test 3: SVG inline preview
1. Click "Preview SVG" toggle button
2. Verify SVG renders inline below the button
3. Verify preview matches the Canvas output
4. Click "Hide Preview" to dismiss
5. ✅ Pass

### Test 4: Generation timing
1. Open Export panel
2. Verify timing shows (e.g., "84ms") next to description
3. ✅ Pass

### Test 5: Empty geometry
1. Set iterations to minimum (produces no geometry if applicable)
2. Verify empty state message appears
3. ✅ Pass

### Test 6: Cross-preset validation
1. All 10 presets export valid SVG in both Optimized and Expanded modes
2. All SVGs have correct xmlns, viewBox, and structure
3. Optimized size ≤ Expanded size for all presets
4. ✅ Pass
