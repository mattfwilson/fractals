import type { Segment } from "@/lib/engine/types";
import type { IFSPoint } from "@/lib/engine/ifs-types";
import { getBBox } from "@/lib/engine/geometry";
import { getIFSBBox } from "@/lib/engine/ifs";

export type IconSize = 16 | 24 | 32 | 48 | 64;

export interface IconOptions {
  size: IconSize;
  /**
   * Simplification tolerance as a fraction of icon size.
   * 0.01 = fine (1% of size), 0.08 = coarse (8% of size).
   * Default: 0.03
   */
  tolerance: number;
  strokeColor: string;
  /** Auto-scaled if omitted: max(1, size / 20) */
  strokeWidth?: number;
  background?: string;
  rotation?: number;
  /** Per-depth colors for gradient mode */
  depthColors?: string[];
  /** When true, use iteration as the color key instead of depth */
  colorByIteration?: boolean;
  /** Per-transform colors for IFS */
  transformColors?: string[];
  /** How many IFS points to subsample for icon rendering. Default: 2000 */
  ifsSampleCount?: number;
}

export interface IconResult {
  svg: string;
  byteSize: number;
  /** Segment/point count in input geometry */
  inputCount: number;
  /** Point count after simplification */
  outputPoints: number;
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

interface Pt { x: number; y: number }

/** Round to N decimal places */
function r(n: number, decimals: number): string {
  const f = Math.pow(10, decimals);
  return (Math.round(n * f) / f).toString();
}

/** Perpendicular distance from point p to line segment a→b */
function perpDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);
  }
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return Math.sqrt((p.x - a.x - t * dx) ** 2 + (p.y - a.y - t * dy) ** 2);
}

/**
 * Iterative Douglas-Peucker simplification.
 * Avoids call-stack overflow on very long polylines.
 */
function simplify(pts: ReadonlyArray<Pt>, epsilon: number): Pt[] {
  const n = pts.length;
  if (n <= 2) return pts.slice();

  const keep = new Uint8Array(n);
  keep[0] = 1;
  keep[n - 1] = 1;

  // Stack of [startIdx, endIdx] index pairs
  const stack: Array<[number, number]> = [[0, n - 1]];

  while (stack.length > 0) {
    const [start, end] = stack.pop()!;
    if (end - start <= 1) continue;

    let maxDist = 0;
    let maxIdx = start;
    const a = pts[start];
    const b = pts[end];

    for (let i = start + 1; i < end; i++) {
      const d = perpDist(pts[i], a, b);
      if (d > maxDist) {
        maxDist = d;
        maxIdx = i;
      }
    }

    if (maxDist > epsilon) {
      keep[maxIdx] = 1;
      stack.push([start, maxIdx]);
      stack.push([maxIdx, end]);
    }
  }

  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    if (keep[i]) out.push(pts[i]);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Polyline building
// ---------------------------------------------------------------------------

interface Polyline {
  pts: Pt[];
  colorKey: number;
}

const CHAIN_EPS = 1e-9;

/**
 * Chain segments into polylines. Breaks a chain when the next segment's
 * start doesn't match the current end, or when the color key changes.
 *
 * Turtle segments are emitted in draw order, so consecutive connected
 * segments share an endpoint without needing a hash lookup.
 */
function buildPolylines(
  segments: Segment[],
  colorKeyFn: (seg: Segment) => number
): Polyline[] {
  if (segments.length === 0) return [];

  const polylines: Polyline[] = [];
  let chain: Pt[] = [{ x: segments[0].x1, y: segments[0].y1 }, { x: segments[0].x2, y: segments[0].y2 }];
  let chainKey = colorKeyFn(segments[0]);

  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    const key = colorKeyFn(seg);
    const prev = segments[i - 1];
    const connected =
      Math.abs(seg.x1 - prev.x2) < CHAIN_EPS &&
      Math.abs(seg.y1 - prev.y2) < CHAIN_EPS;

    if (connected && key === chainKey) {
      chain.push({ x: seg.x2, y: seg.y2 });
    } else {
      polylines.push({ pts: chain, colorKey: chainKey });
      chain = [{ x: seg.x1, y: seg.y1 }, { x: seg.x2, y: seg.y2 }];
      chainKey = key;
    }
  }
  polylines.push({ pts: chain, colorKey: chainKey });

  return polylines;
}

