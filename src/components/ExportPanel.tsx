"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { generateSvg, type SvgExportResult } from "@/lib/export/svg-generator";
import { generateDotMatrixSvg, generateDotMatrixPointsSvg } from "@/lib/export/svg-dotmatrix";
import { generateAsciiSvg, generateAsciiPointsSvg } from "@/lib/export/svg-ascii";
import { generatePointsSvg, type SvgPointsResult } from "@/lib/export/svg-points";
import { generatePatternTileSvg } from "@/lib/export/svg-pattern";
import { formatBytes } from "@/lib/export/svg-optimizer";
import { SvgPreview } from "@/components/SvgPreview";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { buildDepthGradient } from "@/lib/engine/color";
import { IFS_PRESETS } from "@/lib/presets/ifs-presets";
import { buildSeamlessTile, replicateTile } from "@/lib/engine/pattern";
import { getBBox } from "@/lib/engine/geometry";
import type { Segment, FractalParams } from "@/lib/engine/types";
import type { IFSPoint } from "@/lib/engine/ifs-types";

type GeometryResult =
  | { mode: "lsystem"; segments: Segment[] }
  | { mode: "ifs"; points: IFSPoint[] };

interface ExportPanelProps {
  geometry: GeometryResult;
  params: FractalParams;
  /** Pre-pattern base geometry — required when params.pattern is true
   *  so the exporter can derive a single clean tile. */
  baseGeometry?: GeometryResult;
  viewMode?: "fractal" | "dotmatrix" | "ascii";
  dotGridSize?: number;
  dotShape?: "circle" | "square";
  dotMaxFill?: number;
  dotUniform?: boolean;
}

type ExportMode = "optimized" | "expanded";

const HIGH_SEGMENT_THRESHOLD = 10_000;

