import type { EasingName } from "./types";

/**
 * Easing functions. Input t is [0, 1], output is [0, 1].
 */

function linear(t: number): number {
  return t;
}

function easeIn(t: number): number {
  return t * t * t;
}

function easeOut(t: number): number {
  const u = 1 - t;
  return 1 - u * u * u;
}

function easeInOut(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const EASING_MAP: Record<EasingName, (t: number) => number> = {
  linear,
  easeIn,
  easeOut,
  easeInOut,
};

/** Get an easing function by name */
export function getEasing(name: EasingName): (t: number) => number {
  return EASING_MAP[name] ?? linear;
}

/** All available easing names for UI display */
export const EASING_OPTIONS: { value: EasingName; label: string }[] = [
  { value: "linear", label: "Linear" },
  { value: "easeIn", label: "Ease In" },
  { value: "easeOut", label: "Ease Out" },
  { value: "easeInOut", label: "Ease In-Out" },
];
