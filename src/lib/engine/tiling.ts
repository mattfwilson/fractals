import type { Segment } from "./types";
import { getBBox } from "./geometry";

/**
 * Apply tiling by duplicating segments in a grid pattern.
 * Each tile is offset by the bounding box dimensions of the base geometry,
 * creating a seamless repeating pattern.
 *
 * @param segments Base geometry
 * @param cols Number of columns
 * @param rows Number of rows
 * @returns Tiled segments centered around the origin
 */
export function applyTiling(
  segments: Segment[],
  cols: number,
  rows: number
): Segment[] {
  if (cols <= 1 && rows <= 1) return segments;
  if (segments.length === 0) return segments;

  const bbox = getBBox(segments);
  const tileW = bbox.maxX - bbox.minX;
  const tileH = bbox.maxY - bbox.minY;

  // Add a small gap (5% of tile size) for visual clarity
  const gapX = tileW * 0.05;
  const gapY = tileH * 0.05;
  const stepX = tileW + gapX;
  const stepY = tileH + gapY;

  // Center the grid
  const totalW = stepX * cols - gapX;
  const totalH = stepY * rows - gapY;
  const offsetX = -totalW / 2 + tileW / 2;
  const offsetY = -totalH / 2 + tileH / 2;

  // Center of base geometry
  const baseCx = (bbox.minX + bbox.maxX) / 2;
  const baseCy = (bbox.minY + bbox.maxY) / 2;

  const result: Segment[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const dx = col * stepX + offsetX - baseCx + (bbox.minX + bbox.maxX) / 2;
      const dy = row * stepY + offsetY - baseCy + (bbox.minY + bbox.maxY) / 2;

      for (const seg of segments) {
        result.push({
          x1: seg.x1 + dx,
          y1: seg.y1 + dy,
          x2: seg.x2 + dx,
          y2: seg.y2 + dy,
          depth: seg.depth,
          branchId: seg.branchId,
        });
      }
    }
  }

  return result;
}
