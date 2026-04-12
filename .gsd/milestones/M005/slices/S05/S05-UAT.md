# S05: Canvas Sizing, Background, URL Sharing + Polish — UAT

**Milestone:** M005
**Written:** 2026-04-10T22:38:59.258Z

## Canvas Sizing, Background, URL Sharing + Polish UAT

### Test 1: Background controls
1. Toggle Background from "transparent" to "solid"
2. Set background color to dark blue
3. Verify Canvas shows colored background
4. ✅ Pass

### Test 2: URL sharing
1. Configure Fractal Tree with 6× symmetry
2. Verify URL shows ?p=fractal-tree&i=6&a=25&sf=6
3. Click Share button → verify "Copied!" feedback
4. Navigate to URL directly → verify identical pattern renders
5. ✅ Pass

### Test 3: Clean build
1. Run `npx next build`
2. Verify 0 warnings, successful compilation
3. ✅ Pass

### Test 4: All presets working
1. Click each of 10 presets
2. Verify all render without errors
3. ✅ Pass
