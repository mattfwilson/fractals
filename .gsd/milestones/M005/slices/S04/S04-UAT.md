# S04: Symmetry Modes + Tiling — UAT

**Milestone:** M005
**Written:** 2026-04-10T22:28:03.586Z

## Symmetry + Tiling UAT

### Test 1: Radial symmetry
1. Select Fractal Tree preset
2. Set Symmetry to 6×
3. Verify snowflake mandala pattern renders
4. Verify segment count = 256 × 6 = 1,536
5. ✅ Pass

### Test 2: Tiling
1. Select Koch Snowflake preset
2. Enable Tiling toggle
3. Verify 2×2 grid of snowflakes renders
4. ✅ Pass

### Test 3: Symmetry + Tiling combined
1. Enable both 6× symmetry and 2×2 tiling on Fractal Tree
2. Verify mandala pattern tiles correctly
3. ✅ Pass

### Test 4: SVG export with transforms
1. Apply symmetry/tiling
2. Export SVG, verify transforms are preserved
3. ✅ Pass
