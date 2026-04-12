---
id: T02
parent: S03
milestone: M005
key_files:
  - src/lib/engine/random.ts
  - src/lib/engine/turtle.ts
  - src/lib/engine/types.ts
  - src/components/ControlPanel.tsx
  - src/app/page.tsx
key_decisions:
  - (none)
duration: 
verification_result: passed
completed_at: 2026-04-10T22:22:11.723Z
blocker_discovered: false
---

# T02: Implemented angle and length jitter with mulberry32 seeded PRNG, percentage-based sliders, seed display with randomize button, and deterministic output

**Implemented angle and length jitter with mulberry32 seeded PRNG, percentage-based sliders, seed display with randomize button, and deterministic output**

## What Happened

Added mulberry32 PRNG (random.ts) — fast, deterministic, 32-bit. Extended TurtleOptions with angleJitter, lengthJitter, seed fields. Modified turtle interpreter to apply jitter on every + and - turn (angle jitter) and every F/G/A/B draw step (length jitter). Jitter amounts are expressed as fractions (0-0.5 = 0-50%) of the base angle/length, so the fractal structure remains recognizable even at high jitter. Added sliders in Structure section showing 0-50% range with integer display. Seed control appears only when jitter is active, with a 🎲 randomize button.

## Verification

Fractal Tree with 15% angle jitter shows organic variation while maintaining recognizable tree structure. Same seed produces identical output. Randomize button changes the seed and regenerates with different jitter pattern. TypeScript compiles cleanly.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 2800ms |
| 2 | `Browser: 15% angle jitter on Fractal Tree produces organic variation` | 0 | ✅ pass | 1000ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/lib/engine/random.ts`
- `src/lib/engine/turtle.ts`
- `src/lib/engine/types.ts`
- `src/components/ControlPanel.tsx`
- `src/app/page.tsx`
