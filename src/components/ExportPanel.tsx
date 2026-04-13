"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { generateSvg, type SvgExportResult } from "@/lib/export/svg-generator";
import { generatePointsSvg, type SvgPointsResult } from "@/lib/export/svg-points";
import { formatBytes } from "@/lib/export/svg-optimizer";
import { SvgPreview } from "@/components/SvgPreview";
import { buildDepthGradient } from "@/lib/engine/color";
import { IFS_PRESETS } from "@/lib/presets/ifs-presets";
import type { Segment, FractalParams } from "@/lib/engine/types";
import type { IFSPoint } from "@/lib/engine/ifs-types";

type GeometryResult =
  | { mode: "lsystem"; segments: Segment[] }
  | { mode: "ifs"; points: IFSPoint[] };

interface ExportPanelProps {
  geometry: GeometryResult;
  params: FractalParams;
}

type ExportMode = "optimized" | "expanded";

const HIGH_SEGMENT_THRESHOLD = 10_000;

export function ExportPanel({ geometry, params }: ExportPanelProps) {
  const [mode, setMode] = useState<ExportMode>("optimized");
  const [copied, setCopied] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const isIFS = geometry.mode === "ifs";
  const elementCount = isIFS ? geometry.points.length : geometry.segments.length;
  const isEmpty = elementCount === 0;
  const isHighCount = elementCount > HIGH_SEGMENT_THRESHOLD;

  // Build depth colors for L-system export
  const depthColors = useMemo(() => {
    if (isIFS) return undefined;
    if (params.colorMode === "gradient") {
      const segs = (geometry as { mode: "lsystem"; segments: Segment[] }).segments;
      const maxDepth = segs.reduce((max, s) => Math.max(max, s.depth), 0);
      return buildDepthGradient(params.gradientStart, params.gradientEnd, maxDepth);
    }
    if (params.colorMode === "per-iteration" && params.iterationColors.length > 0) {
      return params.iterationColors;
    }
    return undefined;
  }, [isIFS, params.colorMode, params.gradientStart, params.gradientEnd, params.iterationColors, geometry]);

  // Get IFS colors
  const ifsColors = useMemo(() => {
    if (!isIFS) return undefined;
    return IFS_PRESETS[params.ifsPreset]?.colors;
  }, [isIFS, params.ifsPreset]);

  // Generate SVG result
  const result = useMemo(() => {
    if (isIFS) {
      const ptsResult: SvgPointsResult = generatePointsSvg(
        (geometry as { mode: "ifs"; points: IFSPoint[] }).points,
        {
          width: params.canvasWidth,
          height: params.canvasHeight,
          strokeColor: params.strokeColor,
          scale: params.scale,
          rotation: params.rotation,
          precision: 1,
          transformColors: ifsColors,
          background: params.bgTransparent ? undefined : params.bgColor,
        }
      );
      return {
        svg: ptsResult.svg,
        byteSize: ptsResult.byteSize,
        elementCount: ptsResult.pointCount,
        pathCount: ptsResult.pointCount,
      };
    }
    const segs = (geometry as { mode: "lsystem"; segments: Segment[] }).segments;
    return generateSvg(segs, {
      width: params.canvasWidth,
      height: params.canvasHeight,
      strokeColor: params.strokeColor,
      strokeWidth: params.strokeWidth,
      scale: params.scale,
      rotation: params.rotation,
      optimized: mode === "optimized",
      precision: 2,
      depthColors,
      colorByIteration: params.colorMode === "per-iteration",
      background: params.bgTransparent ? undefined : params.bgColor,
    });
  }, [geometry, params, mode, depthColors, ifsColors, isIFS]);

  // Track generation time in an effect (performance.now is impure, can't live in useMemo)
  const [genTimeMs, setGenTimeMs] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    if (isIFS) {
      generatePointsSvg(
        (geometry as { mode: "ifs"; points: IFSPoint[] }).points,
        {
          width: params.canvasWidth,
          height: params.canvasHeight,
          strokeColor: params.strokeColor,
          scale: params.scale,
          rotation: params.rotation,
          precision: 1,
          transformColors: ifsColors,
          background: params.bgTransparent ? undefined : params.bgColor,
        }
      );
    } else {
      const segs = (geometry as { mode: "lsystem"; segments: Segment[] }).segments;
      generateSvg(segs, {
        width: params.canvasWidth,
        height: params.canvasHeight,
        strokeColor: params.strokeColor,
        strokeWidth: params.strokeWidth,
        scale: params.scale,
        rotation: params.rotation,
        optimized: mode === "optimized",
        precision: 2,
        depthColors,
        colorByIteration: params.colorMode === "per-iteration",
        background: params.bgTransparent ? undefined : params.bgColor,
      });
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- diagnostic timing measurement for UX feedback
    setGenTimeMs(performance.now() - t0);
  }, [geometry, params, mode, depthColors, ifsColors, isIFS]);

  // Compute alt result for L-system comparison
  const altResult: SvgExportResult | null = useMemo(() => {
    if (isIFS) return null;
    const segs = (geometry as { mode: "lsystem"; segments: Segment[] }).segments;
    return generateSvg(segs, {
      width: params.canvasWidth,
      height: params.canvasHeight,
      strokeColor: params.strokeColor,
      strokeWidth: params.strokeWidth,
      scale: params.scale,
      rotation: params.rotation,
      optimized: mode !== "optimized",
      precision: 2,
      depthColors,
      colorByIteration: params.colorMode === "per-iteration",
      background: params.bgTransparent ? undefined : params.bgColor,
    });
  }, [geometry, params, mode, depthColors, isIFS]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([result.svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const prefix = isIFS ? `ifs-${params.ifsPreset}` : `fractal-${params.preset}`;
    a.download = `${prefix}-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result.svg, params.preset, params.ifsPreset, isIFS]);

  const handleCopySvg = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result.svg);
      setCopied("svg");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      console.warn("[export] Clipboard write failed");
    }
  }, [result.svg]);

  const handleCopyDataUrl = useCallback(async () => {
    try {
      const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(result.svg)))}`;
      await navigator.clipboard.writeText(dataUrl);
      setCopied("dataurl");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      console.warn("[export] Clipboard write failed");
    }
  }, [result.svg]);

  const savings =
    !isIFS && mode === "optimized" && altResult
      ? Math.round((1 - result.byteSize / Math.max(altResult.byteSize, 1)) * 100)
      : 0;

  const hasDefs = result.svg.includes("<defs>");

  return (
    <div className="px-4 py-4 border-b border-border-subtle">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-tertiary mb-3 font-[family-name:var(--font-display)]">
        Export SVG
      </h3>

      {isEmpty ? (
        <div className="flex items-center justify-center py-6 bg-bg-tertiary/20 rounded border border-border-subtle">
          <span className="text-[10px] font-[family-name:var(--font-mono)] text-text-tertiary">
            No geometry to export
          </span>
        </div>
      ) : (
        <>
          {isHighCount && (
            <div className="mb-3 px-2.5 py-2 rounded bg-[#f5a623]/10 border border-[#f5a623]/20">
              <div className="text-[10px] font-[family-name:var(--font-mono)] text-[#f5a623]">
                ⚠ {elementCount.toLocaleString()} {isIFS ? "points" : "segments"} — export may be slow
              </div>
            </div>
          )}

          {/* Mode toggle (L-system only) */}
          {!isIFS && (
            <div className="flex gap-1 mb-3 p-0.5 bg-bg-tertiary/50 rounded-md">
              <button
                onClick={() => setMode("optimized")}
                className={`flex-1 text-[10px] font-[family-name:var(--font-mono)] py-1.5 rounded transition-all ${
                  mode === "optimized"
                    ? "bg-accent/15 text-accent"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                Optimized
              </button>
              <button
                onClick={() => setMode("expanded")}
                className={`flex-1 text-[10px] font-[family-name:var(--font-mono)] py-1.5 rounded transition-all ${
                  mode === "expanded"
                    ? "bg-accent/15 text-accent"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                Expanded
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-bg-tertiary/30 rounded px-2.5 py-2 border border-border-subtle">
              <div className="text-[9px] text-text-tertiary uppercase tracking-wider font-[family-name:var(--font-display)]">
                File Size
              </div>
              <div className="text-[13px] font-[family-name:var(--font-mono)] text-text-primary mt-0.5">
                {formatBytes(result.byteSize)}
              </div>
              {!isIFS && mode === "optimized" && savings > 0 && (
                <div className="text-[9px] font-[family-name:var(--font-mono)] text-accent mt-0.5">
                  −{savings}% vs expanded
                </div>
              )}
            </div>
            <div className="bg-bg-tertiary/30 rounded px-2.5 py-2 border border-border-subtle">
              <div className="text-[9px] text-text-tertiary uppercase tracking-wider font-[family-name:var(--font-display)]">
                Elements
              </div>
              <div className="text-[13px] font-[family-name:var(--font-mono)] text-text-primary mt-0.5">
                {result.pathCount.toLocaleString()}
              </div>
              <div className="text-[9px] font-[family-name:var(--font-mono)] text-text-tertiary mt-0.5">
                {isIFS
                  ? "circles"
                  : mode === "optimized"
                    ? hasDefs
                      ? "paths + defs/use"
                      : "paths (grouped)"
                    : "lines (separate)"}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-[family-name:var(--font-mono)] text-text-tertiary leading-relaxed">
              {isIFS
                ? "Point cloud as SVG circles. Import into Figma as vector."
                : mode === "optimized"
                  ? hasDefs
                    ? "Structural defs/use + chained paths. Smallest file."
                    : "Grouped paths with chained commands. Smaller file."
                  : "Individual line elements. Each line selectable in Figma."}
            </p>
            {genTimeMs > 0 && (
              <span
                className={`text-[9px] font-[family-name:var(--font-mono)] ml-2 flex-shrink-0 ${
                  genTimeMs > 500 ? "text-[#f5a623]" : "text-text-tertiary"
                }`}
              >
                {genTimeMs < 1 ? "<1" : Math.round(genTimeMs)}ms
              </span>
            )}
          </div>

          {/* SVG Preview toggle */}
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
            {showPreview ? "Hide Preview" : "Preview SVG"}
          </button>

          {showPreview && (
            <div className="mb-3">
              <SvgPreview svgString={result.svg} maxHeight={180} />
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
              Download SVG
            </button>

            <div className="flex gap-1.5">
              <button
                onClick={handleCopySvg}
                className={`flex-1 py-1.5 px-2 rounded-md text-[10px] font-[family-name:var(--font-mono)] border transition-all ${
                  copied === "svg"
                    ? "bg-accent/10 text-accent border-accent/25"
                    : "bg-bg-tertiary/30 text-text-secondary border-border-subtle hover:bg-bg-tertiary hover:text-text-primary"
                }`}
              >
                {copied === "svg" ? "✓ Copied!" : "Copy SVG"}
              </button>
              <button
                onClick={handleCopyDataUrl}
                className={`flex-1 py-1.5 px-2 rounded-md text-[10px] font-[family-name:var(--font-mono)] border transition-all ${
                  copied === "dataurl"
                    ? "bg-accent/10 text-accent border-accent/25"
                    : "bg-bg-tertiary/30 text-text-secondary border-border-subtle hover:bg-bg-tertiary hover:text-text-primary"
                }`}
              >
                {copied === "dataurl" ? "✓ Copied!" : "Copy Data URL"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
