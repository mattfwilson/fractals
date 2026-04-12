# S01: Animation Engine & Playback

**Goal:** Build the core animation engine (keyframe store, parameter interpolation, easing functions, requestAnimationFrame loop) and integrate it with the existing canvas renderer, plus playback UI controls
**Demo:** User can add keyframes from current params, press play, and see the fractal smoothly morph between states on the canvas with play/pause/speed controls

## Must-Haves

- Keyframe capture from current FractalParams works\n- Linear and ease-in-out interpolation of all numeric params\n- HSL color interpolation for stroke/gradient colors\n- Animation loop drives canvas re-renders at smooth framerate\n- Play/pause/speed/loop controls functional\n- Timeline UI with keyframe markers, delete, duration, easing

## Proof Level

- This slice proves: Not provided.

## Integration Closure

Not provided.

## Verification

- Not provided.

## Tasks

- [x] **T01: Animation engine — types, interpolation, easing** `est:30min`
  1. Define animation types: AnimationKeyframe (params snapshot + timestamp), AnimationState (keyframes, playing, currentTime, speed, loop, easing), EasingFunction type\n2. Implement easing functions: linear, easeInOut, easeIn, easeOut\n3. Implement parameter interpolation: lerpNumber for all numeric FractalParams, HSL interpolation for color fields (strokeColor, gradientStart, gradientEnd, iterationColors), handle discrete fields (preset, customMode, customAxiom, customRules) by snapping at midpoint\n4. Implement getInterpolatedParams(keyframes, currentTime, easing) that returns a complete FractalParams for any point in time\n5. Unit-test interpolation logic mentally by verifying edge cases: single keyframe, time beyond last keyframe, color wrapping
  - Files: `src/lib/animation/types.ts`, `src/lib/animation/easing.ts`, `src/lib/animation/interpolate.ts`
  - Verify: TypeScript compiles with no errors: npx tsc --noEmit

- [x] **T02: Animation panel UI with playback controls and timeline** `est:45min`
  1. Create AnimationPanel component that renders in the sidebar below ExportPanel\n2. Add keyframe capture button that snapshots current FractalParams\n3. Display keyframes as numbered visual markers on a horizontal timeline bar\n4. Add playback controls: play/pause button, speed selector (0.25x/0.5x/1x/2x), loop toggle\n5. Add per-segment duration control (default 2s)\n6. Add easing function dropdown selector\n7. Add delete button per keyframe\n8. Integrate with page.tsx: add animation state, wire up the requestAnimationFrame loop that calls getInterpolatedParams and sets the displayed params\n9. When animating, the interpolated params drive the geometry computation and canvas render\n10. Add animation state to URL serialization for sharing
  - Files: `src/components/AnimationPanel.tsx`, `src/app/page.tsx`, `src/lib/sharing/url-state.ts`
  - Verify: npm run build && manual browser verification that animation plays smoothly

## Files Likely Touched

- src/lib/animation/types.ts
- src/lib/animation/easing.ts
- src/lib/animation/interpolate.ts
- src/components/AnimationPanel.tsx
- src/app/page.tsx
- src/lib/sharing/url-state.ts
