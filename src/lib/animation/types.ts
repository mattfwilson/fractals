import type { FractalParams } from "@/lib/engine/types";

/** A single keyframe capturing fractal params at a point in time */
export interface AnimationKeyframe {
  /** Unique ID for React keys and operations */
  id: string;
  /** Complete parameter snapshot */
  params: FractalParams;
  /** Duration (seconds) of the transition FROM this keyframe to the next */
  duration: number;
}

/** Easing function names */
export type EasingName = "linear" | "easeIn" | "easeOut" | "easeInOut";

/** Playback speed multipliers */
export type PlaybackSpeed = 0.25 | 0.5 | 1 | 2 | 4;

/** Full animation state */
export interface AnimationState {
  /** Ordered keyframes */
  keyframes: AnimationKeyframe[];
  /** Currently playing */
  playing: boolean;
  /** Current playback time in seconds */
  currentTime: number;
  /** Speed multiplier */
  speed: PlaybackSpeed;
  /** Loop playback */
  loop: boolean;
  /** Easing function for transitions */
  easing: EasingName;
}

/** Create a fresh empty animation state */
export function createAnimationState(): AnimationState {
  return {
    keyframes: [],
    playing: false,
    currentTime: 0,
    speed: 1,
    loop: true,
    easing: "easeInOut",
  };
}

let _nextId = 1;
/** Generate a unique keyframe ID */
export function generateKeyframeId(): string {
  return `kf-${_nextId++}-${Date.now().toString(36)}`;
}