export function ExportPanel({ geometry, params, baseGeometry, viewMode = "fractal", dotGridSize = 40, dotShape = "circle", dotMaxFill = 0.88, dotUniform = false }: ExportPanelProps) {
  const isDotMatrix = viewMode === "dotmatrix";
  const isAscii = viewMode === "ascii";
  const isAlternate = isDotMatrix || isAscii;
  const patternMode = !isAlternate && params.pattern && !params.tiling && geometry.mode === "lsystem";
  const [patternExport, setPatternExport] = useState<"tile" | "grid">("tile");
  const [mode, setMode] = useState<ExportMode>("optimized");
  const [copied, setCopied] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const isIFS = geometry.mode === "ifs";
  const elementCount = isIFS ? geometry.points.length : geometry.segments.length;
  const isEmpty = elementCount === 0;
  const isHighCount = elementCount > HIGH_SEGMENT_THRESHOLD;

  // Build depth colors and determine the color key, matching FractalCanvas logic.
  // Branching fractals (maxDepth > 0): color by seg.depth (trunk→tips).
  // Flat fractals: color by seg.iteration (positional bands across the path).
  const { depthColors, colorByIteration } = useMemo(() => {
    if (isIFS) return { depthColors: undefined as string[] | undefined, colorByIteration: false };

    const segs = patternMode && baseGeometry?.mode === "lsystem"
      ? baseGeometry.segments
      : geometry.mode === "lsystem" ? geometry.segments : [];
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
  }, [isIFS, params.colorMode, params.gradientStart, params.gradientEnd, params.iterationColors, params.iterations, geometry, patternMode, baseGeometry]);

  // Get IFS colors
  const ifsColors = useMemo(() => {
    if (!isIFS) return undefined;
    return IFS_PRESETS[params.ifsPreset]?.colors;
  }, [isIFS, params.ifsPreset]);

  // Dot matrix SVG result — always computed so it's ready regardless of when
  // isDotMatrix becomes true. The exportSvg selector below picks which to use.
  const dotMatrixResult = useMemo(() => {
    if (isEmpty) return null;
    const bg = params.bgTransparent ? undefined : params.bgColor;
    const baseOpts = {
      width: params.canvasWidth,
      height: params.canvasHeight,
      gridSize: dotGridSize,
      dotShape,
      strokeColor: params.strokeColor,
      scale: params.scale,
      rotation: params.rotation,
      background: bg,
      depthColors,
      colorByIteration,
      maxFill: dotMaxFill,
      uniform: dotUniform,
    };
    if (isIFS) {
      return generateDotMatrixPointsSvg(
        (geometry as { mode: "ifs"; points: IFSPoint[] }).points,
        { ...baseOpts, transformColors: ifsColors }
      );
    }
    return generateDotMatrixSvg(
      (geometry as { mode: "lsystem"; segments: Segment[] }).segments,
      baseOpts
    );
  }, [isEmpty, geometry, params, dotGridSize, dotShape, dotMaxFill, dotUniform, depthColors, colorByIteration, ifsColors, isIFS]);

  // ASCII SVG result — always computed so it's ready when toggled on.
  const asciiResult = useMemo(() => {
    if (isEmpty) return null;
    const bg = params.bgTransparent ? undefined : params.bgColor;
    const baseOpts = {
      width: params.canvasWidth,
      height: params.canvasHeight,
      gridSize: dotGridSize,
      strokeColor: params.strokeColor,
      scale: params.scale,
      rotation: params.rotation,
      background: bg,
      depthColors,
      colorByIteration,
      fontScale: dotMaxFill,
      uniform: dotUniform,
      precision: 1,
    };
    if (isIFS) {
      return generateAsciiPointsSvg(
        (geometry as { mode: "ifs"; points: IFSPoint[] }).points,
        { ...baseOpts, transformColors: ifsColors }
      );
    }
    return generateAsciiSvg(
      (geometry as { mode: "lsystem"; segments: Segment[] }).segments,
      baseOpts
    );
  }, [isEmpty, geometry, params, dotGridSize, dotMaxFill, dotUniform, depthColors, colorByIteration, ifsColors, isIFS]);

  // Generate SVG result
  const result = useMemo(() => {
    if (patternMode && baseGeometry?.mode === "lsystem") {
      const segs = baseGeometry.segments;
      if (segs.length === 0) {
        const empty = `<svg xmlns="http://www.w3.org/2000/svg" width="${params.canvasWidth}" height="${params.canvasHeight}" viewBox="0 0 ${params.canvasWidth} ${params.canvasHeight}"></svg>`;
        return { svg: empty, byteSize: empty.length, elementCount: 0, pathCount: 0 };
      }
      const bbox = getBBox(segs);
      const longSide = Math.max(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY) || 1;
      const tileSizeUnits = longSide * params.patternTileSize;

      const { tileSegments, tile } = buildSeamlessTile(segs, {
        tileSize: tileSizeUnits,
        contentScale: params.patternContentScale,
        offsetX: params.patternOffsetX,
        offsetY: params.patternOffsetY,
      });

      // Use the smaller of canvasWidth/Height as the tile output size.
      const tilePx = Math.min(params.canvasWidth, params.canvasHeight);

      if (patternExport === "tile") {
        const out = generatePatternTileSvg(tileSegments, tile, {
          size: tilePx,
          strokeColor: params.strokeColor,
          strokeWidth: params.strokeWidth,
          precision: 2,
          background: params.bgTransparent ? undefined : params.bgColor,
          depthColors,
          colorByIteration,
        });
        return {
          svg: out.svg,
          byteSize: out.byteSize,
          elementCount: out.segmentCount,
          pathCount: out.segmentCount,
        };
      }

      // Grid export: replicate tile into a 4x4 patch so it's a drop-in Figma fill.
      const gridCols = params.patternPreviewCols;
      const gridRows = params.patternPreviewRows;
      const replicated = replicateTile(tileSegments, tile, gridCols, gridRows);
      return generateSvg(replicated, {
        width: tilePx * gridCols,
        height: tilePx * gridRows,
        strokeColor: params.strokeColor,
        strokeWidth: params.strokeWidth,
        scale: 1,
        rotation: 0,
        optimized: true,
        precision: 2,
        depthColors,
        colorByIteration,
        background: params.bgTransparent ? undefined : params.bgColor,
      });
    }
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
      colorByIteration,
      background: params.bgTransparent ? undefined : params.bgColor,
    });
  }, [geometry, params, mode, depthColors, colorByIteration, ifsColors, isIFS, patternMode, baseGeometry, patternExport]);

  // Track generation time in an effect (performance.now is impure, can't live in useMemo)
  const [genTimeMs, setGenTimeMs] = useState(0);
  useEffect(() => {
    if (patternMode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on mode change
      setGenTimeMs(0);
      return;
    }
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
        colorByIteration,
        background: params.bgTransparent ? undefined : params.bgColor,
      });
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- diagnostic timing measurement for UX feedback
    setGenTimeMs(performance.now() - t0);
  }, [geometry, params, mode, depthColors, colorByIteration, ifsColors, isIFS, patternMode]);

  // Compute alt result for L-system comparison
  const altResult: SvgExportResult | null = useMemo(() => {
    if (isIFS) return null;
    if (patternMode) return null;
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
      colorByIteration,
      background: params.bgTransparent ? undefined : params.bgColor,
    });
  }, [geometry, params, mode, depthColors, colorByIteration, isIFS, patternMode]);

  // When in an alternate mode, use that mode's SVG for all export actions
  const exportSvg = isAscii && asciiResult
    ? asciiResult.svg
    : isDotMatrix && dotMatrixResult
      ? dotMatrixResult.svg
      : result.svg;
  const exportByteSize = isAscii && asciiResult
    ? asciiResult.byteSize
    : isDotMatrix && dotMatrixResult
      ? dotMatrixResult.byteSize
      : result.byteSize;
  const exportElementCount = isAscii && asciiResult
    ? asciiResult.glyphCount
    : isDotMatrix && dotMatrixResult
      ? dotMatrixResult.dotCount
      : result.pathCount;

  const handleDownload = useCallback(() => {
    const blob = new Blob([exportSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const base = patternMode
      ? `pattern-${params.preset}-${patternExport}`
      : isIFS
        ? `ifs-${params.ifsPreset}`
        : `fractal-${params.preset}`;
    const suffix = isAscii
      ? `-ascii-${dotGridSize}`
      : isDotMatrix
        ? `-dots-${dotGridSize}`
        : "";
    a.download = `${base}${suffix}-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportSvg, params.preset, params.ifsPreset, isIFS, patternMode, patternExport, isDotMatrix, isAscii, dotGridSize]);

  const handleCopySvg = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(exportSvg);
      setCopied("svg");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      console.warn("[export] Clipboard write failed");
    }
  }, [exportSvg]);

  const handleCopyDataUrl = useCallback(async () => {
    try {
      const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(exportSvg)))}`;
      await navigator.clipboard.writeText(dataUrl);
      setCopied("dataurl");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      console.warn("[export] Clipboard write failed");
    }
  }, [exportSvg]);

  const savings =
    !isAlternate && !isIFS && mode === "optimized" && altResult
      ? Math.round((1 - result.byteSize / Math.max(altResult.byteSize, 1)) * 100)
      : 0;

  const hasDefs = !isAlternate && result.svg.includes("<defs>");

  return (
    <CollapsibleSection title="Export SVG" persistKey="export">
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

          {/* Pattern export toggle: single tile vs pre-tiled grid */}
          {patternMode && (
            <div className="flex gap-1 mb-3 p-0.5 bg-bg-tertiary/50 rounded-md">
              <button
                onClick={() => setPatternExport("tile")}
                className={`flex-1 text-[10px] font-[family-name:var(--font-mono)] py-1.5 rounded transition-all ${
                  patternExport === "tile"
                    ? "bg-accent/15 text-accent"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
                title="One seamless tile. Array it inside Figma."
              >
                Single Tile
              </button>
              <button
                onClick={() => setPatternExport("grid")}
                className={`flex-1 text-[10px] font-[family-name:var(--font-mono)] py-1.5 rounded transition-all ${
                  patternExport === "grid"
                    ? "bg-accent/15 text-accent"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
                title={`Pre-tiled ${params.patternPreviewCols}×${params.patternPreviewRows} patch for direct drop into Figma.`}
              >
                {params.patternPreviewCols}×{params.patternPreviewRows} Patch
              </button>
            </div>
          )}

          {/* Mode toggle (L-system non-pattern, normal-fractal-view only) */}
          {!isAlternate && !isIFS && !patternMode && (
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

          {/* Dot matrix mode badge */}
          {isDotMatrix && (
            <div className="mb-3 px-2.5 py-2 rounded bg-accent/5 border border-accent/15">
              <div className="text-[10px] font-[family-name:var(--font-mono)] text-accent">
                Dot matrix — {dotGridSize}×{dotGridSize} grid · {dotShape}s
              </div>
            </div>
          )}

          {/* ASCII mode badge */}
          {isAscii && (
            <div className="mb-3 px-2.5 py-2 rounded bg-accent/5 border border-accent/15">
              <div className="text-[10px] font-[family-name:var(--font-mono)] text-accent">
                ASCII — {dotGridSize}×{dotGridSize} grid · monospace text
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-bg-tertiary/30 rounded px-2.5 py-2 border border-border-subtle">
              <div className="text-[9px] text-text-tertiary uppercase tracking-wider font-[family-name:var(--font-display)]">
                File Size
              </div>
              <div className="text-[13px] font-[family-name:var(--font-mono)] text-text-primary mt-0.5">
                {formatBytes(exportByteSize)}
              </div>
              {savings > 0 && (
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
                {exportElementCount.toLocaleString()}
              </div>
              <div className="text-[9px] font-[family-name:var(--font-mono)] text-text-tertiary mt-0.5">
                {patternMode
                  ? patternExport === "tile"
                    ? "tile segments"
                    : "patch segments"
                  : isAscii
                    ? "glyphs"
                    : isDotMatrix
                      ? dotShape === "square" ? "squares" : "circles"
                      : isIFS
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
              {isAscii
                ? "Monospace ASCII art. Density picks the glyph. Drop into Figma as text."
                : isDotMatrix
                ? `Density ${dotShape}s. Size encodes complexity. Drop into Figma.`
                : patternMode
                  ? patternExport === "tile"
                    ? "One seamless tile. Drop into Figma, duplicate to tile."
                    : `Pre-tiled ${params.patternPreviewCols}×${params.patternPreviewRows} patch. Drop in and use as-is.`
                  : isIFS
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
              <SvgPreview svgString={exportSvg} maxHeight={180} />
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
    </CollapsibleSection>
  );
}
