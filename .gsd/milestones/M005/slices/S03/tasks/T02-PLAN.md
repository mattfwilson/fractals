---
estimated_steps: 7
estimated_files: 4
skills_used: []
---

# T02: Angle and length jitter with seeded PRNG

Add angle jitter and length jitter parameters. Use a seeded PRNG (mulberry32) so jitter is deterministic for a given seed. Add jitter controls to the UI.

Steps:
1. Implement mulberry32 seeded PRNG
2. Add angleJitter, lengthJitter, seed fields to FractalParams
3. Modify turtle interpreter to apply jitter during interpretation
4. Add jitter sliders and seed field to ControlPanel
5. Verify jitter produces organic-looking results on Fractal Tree

## Inputs

- `src/lib/engine/turtle.ts`
- `src/lib/engine/types.ts`

## Expected Output

- `Organic jittered fractal rendering`
- `Deterministic jitter with seed control`

## Verification

Apply 15% angle jitter to Fractal Tree. Result looks organic. Same seed produces identical output on re-render.
