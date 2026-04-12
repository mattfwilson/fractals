import type { Segment } from "@/lib/engine/types";

/**
 * A branch is a group of segments with the same branchId,
 * normalized to local coordinates for comparison.
 */
interface Branch {
  branchId: number;
  segments: Segment[];
  /** Origin point (first segment's start) in world coordinates */
  originX: number;
  originY: number;
  /** Rotation of the branch relative to the normalized form */
  rotationRad: number;
  /** Normalized path hash for comparing shapes */
  shapeHash: string;
}

/**
 * A reusable shape definition — segments normalized to origin (0,0)
 * with first segment pointing in the +X direction.
 */
export interface ShapeDef {
  /** Unique def ID for SVG element */
  defId: string;
  /** Segments in local coordinates (origin at 0,0, canonical rotation) */
  localSegments: Segment[];
  /** Number of times this shape appears */
  useCount: number;
}

/**
 * A placed instance of a shape definition.
 */
export interface ShapeUse {
  defId: string;
  translateX: number;
  translateY: number;
  rotationDeg: number;
}

export interface DefsOptimizationResult {
  /** Shape definitions to emit in <defs> */
  defs: ShapeDef[];
  /** Placed instances of shapes */
  uses: ShapeUse[];
  /** Segments that aren't part of any reusable branch (trunk, singletons) */
  remainderSegments: Segment[];
  /** Whether defs/use actually saves bytes vs direct paths */
  worthUsing: boolean;
}

/**
 * Round a number to N decimal places for hashing.
 */
function hashRound(n: number, precision: number): string {
  const factor = Math.pow(10, precision);
  return (Math.round(n * factor) / factor).toString();
}

/**
 * Normalize a branch's segments to local coordinates:
 * - Translate so the first segment starts at (0, 0)
 * - Rotate so the first segment points in the +X direction
 *
 * Returns the normalized segments, origin offset, and rotation angle.
 */
function normalizeBranch(segments: Segment[]): {
  normalized: Segment[];
  originX: number;
  originY: number;
  rotationRad: number;
} {
  if (segments.length === 0) {
    return { normalized: [], originX: 0, originY: 0, rotationRad: 0 };
  }

  const first = segments[0];
  const originX = first.x1;
  const originY = first.y1;

  // Calculate the angle of the first segment
  const dx = first.x2 - first.x1;
  const dy = first.y2 - first.y1;
  const rotationRad = Math.atan2(dy, dx);

  // Rotate all segments so first segment points in +X direction
  const cosR = Math.cos(-rotationRad);
  const sinR = Math.sin(-rotationRad);

  const normalized: Segment[] = segments.map((seg) => {
    // Translate to origin
    const tx1 = seg.x1 - originX;
    const ty1 = seg.y1 - originY;
    const tx2 = seg.x2 - originX;
    const ty2 = seg.y2 - originY;

    // Rotate to canonical orientation
    return {
      x1: tx1 * cosR - ty1 * sinR,
      y1: tx1 * sinR + ty1 * cosR,
      x2: tx2 * cosR - ty2 * sinR,
      y2: tx2 * sinR + ty2 * cosR,
      depth: seg.depth,
      branchId: seg.branchId,
    };
  });

  return { normalized, originX, originY, rotationRad };
}

/**
 * Create a hash string from normalized segments for shape comparison.
 * Uses rounded coordinates to handle floating-point noise.
 */
function hashShape(segments: Segment[], precision: number): string {
  const parts: string[] = [];
  for (const seg of segments) {
    parts.push(
      `${hashRound(seg.x1, precision)},${hashRound(seg.y1, precision)},` +
      `${hashRound(seg.x2, precision)},${hashRound(seg.y2, precision)}`
    );
  }
  return parts.join("|");
}

/**
 * Analyze fractal segments and find repeated branch patterns
 * that can be consolidated into SVG defs/use.
 *
 * Only useful for branching fractals (those with branchId > 0 segments).
 * Non-branching fractals (Koch, Dragon, Hilbert) return worthUsing: false.
 */
export function analyzeDefsOptimization(
  segments: Segment[],
  precision: number = 1
): DefsOptimizationResult {
  // Group segments by branchId
  const branchGroups = new Map<number, Segment[]>();
  for (const seg of segments) {
    const bid = seg.branchId ?? 0;
    const arr = branchGroups.get(bid);
    if (arr) arr.push(seg);
    else branchGroups.set(bid, [seg]);
  }

  // Trunk segments (branchId 0) are always remainder
  const trunkSegments = branchGroups.get(0) ?? [];
  branchGroups.delete(0);

  // If no branches, nothing to optimize
  if (branchGroups.size === 0) {
    return {
      defs: [],
      uses: [],
      remainderSegments: segments,
      worthUsing: false,
    };
  }

  // Normalize each branch and hash its shape
  const branches: Branch[] = [];
  for (const [branchId, segs] of branchGroups) {
    const { normalized, originX, originY, rotationRad } = normalizeBranch(segs);
    const shapeHash = hashShape(normalized, precision);
    branches.push({
      branchId,
      segments: segs,
      originX,
      originY,
      rotationRad,
      shapeHash,
    });
  }

  // Group branches by shape hash
  const shapeGroups = new Map<string, Branch[]>();
  for (const branch of branches) {
    const arr = shapeGroups.get(branch.shapeHash);
    if (arr) arr.push(branch);
    else shapeGroups.set(branch.shapeHash, [branch]);
  }

  // Filter: only consider shapes with enough segments to justify <use> overhead.
  // A <use> element costs ~60 bytes; a chained path segment costs ~15 bytes.
  // So a branch needs at least 5 segments for each <use> to break even.
  const MIN_SEGMENTS_FOR_DEFS = 5;

  const defs: ShapeDef[] = [];
  const uses: ShapeUse[] = [];
  const remainderSegments: Segment[] = [...trunkSegments];

  let defIndex = 0;
  for (const [, group] of shapeGroups) {
    // Only create a def if the shape appears 2+ times and has enough segments
    if (group.length < 2 || group[0].segments.length < MIN_SEGMENTS_FOR_DEFS) {
      // Single-use branches go to remainder
      for (const branch of group) {
        remainderSegments.push(...branch.segments);
      }
      continue;
    }

    const defId = `b${defIndex++}`;

    // Use the first branch's normalized form as the definition
    const { normalized } = normalizeBranch(group[0].segments);
    defs.push({
      defId,
      localSegments: normalized,
      useCount: group.length,
    });

    // Create use instances for each branch
    for (const branch of group) {
      uses.push({
        defId,
        translateX: branch.originX,
        translateY: branch.originY,
        rotationDeg: (branch.rotationRad * 180) / Math.PI,
      });
    }
  }

  // Estimate whether defs/use is worth it:
  // Each def saves (useCount - 1) * segmentsPerBranch worth of path data
  // but adds overhead for <defs>, <g>, <use> elements
  const totalReusedSegments = defs.reduce(
    (sum, d) => sum + d.localSegments.length * (d.useCount - 1),
    0
  );
  // Each chained segment in a path is ~15 bytes (l-command with 2 coords)
  // Each <use> with transform is ~60 bytes
  // Each <defs> entry (g + path) is ~80 bytes
  const savedBytes = totalReusedSegments * 15;
  const overheadBytes = defs.length * 80 + uses.length * 60;
  const worthUsing = savedBytes > overheadBytes * 1.2 && defs.length > 0;

  return { defs, uses, remainderSegments, worthUsing };
}
