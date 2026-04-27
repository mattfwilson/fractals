"use client";

import { useState, useCallback, useMemo } from "react";
import { generateIconSvg, generateIfsIconSvg, type IconSize } from "@/lib/export/svg-icon";
import { SvgPreview } from "@/components/SvgPreview";
import { buildDepthGradient } from "@/lib/engine/color";
import { IFS_PRESETS } from "@/lib/presets/ifs-presets";
import type { Segment, FractalParams } from "@/lib/engine/types";
import type { IFSPoint } from "@/lib/engine/ifs-types";

type GeometryResult =
  | { mode: "lsystem"; segments: Segment[] }
  | { mode: "ifs"; points: IFSPoint[] };

interface IconExportPanelProps {
  geometry: GeometryResult;
  params: FractalParams;
}

const ICON_SIZES: IconSize[] = [16, 24, 32, 48, 64];

// Tolerance presets: maps a 0–100 slider value to a D-P epsilon fraction
// 0 = fine (0.008), 100 = coarse (0.06)
function sliderToTolerance(v: number): number {
  const min = 0.008;
  const max = 0.06;
  return min + (max - min) * (v / 100);
}

export function IconExportPanel({ geometry, params }: IconExportPanelProps) {
  const [size, setSize] = useState<IconSize>(32);
  const [detailSlider, setDetailSlider] = useState(30); // 0=fine, 100=coarse
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const isIFS = geometry.mode === "ifs";
  const isEmpty = isIFS
    ? geometry.points.length === 0
    : geometry.segments.length === 0;

  // Build depth colors matching ExportPanel logic
  const { depthColors, colorByIteration } = useMemo(() => {
    if (isIFS) return { depthColors: undefined as string[] | undefined, colorByIteration: false };
    const segs = geometry.mode === "lsystem" ? geometry.segments : [];
    const maxDepth = segs.reduce((max, s) => Math.max(max, s.depth), 0);
    const branching = maxDepth > 0;
    if (params.colorMode === "gradient") {
      return branching
        ? { depthColors: buildDepthGradient(params.gradientStart, params.gradientEnd, maxDepth), colorByIteration: false }
        : { depthColors: buildDepthGradient(params.gradientStart, params.gradientEnd, params.iterations), colorByIteration: true };
    }
    if (params.colorMode === "per-iteration" && params.iterationColors.length > 0) {
      return { depthColors: params.iterationColors, colorByIteration: !branching };
    }
    return { depthColors: undefined, colorByIteration: false };
  }, [isIFS, params.colorMode, params.gradientStart, params.gradientEnd, params.iterationColors, params.iterations, geometry]);

  const ifsColors = useMemo(() => {
    if (!isIFS) return undefined;
    return IFS_PRESETS[params.ifsPreset]?.colors;
  }, [isIFS, params.ifsPreset]);

  const result = useMemo(() => {
    const tolerance = sliderToTolerance(detailSlider);
    const bg = params.bgTransparent ? undefined : params.bgColor;

    if (isIFS) {
      return generateIfsIconSvg(
        (geometry as { mode: "ifs"; points: IFSPoint[] }).points,
        {
          size,
          tolerance,
          strokeColor: params.strokeColor,
          background: bg,
          rotation: params.rotation,
          transformColors: ifsColors,
        }
      );
    }

    return generateIconSvg(
      (geometry as { mode: "lsystem"; segments: Segment[] }).segments,
      {
        size,
        tolerance,
        strokeColor: params.strokeColor,
        background: bg,
        rotation: params.rotation,
        depthColors,
        colorByIteration,
      }
    );
  }, [geometry, params, size, detailSlider, depthColors, colorByIteration, ifsColors, isIFS]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([result.svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const prefix = isIFS ? `ifs-${params.ifsPreset}` : `fractal-${params.preset}`;
    a.download = `${prefix}-icon-${size}x${size}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result.svg, params.preset, params.ifsPreset, isIFS, size]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result.svg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.warn("[icon-export] Clipboard write failed");
    }
  }, [result.svg]);

  // Reduction stat: what % of input geometry is in the output
  const reductionPct =
    !isIFS && result.inputCount > 0
      ? Math.round((1 - result.outputPoints / Math.max(result.inputCount, 1)) * 100)
      : null;

  return (
    <div className="px-4 py-4 border-b border-border-subtle">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-tertiary mb-3 font-[family-name:var(--font-display)]">
        Icon Export
      </h3>

      {isEmpty ? (
        <div className="flex items-center justify-center py-6 bg-bg-tertiary/20 rounded border border-border-subtle">
          <span className="text-[10px] font-[family-name:var(--font-mono)] text-text-tertiary">
            No geometry to export
          </span>
        </div>
      ) : (
        <>
          {/* Size picker */}
          <div className="mb-3">
            <div className="text-[9px] uppercase tracking-wider text-text-tertiary mb-1.5 font-[family-name:var(--font-display)]">
              Size
            </div>
            <div className="flex gap-1 p-0.5 bg-bg-tertiary/50 rounded-md">
              {ICON_SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`flex-1 text-[10px] font-[family-name:var(--font-mono)] py-1.5 rounded transition-all ${
                    size === s
                      ? "bg-accent/15 text-accent"
                      : "text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Detail slider (L-system only — IFS uses point density) */}
          {!isIFS && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[9px] uppercase tracking-wider text-text-tertiary font-[family-name:var(--font-display)]">
                  Detail
                </div>
                <div className="text-[9px] font-[family-name:var(--font-mono)] text-text-tertiary">
                  {detailSlider < 20
                    ? "Fine"
                    : detailSlider < 55
                      ? "Balanced"
                      : detailSlider < 80
                        ? "Simplified"
                        : "Coarse"}
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={detailSlider}
                onChange={(e) => setDetailSlider(Number(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer bg-bg-tertiary accent-accent"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[9px] font-[family-name:var(--font-mono)] text-text-tertiary">Fine</span>
                <span className="text-[9px] font-[family-name:var(--font-mono)] text-text-tertiary">Coarse</span>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-bg-tertiary/30 rounded px-2.5 py-2 border border-border-subtle">
              <div className="text-[9px] text-text-tertiary uppercase tracking-wider font-[family-name:var(--font-display)]">
                Viewbox
              </div>
              <div className="text-[13px] font-[family-name:var(--font-mono)] text-text-primary mt-0.5">
                {size}×{size}
              </div>
            </div>
            <div className="bg-bg-tertiary/30 rounded px-2.5 py-2 border border-border-subtle">
              <div className="text-[9px] text-text-tertiary uppercase tracking-wider font-[family-name:var(--font-display)]">
                {isIFS ? "Points" : "Points"}
              </div>
              <div className="text-[13px] font-[family-name:var(--font-mono)] text-text-primary mt-0.5">
                {result.outputPoints.toLocaleString()}
              </div>
              {reductionPct !== null && reductionPct > 0 && (
                <div className="text-[9px] font-[family-name:var(--font-mono)] text-accent mt-0.5">
                  −{reductionPct}% simplified
                </div>
              )}
            </div>
          </div>

          {/* Preview toggle */}
          <button
            onClick={() => setShowPreview((prev) => !prev)}
            className="w-full mb-3 py-1.5 px-2 rounded-md text-[10px] font-[family-name:var(--font-mono)] border border-border-subtle bg-bg-tertiary/20 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-all flex items-center justify-center gap-1.5"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className={`transition-transform ${showPreview ? "rotate-90" : ""}`}
            >
              <path
                d="M4.5 2.5L8 6L4.5 9.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {showPreview ? "Hide Preview" : "Preview Icon"}
          </button>

          {showPreview && (
            <div className="mb-3 flex justify-center">
              {/* Show icon at actual px size alongside a zoomed-in preview */}
              <div className="flex items-center gap-4">
                {/* Actual size */}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="rounded border border-border-subtle bg-bg-tertiary/30 flex items-center justify-center overflow-hidden"
                    style={{ width: Math.max(size, 32), height: Math.max(size, 32) }}
                  >
                    <SvgPreview svgString={result.svg} maxHeight={size} />
                  </div>
                  <span className="text-[8px] font-[family-name:var(--font-mono)] text-text-tertiary">
                    1×
                  </span>
                </div>
                {/* 4× zoom */}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="rounded border border-border-subtle bg-bg-tertiary/30 overflow-hidden"
                    style={{ width: Math.min(size * 4, 128), height: Math.min(size * 4, 128) }}
                  >
                    <SvgPreview svgString={result.svg} maxHeight={Math.min(size * 4, 128)} />
                  </div>
                  <span className="text-[8px] font-[family-name:var(--font-mono)] text-text-tertiary">
                    4×
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Export buttons */}
          <div className="flex flex-col gap-1.5">
            <button
              onClick={handleDownload}
              className="w-full py-2 px-3 rounded-md bg-accent/15 text-accent text-[11px] font-[family-name:var(--font-display)] font-semibold border border-accent/25 hover:bg-accent/20 transition-all flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 1v8m0 0L4 6.5M7 9l3-2.5M2 11h10"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Download Icon SVG
            </button>

            <button
              onClick={handleCopy}
              className={`w-full py-1.5 px-2 rounded-md text-[10px] font-[family-name:var(--font-mono)] border transition-all ${
                copied
                  ? "bg-accent/10 text-accent border-accent/25"
                  : "bg-bg-tertiary/30 text-text-secondary border-border-subtle hover:bg-bg-tertiary hover:text-text-primary"
              }`}
            >
              {copied ? "✓ Copied SVG!" : "Copy Icon SVG"}
            </button>
          </div>

          <p className="text-[9px] font-[family-name:var(--font-mono)] text-text-tertiary mt-2 leading-relaxed">
            {isIFS
              ? `Point-cloud subsampled to ${result.outputPoints.toLocaleString()} points. Paste into Figma as SVG.`
              : "Path-simplified to icon scale. Drag & drop SVG into Figma."}
          </p>
        </>
      )}
    </div>
  );
}
