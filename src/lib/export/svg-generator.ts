import type { Segment, SvgExportOptions } from "@/lib/engine/types";
import { getBBox } from "@/lib/engine/geometry";
import { optimizeSvgString } from "./svg-optimizer";
import { analyzeDefsOptimization } from "./defs-optimizer";

/** Round a number to N decimal places */
function r(n: number, precision: number): string {
  const factor = Math.pow(10, precision);
  return (Math.round(n * factor) / factor).toString();
}

/**
 * Build a single SVG <path> d-attribute from contiguous segments.
 * Uses relative line commands (l) after the initial M to save bytes.
 */
function segmentsToPathD(
  segments: Segment[],
  offsetX: number,
  offsetY: number,
  fitScale: number,
  geoCenterX: number,
  geoCenterY: number,
  precision: number
): string {
  if (segments.length === 0) return "";

  const parts: string[] = [];

  for (const seg of segments) {
    const x1 = (seg.x1 - geoCenterX) * fitScale + offsetX;
    const y1 = (seg.y1 - geoCenterY) * fitScale + offsetY;
    const x2 = (seg.x2 - geoCenterX) * fitScale + offsetX;
    const y2 = (seg.y2 - geoCenterY) * fitScale + offsetY;

    // Use M (absolute move) then l (relative line) for each segment
    const dx = x2 - x1;
    const dy = y2 - y1;

    parts.push(`M${r(x1, precision)} ${r(y1, precision)}l${r(dx, precision)} ${r(dy, precision)}`);
  }

  return parts.join("");
}

/**
 * Build optimized SVG path data by chaining contiguous segments.
 * When the end of one segment matches the start of the next,
 * we skip the M command and just add another l command.
 */
function segmentsToOptimizedPathD(
  segments: Segment[],
  offsetX: number,
  offsetY: number,
  fitScale: number,
  geoCenterX: number,
  geoCenterY: number,
  precision: number
): string {
  if (segments.length === 0) return "";

  const parts: string[] = [];
  let lastX = NaN;
  let lastY = NaN;
  const eps = 0.001; // tolerance for "same point"

  for (const seg of segments) {
    const x1 = (seg.x1 - geoCenterX) * fitScale + offsetX;
    const y1 = (seg.y1 - geoCenterY) * fitScale + offsetY;
    const x2 = (seg.x2 - geoCenterX) * fitScale + offsetX;
    const y2 = (seg.y2 - geoCenterY) * fitScale + offsetY;

    const dx = x2 - x1;
    const dy = y2 - y1;

    // Check if this segment starts where the last one ended
    if (Math.abs(x1 - lastX) < eps && Math.abs(y1 - lastY) < eps) {
      // Continue the current subpath with a relative line
      parts.push(`l${r(dx, precision)} ${r(dy, precision)}`);
    } else {
      // New subpath
      parts.push(`M${r(x1, precision)} ${r(y1, precision)}l${r(dx, precision)} ${r(dy, precision)}`);
    }

    lastX = x2;
    lastY = y2;
  }

  return parts.join("");
}

/**
 * Group segments by a numeric key (depth or iteration).
 */
function groupByKey(segments: Segment[], keyFn: (seg: Segment) => number): Map<number, Segment[]> {
  const groups = new Map<number, Segment[]>();
  for (const seg of segments) {
    const key = keyFn(seg);
    const arr = groups.get(key);
    if (arr) {
      arr.push(seg);
    } else {
      groups.set(key, [seg]);
    }
  }
  return groups;
}

/** Legacy helper — group by depth */
function groupByDepth(segments: Segment[]): Map<number, Segment[]> {
  return groupByKey(segments, (s) => s.depth);
}

/** Resolve stroke color for a given level using optional color array. */
function levelStroke(level: number, defaultColor: string, colors?: string[]): string {
  if (!colors || colors.length === 0) return defaultColor;
  return colors[Math.min(level, colors.length - 1)];
}

export interface SvgExportResult {
  svg: string;
  byteSize: number;
  elementCount: number;
  pathCount: number;
}

/**
 * Generate an SVG string from fractal geometry.
 *
 * In optimized mode: groups segments by depth into shared-attribute <g> elements,
 * and chains contiguous segments to minimize path commands.
 *
 * In expanded mode: each segment is a separate <line> element for maximum
 * editability in Figma.
 */
