import type { IFSPoint } from "@/lib/engine/ifs-types";
import { getIFSBBox } from "@/lib/engine/ifs";

interface SvgPointsOptions {
  width: number;
  height: number;
  strokeColor: string;
  scale: number;
  rotation: number;
  precision: number;
  background?: string;
  /** Per-transform colors */
  transformColors?: string[];
  /** Point radius in SVG units */
  pointRadius?: number;
}

export interface SvgPointsResult {
  svg: string;
  byteSize: number;
  pointCount: number;
}

/** Round a number to N decimal places */
function r(n: number, precision: number): string {
  const factor = Math.pow(10, precision);
  return (Math.round(n * factor) / factor).toString();
}

/**
 * Generate an SVG from IFS point cloud.
 * Groups points by transform index for efficient coloring,
 * and uses tiny circles for each point.
 */
export function generatePointsSvg(
  points: IFSPoint[],
  options: SvgPointsOptions
): SvgPointsResult {
  const {
    width,
    height,
    strokeColor,
    scale,
    rotation,
    precision,
    background,
    transformColors,
    pointRadius = 0.5,
  } = options;

  if (points.length === 0) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"></svg>`;
    return { svg, byteSize: svg.length, pointCount: 0 };
  }

  const bbox = getIFSBBox(points);
  const geoWidth = bbox.maxX - bbox.minX || 1;
  const geoHeight = bbox.maxY - bbox.minY || 1;

  const padding = Math.min(width, height) * 0.05;
  const availW = width - padding * 2;
  const availH = height - padding * 2;
  const fitScale = Math.min(availW / geoWidth, availH / geoHeight) * scale;

  const centerX = width / 2;
  const centerY = height / 2;
  const geoCenterX = (bbox.minX + bbox.maxX) / 2;
  const geoCenterY = (bbox.minY + bbox.maxY) / 2;

  // Group points by transform index
  const groups = new Map<number, IFSPoint[]>();
  for (const p of points) {
    const arr = groups.get(p.transformIndex);
    if (arr) arr.push(p);
    else groups.set(p.transformIndex, [p]);
  }

  const lines: string[] = [];
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
  );

  if (background) {
    lines.push(`  <rect width="${width}" height="${height}" fill="${background}"/>`);
  }

  const hasRotation = rotation !== 0;
  if (hasRotation) {
    lines.push(`  <g transform="rotate(${r(rotation, 1)} ${r(centerX, 1)} ${r(centerY, 1)})">`);
  }

  const indent = hasRotation ? "    " : "  ";

  for (const [idx, pts] of groups) {
    const color =
      transformColors && transformColors.length > 0
        ? transformColors[idx % transformColors.length]
        : strokeColor;

    // Build a single <path> with tiny circles approximated as dots
    // Using a <g> with circles is most SVG-compatible
    lines.push(`${indent}<g fill="${color}" opacity="0.8">`);

    for (const p of pts) {
      const px = (p.x - geoCenterX) * fitScale + centerX;
      const py = -(p.y - geoCenterY) * fitScale + centerY;
      lines.push(
        `${indent}  <circle cx="${r(px, precision)}" cy="${r(py, precision)}" r="${r(pointRadius, 1)}"/>`
      );
    }

    lines.push(`${indent}</g>`);
  }

  if (hasRotation) {
    lines.push("  </g>");
  }

  lines.push("</svg>");

  const svg = lines.join("\n");

  return {
    svg,
    byteSize: new Blob([svg]).size,
    pointCount: points.length,
  };
}