// ---------------------------------------------------------------------------
// Transform to icon space
// ---------------------------------------------------------------------------

interface Transform {
  scale: number;
  offsetX: number;
  offsetY: number;
  geoCenterX: number;
  geoCenterY: number;
  /** For IFS: y-axis is flipped */
  flipY?: boolean;
}

function computeTransform(
  geoMinX: number,
  geoMinY: number,
  geoMaxX: number,
  geoMaxY: number,
  size: number,
  flipY = false
): Transform {
  const padding = size * 0.08;
  const avail = size - padding * 2;
  const geoW = geoMaxX - geoMinX || 1;
  const geoH = geoMaxY - geoMinY || 1;
  const scale = Math.min(avail / geoW, avail / geoH);
  const geoCenterX = (geoMinX + geoMaxX) / 2;
  const geoCenterY = (geoMinY + geoMaxY) / 2;
  return { scale, offsetX: size / 2, offsetY: size / 2, geoCenterX, geoCenterY, flipY };
}

function applyTransform(x: number, y: number, t: Transform): Pt {
  return {
    x: (x - t.geoCenterX) * t.scale + t.offsetX,
    y: t.flipY
      ? -(y - t.geoCenterY) * t.scale + t.offsetY
      : (y - t.geoCenterY) * t.scale + t.offsetY,
  };
}

function transformPolyline(pl: Polyline, t: Transform): Polyline {
  return {
    pts: pl.pts.map((p) => applyTransform(p.x, p.y, t)),
    colorKey: pl.colorKey,
  };
}

// ---------------------------------------------------------------------------
// SVG path builder
// ---------------------------------------------------------------------------

function polylinesToPathD(pts: Pt[], precision: number): string {
  if (pts.length < 2) return "";
  const parts: string[] = [`M${r(pts[0].x, precision)} ${r(pts[0].y, precision)}`];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    parts.push(`l${r(dx, precision)} ${r(dy, precision)}`);
  }
  return parts.join("");
}

function resolveColor(key: number, defaultColor: string, colors?: string[]): string {
  if (!colors || colors.length === 0) return defaultColor;
  return colors[Math.min(key, colors.length - 1)];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a simplified SVG icon from L-system segment geometry.
 *
 * The algorithm:
 *   1. Transform all segments into icon pixel space.
 *   2. Chain connected segments into polylines (O(n) scan).
 *   3. Apply iterative Douglas-Peucker with epsilon = size × tolerance.
 *   4. Group simplified polylines by color key and emit one <path> per group.
 */
export function generateIconSvg(segments: Segment[], options: IconOptions): IconResult {
  const {
    size,
    tolerance,
    strokeColor,
    strokeWidth: swOpt,
    background,
    rotation = 0,
    depthColors,
    colorByIteration = false,
  } = options;

  const strokeWidth = swOpt ?? Math.max(1, size / 20);
  const epsilon = size * tolerance;
  const precision = size <= 24 ? 1 : 2;

  if (segments.length === 0) {
    const svg = emptySvg(size);
    return { svg, byteSize: svg.length, inputCount: 0, outputPoints: 0 };
  }

  const bbox = getBBox(segments);
  const t = computeTransform(bbox.minX, bbox.minY, bbox.maxX, bbox.maxY, size);

  const colorKeyFn = colorByIteration
    ? (seg: Segment) => seg.iteration ?? 0
    : (seg: Segment) => seg.depth;

  // Build and simplify polylines in icon space
  const rawPolylines = buildPolylines(segments, colorKeyFn);
  const simplified: Polyline[] = [];
  let outputPoints = 0;

  for (const pl of rawPolylines) {
    const inIconSpace = transformPolyline(pl, t);
    const simp = simplify(inIconSpace.pts, epsilon);
    if (simp.length >= 2) {
      simplified.push({ pts: simp, colorKey: pl.colorKey });
      outputPoints += simp.length;
    }
  }

  // Group by color key → one <path> per key
  const groups = new Map<number, Pt[][]>();
  for (const pl of simplified) {
    const arr = groups.get(pl.colorKey);
    if (arr) arr.push(pl.pts);
    else groups.set(pl.colorKey, [pl.pts]);
  }

  const lines: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`,
  ];

  if (background) {
    lines.push(`  <rect width="${size}" height="${size}" fill="${background}"/>`);
  }

  const hasRotation = rotation !== 0;
  const cx = size / 2;
  if (hasRotation) {
    lines.push(`  <g transform="rotate(${r(rotation, 1)} ${r(cx, 1)} ${r(cx, 1)})">`);
  }

  const indent = hasRotation ? "    " : "  ";
  const sw = r(strokeWidth, 1);

  const sortedKeys = Array.from(groups.keys()).sort((a, b) => a - b);
  for (const key of sortedKeys) {
    const pathGroups = groups.get(key)!;
    const d = pathGroups.map((pts) => polylinesToPathD(pts, precision)).join("");
    const color = resolveColor(key, strokeColor, depthColors);
    lines.push(
      `${indent}<path d="${d}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`
    );
  }

  if (hasRotation) lines.push("  </g>");
  lines.push("</svg>");

  const svg = lines.join("\n");
  return { svg, byteSize: new Blob([svg]).size, inputCount: segments.length, outputPoints };
}

