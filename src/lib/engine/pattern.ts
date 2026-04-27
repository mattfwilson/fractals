import type { Segment } from "./types";
import { getBBox } from "./geometry";

export interface TileRect {
  cx: number;
  cy: number;
  size: number;
}

export interface PatternOptions {
  /** Edge length of the square tile, in geometry units (before fit scaling). */
  tileSize: number;
  /** Scale factor applied to segments before wrapping (live size-in-tile control). */
  contentScale: number;
  /** Horizontal shift of the tile origin, in tile units (-0.5..0.5 wraps naturally). */
  offsetX: number;
  /** Vertical shift of the tile origin, in tile units. */
  offsetY: number;
}

export interface SeamlessTileResult {
  /** Segments clipped to the tile square (the one reusable tile). */
  tileSegments: Segment[];
  /** The tile rect in local geometry coordinates (origin-centered square). */
  tile: TileRect;
}

/**
 * Build a seamless tile from a fractal's segments by:
 *   1. Scaling segments by contentScale.
 *   2. Placing a square tile at the geometry center with user-chosen edge length.
 *   3. Replicating the scaled segments into a 3x3 neighborhood (±tileSize, 0).
 *   4. Clipping every segment to the tile rect.
 *
 * Result: any geometry crossing a tile edge reappears on the opposite edge,
 * so arraying the tile produces a seamless wallpaper.
 *
 * The returned `tile` is origin-centered: `cx = cy = 0`, easy to place on export.
 */
export function buildSeamlessTile(
  segments: Segment[],
  options: PatternOptions
): SeamlessTileResult {
  const { tileSize, contentScale, offsetX, offsetY } = options;
  const size = Math.max(1e-3, tileSize);

  if (segments.length === 0) {
    return {
      tileSegments: [],
      tile: { cx: 0, cy: 0, size },
    };
  }

  const bbox = getBBox(segments);
  const baseCx = (bbox.minX + bbox.maxX) / 2;
  const baseCy = (bbox.minY + bbox.maxY) / 2;

  // Shift the "origin" of the tile within the content. A non-zero offset
  // slides the repeat so users can dial in where the seam reads.
  const originX = baseCx + offsetX * size;
  const originY = baseCy + offsetY * size;

  // Pre-transform: recenter on tile origin and apply content scale.
  const scaled: Segment[] = new Array(segments.length);
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    scaled[i] = {
      x1: (s.x1 - originX) * contentScale,
      y1: (s.y1 - originY) * contentScale,
      x2: (s.x2 - originX) * contentScale,
      y2: (s.y2 - originY) * contentScale,
      depth: s.depth,
      branchId: s.branchId,
      iteration: s.iteration,
    };
  }

  const half = size / 2;
  const tile: TileRect = { cx: 0, cy: 0, size };

  // 3x3 neighborhood — anything from the -1,0,+1 tile that crosses into the
  // main tile's rect gets clipped into it.
  const out: Segment[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const ox = dx * size;
      const oy = dy * size;
      for (let i = 0; i < scaled.length; i++) {
        const seg = scaled[i];
        const clipped = clipSegmentToRect(
          seg.x1 + ox, seg.y1 + oy,
          seg.x2 + ox, seg.y2 + oy,
          -half, -half, half, half
        );
        if (clipped) {
          out.push({
            x1: clipped.x1,
            y1: clipped.y1,
            x2: clipped.x2,
            y2: clipped.y2,
            depth: seg.depth,
            branchId: seg.branchId,
            iteration: seg.iteration,
          });
        }
      }
    }
  }

  return { tileSegments: out, tile };
}

/**
 * Replicate a tile's segments into a cols x rows grid, for live wallpaper
 * preview. Grid is centered on the origin so the canvas fit logic keeps
 * the pattern framed.
 */
export function replicateTile(
  tileSegments: Segment[],
  tile: TileRect,
  cols: number,
  rows: number
): Segment[] {
  if (tileSegments.length === 0) return [];
  if (cols < 1) cols = 1;
  if (rows < 1) rows = 1;

  const { size } = tile;
  // Center the grid around origin.
  const startX = -((cols - 1) * size) / 2;
  const startY = -((rows - 1) * size) / 2;

  const result: Segment[] = new Array(tileSegments.length * cols * rows);
  let w = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ox = startX + c * size;
      const oy = startY + r * size;
      for (let i = 0; i < tileSegments.length; i++) {
        const s = tileSegments[i];
        result[w++] = {
          x1: s.x1 + ox,
          y1: s.y1 + oy,
          x2: s.x2 + ox,
          y2: s.y2 + oy,
          depth: s.depth,
          branchId: s.branchId,
          iteration: s.iteration,
        };
      }
    }
  }
  return result;
}

/**
 * Liang-Barsky segment clipping against an axis-aligned rect.
 * Returns the clipped segment or null if the segment lies fully outside.
 */
function clipSegmentToRect(
  x1: number, y1: number,
  x2: number, y2: number,
  xmin: number, ymin: number,
  xmax: number, ymax: number
): { x1: number; y1: number; x2: number; y2: number } | null {
  const dx = x2 - x1;
  const dy = y2 - y1;

  let t0 = 0;
  let t1 = 1;

  const p = [-dx, dx, -dy, dy];
  const q = [x1 - xmin, xmax - x1, y1 - ymin, ymax - y1];

  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      // Parallel to this edge. Reject if outside.
      if (q[i] < 0) return null;
      continue;
    }
    const t = q[i] / p[i];
    if (p[i] < 0) {
      if (t > t1) return null;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return null;
      if (t < t1) t1 = t;
    }
  }

  return {
    x1: x1 + t0 * dx,
    y1: y1 + t0 * dy,
    x2: x1 + t1 * dx,
    y2: y1 + t1 * dy,
  };
}
