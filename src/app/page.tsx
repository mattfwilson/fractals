"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { ControlPanel } from "@/components/ControlPanel";
import { IFSControlPanel } from "@/components/IFSControlPanel";
import { ExportPanel } from "@/components/ExportPanel";
import { FractalCanvas } from "@/components/FractalCanvas";
import { AnimationPanel } from "@/components/AnimationPanel";
import { PRESETS } from "@/lib/presets";
import { generateLSystem, generateLSystemWithIterations } from "@/lib/engine/lsystem";
import { interpretTurtle } from "@/lib/engine/turtle";
import { parseRuleString } from "@/components/CustomRuleEditor";
import { applyRadialSymmetry } from "@/lib/engine/symmetry";
import { applyTiling } from "@/lib/engine/tiling";
import { serializeParams, deserializeParams } from "@/lib/sharing/url-state";
import type { FractalParams } from "@/lib/engine/types";
import type { IFSPoint } from "@/lib/engine/ifs-types";
import { IFS_PRESETS } from "@/lib/presets/ifs-presets";
import { generateIFS } from "@/lib/engine/ifs";
import type { AnimationState } from "@/lib/animation/types";
import { createAnimationState } from "@/lib/animation/types";
import { getInterpolatedParams, getTotalDuration } from "@/lib/animation/interpolate";

const DEFAULT_PRESET = "koch-snowflake";

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  }, []);

  return (
    <button
      onClick={handleCopy}
      className={`text-[10px] font-[family-name:var(--font-mono)] px-2 py-1 rounded-md border transition-all ${
        copied
          ? "bg-accent/10 text-accent border-accent/25"
          : "bg-bg-tertiary/50 text-text-tertiary border-border-subtle hover:text-text-primary hover:bg-bg-tertiary"
      }`}
      title="Copy shareable link to clipboard"
    >
      {copied ? "✓ Copied!" : "🔗 Share"}
    </button>
  );
}

/** Unified geometry result — either L-system segments or IFS points */
type GeometryResult =
  | { mode: "lsystem"; segments: import("@/lib/engine/types").Segment[] }
  | { mode: "ifs"; points: IFSPoint[] };

/**
 * Compute geometry from FractalParams. Extracted so it can be called
 * from both the static useMemo path and the animation loop.
 */
function computeGeometry(params: FractalParams): GeometryResult {
  if (params.engineMode === "ifs") {
    let transforms;
    if (params.ifsCustomMode) {
      try {
        transforms = JSON.parse(params.ifsCustomTransforms);
        if (!Array.isArray(transforms) || transforms.length === 0) {
          transforms = IFS_PRESETS["barnsley-fern"].transforms;
        }
      } catch {
        transforms = IFS_PRESETS["barnsley-fern"].transforms;
      }
    } else {
      const preset = IFS_PRESETS[params.ifsPreset];
      transforms = preset?.transforms ?? IFS_PRESETS["barnsley-fern"].transforms;
    }
    const points = generateIFS(transforms, params.ifsPoints, params.seed);
    return { mode: "ifs", points };
  }

  // L-system mode
  let axiom: string;
  let rules: Record<string, string>;
  let initialAngle = 0;

  if (params.customMode) {
    axiom = params.customAxiom || "F";
    const parsed = parseRuleString(params.customRules);
    rules = parsed || { F: "F" };
  } else {
    const preset = PRESETS[params.preset];
    if (!preset) return { mode: "lsystem", segments: [] };
    axiom = preset.axiom;
    rules = preset.rules;
    initialAngle = preset.initialAngle ?? 0;
  }

  const turtleOpts = {
    angle: params.angle,
    lengthRatio: params.lengthRatio,
    initialAngle,
    angleJitter: params.angleJitter,
    lengthJitter: params.lengthJitter,
    seed: params.seed,
  };

  let segments: import("@/lib/engine/types").Segment[];

  if (params.colorMode === "per-iteration") {
    const { lString, iterationMap } = generateLSystemWithIterations(axiom, rules, params.iterations);
    segments = interpretTurtle(lString, turtleOpts, iterationMap);
  } else {
    const lString = generateLSystem(axiom, rules, params.iterations);
    segments = interpretTurtle(lString, turtleOpts);
  }

  if (params.symmetryFolds > 1) {
    segments = applyRadialSymmetry(segments, params.symmetryFolds);
  }

  if (params.tiling) {
    segments = applyTiling(segments, params.tileCols, params.tileRows);
  }

  return { mode: "lsystem", segments };
}