/**
 * Generate a simplified SVG icon from IFS point cloud geometry.
 *
 * Subsamples the point cloud to a density appropriate for the icon size,
 * groups by transform index for coloring, and renders as small circles.
 */
export function generateIfsIconSvg(points: IFSPoint[], options: IconOptions): IconResult {
  const {
    size,
    strokeColor,
    strokeWidth: swOpt,
    background,
    rotation = 0,
    transformColors,
    ifsSampleCount,
  } = options;

  // Scale point count to icon size: more points for larger icons
  const sampleCount = ifsSampleCount ?? Math.round(size * size * 1.5);
  const strokeWidth = swOpt ?? Math.max(0.6, size / 40);

  if (points.length === 0) {
    const svg = emptySvg(size);
    return { svg, byteSize: svg.length, inputCount: 0, outputPoints: 0 };
  }

  // Uniform subsample
  const sampled: IFSPoint[] = [];
  if (points.length <= sampleCount) {
    sampled.push(...points);
  } else {
    const step = points.length / sampleCount;
    for (let i = 0; i < sampleCount; i++) {
      sampled.push(points[Math.floor(i * step)]);
    }
  }

  const bbox = getIFSBBox(sampled);
  const t = computeTransform(bbox.minX, bbox.minY, bbox.maxX, bbox.maxY, size, true);

  // Group by transform index
  const groups = new Map<number, Pt[]>();
  for (const p of sampled) {
    const { x, y } = applyTransform(p.x, p.y, t);
    const arr = groups.get(p.transformIndex);
    if (arr) arr.push({ x, y });
    else groups.set(p.transformIndex, [{ x, y }]);
  }

  const precision = 1;
  const radius = r(strokeWidth, 1);

  const lines: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`,
  ];

  if (background) {
    lines.push(`  <rect width="${size}" height="${size}" fill="${background}"/>`);
  }

  const hasRotation = rotation !== 0;
  const cx = size / 2;
  if (hasRotation) {
    lines.push(`  <g transform="rotate(${r(rotation, 1)} ${r(cx, 1)} ${r(cx, 1)})">`);
  }

  const indent = hasRotation ? "    " : "  ";

  for (const [idx, pts] of groups) {
    const color =
      transformColors && transformColors.length > 0
        ? transformColors[idx % transformColors.length]
        : strokeColor;

    lines.push(`${indent}<g fill="${color}">`);
    for (const p of pts) {
      lines.push(`${indent}  <circle cx="${r(p.x, precision)}" cy="${r(p.y, precision)}" r="${radius}"/>`);
    }
    lines.push(`${indent}</g>`);
  }

  if (hasRotation) lines.push("  </g>");
  lines.push("</svg>");

  const svg = lines.join("\n");
  return { svg, byteSize: new Blob([svg]).size, inputCount: points.length, outputPoints: sampled.length };
}

function emptySvg(size: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"></svg>`;
}
