import type { Segment } from "./types";

/**
 * Apply N-fold radial symmetry by duplicating and rotating segments.
 * The base segments are kept as-is (fold 0), then duplicated N-1 times
 * with rotation of 360/N degrees per fold.
 *
 * Rotation is around the centroid of the base geometry.
 *
 * @param segments Base geometry
 * @param folds Number of symmetry folds (1 = no symmetry, 2+ = radial)
 * @returns Combined segments with all folds applied
 */
export function applyRadialSymmetry(
  segments: Segment[],
  folds: number
): Segment[] {
  if (folds <= 1 || segments.length === 0) return segments;

  // Find centroid of base geometry
  let cx = 0;
  let cy = 0;
  let count = 0;
  for (const seg of segments) {
    cx += seg.x1 + seg.x2;
    cy += seg.y1 + seg.y2;
    count += 2;
  }
  cx /= count;
  cy /= count;

  const result: Segment[] = [...segments]; // fold 0 = original
  const angleStep = (2 * Math.PI) / folds;

  for (let i = 1; i < folds; i++) {
    const angle = angleStep * i;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    for (const seg of segments) {
      // Translate to centroid, rotate, translate back
      const dx1 = seg.x1 - cx;
      const dy1 = seg.y1 - cy;
      const dx2 = seg.x2 - cx;
      const dy2 = seg.y2 - cy;

      result.push({
        x1: dx1 * cos - dy1 * sin + cx,
        y1: dx1 * sin + dy1 * cos + cy,
        x2: dx2 * cos - dy2 * sin + cx,
        y2: dx2 * sin + dy2 * cos + cy,
        depth: seg.depth,
        branchId: seg.branchId,
      });
    }
  }

  return result;
}