export default function Home() {
  const [params, setParams] = useState<FractalParams>(() => {
    const preset = PRESETS[DEFAULT_PRESET];
    return {
      engineMode: "lsystem" as const,
      preset: DEFAULT_PRESET,
      iterations: preset.defaultIterations,
      scale: 1.0,
      strokeWidth: 1.5,
      rotation: 0,
      angle: preset.angle,
      lengthRatio: 0.5,
      strokeColor: "#5bf5a0",
      canvasWidth: 800,
      canvasHeight: 800,
      useGradient: false,
      gradientStart: "#5bf5a0",
      gradientEnd: "#a855f7",
      colorMode: "single" as const,
      iterationColors: ["#5bf5a0"],
      angleJitter: 0,
      lengthJitter: 0,
      seed: 42,
      customMode: false,
      customAxiom: "F",
      customRules: "F=F+F-F-F+F",
      symmetryFolds: 1,
      tiling: false,
      tileCols: 2,
      tileRows: 2,
      bgColor: "#0a0a14",
      bgTransparent: true,
      ifsPreset: "barnsley-fern",
      ifsPoints: 100000,
      ifsCustomMode: false,
      ifsCustomTransforms: "[]",
    };
  });

  const [animation, setAnimation] = useState<AnimationState>(createAnimationState);

  // The params actually used for rendering — either user params or animated params
  const [animatedParams, setAnimatedParams] = useState<FractalParams | null>(null);
  const displayParams = animatedParams ?? params;

  // --- Animation loop ---
  const animRef = useRef(animation);
  animRef.current = animation;

  const lastFrameRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!animation.playing) {
      lastFrameRef.current = null;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const tick = (timestamp: number) => {
      const anim = animRef.current;
      if (!anim.playing) return;

      if (lastFrameRef.current === null) {
        lastFrameRef.current = timestamp;
      }

      const deltaMs = timestamp - lastFrameRef.current;
      lastFrameRef.current = timestamp;

      const deltaSec = (deltaMs / 1000) * anim.speed;
      const totalDuration = getTotalDuration(anim.keyframes);

      if (totalDuration <= 0) return;

      let nextTime = anim.currentTime + deltaSec;

      if (nextTime >= totalDuration) {
        if (anim.loop) {
          nextTime = nextTime % totalDuration;
        } else {
          // Stop at end
          nextTime = totalDuration;
          setAnimation((prev) => ({ ...prev, playing: false, currentTime: totalDuration }));
          setAnimatedParams(
            getInterpolatedParams(anim.keyframes, totalDuration, anim.easing)
          );
          return;
        }
      }

      // Update time in animation state (for UI scrubber)
      setAnimation((prev) => ({ ...prev, currentTime: nextTime }));

      // Compute interpolated params for this frame
      const interpolated = getInterpolatedParams(anim.keyframes, nextTime, anim.easing);
      if (interpolated) {
        setAnimatedParams(interpolated);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [animation.playing]);

  // When animation stops, clear animated params so we revert to user params
  // (unless user is scrubbing — scrubbing sets playing=false but we want to show the scrub position)
  useEffect(() => {
    if (!animation.playing && animation.keyframes.length >= 2 && animation.currentTime > 0) {
      // User scrubbed or animation ended — show interpolated frame
      const interpolated = getInterpolatedParams(
        animation.keyframes,
        animation.currentTime,
        animation.easing
      );
      if (interpolated) {
        setAnimatedParams(interpolated);
      }
    } else if (!animation.playing && animation.currentTime === 0) {
      // Stopped/reset — revert to user params
      setAnimatedParams(null);
    }
  }, [animation.playing, animation.currentTime, animation.keyframes, animation.easing]);

  // Restore from URL on mount
  const [urlApplied, setUrlApplied] = useState(false);
  useEffect(() => {
    if (urlApplied) return;
    const urlParams = deserializeParams(window.location.search);
    if (urlParams && Object.keys(urlParams).length > 0) {
      setParams((prev) => ({ ...prev, ...urlParams }));
    }
    setUrlApplied(true);
  }, [urlApplied]);

  // Sync params to URL after URL has been applied (only when not animating)
  useEffect(() => {
    if (!urlApplied) return;
    if (animation.playing) return;
    const search = serializeParams(params);
    const newUrl = `${window.location.pathname}?${search}`;
    window.history.replaceState(null, "", newUrl);
  }, [params, urlApplied, animation.playing]);

  // Compute geometry from display params
  const geometry = useMemo(() => computeGeometry(displayParams), [displayParams]);

  const handleParamChange = useCallback(
    (key: keyof FractalParams, value: number | string | boolean | string[]) => {
      // When user manually changes params, clear animated overlay
      setAnimatedParams(null);
      setParams((prev) => {
        const next = { ...prev, [key]: value };
        const palette = [
          "#5bf5a0", "#a855f7", "#f59e0b", "#3b82f6", "#ef4444", "#ec4899",
          "#14b8a6", "#f97316", "#8b5cf6", "#06b6d4", "#84cc16", "#e879f9",
        ];
        if (key === "colorMode" && value === "per-iteration") {
          const count = prev.iterations + 1;
          if (prev.iterationColors.length !== count) {
            const resized = prev.iterationColors.slice(0, count);
            while (resized.length < count) {
              resized.push(palette[resized.length % palette.length]);
            }
            next.iterationColors = resized;
          }
        }
        if (key === "iterations" && (next.colorMode ?? prev.colorMode) === "per-iteration") {
          const count = (value as number) + 1;
          const current = prev.iterationColors;
          if (current.length !== count) {
            const resized = current.slice(0, count);
            while (resized.length < count) {
              resized.push(palette[resized.length % palette.length]);
            }
            next.iterationColors = resized;
          }
        }
        return next;
      });
    },
    []
  );

  const handlePresetChange = useCallback((presetKey: string) => {
    const preset = PRESETS[presetKey];
    if (!preset) return;
    setAnimatedParams(null);
    setParams((prev) => ({
      ...prev,
      preset: presetKey,
      iterations: preset.defaultIterations,
      angle: preset.angle,
      lengthRatio: 0.5,
    }));
  }, []);

  const handleIFSPresetChange = useCallback((presetKey: string) => {
    const preset = IFS_PRESETS[presetKey];
    if (!preset) return;
    setAnimatedParams(null);
    setParams((prev) => ({
      ...prev,
      ifsPreset: presetKey,
      ifsPoints: preset.defaultPoints,
    }));
  }, []);

  const handleEngineChange = useCallback((mode: "lsystem" | "ifs") => {
    setAnimatedParams(null);
    setParams((prev) => ({ ...prev, engineMode: mode }));
  }, []);

  const isAnimating = animation.playing;

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-border-subtle bg-bg-secondary/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-accent/15 flex items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="text-accent"
            >
              <path
                d="M8 1L10 5L14 5.5L11 8.5L12 13L8 10.5L4 13L5 8.5L2 5.5L6 5L8 1Z"
                stroke="currentColor"
                strokeWidth="1.2"
                fill="none"
              />
            </svg>
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-base font-semibold tracking-tight text-text-primary">
            Fractal Lab
          </h1>
          <span className="text-[10px] font-[family-name:var(--font-mono)] text-text-tertiary bg-bg-tertiary px-2 py-0.5 rounded">
            v0.2
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isAnimating && (
            <span className="text-[10px] font-[family-name:var(--font-mono)] text-accent animate-pulse">
              ▶ Animating
            </span>
          )}
          <span className="text-[11px] font-[family-name:var(--font-mono)] text-text-tertiary">
            {geometry.mode === "lsystem"
              ? `${geometry.segments.length.toLocaleString()} segments`
              : `${geometry.points.length.toLocaleString()} points`}
          </span>
          <CopyLinkButton />
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Controls sidebar */}
        <aside className="w-[320px] flex-shrink-0 border-r border-border-subtle bg-bg-secondary overflow-y-auto">
          {/* Engine mode toggle */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex gap-1 p-0.5 bg-bg-tertiary/50 rounded-md">
              <button
                onClick={() => handleEngineChange("lsystem")}
                className={`flex-1 text-[10px] font-[family-name:var(--font-display)] font-semibold py-2 rounded transition-all ${
                  params.engineMode === "lsystem"
                    ? "bg-accent/15 text-accent"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                L-System
              </button>
              <button
                onClick={() => handleEngineChange("ifs")}
                className={`flex-1 text-[10px] font-[family-name:var(--font-display)] font-semibold py-2 rounded transition-all ${
                  params.engineMode === "ifs"
                    ? "bg-accent/15 text-accent"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                IFS
              </button>
            </div>
          </div>

          {params.engineMode === "lsystem" ? (
            <ControlPanel
              params={params}
              onParamChange={handleParamChange}
              onPresetChange={handlePresetChange}
            />
          ) : (
            <IFSControlPanel
              params={params}
              onParamChange={handleParamChange}
              onIFSPresetChange={handleIFSPresetChange}
            />
          )}
          <AnimationPanel
            params={params}
            animation={animation}
            onAnimationChange={setAnimation}
          />
          <ExportPanel
            geometry={geometry}
            params={displayParams}
          />
        </aside>

        {/* Canvas area */}
        <main className="flex-1 flex items-center justify-center bg-bg-primary relative overflow-hidden">
          {/* Subtle grid background */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(var(--text-secondary) 1px, transparent 1px),
                linear-gradient(90deg, var(--text-secondary) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />
          <FractalCanvas
            geometry={geometry}
            params={displayParams}
          />
        </main>
      </div>
    </div>
  );
}
