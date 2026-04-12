import type { FractalParams } from "@/lib/engine/types";
import type { AnimationKeyframe, EasingName } from "./types";
import { getEasing } from "./easing";
import { hexToHsl, hslToHex, interpolateHsl } from "@/lib/engine/color";

/**
 * Numeric keys of FractalParams that should be smoothly interpolated.
 */
const NUMERIC_KEYS: (keyof FractalParams)[] = [
  "iterations",
  "scale",
  "strokeWidth",
  "rotation",
  "angle",
  "lengthRatio",
  "angleJitter",
  "lengthJitter",
  "seed",
  "symmetryFolds",
  "tileCols",
  "tileRows",
  "ifsPoints",
];

/** Keys that must be integers after interpolation */
const INTEGER_KEYS = new Set<keyof FractalParams>([
  "iterations",
  "seed",
  "symmetryFolds",
  "tileCols",
  "tileRows",
  "ifsPoints",
]);

/** Color keys to interpolate via HSL */
const COLOR_KEYS: (keyof FractalParams)[] = [
  "strokeColor",
  "gradientStart",
  "gradientEnd",
  "bgColor",
];

/** Boolean/string keys that snap at midpoint (t >= 0.5 → B, else A) */
const SNAP_KEYS: (keyof FractalParams)[] = [
  "engineMode",
  "preset",
  "customMode",
  "customAxiom",
  "customRules",
  "useGradient",
  "colorMode",
  "tiling",
  "bgTransparent",
  "canvasWidth",
  "canvasHeight",
  "ifsPreset",
  "ifsCustomMode",
  "ifsCustomTransforms",
];

/** Lerp a single number */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Interpolate a hex color via HSL */
function lerpColor(a: string, b: string, t: number): string {
  if (a === b) return a;
  const hslA = hexToHsl(a);
  const hslB = hexToHsl(b);
  return hslToHex(interpolateHsl(hslA, hslB, t));
}

/** Interpolate a color array (per-iteration colors) */
function lerpColorArray(a: string[], b: string[], t: number): string[] {
  const len = Math.max(a.length, b.length);
  const result: string[] = [];
  for (let i = 0; i < len; i++) {
    const ca = a[i] ?? a[a.length - 1] ?? "#5bf5a0";
    const cb = b[i] ?? b[b.length - 1] ?? "#5bf5a0";
    result.push(lerpColor(ca, cb, t));
  }
  return result;
}

/**
 * Interpolate between two FractalParams snapshots.
 * @param a Start params
 * @param b End params
 * @param t Progress 0..1 (already eased)
 */
export function interpolateParams(
  a: FractalParams,
  b: FractalParams,
  t: number
): FractalParams {
  // Start with a copy of A, then blend toward B
  const result = { ...a };

  // Numeric interpolation
  for (const key of NUMERIC_KEYS) {
    const va = a[key] as number;
    const vb = b[key] as number;
    let v = lerp(va, vb, t);
    if (INTEGER_KEYS.has(key)) {
      v = Math.round(v);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (result as any)[key] = v;
  }

  // Color interpolation
  for (const key of COLOR_KEYS) {
    const va = a[key] as string;
    const vb = b[key] as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (result as any)[key] = lerpColor(va, vb, t);
  }

  // Per-iteration colors
  result.iterationColors = lerpColorArray(
    a.iterationColors,
    b.iterationColors,
    t
  );

  // Snap keys at midpoint
  for (const key of SNAP_KEYS) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (result as any)[key] = t < 0.5 ? a[key] : b[key];
  }

  return result;
}

/**
 * Calculate the total duration of an animation (sum of all keyframe durations
 * except the last, which has no transition after it).
 */
export function getTotalDuration(keyframes: AnimationKeyframe[]): number {
  if (keyframes.length <= 1) return 0;
  let total = 0;
  for (let i = 0; i < keyframes.length - 1; i++) {
    total += keyframes[i].duration;
  }
  return total;
}

/**
 * Get interpolated FractalParams at a given time position.
 * Handles segment boundaries, easing, and edge cases.
 */
export function getInterpolatedParams(
  keyframes: AnimationKeyframe[],
  currentTime: number,
  easing: EasingName
): FractalParams | null {
  if (keyframes.length === 0) return null;
  if (keyframes.length === 1) return keyframes[0].params;

  const totalDuration = getTotalDuration(keyframes);
  if (totalDuration <= 0) return keyframes[0].params;

  // Clamp time to valid range
  const t = Math.max(0, Math.min(currentTime, totalDuration));

  // Find which segment we're in
  let elapsed = 0;
  for (let i = 0; i < keyframes.length - 1; i++) {
    const segDuration = keyframes[i].duration;
    if (t <= elapsed + segDuration) {
      // We're in segment i → i+1
      const segProgress = segDuration > 0 ? (t - elapsed) / segDuration : 0;
      const easedProgress = getEasing(easing)(segProgress);
      return interpolateParams(
        keyframes[i].params,
        keyframes[i + 1].params,
        easedProgress
      );
    }
    elapsed += segDuration;
  }

  // Past the end — return last keyframe
  return keyframes[keyframes.length - 1].params;
}
