"use client";

import { useCallback } from "react";
import type { FractalParams } from "@/lib/engine/types";
import type {
  AnimationState,
  AnimationKeyframe,
  EasingName,
  PlaybackSpeed,
} from "@/lib/animation/types";
import { generateKeyframeId } from "@/lib/animation/types";
import { EASING_OPTIONS } from "@/lib/animation/easing";
import { getTotalDuration } from "@/lib/animation/interpolate";

const SPEED_OPTIONS: PlaybackSpeed[] = [0.25, 0.5, 1, 2, 4];

interface AnimationPanelProps {
  params: FractalParams;
  animation: AnimationState;
  onAnimationChange: (animation: AnimationState) => void;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-4 border-b border-border-subtle">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-tertiary mb-3 font-[family-name:var(--font-display)]">
        {title}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

export function AnimationPanel({
  params,
  animation,
  onAnimationChange,
}: AnimationPanelProps) {
  const { keyframes, playing, speed, loop, easing, currentTime } = animation;
  const totalDuration = getTotalDuration(keyframes);

  const addKeyframe = useCallback(() => {
    const kf: AnimationKeyframe = {
      id: generateKeyframeId(),
      params: { ...params },
      duration: 2,
    };
    onAnimationChange({
      ...animation,
      keyframes: [...keyframes, kf],
    });
  }, [params, animation, keyframes, onAnimationChange]);

  const removeKeyframe = useCallback(
    (id: string) => {
      onAnimationChange({
        ...animation,
        keyframes: keyframes.filter((kf) => kf.id !== id),
        playing: false,
        currentTime: 0,
      });
    },
    [animation, keyframes, onAnimationChange]
  );

  const updateKeyframeDuration = useCallback(
    (id: string, duration: number) => {
      onAnimationChange({
        ...animation,
        keyframes: keyframes.map((kf) =>
          kf.id === id ? { ...kf, duration } : kf
        ),
      });
    },
    [animation, keyframes, onAnimationChange]
  );

  const togglePlay = useCallback(() => {
    if (keyframes.length < 2) return;
    const nowPlaying = !playing;
    onAnimationChange({
      ...animation,
      playing: nowPlaying,
      // Reset to start if we were at the end
      currentTime:
        nowPlaying && currentTime >= totalDuration ? 0 : currentTime,
    });
  }, [animation, playing, keyframes.length, currentTime, totalDuration, onAnimationChange]);

  const stop = useCallback(() => {
    onAnimationChange({
      ...animation,
      playing: false,
      currentTime: 0,
    });
  }, [animation, onAnimationChange]);

  const setSpeed = useCallback(
    (s: PlaybackSpeed) => {
      onAnimationChange({ ...animation, speed: s });
    },
    [animation, onAnimationChange]
  );

  const toggleLoop = useCallback(() => {
    onAnimationChange({ ...animation, loop: !loop });
  }, [animation, loop, onAnimationChange]);

  const setEasing = useCallback(
    (e: EasingName) => {
      onAnimationChange({ ...animation, easing: e });
    },
    [animation, onAnimationChange]
  );

  const setCurrentTime = useCallback(
    (t: number) => {
      onAnimationChange({ ...animation, currentTime: t, playing: false });
    },
    [animation, onAnimationChange]
  );

  const canPlay = keyframes.length >= 2;
  const progressPct =
    totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <Section title="Animation">
      {/* Add keyframe button */}
      <button
        onClick={addKeyframe}
        className="w-full py-2 px-3 rounded-md bg-accent/10 text-accent text-[11px] font-[family-name:var(--font-display)] font-semibold border border-accent/20 hover:bg-accent/15 transition-all flex items-center justify-center gap-2"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M6 2v8M2 6h8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        Capture Keyframe
      </button>

      {/* Keyframe list */}
      {keyframes.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {keyframes.map((kf, i) => (
            <div
              key={kf.id}
              className="flex items-center gap-2 bg-bg-tertiary/30 rounded-md px-2.5 py-1.5 border border-border-subtle group"
            >
              {/* Keyframe number */}
              <span className="w-5 h-5 rounded-full bg-accent/15 text-accent text-[9px] font-[family-name:var(--font-mono)] font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>

              {/* Preset/info */}
              <span className="text-[10px] font-[family-name:var(--font-mono)] text-text-secondary truncate flex-1">
                {kf.params.customMode
                  ? "Custom"
                  : kf.params.preset.replace(/-/g, " ")}
              </span>

              {/* Duration (not shown for last keyframe) */}
              {i < keyframes.length - 1 && (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={kf.duration}
                    onChange={(e) =>
                      updateKeyframeDuration(
                        kf.id,
                        Math.max(0.1, parseFloat(e.target.value) || 0.5)
                      )
                    }
                    className="w-10 px-1 py-0.5 text-[9px] font-[family-name:var(--font-mono)] text-accent bg-bg-tertiary/50 border border-border-subtle rounded text-center focus:border-accent/40 focus:outline-none"
                    min={0.1}
                    max={30}
                    step={0.5}
                    title="Transition duration (seconds)"
                  />
                  <span className="text-[8px] font-[family-name:var(--font-mono)] text-text-tertiary">
                    s
                  </span>
                </div>
              )}

              {/* Delete */}
              <button
                onClick={() => removeKeyframe(kf.id)}
                className="text-text-tertiary hover:text-[#ef4444] transition-colors opacity-0 group-hover:opacity-100"
                title="Remove keyframe"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2 2l6 6M8 2l-6 6"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Timeline scrubber */}
      {keyframes.length >= 2 && (
        <div className="flex flex-col gap-1.5">
          {/* Progress bar with keyframe markers */}
          <div className="relative h-6 flex items-center">
            {/* Track background */}
            <div className="absolute inset-x-0 h-1.5 bg-bg-tertiary rounded-full">
              {/* Fill */}
              <div
                className="h-full bg-accent/40 rounded-full transition-[width] duration-75"
                style={{ width: `${Math.min(progressPct, 100)}%` }}
              />
            </div>

            {/* Keyframe markers */}
            {keyframes.map((kf, i) => {
              let pos = 0;
              if (totalDuration > 0) {
                let t = 0;
                for (let j = 0; j < i; j++) t += keyframes[j].duration;
                pos = (t / totalDuration) * 100;
              }
              return (
                <div
                  key={kf.id}
                  className="absolute w-2.5 h-2.5 rounded-full bg-accent border-2 border-bg-secondary -translate-x-1/2 z-10"
                  style={{ left: `${pos}%` }}
                  title={`Keyframe ${i + 1}`}
                />
              );
            })}

            {/* Scrub input */}
            <input
              type="range"
              min={0}
              max={totalDuration}
              step={0.01}
              value={currentTime}
              onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
              className="absolute inset-x-0 w-full opacity-0 cursor-pointer h-6 z-20"
              title="Scrub timeline"
            />
          </div>

          {/* Time display */}
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-[family-name:var(--font-mono)] text-text-tertiary tabular-nums">
              {currentTime.toFixed(1)}s
            </span>
            <span className="text-[9px] font-[family-name:var(--font-mono)] text-text-tertiary tabular-nums">
              {totalDuration.toFixed(1)}s
            </span>
          </div>
        </div>
      )}

      {/* Playback controls */}
      {canPlay && (
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className={`flex items-center justify-center w-8 h-8 rounded-md border transition-all ${
              playing
                ? "bg-accent/20 text-accent border-accent/30"
                : "bg-bg-tertiary/50 text-text-secondary border-border-subtle hover:text-text-primary hover:bg-bg-tertiary"
            }`}
            title={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="2" y="2" width="3" height="8" rx="0.5" fill="currentColor" />
                <rect x="7" y="2" width="3" height="8" rx="0.5" fill="currentColor" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 1.5v9l7.5-4.5L3 1.5z" fill="currentColor" />
              </svg>
            )}
          </button>

          {/* Stop */}
          <button
            onClick={stop}
            className="flex items-center justify-center w-8 h-8 rounded-md bg-bg-tertiary/50 text-text-secondary border border-border-subtle hover:text-text-primary hover:bg-bg-tertiary transition-all"
            title="Stop & reset"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="1" y="1" width="8" height="8" rx="1" fill="currentColor" />
            </svg>
          </button>

          {/* Loop toggle */}
          <button
            onClick={toggleLoop}
            className={`flex items-center justify-center w-8 h-8 rounded-md border transition-all ${
              loop
                ? "bg-accent/15 text-accent border-accent/25"
                : "bg-bg-tertiary/50 text-text-tertiary border-border-subtle hover:text-text-secondary"
            }`}
            title={loop ? "Loop on" : "Loop off"}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M9 3.5H4a2.5 2.5 0 000 5h5M9 3.5L7 1.5M9 3.5L7 5.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Speed selector */}
          <div className="flex gap-0.5 ml-auto">
            {SPEED_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-1.5 py-1 text-[8px] font-[family-name:var(--font-mono)] rounded transition-all ${
                  speed === s
                    ? "bg-accent/15 text-accent"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Easing selector */}
      {canPlay && (
        <div className="flex gap-1 p-0.5 bg-bg-tertiary/50 rounded-md">
          {EASING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setEasing(opt.value)}
              className={`flex-1 text-[8px] font-[family-name:var(--font-mono)] py-1.5 rounded transition-all ${
                easing === opt.value
                  ? "bg-accent/15 text-accent"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Empty state hint */}
      {keyframes.length === 0 && (
        <p className="text-[9px] font-[family-name:var(--font-mono)] text-text-tertiary leading-relaxed">
          Capture 2+ keyframes with different settings to animate between them.
        </p>
      )}
      {keyframes.length === 1 && (
        <p className="text-[9px] font-[family-name:var(--font-mono)] text-text-tertiary leading-relaxed">
          Add at least one more keyframe to enable animation.
        </p>
      )}
    </Section>
  );
}
