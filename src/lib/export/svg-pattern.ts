import type { Segment } from "@/lib/engine/types";
import type { TileRect } from "@/lib/engine/pattern";

interface PatternSvgOptions {
  /** Output tile size in px (square). */
  size: number;
  strokeColor: string;
  strokeWidth: number;
  precision: number;
  /** Background rect color. Omit for transparent. */
  background?: string;
  /** Per-depth or per-iteration color array. */
  depthColors?: string[];
  /** When true, color by segment.iteration rather than segment.depth. */
  colorByIteration?: boolean;
}

export interface PatternSvgResult {
  svg: string;
  byteSize: number;
  segmentCount: number;
}

function r(n: number, precision: number): string {
  const factor = Math.pow(10, precision);
  return (Math.round(n * factor) / factor).toString();
}

function levelStroke(level: number, defaultColor: string, colors?: string[]): string {
  if (!colors || colors.length === 0) return defaultColor;
  return colors[Math.min(level, colors.length - 1)];
}

/**
 * Emit a seamless tile as a single-tile SVG.
 *
 * Contract for Figma-friendly output:
 *  - viewBox is "0 0 size size" with no padding — the tile fills the canvas exactly.
 *  - No rotation, no fit-scale, no auto-centering. The tile's own bounds ARE the
 *    viewport; array the SVG in Figma and seams align.
 *  - Segments are grouped by color and emitted as chained <path> elements.
 */
export function generatePatternTileSvg(
  tileSegments: Segment[],
  tile: TileRect,
  options: PatternSvgOptions
): PatternSvgResult {
  const {
    size,
    strokeColor,
    strokeWidth,
    precision,
    background,
    depthColors,
    colorByIteration,
  } = options;

  // Map geometry-space (origin-centered, edge = tile.size) to SVG-space
  // (0..size). Translate so the tile's top-left lands at (0,0), then scale.
  const tileEdge = tile.size;
  const scale = size / tileEdge;
  const tx = (tx0: number) => (tx0 + tileEdge / 2) * scale;
  const ty = (ty0: number) => (ty0 + tileEdge / 2) * scale;

  const lines: string[] = [];
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`
  );

  if (background) {
    lines.push(`  <rect width="${size}" height="${size}" fill="${background}"/>`);
  }

  if (tileSegments.length === 0) {
    lines.push("</svg>");
    const svg = lines.join("\n");
    return { svg, byteSize: new Blob([svg]).size, segmentCount: 0 };
  }

  // Group by color key (depth or iteration) so we emit one path per color.
  const keyFn = colorByIteration
    ? (s: Segment) => s.iteration ?? 0
    : (s: Segment) => s.depth;

  const groups = new Map<number, Segment[]>();
  for (const seg of tileSegments) {
    const k = keyFn(seg);
    const arr = groups.get(k);
    if (arr) arr.push(seg);
    else groups.set(k, [seg]);
  }

  const levels = Array.from(groups.keys()).sort((a, b) => a - b);
  for (const level of levels) {
    const segs = groups.get(level)!;
    const parts: string[] = [];
    let lastX = NaN;
    let lastY = NaN;
    const eps = 0.001;

    for (const seg of segs) {
      const x1 = tx(seg.x1);
      const y1 = ty(seg.y1);
      const x2 = tx(seg.x2);
      const y2 = ty(seg.y2);
      const dx = x2 - x1;
      const dy = y2 - y1;

      if (Math.abs(x1 - lastX) < eps && Math.abs(y1 - lastY) < eps) {
        parts.push(`l${r(dx, precision)} ${r(dy, precision)}`);
      } else {
        parts.push(`M${r(x1, precision)} ${r(y1, precision)}l${r(dx, precision)} ${r(dy, precision)}`);
      }
      lastX = x2;
      lastY = y2;
    }

    const color = levelStroke(level, strokeColor, depthColors);
    lines.push(
      `  <path d="${parts.join("")}" fill="none" stroke="${color}" stroke-width="${r(strokeWidth, 1)}" stroke-linecap="round" stroke-linejoin="round"/>`
    );
  }

  lines.push("</svg>");
  const svg = lines.join("\n");
  return {
    svg,
    byteSize: new Blob([svg]).size,
    segmentCount: tileSegments.length,
  };
}
