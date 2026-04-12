import type { Segment } from "@/lib/engine/types";
import { getBBox } from "@/lib/engine/geometry";

interface RenderOptions {
  strokeColor: string;
  strokeWidth: number;
  scale: number;
  rotation: number;
  canvasWidth: number;
  canvasHeight: number;
  /** Optional per-depth color array. Index = depth, value = hex color. */
  depthColors?: string[];
  /** When true, color by segment.iteration instead of segment.depth */
  colorByIteration?: boolean;
}

/**
 * Render fractal segments to a Canvas 2D context.
 * Auto-fits the geometry to fill the canvas with padding.
 * Supports per-depth coloring when depthColors is provided.
 */
export function renderToCanvas(
  ctx: CanvasRenderingContext2D,
  segments: Segment[],
  options: RenderOptions
): void {
  const { strokeColor, strokeWidth, scale, rotation, canvasWidth, canvasHeight, depthColors, colorByIteration } = options;
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  // Clear
  ctx.clearRect(0, 0, canvasWidth * dpr, canvasHeight * dpr);

  if (segments.length === 0) return;

  // Calculate bounding box
  const bbox = getBBox(segments);
  const geoWidth = bbox.maxX - bbox.minX || 1;
  const geoHeight = bbox.maxY - bbox.minY || 1;

  // Calculate scale to fit with padding
  const padding = 40 * dpr;
  const availW = canvasWidth * dpr - padding * 2;
  const availH = canvasHeight * dpr - padding * 2;
  const fitScale = Math.min(availW / geoWidth, availH / geoHeight) * scale;

  // Center offset
  const centerX = (canvasWidth * dpr) / 2;
  const centerY = (canvasHeight * dpr) / 2;
  const geoCenterX = (bbox.minX + bbox.maxX) / 2;
  const geoCenterY = (bbox.minY + bbox.maxY) / 2;

  ctx.save();

  // Transform: translate to center, rotate, then draw
  ctx.translate(centerX, centerY);
  ctx.rotate((rotation * Math.PI) / 180);

  ctx.lineWidth = strokeWidth * dpr;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (depthColors && depthColors.length > 0) {
    // Per-depth or per-iteration coloring: group segments for efficient batching
    const colorGroups = new Map<number, Segment[]>();
    for (const seg of segments) {
      const key = colorByIteration ? (seg.iteration ?? 0) : seg.depth;
      const arr = colorGroups.get(key);
      if (arr) arr.push(seg);
      else colorGroups.set(key, [seg]);
    }

    for (const [level, segs] of colorGroups) {
      const color = depthColors[Math.min(level, depthColors.length - 1)];
      ctx.strokeStyle = color;
      ctx.beginPath();
      for (const seg of segs) {
        const x1 = (seg.x1 - geoCenterX) * fitScale;
        const y1 = (seg.y1 - geoCenterY) * fitScale;
        const x2 = (seg.x2 - geoCenterX) * fitScale;
        const y2 = (seg.y2 - geoCenterY) * fitScale;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.stroke();
    }
  } else {
    // Single color mode
    ctx.strokeStyle = strokeColor;
    ctx.beginPath();
    for (const seg of segments) {
      const x1 = (seg.x1 - geoCenterX) * fitScale;
      const y1 = (seg.y1 - geoCenterY) * fitScale;
      const x2 = (seg.x2 - geoCenterX) * fitScale;
      const y2 = (seg.y2 - geoCenterY) * fitScale;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();
  }

  ctx.restore();
}
