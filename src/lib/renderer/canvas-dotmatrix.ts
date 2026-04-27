import type { Segment } from "@/lib/engine/types";
import type { IFSPoint } from "@/lib/engine/ifs-types";
import { getBBox } from "@/lib/engine/geometry";
import { getIFSBBox } from "@/lib/engine/ifs";

export interface DotMatrixOptions {
  strokeColor: string;
  scale: number;
  rotation: number;
  canvasWidth: number;
  canvasHeight: number;
  /** Number of cells in each dimension. Default: 40 */
  gridSize: number;
  depthColors?: string[];
  colorByIteration?: boolean;
  transformColors?: string[];
  /** Max dot radius as a fraction of half the cell size. Default: 0.88 */
  maxFill?: number;
  /** Min dot radius as a fraction of half the cell size for non-empty cells. Default: 0.08 */
  minFill?: number;
  /** Shape of each cell marker. Default: 'circle' */
  dotShape?: "circle" | "square";
  /** When true, all non-empty cells get the same size (maxFill) regardless of density. Default: false */
  uniform?: boolean;
}

// ---------------------------------------------------------------------------
// Coordinate helpers
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
  const centerX = (canvasWidth * dpr) / 2;
  const centerY = (canvasHeight * dpr) / 2;
  const geoCenterX = (geoMinX + geoMaxX) / 2;
  const geoCenterY = (geoMinY + geoMaxY) / 2;
  const rad = (rotation * Math.PI) / 180;
  return {
    fitScale,
    centerX,
    centerY,
    geoCenterX,
    geoCenterY,
    cosR: Math.cos(rad),
    sinR: Math.sin(rad),
  };
}

/** Map a geometry point to canvas pixel coordinates (rotation applied). */
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

// ---------------------------------------------------------------------------
// Density grid
// ---------------------------------------------------------------------------

interface Grid {
  density: Float32Array;
  depthSum: Float32Array;
  cols: number;
  rows: number;
  cellW: number;
  cellH: number;
  totalW: number;
  totalH: number;
}

function makeGrid(gridSize: number, canvasWidth: number, canvasHeight: number, dpr: number): Grid {
  const totalW = canvasWidth * dpr;
  const totalH = canvasHeight * dpr;
  const cols = gridSize;
  const rows = gridSize;
  const cellW = totalW / cols;
  const cellH = totalH / rows;
  return {
    density: new Float32Array(cols * rows),
    depthSum: new Float32Array(cols * rows),
    cols,
    rows,
    cellW,
    cellH,
    totalW,
    totalH,
  };
}

function incrementCell(grid: Grid, px: number, py: number, depthKey: number, weight = 1): void {
  const col = Math.floor(px / grid.cellW);
  const row = Math.floor(py / grid.cellH);
  if (col < 0 || col >= grid.cols || row < 0 || row >= grid.rows) return;
  const idx = row * grid.cols + col;
  grid.density[idx] += weight;
  grid.depthSum[idx] += depthKey;
}

/**
 * Rasterize an L-system segment into the density grid.
 * Samples along the segment at sub-cell intervals to avoid missing cells.
 */
function rasterizeSegment(
  grid: Grid,
  x1: number, y1: number,
  x2: number, y2: number,
  depthKey: number
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const segLen = Math.sqrt(dx * dx + dy * dy);
  // Sample every half a cell-width to ensure coverage
  const minCellSide = Math.min(grid.cellW, grid.cellH);
  const numSamples = Math.max(2, Math.ceil(segLen / (minCellSide * 0.5)));
  const step = 1 / (numSamples - 1);

  for (let i = 0; i < numSamples; i++) {
    const t = i * step;
    incrementCell(grid, x1 + dx * t, y1 + dy * t, depthKey);
  }
}

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

function resolveColor(
  avgDepthKey: number,
  strokeColor: string,
  depthColors?: string[]
): string {
  if (!depthColors || depthColors.length === 0) return strokeColor;
  const idx = Math.min(Math.round(avgDepthKey), depthColors.length - 1);
  return depthColors[Math.max(0, idx)];
}

// ---------------------------------------------------------------------------
// Public renderers
// ---------------------------------------------------------------------------

/**
 * Render L-system segment geometry as a dot matrix.
 * Dot radius scales with local segment density (sqrt-normalized).
 */