export function generateSvg(
  segments: Segment[],
  options: SvgExportOptions
): SvgExportResult {
  const {
    width,
    height,
    strokeColor,
    strokeWidth,
    scale,
    rotation,
    optimized,
    precision,
    background,
    depthColors,
    colorByIteration,
  } = options;

  // Choose grouping key based on color mode
  const colorKey = colorByIteration
    ? (seg: Segment) => seg.iteration ?? 0
    : (seg: Segment) => seg.depth;

  if (segments.length === 0) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"></svg>`;
    return { svg, byteSize: svg.length, elementCount: 0, pathCount: 0 };
  }

  // Calculate geometry bounds and fit scale
  const bbox = getBBox(segments);
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

  const lines: string[] = [];
  let elementCount = 0;
  let pathCount = 0;

  // SVG header
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
  );

  // Background
  if (background) {
    lines.push(`  <rect width="${width}" height="${height}" fill="${background}"/>`);
    elementCount++;
  }

  // Rotation wrapper
  const hasRotation = rotation !== 0;
  if (hasRotation) {
    lines.push(`  <g transform="rotate(${r(rotation, 1)} ${r(centerX, 1)} ${r(centerY, 1)})">`);
  }

  if (optimized) {
    // Try defs/use optimization for branching fractals
    const defsResult = analyzeDefsOptimization(segments, precision);

    if (defsResult.worthUsing && defsResult.defs.length > 0) {
      // Defs/use mode: emit reusable branch definitions + placements
      // Path data in defs has fitScale baked in (centered at origin).
      // <use> elements apply translate + rotate to place each branch.
      const indent = hasRotation ? "    " : "  ";

      // Emit <defs> block with fitScale baked into path coordinates
      lines.push(`${indent}<defs>`);
      for (const def of defsResult.defs) {
        const d = segmentsToOptimizedPathD(
          def.localSegments,
          0, 0, fitScale, 0, 0, precision
        );
        lines.push(
          `${indent}  <g id="${def.defId}"><path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="${r(strokeWidth, 1)}" stroke-linecap="round" stroke-linejoin="round"/></g>`
        );
        elementCount += 2; // g + path
        pathCount++;
      }
      lines.push(`${indent}</defs>`);

      // Emit <use> elements for each branch placement
      for (const use of defsResult.uses) {
        // translate to viewport position, then rotate around that point
        const tx = (use.translateX - geoCenterX) * fitScale + centerX;
        const ty = (use.translateY - geoCenterY) * fitScale + centerY;
        const transforms: string[] = [];
        transforms.push(`translate(${r(tx, precision)} ${r(ty, precision)})`);
        if (Math.abs(use.rotationDeg) > 0.01) {
          transforms.push(`rotate(${r(use.rotationDeg, 1)})`);
        }

        lines.push(
          `${indent}<use href="#${use.defId}" transform="${transforms.join(" ")}"/>`
        );
        elementCount++;
      }

      // Emit remainder segments (trunk, singletons) as regular paths
      if (defsResult.remainderSegments.length > 0) {
        const remainderGroups = groupByDepth(defsResult.remainderSegments);
        const depths = Array.from(remainderGroups.keys()).sort((a, b) => a - b);

        for (const depth of depths) {
          const segs = remainderGroups.get(depth)!;
          const d = segmentsToOptimizedPathD(
            segs, centerX, centerY, fitScale, geoCenterX, geoCenterY, precision
          );
          lines.push(
            `${indent}<path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="${r(strokeWidth, 1)}" stroke-linecap="round" stroke-linejoin="round"/>`
          );
          elementCount++;
          pathCount++;
        }
      }
    } else {
      // Standard optimized mode: group by depth/iteration, chain contiguous segments
      const groups = groupByKey(segments, colorKey);
      const levels = Array.from(groups.keys()).sort((a, b) => a - b);

      for (const level of levels) {
        const segs = groups.get(level)!;
        const d = segmentsToOptimizedPathD(
          segs, centerX, centerY, fitScale, geoCenterX, geoCenterY, precision
        );

        const indent = hasRotation ? "    " : "  ";
        const color = levelStroke(level, strokeColor, depthColors);
        lines.push(
          `${indent}<path d="${d}" fill="none" stroke="${color}" stroke-width="${r(strokeWidth, 1)}" stroke-linecap="round" stroke-linejoin="round"/>`
        );
        elementCount++;
        pathCount++;
      }
    }
  } else {
    // Expanded mode: individual <line> elements
    const indent = hasRotation ? "    " : "  ";
    for (const seg of segments) {
      const x1 = (seg.x1 - geoCenterX) * fitScale + centerX;
      const y1 = (seg.y1 - geoCenterY) * fitScale + centerY;
      const x2 = (seg.x2 - geoCenterX) * fitScale + centerX;
      const y2 = (seg.y2 - geoCenterY) * fitScale + centerY;
      const color = levelStroke(colorKey(seg), strokeColor, depthColors);

      lines.push(
        `${indent}<line x1="${r(x1, precision)}" y1="${r(y1, precision)}" x2="${r(x2, precision)}" y2="${r(y2, precision)}" stroke="${color}" stroke-width="${r(strokeWidth, 1)}" stroke-linecap="round"/>`
      );
      elementCount++;
    }
    pathCount = segments.length;
  }

  if (hasRotation) {
    lines.push("  </g>");
  }

  lines.push("</svg>");

  const rawSvg = lines.join("\n");
  const svg = optimized ? optimizeSvgString(rawSvg, precision) : rawSvg;

  return {
    svg,
    byteSize: new Blob([svg]).size,
    elementCount,
    pathCount,
  };
}
