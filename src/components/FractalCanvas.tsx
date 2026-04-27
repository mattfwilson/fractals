"use client";

import { useRef, useEffect, useMemo } from "react";
import { renderToCanvas } from "@/lib/renderer/canvas";
import { renderPointsToCanvas } from "@/lib/renderer/canvas-points";
import { renderDotMatrixToCanvas, renderDotMatrixPointsToCanvas } from "@/lib/renderer/canvas-dotmatrix";
import { renderAsciiToCanvas, renderAsciiPointsToCanvas } from "@/lib/renderer/canvas-ascii";
import { buildDepthGradient } from "@/lib/engine/color";
import { IFS_PRESETS } from "@/lib/presets/ifs-presets";
import type { Segment, FractalParams } from "@/lib/engine/types";
import type { IFSPoint } from "@/lib/engine/ifs-types";

type GeometryResult =
  | { mode: "lsystem"; segments: Segment[] }
  | { mode: "ifs"; points: IFSPoint[] };

interface FractalCanvasProps {
  geometry: GeometryResult;
  params: FractalParams;
  /** Optional overlay rects drawn in geometry space (e.g. pattern tile bounds). */
  overlayRects?: Array<{ x: number; y: number; w: number; h: number }>;
  viewMode?: "fractal" | "dotmatrix" | "ascii";
  dotGridSize?: number;
  dotShape?: "circle" | "square";
  dotMaxFill?: number;
  dotUniform?: boolean;
}

export function FractalCanvas({ geometry, params, overlayRects, viewMode = "fractal", dotGridSize = 40, dotShape = "circle", dotMaxFill = 0.88, dotUniform = false }: FractalCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build depth color array and determine the color key for the current mode.
  // Branching fractals (maxDepth > 0) use seg.depth — structural, trunk→tips.
  // Flat fractals (maxDepth === 0, e.g. Koch) use seg.iteration — positional bands
  // that span the whole drawing path so the gradient is visible.
  const { depthColors, colorByIteration } = useMemo(() => {
    if (geometry.mode !== "lsystem") {
      return { depthColors: undefined as string[] | undefined, colorByIteration: false };
    }
    const maxDepth = geometry.segments.reduce((max, s) => Math.max(max, s.depth), 0);
    const branching = maxDepth > 0;

    if (params.colorMode === "gradient") {
      return branching
        ? { depthColors: buildDepthGradient(params.gradientStart, params.gradientEnd, maxDepth), colorByIteration: false }
        : { depthColors: buildDepthGradient(params.gradientStart, params.gradientEnd, params.iterations), colorByIteration: true };
    }
    if (params.colorMode === "per-iteration" && params.iterationColors.length > 0) {
      // Branching: color by depth so trunk/tips get distinct swatches.
      // Flat: color by positional band so all swatches appear across the path.
      return { depthColors: params.iterationColors, colorByIteration: !branching };
    }
    return { depthColors: undefined, colorByIteration: false };
  }, [params.colorMode, params.gradientStart, params.gradientEnd, params.iterationColors, params.iterations, geometry]);

  // Get IFS transform colors
  const ifsColors = useMemo(() => {
    if (geometry.mode !== "ifs") return undefined;
    const preset = IFS_PRESETS[params.ifsPreset];
    return preset?.colors;
  }, [geometry.mode, params.ifsPreset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Size canvas to container
    const rect = container.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height) - 32;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    // Draw background
    if (!params.bgTransparent) {
      ctx.fillStyle = params.bgColor;
      ctx.fillRect(0, 0, size * dpr, size * dpr);
    }

    const t0 = performance.now();

    if (viewMode === "ascii") {
      if (geometry.mode === "ifs") {
        renderAsciiPointsToCanvas(ctx, geometry.points, {
          strokeColor: params.strokeColor,
          scale: params.scale,
          rotation: params.rotation,
          canvasWidth: size,
          canvasHeight: size,
          gridSize: dotGridSize,
          transformColors: ifsColors,
          fontScale: dotMaxFill,
          uniform: dotUniform,
        });
      } else {
        renderAsciiToCanvas(ctx, geometry.segments, {
          strokeColor: params.strokeColor,
          scale: params.scale,
          rotation: params.rotation,
          canvasWidth: size,
          canvasHeight: size,
          gridSize: dotGridSize,
          depthColors,
          colorByIteration,
          fontScale: dotMaxFill,
          uniform: dotUniform,
        });
      }
    } else if (viewMode === "dotmatrix") {
      if (geometry.mode === "ifs") {
        renderDotMatrixPointsToCanvas(ctx, geometry.points, {
          strokeColor: params.strokeColor,
          scale: params.scale,
          rotation: params.rotation,
          canvasWidth: size,
          canvasHeight: size,
          gridSize: dotGridSize,
          transformColors: ifsColors,
          dotShape,
          maxFill: dotMaxFill,
          uniform: dotUniform,
        });
      } else {
        renderDotMatrixToCanvas(ctx, geometry.segments, {
          strokeColor: params.strokeColor,
          scale: params.scale,
          rotation: params.rotation,
          canvasWidth: size,
          canvasHeight: size,
          gridSize: dotGridSize,
          depthColors,
          colorByIteration,
          dotShape,
          maxFill: dotMaxFill,
          uniform: dotUniform,
        });
      }
    } else if (geometry.mode === "ifs") {
      renderPointsToCanvas(ctx, geometry.points, {
        strokeColor: params.strokeColor,
        scale: params.scale,
        rotation: params.rotation,
        canvasWidth: size,
        canvasHeight: size,
        transformColors: ifsColors,
      });
    } else {
      renderToCanvas(ctx, geometry.segments, {
        strokeColor: params.strokeColor,
        strokeWidth: params.strokeWidth,
        scale: params.scale,
        rotation: params.rotation,
        canvasWidth: size,
        canvasHeight: size,
        depthColors,
        colorByIteration,
        overlayRects,
      });
    }

    const elapsed = performance.now() - t0;
    if (elapsed > 50) {
      const count = geometry.mode === "ifs" ? geometry.points.length : geometry.segments.length;
      console.log(`[render] ${elapsed.toFixed(1)}ms for ${count} ${geometry.mode === "ifs" ? "points" : "segments"}`);
    }
  }, [geometry, params.strokeColor, params.strokeWidth, params.scale, params.rotation, depthColors, colorByIteration, ifsColors, params.bgColor, params.bgTransparent, params.colorMode, overlayRects, viewMode, dotGridSize, dotShape, dotMaxFill, dotUniform]);

  const isEmpty = geometry.mode === "ifs" ? geometry.points.length === 0 : geometry.segments.length === 0;

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center w-full h-full p-4"
    >
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="rounded-lg"
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-[family-name:var(--font-mono)] text-text-tertiary">
              Select a preset to begin
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
