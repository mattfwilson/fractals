import type { Segment } from "@/lib/engine/types";
import type { IFSPoint } from "@/lib/engine/ifs-types";
import { getBBox } from "@/lib/engine/geometry";
import { getIFSBBox } from "@/lib/engine/ifs";

export interface SvgDotMatrixOptions {
  width: number;
  height: number;
  gridSize: number;
  dotShape: "circle" | "square";
  strokeColor: string;
  scale: number;
  rotation: number;
  background?: string;
  depthColors?: string[];
  colorByIteration?: boolean;
  transformColors?: string[];
  maxFill?: number;
  minFill?: number;
  precision?: number;
  /** When true, all non-empty cells get the same size (maxFill) regardless of density. Default: false */
  uniform?: boolean;
}

export interface SvgDotMatrixResult {
  svg: string;
  byteSize: number;
  dotCount: number;
}

// ---------------------------------------------------------------------------
// Shared transform + grid helpers (pure math, no DOM)
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
  width: number, height: number, scale: number, rotation: number
): Transform {
  const geoWidth = geoMaxX - geoMinX || 1;
  const geoHeight = geoMaxY - geoMinY || 1;
  const padding = Math.min(width, height) * 0.05;
  const availW = width - padding * 2;
  const availH = height - padding * 2;
  const fitScale = Math.min(availW / geoWidth, availH / geoHeight) * scale;
  const rad = (rotation * Math.PI) / 180;
  return {
    fitScale,
    centerX: width / 2,
    centerY: height / 2,
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

function makeGrid(gridSize: number, width: number, height: number): Grid {
  return {
    density: new Float32Array(gridSize * gridSize),
    depthSum: new Float32Array(gridSize * gridSize),
    cols: gridSize,
    rows: gridSize,
    cellW: width / gridSize,
    cellH: height / gridSize,
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
  x1: number, y1: number,
  x2: number, y2: number,
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

function r(n: number, decimals: number): string {
  const f = Math.pow(10, decimals);
  return (Math.round(n * f) / f).toString();
}

// ---------------------------------------------------------------------------
// SVG builder
// ---------------------------------------------------------------------------

function buildSvgFromGrid(
  grid: Grid,
  options: SvgDotMatrixOptions,
  background: string | undefined
): SvgDotMatrixResult {
  const { width, height, dotShape, strokeColor, depthColors, transformColors, precision = 1 } = options;
  const maxFill = options.maxFill ?? 0.88;
  const minFill = options.minFill ?? 0.08;

  const colors = depthColors ?? transformColors;

  let maxDensity = 0;
  for (let i = 0; i < grid.density.length; i++) {
    if (grid.density[i] > maxDensity) maxDensity = grid.density[i];
  }

  const lines: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
  ];
  if (background) {
    lines.push(`  <rect width="${width}" height="${height}" fill="${background}"/>`);
  }

  if (maxDensity === 0) {
    lines.push("</svg>");
    const svg = lines.join("\n");
    return { svg, byteSize: new Blob([svg]).size, dotCount: 0 };
  }

  const sqrtMax = Math.sqrt(maxDensity);
  const maxR = (Math.min(grid.cellW, grid.cellH) / 2) * maxFill;
  const minR = (Math.min(grid.cellW, grid.cellH) / 2) * minFill;
  const uniform = options.uniform ?? false;

  // Group dots by resolved color
  const colorBuckets = new Map<string, string[]>(); // color → array of element strings
  let dotCount = 0;

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

      let el: string;
      if (dotShape === "square") {
        const side = radius * 2;
        el = `<rect x="${r(cx - radius, precision)}" y="${r(cy - radius, precision)}" width="${r(side, precision)}" height="${r(side, precision)}"/>`;
      } else {
        el = `<circle cx="${r(cx, precision)}" cy="${r(cy, precision)}" r="${r(radius, precision)}"/>`;
      }

      const bucket = colorBuckets.get(color);
      if (bucket) bucket.push(el);
      else colorBuckets.set(color, [el]);
      dotCount++;
    }
  }

  for (const [color, els] of colorBuckets) {
    lines.push(`  <g fill="${color}">`);
    for (const el of els) {
      lines.push(`    ${el}`);
    }
    lines.push("  </g>");
  }

  lines.push("</svg>");
  const svg = lines.join("\n");
  return { svg, byteSize: new Blob([svg]).size, dotCount };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateDotMatrixSvg(
  segments: Segment[],
  options: SvgDotMatrixOptions
): SvgDotMatrixResult {
  const { width, height, gridSize, scale, rotation, background } = options;

  if (segments.length === 0) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"></svg>`;
    return { svg, byteSize: svg.length, dotCount: 0 };
  }

  const bbox = getBBox(segments);
  const t = makeTransform(bbox.minX, bbox.minY, bbox.maxX, bbox.maxY, width, height, scale, rotation);
  const grid = makeGrid(gridSize, width, height);

  for (const seg of segments) {
    const depthKey = (options.colorByIteration ? (seg.iteration ?? 0) : seg.depth);
    const [x1, y1] = toPixel(seg.x1, seg.y1, t);
    const [x2, y2] = toPixel(seg.x2, seg.y2, t);
    rasterizeSegment(grid, x1, y1, x2, y2, depthKey);
  }

  return buildSvgFromGrid(grid, options, background);
}

export function generateDotMatrixPointsSvg(
  points: IFSPoint[],
  options: SvgDotMatrixOptions
): SvgDotMatrixResult {
  const { width, height, gridSize, scale, rotation, background } = options;

  if (points.length === 0) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"></svg>`;
    return { svg, byteSize: svg.length, dotCount: 0 };
  }

  const bbox = getIFSBBox(points);
  const t = makeTransform(bbox.minX, bbox.minY, bbox.maxX, bbox.maxY, width, height, scale, rotation);
  const grid = makeGrid(gridSize, width, height);

  for (const p of points) {
    const [px, py] = toPixel(p.x, p.y, t, true);
    incrementCell(grid, px, py, p.transformIndex);
  }

  return buildSvgFromGrid(grid, options, background);
}
