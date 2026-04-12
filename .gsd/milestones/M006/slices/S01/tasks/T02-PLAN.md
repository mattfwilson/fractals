---
estimated_steps: 1
estimated_files: 3
skills_used: []
---

# T02: Animation panel UI with playback controls and timeline

1. Create AnimationPanel component that renders in the sidebar below ExportPanel\n2. Add keyframe capture button that snapshots current FractalParams\n3. Display keyframes as numbered visual markers on a horizontal timeline bar\n4. Add playback controls: play/pause button, speed selector (0.25x/0.5x/1x/2x), loop toggle\n5. Add per-segment duration control (default 2s)\n6. Add easing function dropdown selector\n7. Add delete button per keyframe\n8. Integrate with page.tsx: add animation state, wire up the requestAnimationFrame loop that calls getInterpolatedParams and sets the displayed params\n9. When animating, the interpolated params drive the geometry computation and canvas render\n10. Add animation state to URL serialization for sharing

## Inputs

- `src/lib/animation/types.ts`
- `src/lib/animation/easing.ts`
- `src/lib/animation/interpolate.ts`
- `src/components/ExportPanel.tsx`
- `src/app/page.tsx`

## Expected Output

- `src/components/AnimationPanel.tsx`

## Verification

npm run build && manual browser verification that animation plays smoothly
