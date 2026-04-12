import type { Segment, TurtleOptions } from "./types";
import { mulberry32 } from "./random";

const DEG_TO_RAD = Math.PI / 180;

interface TurtleState {
  x: number;
  y: number;
  angle: number; // in degrees
  depth: number;
  branchId: number;
}

/**
 * Interpret an L-system string using turtle graphics.
 *
 * Commands:
 *   F, G, A, B — move forward and draw a line
 *   f           — move forward without drawing
 *   +           — turn left by angle
 *   -           — turn right by angle
 *   [           — push current state onto stack
 *   ]           — pop state from stack (also increments depth)
 *
 * @param lString - The L-system string to interpret
 * @param options - Turtle configuration (angles, jitter, etc.)
 * @param iterationMap - Optional Uint8Array mapping each character index to
 *   the iteration number that produced it. When provided, segments get an
 *   `iteration` field for per-iteration coloring.
 * @returns Array of line segments with position and depth metadata
 */
export function interpretTurtle(
  lString: string,
  options: TurtleOptions,
  iterationMap?: Uint8Array
): Segment[] {
  const {
    angle: turnAngle,
    lengthRatio = 0.5,
    initialAngle = 0,
    angleJitter = 0,
    lengthJitter = 0,
    seed = 42,
  } = options;
  const segments: Segment[] = [];
  const stack: TurtleState[] = [];

  // Seeded PRNG for deterministic jitter
  const rng = mulberry32(seed);

  // Base step length at depth 0. lengthRatio controls how much shorter each
  // deeper branch level is: step = 1 * lengthRatio^depth.
  // At ratio 1.0, all segments are equal length.
  // At ratio 0.5, each depth level is half the length of the previous.

  let nextBranchId = 1;
  let state: TurtleState = {
    x: 0,
    y: 0,
    angle: initialAngle,
    depth: 0,
    branchId: 0,
  };

  for (let i = 0; i < lString.length; i++) {
    const cmd = lString[i];

    switch (cmd) {
      case "F":
      case "G":
      case "A":
      case "B": {
        // Move forward and draw. Step length shrinks by lengthRatio at each depth.
        const baseStep = Math.pow(lengthRatio, state.depth);
        const stepLength = lengthJitter > 0
          ? baseStep * (1 + (rng() * 2 - 1) * lengthJitter)
          : baseStep;
        const rad = state.angle * DEG_TO_RAD;
        const newX = state.x + stepLength * Math.cos(rad);
        const newY = state.y + stepLength * Math.sin(rad);

        const seg: Segment = {
          x1: state.x,
          y1: state.y,
          x2: newX,
          y2: newY,
          depth: state.depth,
          branchId: state.branchId,
        };
        if (iterationMap) {
          seg.iteration = iterationMap[i];
        }
        segments.push(seg);

        state.x = newX;
        state.y = newY;
        break;
      }

      case "f": {
        // Move forward without drawing, with depth-based length scaling
        const baseStep = Math.pow(lengthRatio, state.depth);
        const stepLength = lengthJitter > 0
          ? baseStep * (1 + (rng() * 2 - 1) * lengthJitter)
          : baseStep;
        const rad = state.angle * DEG_TO_RAD;
        state.x += stepLength * Math.cos(rad);
        state.y += stepLength * Math.sin(rad);
        break;
      }

      case "+":
        // Turn left, with optional angle jitter
        state.angle -= turnAngle * (1 + (angleJitter > 0 ? (rng() * 2 - 1) * angleJitter : 0));
        break;

      case "-":
        // Turn right, with optional angle jitter
        state.angle += turnAngle * (1 + (angleJitter > 0 ? (rng() * 2 - 1) * angleJitter : 0));
        break;

      case "[":
        // Push state — start a new branch with a unique ID
        stack.push({ ...state });
        state.depth++;
        state.branchId = nextBranchId++;
        break;

      case "]":
        // Pop state
        if (stack.length > 0) {
          state = stack.pop()!;
        }
        break;

      case "|":
        // Turn around (180°)
        state.angle += 180;
        break;

      // All other characters are ignored (constants / decoration)
      default:
        break;
    }
  }

  return segments;
}
