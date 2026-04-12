import type { FractalPreset } from "@/lib/engine/types";

export const PRESETS: Record<string, FractalPreset> = {
  "koch-snowflake": {
    name: "Koch Snowflake",
    description: "Classic snowflake curve — equilateral triangle with recursive spikes",
    axiom: "F--F--F",
    rules: { F: "F+F--F+F" },
    angle: 60,
    defaultIterations: 4,
    maxIterations: 6,
    initialAngle: 0,
  },

  "sierpinski-triangle": {
    name: "Sierpiński Triangle",
    description: "Triangular fractal built from recursive subdivision",
    axiom: "F-G-G",
    rules: { F: "F-G+F+G-F", G: "GG" },
    angle: 120,
    defaultIterations: 5,
    maxIterations: 8,
    initialAngle: 0,
  },

  "dragon-curve": {
    name: "Dragon Curve",
    description: "Space-filling curve that never crosses itself",
    axiom: "F",
    rules: { F: "F+G", G: "F-G" },
    angle: 90,
    defaultIterations: 10,
    maxIterations: 16,
    initialAngle: 0,
  },

  "fractal-tree": {
    name: "Fractal Tree",
    description: "Organic branching tree with recursive limbs",
    axiom: "F",
    rules: { F: "G[+F]-F", G: "GG" },
    angle: 25,
    defaultIterations: 6,
    maxIterations: 8,
    initialAngle: -90, // Grow upward
  },

  "fractal-bush": {
    name: "Fractal Bush",
    description: "Dense bushy plant with multiple branching",
    axiom: "F",
    rules: { F: "F[+F]F[-F]F" },
    angle: 25.7,
    defaultIterations: 4,
    maxIterations: 6,
    initialAngle: -90,
  },

  "hilbert-curve": {
    name: "Hilbert Curve",
    description: "Space-filling curve that visits every point in a square",
    axiom: "A",
    rules: { A: "+BF-AFA-FB+", B: "-AF+BFB+FA-" },
    angle: 90,
    defaultIterations: 5,
    maxIterations: 7,
    initialAngle: 0,
  },

  "levy-c-curve": {
    name: "Lévy C-Curve",
    description: "Self-similar curve with a distinctive C-shape",
    axiom: "F",
    rules: { F: "+F--F+" },
    angle: 45,
    defaultIterations: 10,
    maxIterations: 16,
    initialAngle: 0,
  },

  "koch-island": {
    name: "Koch Island",
    description: "Koch curve applied to a square base — creates a complex coastline",
    axiom: "F-F-F-F",
    rules: { F: "F-F+F+FF-F-F+F" },
    angle: 90,
    defaultIterations: 3,
    maxIterations: 5,
    initialAngle: 0,
  },

  "sierpinski-carpet": {
    name: "Sierpiński Carpet",
    description: "Square analog of the Sierpiński triangle",
    axiom: "F+F+F+F",
    rules: { F: "F+F-F-F-G+F+F+F-F", G: "GGG" },
    angle: 90,
    defaultIterations: 3,
    maxIterations: 4,
    initialAngle: 0,
  },

  "penrose-snowflake": {
    name: "Pentagonal Snowflake",
    description: "Five-fold symmetric fractal with pentagonal geometry",
    axiom: "F++F++F++F++F",
    rules: { F: "F++F++F|F-F++F" },
    angle: 36,
    defaultIterations: 3,
    maxIterations: 5,
    initialAngle: 0,
  },
};

/** Ordered list of preset keys for UI display */
export const PRESET_ORDER = Object.keys(PRESETS);

/** Get a preset by key, with fallback */
export function getPreset(key: string): FractalPreset | undefined {
  return PRESETS[key];
}
