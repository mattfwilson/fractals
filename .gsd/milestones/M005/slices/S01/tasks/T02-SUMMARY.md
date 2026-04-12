---
id: T02
parent: S01
milestone: M005
key_files:
  - src/lib/engine/lsystem.ts
  - src/lib/engine/turtle.ts
  - src/lib/engine/types.ts
key_decisions:
  - (none)
duration: 
verification_result: passed
completed_at: 2026-04-10T21:24:22.268Z
blocker_discovered: false
---

# T02: Built L-system engine with string rewriting and turtle graphics interpreter producing geometry arrays

**Built L-system engine with string rewriting and turtle graphics interpreter producing geometry arrays**

## What Happened

Implemented the L-system engine in two modules: lsystem.ts handles iterative string rewriting with production rules, with a 2M character safety cap and early-abort on explosion. turtle.ts interprets the generated strings using turtle graphics commands (F/G/A/B draw, f move, +/- turn, [/] push/pop state, | turn-around). Output is an array of Segment objects with x1,y1,x2,y2,depth metadata. Engine is a pure function: rules + params in, geometry out.

## Verification

Koch snowflake at depth 4 generates 768 segments (3 × 4^4 = 768). Fractal tree at depth 6 generates 256 segments. All verified in browser.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `Browser verification: Koch depth 4 = 768 segments, Dragon depth 10 = 1024 segments` | 0 | ✅ pass | 100ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/lib/engine/lsystem.ts`
- `src/lib/engine/turtle.ts`
- `src/lib/engine/types.ts`
