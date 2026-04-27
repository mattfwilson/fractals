"use client";

import { useCallback, useRef } from "react";
import { Slider, LabelWithTooltip } from "./Slider";
import { CollapsibleSection } from "./CollapsibleSection";
import { PRESETS, PRESET_ORDER } from "@/lib/presets";
import { CustomRuleEditor } from "./CustomRuleEditor";
import type { FractalParams } from "@/lib/engine/types";

/** Named palettes for the per-iteration color picker. */
const ITERATION_PALETTES: Record<string, string[]> = {
  Accent: [
    "#5bf5a0", "#a855f7", "#f59e0b", "#3b82f6", "#ef4444", "#ec4899",
    "#14b8a6", "#f97316", "#8b5cf6", "#06b6d4", "#84cc16", "#e879f9",
  ],
  Warm: [
    "#fde68a", "#fbbf24", "#f97316", "#ef4444", "#b91c1c", "#7f1d1d",
    "#fecaca", "#fca5a5", "#f87171", "#dc2626", "#991b1b", "#450a0a",
  ],
  Cool: [
    "#a7f3d0", "#6ee7b7", "#34d399", "#10b981", "#06b6d4", "#0891b2",
    "#3b82f6", "#6366f1", "#8b5cf6", "#4338ca", "#1e3a8a", "#172554",
  ],
  Mono: [
    "#fafafa", "#e5e5e5", "#d4d4d4", "#a3a3a3", "#737373", "#525252",
    "#404040", "#262626", "#171717", "#0a0a0a", "#000000", "#1a1a1a",
  ],
};

