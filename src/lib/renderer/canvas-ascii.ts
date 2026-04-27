import type { Segment } from "@/lib/engine/types";
import type { IFSPoint } from "@/lib/engine/ifs-types";
import { getBBox } from "@/lib/engine/geometry";
import { getIFSBBox } from "@/lib/engine/ifs";

/**
 * ASCII density ramp — light to dense.
 * Each non-empty cell maps to one of these characters by density.
 */
export const ASCII_RAMP = [".", ":", "-", "=", "+", "*", "#", "%", "@"];

export interface AsciiOptions {
  strokeColor: string;
  scale: number;
  rotation: number;
  canvasWidth: number;
  canvasHeight: number;
  /** Number of cells (chars) in each dimension. */
  gridSize: number;
  depthColors?: string[];
  colorByIteration?: boolean;
  transformColors?: string[];
  /** Font size as fraction of cell height. Default 1.0 (fills the cell). */
  fontScale?: number;
  /** When true, every non-empty cell uses the densest ramp character. */
  uniform?: boolean;
}

// ---------------------------------------------------------------------------
// Coordinate / grid helpers (mirror canvas-dotmatrix.ts)
// ---------------------------------------------------------------------------

interface Transform {
  fitScale: number;
  centerX: number;
  centerY: number;
  geoCenterX: number;
  geoCenterY: number;
  cosR: number;
  sinR: number;
}

function makeTransform(
  geoMinX: number, geoMinY: number, geoMaxX: number, geoMaxY: number,
  canvasWidth: number, canvasHeight: number, scale: number, rotation: number, dpr: number
): Transform {
  const geoWidth = geoMaxX - geoMinX || 1;
  const geoHeight = geoMaxY - geoMinY || 1;
  const padding = 40 * dpr;
  const availW = canvasWidth * dpr - padding * 2;
  const availH = canvasHeight * dpr - padding * 2;
  const fitScale = Math.min(availW / geoWidth, availH / geoHeight) * scale;
  const rad = (rotation * Math.PI) / 180;
  return {
    fitScale,
    centerX: (canvasWidth * dpr) / 2,
    centerY: (canvasHeight * dpr) / 2,
    geoCenterX: (geoMinX + geoMaxX) / 2,
    geoCenterY: (geoMinY + geoMaxY) / 2,
    cosR: Math.cos(rad),
    sinR: Math.sin(rad),
  };
}

function toPixel(gx: number, gy: number, t: Transform, flipY = false): [number, number] {
  const lx = (gx - t.geoCenterX) * t.fitScale;
  const ly = flipY
    ? -(gy - t.geoCenterY) * t.fitScale
    : (gy - t.geoCenterY) * t.fitScale;
  return [
    lx * t.cosR - ly * t.sinR + t.centerX,
    lx * t.sinR + ly * t.cosR + t.centerY,
  ];
}

interface Grid {
  density: Float32Array;
  depthSum: Float32Array;
  cols: number;
  rows: number;
  cellW: number;
  cellH: number;
}

function makeGrid(gridSize: number, canvasWidth: number, canvasHeight: number, dpr: number): Grid {
  return {
    density: new Float32Array(gridSize * gridSize),
    depthSum: new Float32Array(gridSize * gridSize),
    cols: gridSize,
    rows: gridSize,
    cellW: (canvasWidth * dpr) / gridSize,
    cellH: (canvasHeight * dpr) / gridSize,
  };
}

function incrementCell(grid: Grid, px: number, py: number, depthKey: number): void {
  const col = Math.floor(px / grid.cellW);
  const row = Math.floor(py / grid.cellH);
  if (col < 0 || col >= grid.cols || row < 0 || row >= grid.rows) return;
  const idx = row * grid.cols + col;
  grid.density[idx] += 1;
  grid.depthSum[idx] += depthKey;
}

function rasterizeSegment(
  grid: Grid,
  x1: number, y1: number, x2: number, y2: number,
  depthKey: number
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const segLen = Math.sqrt(dx * dx + dy * dy);
  const minCellSide = Math.min(grid.cellW, grid.cellH);
  const numSamples = Math.max(2, Math.ceil(segLen / (minCellSide * 0.5)));
  const step = 1 / (numSamples - 1);
  for (let i = 0; i < numSamples; i++) {
    const t = i * step;
    incrementCell(grid, x1 + dx * t, y1 + dy * t, depthKey);
  }
}