export function renderDotMatrixToCanvas(
  ctx: CanvasRenderingContext2D,
  segments: Segment[],
  options: DotMatrixOptions
): void {
  const {
    strokeColor,
    scale,
    rotation,
    canvasWidth,
    canvasHeight,
    gridSize,
    depthColors,
    colorByIteration = false,
    maxFill = 0.88,
    minFill = 0.08,
  } = options;

  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  ctx.clearRect(0, 0, canvasWidth * dpr, canvasHeight * dpr);
  if (segments.length === 0) return;

  const bbox = getBBox(segments);
  const t = makeTransform(
    bbox.minX, bbox.minY, bbox.maxX, bbox.maxY,
    canvasWidth, canvasHeight, scale, rotation, dpr
  );
  const grid = makeGrid(gridSize, canvasWidth, canvasHeight, dpr);

  for (const seg of segments) {
    const depthKey = colorByIteration ? (seg.iteration ?? 0) : seg.depth;
    const [x1, y1] = toPixel(seg.x1, seg.y1, t);
    const [x2, y2] = toPixel(seg.x2, seg.y2, t);
    rasterizeSegment(grid, x1, y1, x2, y2, depthKey);
  }

  drawDots(ctx, grid, strokeColor, depthColors, maxFill, minFill, options.dotShape, options.uniform);
}

/**
 * Render IFS point cloud as a dot matrix.
 * Each point increments its grid cell; dot radius scales with density.
 */
export function renderDotMatrixPointsToCanvas(
  ctx: CanvasRenderingContext2D,
  points: IFSPoint[],
  options: DotMatrixOptions
): void {
  const {
    strokeColor,
    scale,
    rotation,
    canvasWidth,
    canvasHeight,
    gridSize,
    transformColors,
    maxFill = 0.88,
    minFill = 0.08,
  } = options;

  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  ctx.clearRect(0, 0, canvasWidth * dpr, canvasHeight * dpr);
  if (points.length === 0) return;

  const bbox = getIFSBBox(points);
  const t = makeTransform(
    bbox.minX, bbox.minY, bbox.maxX, bbox.maxY,
    canvasWidth, canvasHeight, scale, rotation, dpr
  );
  const grid = makeGrid(gridSize, canvasWidth, canvasHeight, dpr);

  for (const p of points) {
    const [px, py] = toPixel(p.x, p.y, t, true);
    incrementCell(grid, px, py, p.transformIndex);
  }

  drawDots(ctx, grid, strokeColor, transformColors, maxFill, minFill, options.dotShape, options.uniform);
}

// ---------------------------------------------------------------------------
// Dot drawing
// ---------------------------------------------------------------------------

function drawDots(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  strokeColor: string,
  colors: string[] | undefined,
  maxFill: number,
  minFill: number,
  dotShape: "circle" | "square" = "circle",
  uniform = false
): void {
  // Find max density for normalization
  let maxDensity = 0;
  for (let i = 0; i < grid.density.length; i++) {
    if (grid.density[i] > maxDensity) maxDensity = grid.density[i];
  }
  if (maxDensity === 0) return;

  const sqrtMax = Math.sqrt(maxDensity);
  const maxR = (Math.min(grid.cellW, grid.cellH) / 2) * maxFill;
  const minR = (Math.min(grid.cellW, grid.cellH) / 2) * minFill;

  // Group by color for fewer fillStyle changes
  const colorBuckets = new Map<string, Array<[number, number, number]>>(); // color → [cx, cy, r]

  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const idx = row * grid.cols + col;
      const d = grid.density[idx];
      if (d === 0) continue;

      const radius = uniform ? maxR : minR + (maxR - minR) * (Math.sqrt(d) / sqrtMax);

      const cx = (col + 0.5) * grid.cellW;
      const cy = (row + 0.5) * grid.cellH;

      const avgDepthKey = grid.depthSum[idx] / d;
      const color = resolveColor(avgDepthKey, strokeColor, colors);

      const bucket = colorBuckets.get(color);
      if (bucket) bucket.push([cx, cy, radius]);
      else colorBuckets.set(color, [[cx, cy, radius]]);
    }
  }

  for (const [color, dots] of colorBuckets) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (const [cx, cy, r] of dots) {
      if (dotShape === "square") {
        const side = r * 2;
        ctx.rect(cx - r, cy - r, side, side);
      } else {
        ctx.moveTo(cx + r, cy);
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
      }
    }
    ctx.fill();
  }
}
