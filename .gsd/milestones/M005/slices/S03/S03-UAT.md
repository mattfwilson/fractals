# S03: Color, Style, Jitter + Custom L-System Rules — UAT

**Milestone:** M005
**Written:** 2026-04-10T22:24:22.948Z

## Color, Style, Jitter + Custom Rules UAT

### Test 1: Depth gradient
1. Select Fractal Tree preset
2. Enable Depth Gradient toggle in Appearance
3. Set start color green, end color purple
4. Verify Canvas shows gradient from trunk (green) to tips (purple)
5. ✅ Pass

### Test 2: SVG export with gradient
1. With gradient enabled, click Preview SVG
2. Verify preview shows per-depth colors
3. ✅ Pass

### Test 3: Angle jitter
1. Select Fractal Tree, set Angle Jitter to 15%
2. Verify tree looks organic (asymmetric branches)
3. Change seed via 🎲 button — verify different pattern
4. Set same seed back — verify identical output
5. ✅ Pass

### Test 4: Custom L-system rules
1. Click "✏️ Custom Rules" button
2. Enter axiom "F", rules "F=F+F-F-F+F"
3. Click Generate
4. Verify Koch variant renders (625 segments at iteration 4)
5. ✅ Pass

### Test 5: Switch back to presets
1. Click "Koch Snowflake" preset
2. Verify custom mode deactivates, preset renders normally
3. ✅ Pass
