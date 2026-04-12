import type { IFSTransform, IFSPoint } from "./ifs-types";
import { mulberry32 } from "./random";

/**
 * Normalize probability weights so they sum to 1.
 */
function normalizeProbabilities(transforms: IFSTransform[]): number[] {
  const total = transforms.reduce((sum, t) => sum + t.p, 0);
  if (total <= 0) {
    // Equal probability fallback
    return transforms.map(() => 1 / transforms.length);
  }
  return transforms.map((t) => t.p / total);
}

/**
 * Build a cumulative distribution from normalized probabilities
 * for efficient weighted random selection.
 */
function buildCDF(probs: number[]): number[] {
  const cdf: number[] = [];
  let acc = 0;
  for (const p of probs) {
    acc += p;
    cdf.push(acc);
  }
  // Fix floating point — ensure last entry is exactly 1
  if (cdf.length > 0) cdf[cdf.length - 1] = 1;
  return cdf;
}

/**
 * Select a transform index using the cumulative distribution.
 */
function selectTransform(cdf: number[], r: number): number {
  for (let i = 0; i < cdf.length; i++) {
    if (r <= cdf[i]) return i;
  }
  return cdf.length - 1;
}

/**
 * Run the IFS chaos game algorithm.
 *
 * Starting from (0, 0), repeatedly selects a random transform
 * (weighted by probability) and applies the affine transformation.
 * The first 20 points are discarded as "warm-up" to let the
 * iteration converge to the attractor.
 *
 * @param transforms - Array of affine transforms with probabilities
 * @param numPoints - Number of points to generate
 * @param seed - PRNG seed for deterministic output
 * @returns Array of IFS points
 */
export function generateIFS(
  transforms: IFSTransform[],
  numPoints: number,
  seed: number = 42
): IFSPoint[] {
  if (transforms.length === 0 || numPoints <= 0) return [];

  const rng = mulberry32(seed);
  const probs = normalizeProbabilities(transforms);
  const cdf = buildCDF(probs);

  const warmup = 20;
  const totalIterations = numPoints + warmup;
  const points: IFSPoint[] = [];

  let x = 0;
  let y = 0;

  for (let i = 0; i < totalIterations; i++) {
    const idx = selectTransform(cdf, rng());
    const t = transforms[idx];

    const nx = t.a * x + t.b * y + t.e;
    const ny = t.c * x + t.d * y + t.f;
    x = nx;
    y = ny;

    // Skip warmup points
    if (i >= warmup) {
      points.push({ x, y, transformIndex: idx });
    }
  }

  return points;
}

/**
 * Get the bounding box of IFS points.
 */
export function getIFSBBox(points: IFSPoint[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  if (points.length === 0) {
    return { minX: -1, minY: -1, maxX: 1, maxY: 1 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  return { minX, minY, maxX, maxY };
}
