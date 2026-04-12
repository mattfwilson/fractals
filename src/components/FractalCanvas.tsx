"use client";

import { useRef, useEffect, useMemo } from "react";
import { renderToCanvas } from "@/lib/renderer/canvas";
import { renderPointsToCanvas } from "@/lib/renderer/canvas-points";
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
}

export function FractalCanvas({ geometry, params }: FractalCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build depth color array based on color mode (L-system only)
  const depthColors = useMemo(() => {
    if (geometry.mode !== "lsystem") return undefined;
    if (params.colorMode === "gradient") {
      const maxDepth = geometry.segments.reduce((max, s) => Math.max(max, s.depth), 0);
      return buildDepthGradient(params.gradientStart, params.gradientEnd, maxDepth);
    }
    if (params.colorMode === "per-iteration" && params.iterationColors.length > 0) {
      return params.iterationColors;
    }
    return undefined;
  }, [params.colorMode, params.gradientStart, params.gradientEnd, params.iterationColors, geometry]);

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

    if (geometry.mode === "ifs") {
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
        colorByIteration: params.colorMode === "per-iteration",
      });
    }

    const elapsed = performance.now() - t0;
    if (elapsed > 50) {
      const count = geometry.mode === "ifs" ? geometry.points.length : geometry.segments.length;
      console.log(`[render] ${elapsed.toFixed(1)}ms for ${count} ${geometry.mode === "ifs" ? "points" : "segments"}`);
    }
  }, [geometry, params.strokeColor, params.strokeWidth, params.scale, params.rotation, depthColors, ifsColors, params.bgColor, params.bgTransparent, params.colorMode]);

  const isEmpty = geometry.mode === "ifs" ? geometry.points.length === 0 : geometry.segments.length === 0;

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center w-full h-full p-4"
    >
      <div className="relative">
        <div className="absolute -inset-px rounded-lg bg-gradient-to-br from-accent/10 via-transparent to-accent/5 pointer-events-none" />
        <canvas
          ref={canvasRef}
          className="rounded-lg bg-bg-primary border border-border-subtle"
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