/** Default palette for per-iteration colors — chosen for good contrast on dark backgrounds */
const ITERATION_PALETTE = ITERATION_PALETTES.Accent;

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

  const applyPalette = useCallback(
    (name: keyof typeof ITERATION_PALETTES) => {
      const palette = ITERATION_PALETTES[name];
      const next = Array.from({ length: count }, (_, i) => palette[i % palette.length]);
      onColorsChange(next);
    },
    [count, onColorsChange]
  );

  const shuffle = useCallback(() => {
    const next = [...normalized];
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    onColorsChange(next);
  }, [normalized, onColorsChange]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        {(Object.keys(ITERATION_PALETTES) as Array<keyof typeof ITERATION_PALETTES>).map((name) => (
          <button
            key={name}
            onClick={() => applyPalette(name)}
            className="flex-1 text-[9px] font-[family-name:var(--font-mono)] py-1 rounded bg-bg-tertiary/50 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary border border-border-subtle transition-all"
            title={`Apply ${name} palette`}
          >
            {name}
          </button>
        ))}
        <button
          onClick={shuffle}
          className="text-[10px] font-[family-name:var(--font-mono)] px-2 py-1 rounded bg-bg-tertiary/50 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary border border-border-subtle transition-all"
          title="Shuffle colors"
        >
          ⇄
        </button>
      </div>
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

const Section = CollapsibleSection;

/** Compact +/− stepper for small integer ranges. */
function Stepper({
  label,
  tooltip,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  tooltip?: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className="flex flex-col gap-1.5 flex-1">
      <LabelWithTooltip label={label} tooltip={tooltip} />
      <div className="flex items-center h-6 rounded-md border border-border-subtle bg-bg-tertiary/40 overflow-hidden">
        <button
          type="button"
          onClick={dec}
          disabled={value <= min}
          className="w-6 h-full flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-tertiary transition-colors"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="flex-1 text-center text-[11px] font-[family-name:var(--font-mono)] text-accent tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={inc}
          disabled={value >= max}
          className="w-6 h-full flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-tertiary transition-colors"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

/** 3-way segmented toggle for mutually-exclusive modes. */
function SegmentedThree<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 p-0.5 bg-bg-tertiary/50 rounded-md">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 text-[10px] font-[family-name:var(--font-mono)] py-1.5 rounded transition-all ${
            value === opt.value
              ? "bg-accent/15 text-accent"
              : "text-text-tertiary hover:text-text-secondary"
          }`}
        >
          {opt.label}
        </button>
      ))}
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

  // Length ratio only affects fractals with branching ([ ] in rules),
  // since it scales by depth which only increments inside branches.
  const hasBranching = params.customMode
    ? params.customRules.includes("[")
    : currentPreset != null && Object.values(currentPreset.rules).some((r) => r.includes("["));

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
      <Section title="Preset" persistKey="preset" defaultOpen>
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
      <Section title="Structure" persistKey="structure" defaultOpen>
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
        {hasBranching && (
          <Slider
            label="Length Ratio"
            tooltip="How much each branch level shrinks relative to its parent. At 0.5, branches are half the length of the previous level. At 1.0, all segments are equal length."
            value={params.lengthRatio}
            min={0.1}
            max={1.0}
            step={0.01}
            onChange={handleLengthRatio}
          />
        )}
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

      {/* Repeat — mutually-exclusive Off / Tiling / Seamless modes.
          Symmetry lives here too since it's another form of spatial repetition. */}
      <Section title="Repeat" persistKey="repeat">
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

        {(() => {
          type RepeatMode = "off" | "tiling" | "seamless";
          const mode: RepeatMode = params.pattern ? "seamless" : params.tiling ? "tiling" : "off";
          const setMode = (next: RepeatMode) => {
            onParamChange("tiling", next === "tiling");
            onParamChange("pattern", next === "seamless");
          };
          return (
            <div className="flex flex-col gap-2">
              <LabelWithTooltip
                label="Mode"
                tooltip="Off: single fractal. Tiling: repeat in a simple grid with gaps. Seamless: carve a wrapped tile that repeats without seams (best for Figma patterns)."
              />
              <SegmentedThree
                value={mode}
                onChange={setMode}
                options={[
                  { value: "off", label: "Off" },
                  { value: "tiling", label: "Tiling" },
                  { value: "seamless", label: "Seamless" },
                ]}
              />
            </div>
          );
        })()}

        {params.tiling && !params.pattern && (
          <div className="flex gap-3">
            <Stepper
              label="Cols"
              tooltip="Number of columns in the tiling grid."
              value={params.tileCols}
              min={1}
              max={5}
              onChange={(v) => onParamChange("tileCols", v)}
            />
            <Stepper
              label="Rows"
              tooltip="Number of rows in the tiling grid."
              value={params.tileRows}
              min={1}
              max={5}
              onChange={(v) => onParamChange("tileRows", v)}
            />
          </div>
        )}

        {params.pattern && (
          <>
            <Slider
              label="Tile Size"
              tooltip="Size of the tile relative to the fractal's longer side. Smaller values crop tighter and cause more wrapping."
              value={params.patternTileSize}
              min={0.3}
              max={2.0}
              step={0.01}
              onChange={(v) => onParamChange("patternTileSize", v)}
              unit="×"
            />
            <Slider
              label="Content Scale"
              tooltip="Scale the fractal inside the tile without changing the tile size. Use to dial in density."
              value={params.patternContentScale}
              min={0.3}
              max={2.0}
              step={0.01}
              onChange={(v) => onParamChange("patternContentScale", v)}
              unit="×"
            />
            <Slider
              label="Offset X"
              tooltip="Shift the tile origin horizontally within the fractal. Changes where the seam falls."
              value={params.patternOffsetX}
              min={-0.5}
              max={0.5}
              step={0.01}
              onChange={(v) => onParamChange("patternOffsetX", v)}
            />
            <Slider
              label="Offset Y"
              tooltip="Shift the tile origin vertically within the fractal."
              value={params.patternOffsetY}
              min={-0.5}
              max={0.5}
              step={0.01}
              onChange={(v) => onParamChange("patternOffsetY", v)}
            />
            <div className="flex gap-3">
              <Stepper
                label="Preview Cols"
                tooltip="How many repeats to show horizontally in the preview. Export is always a single tile."
                value={params.patternPreviewCols}
                min={1}
                max={6}
                onChange={(v) => onParamChange("patternPreviewCols", v)}
              />
              <Stepper
                label="Preview Rows"
                tooltip="How many repeats to show vertically in the preview."
                value={params.patternPreviewRows}
                min={1}
                max={6}
                onChange={(v) => onParamChange("patternPreviewRows", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <LabelWithTooltip label="Show Tile Bounds" tooltip="Overlay the tile boundary on the preview to see the seam alignment. Export never includes this." />
              <button
                onClick={() => onParamChange("patternShowBounds", !params.patternShowBounds)}
                className={`w-8 h-4 rounded-full transition-all relative ${
                  params.patternShowBounds
                    ? "bg-accent/40"
                    : "bg-bg-tertiary border border-border-subtle"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${
                    params.patternShowBounds
                      ? "left-[calc(100%-14px)] bg-accent"
                      : "left-0.5 bg-text-tertiary"
                  }`}
                />
              </button>
            </div>
          </>
        )}
      </Section>

      {/* Visual controls */}
      <Section title="Appearance" persistKey="appearance">
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
