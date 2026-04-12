import type { Segment, BBox } from "./types";

/**
 * Calculate the bounding box of a set of segments.
 */
export function getBBox(segments: Segment[]): BBox {
  if (segments.length === 0) {
    return { minX: -1, minY: -1, maxX: 1, maxY: 1 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const seg of segments) {
    if (seg.x1 < minX) minX = seg.x1;
    if (seg.y1 < minY) minY = seg.y1;
    if (seg.x2 < minX) minX = seg.x2;
    if (seg.y2 < minY) minY = seg.y2;
    if (seg.x1 > maxX) maxX = seg.x1;
    if (seg.y1 > maxY) maxY = seg.y1;
    if (seg.x2 > maxX) maxX = seg.x2;
    if (seg.y2 > maxY) maxY = seg.y2;
  }

  return { minX, minY, maxX, maxY };
}
