"use client";

import { useCallback, useRef } from "react";
import { Slider, LabelWithTooltip } from "./Slider";
import { PRESETS, PRESET_ORDER } from "@/lib/presets";
import { CustomRuleEditor } from "./CustomRuleEditor";
import type { FractalParams } from "@/lib/engine/types";

/** Default palette for per-iteration colors — chosen for good contrast on dark backgrounds */
const ITERATION_PALETTE = [
  "#5bf5a0", // green (accent)
  "#a855f7", // purple
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#ef4444", // red
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#e879f9", // fuchsia
];

/**
 * Ensure the iterationColors array has exactly `count` entries.
 * Extends with palette colors if too short, trims if too long.
 */
function ensureColorCount(colors: string[], count: number): string[] {
  if (colors.length === count) return colors;
  const result = colors.slice(0, count);
  while (result.length < count) {
    result.push(ITERATION_PALETTE[result.length % ITERATION_PALETTE.length]);
  }
  return result;
}

/** Per-iteration color picker with swatches for each depth level */
function IterationColorPicker({
  iterations,
  colors,
  onColorsChange,
}: {
  iterations: number;
  colors: string[];
  onColorsChange: (colors: string[]) => void;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // We need iterations+1 colors: depth 0 (axiom) through depth N
  const count = iterations + 1;
  const normalized = ensureColorCount(colors, count);

  const handleColorChange = useCallback(
    (index: number, color: string) => {
      const next = [...normalized];
      next[index] = color;
      onColorsChange(next);
    },
    [normalized, onColorsChange]
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {normalized.map((color, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <button
              onClick={() => inputRefs.current[i]?.click()}
              className="relative w-7 h-7 rounded-md border border-border-subtle hover:border-accent/40 transition-all group cursor-pointer"
              style={{ backgroundColor: color }}
              title={`Iteration ${i} — ${color}`}
            >
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-[family-name:var(--font-mono)] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  color: isLightColor(color) ? "#000" : "#fff",
                  textShadow: isLightColor(color) ? "none" : "0 1px 2px rgba(0,0,0,0.5)",
                }}
              >
                {i}
              </span>
              <input
                ref={(el) => { inputRefs.current[i] = el; }}
                type="color"
                value={color}
                onChange={(e) => handleColorChange(i, e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                tabIndex={-1}
              />
            </button>
            <span className="text-[8px] font-[family-name:var(--font-mono)] text-text-tertiary leading-none">
              {i}
            </span>
          </div>
        ))}
      </div>
      {/* Preview gradient bar */}
      <div
        className="h-2 rounded-sm w-full"
        style={{
          background: normalized.length > 1
            ? `linear-gradient(to right, ${normalized.map((c, i) => `${c} ${(i / (normalized.length - 1)) * 100}%`).join(", ")})`
            : normalized[0],
        }}
      />
    </div>
  );
}

/** Check if a hex color is light (for contrast text) */
function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  // Relative luminance approximation
  return (r * 0.299 + g * 0.587 + b * 0.114) > 150;
}