function resolveColor(avgDepthKey: number, strokeColor: string, colors?: string[]): string {
  if (!colors || colors.length === 0) return strokeColor;
  return colors[Math.min(Math.max(0, Math.round(avgDepthKey)), colors.length - 1)];
}

/** Map normalized density (0..1) → ramp character. */
export function densityToChar(normalized: number, uniform: boolean): string {
  if (uniform) return ASCII_RAMP[ASCII_RAMP.length - 1];
  const idx = Math.min(
    ASCII_RAMP.length - 1,
    Math.max(0, Math.floor(normalized * ASCII_RAMP.length))
  );
  return ASCII_RAMP[idx];
}

// ---------------------------------------------------------------------------
// Public renderers
// ---------------------------------------------------------------------------

export function renderAsciiToCanvas(
  ctx: CanvasRenderingContext2D,
  segments: Segment[],
  options: AsciiOptions
): void {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  ctx.clearRect(0, 0, options.canvasWidth * dpr, options.canvasHeight * dpr);
  if (segments.length === 0) return;

  const bbox = getBBox(segments);
  const t = makeTransform(
    bbox.minX, bbox.minY, bbox.maxX, bbox.maxY,
    options.canvasWidth, options.canvasHeight, options.scale, options.rotation, dpr
  );
  const grid = makeGrid(options.gridSize, options.canvasWidth, options.canvasHeight, dpr);

  for (const seg of segments) {
    const depthKey = options.colorByIteration ? (seg.iteration ?? 0) : seg.depth;
    const [x1, y1] = toPixel(seg.x1, seg.y1, t);
    const [x2, y2] = toPixel(seg.x2, seg.y2, t);
    rasterizeSegment(grid, x1, y1, x2, y2, depthKey);
  }

  drawAscii(ctx, grid, options.strokeColor, options.depthColors, options.fontScale ?? 1.0, options.uniform ?? false);
}

export function renderAsciiPointsToCanvas(
  ctx: CanvasRenderingContext2D,
  points: IFSPoint[],
  options: AsciiOptions
): void {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  ctx.clearRect(0, 0, options.canvasWidth * dpr, options.canvasHeight * dpr);
  if (points.length === 0) return;

  const bbox = getIFSBBox(points);
  const t = makeTransform(
    bbox.minX, bbox.minY, bbox.maxX, bbox.maxY,
    options.canvasWidth, options.canvasHeight, options.scale, options.rotation, dpr
  );
  const grid = makeGrid(options.gridSize, options.canvasWidth, options.canvasHeight, dpr);

  for (const p of points) {
    const [px, py] = toPixel(p.x, p.y, t, true);
    incrementCell(grid, px, py, p.transformIndex);
  }

  drawAscii(ctx, grid, options.strokeColor, options.transformColors, options.fontScale ?? 1.0, options.uniform ?? false);
}

// ---------------------------------------------------------------------------
// Char drawing
// ---------------------------------------------------------------------------

function drawAscii(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  strokeColor: string,
  colors: string[] | undefined,
  fontScale: number,
  uniform: boolean
): void {
  let maxDensity = 0;
  for (let i = 0; i < grid.density.length; i++) {
    if (grid.density[i] > maxDensity) maxDensity = grid.density[i];
  }
  if (maxDensity === 0) return;

  const sqrtMax = Math.sqrt(maxDensity);
  const fontPx = Math.max(1, Math.min(grid.cellW, grid.cellH) * fontScale);

  ctx.font = `${fontPx}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Group by color → list of [char, cx, cy]
  const colorBuckets = new Map<string, Array<[string, number, number]>>();

  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const idx = row * grid.cols + col;
      const d = grid.density[idx];
      if (d === 0) continue;

      const normalized = Math.sqrt(d) / sqrtMax;
      const ch = densityToChar(normalized, uniform);
      const cx = (col + 0.5) * grid.cellW;
      const cy = (row + 0.5) * grid.cellH;
      const avgDepthKey = grid.depthSum[idx] / d;
      const color = resolveColor(avgDepthKey, strokeColor, colors);

      const bucket = colorBuckets.get(color);
      if (bucket) bucket.push([ch, cx, cy]);
      else colorBuckets.set(color, [[ch, cx, cy]]);
    }
  }

  for (const [color, glyphs] of colorBuckets) {
    ctx.fillStyle = color;
    for (const [ch, cx, cy] of glyphs) {
      ctx.fillText(ch, cx, cy);
    }
  }
}
