# M006: Animation & Parameter Morphing

## Vision
Add animation capabilities that smoothly morph between fractal parameter states. Users can define keyframes, preview real-time transitions, and export animated GIFs. The animation system interpolates all numeric parameters (angle, jitter, scale, rotation, iterations) and colors over time using easing functions.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | S01 | medium | — | ✅ | User can add keyframes from current params, press play, and see the fractal smoothly morph between states on the canvas with play/pause/speed controls |
| S02 | Animation Timeline UI | low | S01 | ⬜ | Sidebar shows a visual timeline with draggable keyframes, duration controls, easing selector, and the animation can be shared via URL |
| S03 | Animated GIF Export | high | S01 | ⬜ | User can export their animation as an animated GIF at configurable resolution and frame rate |