interface ControlPanelProps {
  params: FractalParams;
  onParamChange: (key: keyof FractalParams, value: number | string | boolean | string[]) => void;
  onPresetChange: (presetKey: string) => void;
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
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

export function ControlPanel({
  params,
  onParamChange,
  onPresetChange,
}: ControlPanelProps) {
  const currentPreset = PRESETS[params.preset];
  const maxIter = currentPreset?.maxIterations ?? 8;

  const handleIterations = useCallback(
    (v: number) => onParamChange("iterations", v),
    [onParamChange]
  );
  const handleScale = useCallback(
    (v: number) => onParamChange("scale", v),
    [onParamChange]
  );
  const handleStrokeWidth = useCallback(
    (v: number) => onParamChange("strokeWidth", v),
    [onParamChange]
  );
  const handleRotation = useCallback(
    (v: number) => onParamChange("rotation", v),
    [onParamChange]
  );
  const handleAngle = useCallback(
    (v: number) => onParamChange("angle", v),
    [onParamChange]
  );
  const handleLengthRatio = useCallback(
    (v: number) => onParamChange("lengthRatio", v),
    [onParamChange]
  );
  const handleAngleJitter = useCallback(
    (v: number) => onParamChange("angleJitter", v),
    [onParamChange]
  );
  const handleLengthJitter = useCallback(
    (v: number) => onParamChange("lengthJitter", v),
    [onParamChange]
  );

  return (
    <div className="flex flex-col">
      {/* Preset selector */}
      <Section title="Preset">
        <div className="grid grid-cols-2 gap-1.5">
          {PRESET_ORDER.map((key) => {
            const preset = PRESETS[key];
            const isActive = params.preset === key && !params.customMode;
            return (
              <button
                key={key}
                onClick={() => {
                  onParamChange("customMode", false);
                  onPresetChange(key);
                }}
                className={`
                  px-2.5 py-2 rounded-md text-[11px] font-[family-name:var(--font-display)] font-medium
                  text-left transition-all duration-150
                  ${
                    isActive
                      ? "bg-accent/12 text-accent border border-accent/25 shadow-[0_0_12px_rgba(91,245,160,0.06)]"
                      : "bg-bg-tertiary/50 text-text-secondary border border-transparent hover:bg-bg-tertiary hover:text-text-primary"
                  }
                `}
                title={preset.description}
              >
                {preset.name}
              </button>
            );
          })}
          <button
            onClick={() => onParamChange("customMode", true)}
            className={`
              px-2.5 py-2 rounded-md text-[11px] font-[family-name:var(--font-display)] font-medium
              text-left transition-all duration-150 col-span-2
              ${
                params.customMode
                  ? "bg-accent/12 text-accent border border-accent/25 shadow-[0_0_12px_rgba(91,245,160,0.06)]"
                  : "bg-bg-tertiary/50 text-text-secondary border border-transparent hover:bg-bg-tertiary hover:text-text-primary"
              }
            `}
            title="Enter your own L-system rules"
          >
            ✏️ Custom Rules
          </button>
        </div>
        {params.customMode && (
          <div className="mt-3">
            <CustomRuleEditor params={params} onParamChange={onParamChange} />
          </div>
        )}
      </Section>

      {/* Structure controls */}
      <Section title="Structure">
        <Slider
          label="Iterations"
          tooltip="Number of times the L-system rules are applied. Higher values create more detail but increase complexity exponentially."
          value={params.iterations}
          min={1}
          max={maxIter}
          step={1}
          onChange={handleIterations}
          decimals={0}
        />
        <Slider
          label="Branch Angle"
          tooltip="The turning angle for + and − commands. Controls how sharply the fractal branches. 60° gives hexagonal shapes, 90° gives square shapes."
          value={params.angle}
          min={5}
          max={180}
          step={0.5}
          onChange={handleAngle}
          unit="°"
          decimals={1}
        />
        <Slider
          label="Length Ratio"
          tooltip="How much each branch level shrinks relative to its parent. At 0.5, branches are half the length of the previous level. At 1.0, all segments are equal length. Most visible on branching fractals like trees."
          value={params.lengthRatio}
          min={0.1}
          max={1.0}
          step={0.01}
          onChange={handleLengthRatio}
        />
        <Slider
          label="Angle Jitter"
          tooltip="Random variation applied to each turn angle. Adds organic irregularity — great for natural-looking trees and plants."
          value={params.angleJitter * 100}
          min={0}
          max={50}
          step={1}
          onChange={(v) => handleAngleJitter(v / 100)}
          unit="%"
          decimals={0}
        />
        <Slider
          label="Length Jitter"
          tooltip="Random variation applied to each segment length. Combined with angle jitter, creates natural-looking organic forms."
          value={params.lengthJitter * 100}
          min={0}
          max={50}
          step={1}
          onChange={(v) => handleLengthJitter(v / 100)}
          unit="%"
          decimals={0}
        />
        {/* Seed control — only visible when jitter is active */}
        {(params.angleJitter > 0 || params.lengthJitter > 0) && (
          <div className="flex items-center justify-between">
            <LabelWithTooltip label="Seed" tooltip="Controls the random number generator. Same seed + same settings = same result every time. Randomize to explore variations." />
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-[family-name:var(--font-mono)] text-accent tabular-nums">
                {params.seed}
              </span>
              <button
                onClick={() => onParamChange("seed", Math.floor(Math.random() * 100000))}
                className="text-[9px] font-[family-name:var(--font-mono)] px-1.5 py-0.5 rounded bg-bg-tertiary/50 text-text-tertiary hover:text-text-primary border border-border-subtle transition-all"
                title="Randomize seed"
              >
                🎲
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* Symmetry & Tiling */}
      <Section title="Transform">
        <Slider
          label="Symmetry"
          tooltip="N-fold radial symmetry. Duplicates the fractal N times around a center point, like a kaleidoscope. 1 = off."
          value={params.symmetryFolds}
          min={1}
          max={12}
          step={1}
          onChange={(v) => onParamChange("symmetryFolds", v)}
          unit="×"
          decimals={0}
        />

        {/* Tiling toggle */}
        <div className="flex items-center justify-between">
          <LabelWithTooltip label="Tiling" tooltip="Repeat the fractal in a grid pattern. Creates seamless wallpaper-like designs." />
          <button
            onClick={() => onParamChange("tiling", !params.tiling)}
            className={`w-8 h-4 rounded-full transition-all relative ${
              params.tiling
                ? "bg-accent/40"
                : "bg-bg-tertiary border border-border-subtle"
            }`}
          >
            <div
              className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${
                params.tiling
                  ? "left-[calc(100%-14px)] bg-accent"
                  : "left-0.5 bg-text-tertiary"
              }`}
            />
          </button>
        </div>
        {params.tiling && (
          <div className="flex gap-3">
            <Slider
              label="Cols"
              tooltip="Number of columns in the tiling grid."
              value={params.tileCols}
              min={1}
              max={5}
              step={1}
              onChange={(v) => onParamChange("tileCols", v)}
              decimals={0}
            />
            <Slider
              label="Rows"
              tooltip="Number of rows in the tiling grid."
              value={params.tileRows}
              min={1}
              max={5}
              step={1}
              onChange={(v) => onParamChange("tileRows", v)}
              decimals={0}
            />
          </div>
        )}
      </Section>

      {/* Visual controls */}
      <Section title="Appearance">
        <Slider
          label="Scale"
          tooltip="Zoom level of the fractal on the canvas. Values above 1× enlarge, below 1× shrink."
          value={params.scale}
          min={0.1}
          max={3.0}
          step={0.05}
          onChange={handleScale}
          unit="×"
        />
        <Slider
          label="Stroke Width"
          tooltip="Thickness of the drawn lines in pixels. Thicker strokes make the fractal more visible at small sizes."
          value={params.strokeWidth}
          min={0.2}
          max={5.0}
          step={0.1}
          onChange={handleStrokeWidth}
          unit="px"
        />
        <Slider
          label="Rotation"
          tooltip="Rotate the entire fractal around its center. Useful for orienting trees upward or finding interesting angles."
          value={params.rotation}
          min={0}
          max={360}
          step={1}
          onChange={handleRotation}
          unit="°"
          decimals={0}
        />

        {/* Background controls */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <LabelWithTooltip label="Background" tooltip="Canvas and SVG export background. Transparent is best for Figma import; solid adds a colored backdrop." />
            <button
              onClick={() => onParamChange("bgTransparent", !params.bgTransparent)}
              className={`text-[9px] font-[family-name:var(--font-mono)] px-2 py-0.5 rounded border transition-all ${
                params.bgTransparent
                  ? "bg-bg-tertiary/50 text-text-tertiary border-border-subtle"
                  : "bg-accent/10 text-accent border-accent/25"
              }`}
            >
              {params.bgTransparent ? "transparent" : "solid"}
            </button>
          </div>
          {!params.bgTransparent && (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={params.bgColor}
                onChange={(e) => onParamChange("bgColor", e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border border-border-subtle bg-transparent"
                title="Background color"
              />
              <span className="text-[10px] font-[family-name:var(--font-mono)] text-text-tertiary">
                {params.bgColor}
              </span>
            </div>
          )}
        </div>

        {/* Color mode controls */}
        <div className="flex flex-col gap-2">
          <LabelWithTooltip label="Color" tooltip="Solid uses one color. Gradient blends between two colors by depth. Per Iter assigns a unique color to each iteration level." />
          {/* Mode selector */}
          <div className="flex gap-1 p-0.5 bg-bg-tertiary/50 rounded-md">
            {(["single", "gradient", "per-iteration"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  onParamChange("colorMode", mode);
                  onParamChange("useGradient", mode === "gradient");
                }}
                className={`flex-1 text-[9px] font-[family-name:var(--font-mono)] py-1.5 rounded transition-all ${
                  params.colorMode === mode
                    ? "bg-accent/15 text-accent"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                {mode === "single" ? "Solid" : mode === "gradient" ? "Gradient" : "Per Iter"}
              </button>
            ))}
          </div>

          {/* Single color */}
          {params.colorMode === "single" && (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={params.strokeColor}
                onChange={(e) => onParamChange("strokeColor", e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border border-border-subtle bg-transparent"
                title="Stroke color"
              />
              <span className="text-[10px] font-[family-name:var(--font-mono)] text-text-tertiary">
                {params.strokeColor}
              </span>
            </div>
          )}

          {/* Gradient */}
          {params.colorMode === "gradient" && (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={params.gradientStart}
                onChange={(e) => onParamChange("gradientStart", e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border border-border-subtle bg-transparent"
                title="Start color"
              />
              <div
                className="flex-1 h-3 rounded-sm"
                style={{
                  background: `linear-gradient(to right, ${params.gradientStart}, ${params.gradientEnd})`,
                }}
              />
              <input
                type="color"
                value={params.gradientEnd}
                onChange={(e) => onParamChange("gradientEnd", e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border border-border-subtle bg-transparent"
                title="End color"
              />
            </div>
          )}

          {/* Per-iteration colors */}
          {params.colorMode === "per-iteration" && (
            <IterationColorPicker
              iterations={params.iterations}
              colors={params.iterationColors}
              onColorsChange={(colors) => onParamChange("iterationColors", colors as unknown as string)}
            />
          )}
        </div>
      </Section>

      {/* Info panel */}
      <div className="px-4 py-4">
        <div className="bg-bg-tertiary/40 rounded-md p-3 border border-border-subtle">
          <p className="text-[10px] font-[family-name:var(--font-mono)] text-text-tertiary leading-relaxed">
            {currentPreset?.description ?? "Select a preset to begin"}
          </p>
          <div className="mt-2 flex gap-3 text-[10px] font-[family-name:var(--font-mono)] text-text-tertiary">
            <span>
              axiom:{" "}
              <span className="text-accent/70">{currentPreset?.axiom}</span>
            </span>
          </div>
          <div className="mt-1 flex flex-col gap-0.5 text-[10px] font-[family-name:var(--font-mono)] text-text-tertiary">
            {currentPreset &&
              Object.entries(currentPreset.rules).map(([key, val]) => (
                <span key={key}>
                  {key} →{" "}
                  <span className="text-accent/70">{val}</span>
                </span>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
