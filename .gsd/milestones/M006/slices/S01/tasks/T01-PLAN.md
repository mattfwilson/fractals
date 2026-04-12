---
estimated_steps: 1
estimated_files: 3
skills_used: []
---

# T01: Animation engine — types, interpolation, easing

1. Define animation types: AnimationKeyframe (params snapshot + timestamp), AnimationState (keyframes, playing, currentTime, speed, loop, easing), EasingFunction type\n2. Implement easing functions: linear, easeInOut, easeIn, easeOut\n3. Implement parameter interpolation: lerpNumber for all numeric FractalParams, HSL interpolation for color fields (strokeColor, gradientStart, gradientEnd, iterationColors), handle discrete fields (preset, customMode, customAxiom, customRules) by snapping at midpoint\n4. Implement getInterpolatedParams(keyframes, currentTime, easing) that returns a complete FractalParams for any point in time\n5. Unit-test interpolation logic mentally by verifying edge cases: single keyframe, time beyond last keyframe, color wrapping

## Inputs

- `src/lib/engine/types.ts`
- `src/lib/engine/color.ts`

## Expected Output

- `src/lib/animation/types.ts`
- `src/lib/animation/easing.ts`
- `src/lib/animation/interpolate.ts`

## Verification

TypeScript compiles with no errors: npx tsc --noEmit
