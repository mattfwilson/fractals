import type { IFSPreset } from "@/lib/engine/ifs-types";

export const IFS_PRESETS: Record<string, IFSPreset> = {
  "barnsley-fern": {
    name: "Barnsley Fern",
    description: "Classic fern with four affine transforms — stem, left leaflet, right leaflet, and tip",
    transforms: [
      { a: 0.0,  b: 0.0,   c: 0.0,  d: 0.16,  e: 0.0, f: 0.0,   p: 0.01 },
      { a: 0.85, b: 0.04,  c: -0.04, d: 0.85, e: 0.0, f: 1.6,   p: 0.85 },
      { a: 0.2,  b: -0.26, c: 0.23,  d: 0.22, e: 0.0, f: 1.6,   p: 0.07 },
      { a: -0.15, b: 0.28, c: 0.26,  d: 0.24, e: 0.0, f: 0.44,  p: 0.07 },
    ],
    defaultPoints: 100000,
    colors: ["#2d5a27", "#5bf5a0", "#3ab87a", "#a855f7"],
  },

  "sierpinski-triangle-ifs": {
    name: "Sierpiński Triangle",
    description: "Three contracting transforms pointing at triangle vertices",
    transforms: [
      { a: 0.5, b: 0.0, c: 0.0, d: 0.5, e: 0.0,  f: 0.0,  p: 1 / 3 },
      { a: 0.5, b: 0.0, c: 0.0, d: 0.5, e: 0.5,  f: 0.0,  p: 1 / 3 },
      { a: 0.5, b: 0.0, c: 0.0, d: 0.5, e: 0.25, f: 0.433, p: 1 / 3 },
    ],
    defaultPoints: 50000,
    colors: ["#ef4444", "#3b82f6", "#5bf5a0"],
  },

  "dragon-ifs": {
    name: "Dragon IFS",
    description: "Two-transform IFS that produces the classic dragon curve attractor",
    transforms: [
      { a: 0.5,  b: -0.5, c: 0.5,  d: 0.5, e: 0.0, f: 0.0, p: 0.5 },
      { a: -0.5, b: -0.5, c: 0.5, d: -0.5, e: 1.0, f: 0.0, p: 0.5 },
    ],
    defaultPoints: 100000,
    colors: ["#a855f7", "#5bf5a0"],
  },

  "maple-leaf": {
    name: "Maple Leaf",
    description: "Four-transform system that creates an organic maple leaf shape",
    transforms: [
      { a: 0.14,  b: 0.01,  c: 0.0,   d: 0.51,  e: -0.08, f: -1.31, p: 0.10 },
      { a: 0.43,  b: 0.52,  c: -0.45, d: 0.50,  e: 1.49,  f: -0.75, p: 0.35 },
      { a: 0.45,  b: -0.49, c: 0.47,  d: 0.47,  e: -1.62, f: -0.74, p: 0.35 },
      { a: 0.49,  b: 0.0,   c: 0.0,   d: 0.51,  e: 0.02,  f: 1.62,  p: 0.20 },
    ],
    defaultPoints: 100000,
    colors: ["#f59e0b", "#ef4444", "#ec4899", "#5bf5a0"],
  },

  "koch-ifs": {
    name: "Koch Curve IFS",
    description: "Four-transform IFS producing the Koch curve as an attractor",
    transforms: [
      { a: 1 / 3, b: 0.0,    c: 0.0,    d: 1 / 3, e: 0.0,   f: 0.0,   p: 0.25 },
      { a: 1 / 6, b: -0.289, c: 0.289,  d: 1 / 6, e: 1 / 3, f: 0.0,   p: 0.25 },
      { a: 1 / 6, b: 0.289,  c: -0.289, d: 1 / 6, e: 0.5,   f: 0.289, p: 0.25 },
      { a: 1 / 3, b: 0.0,    c: 0.0,    d: 1 / 3, e: 2 / 3, f: 0.0,   p: 0.25 },
    ],
    defaultPoints: 80000,
    colors: ["#3b82f6", "#06b6d4", "#14b8a6", "#5bf5a0"],
  },

  "spiral": {
    name: "Spiral",
    description: "Logarithmic spiral attractor from two rotating contractions",
    transforms: [
      { a: 0.787879, b: -0.424242, c: 0.242424, d: 0.859848, e: 1.758647, f: 1.408065, p: 0.895652 },
      { a: -0.121212, b: 0.257576, c: 0.151515, d: 0.053030, e: -6.721654, f: 1.377236, p: 0.052174 },
      { a: 0.181818, b: -0.136364, c: 0.090909, d: 0.181818, e: 6.086107, f: 1.568035, p: 0.052174 },
    ],
    defaultPoints: 100000,
    colors: ["#a855f7", "#ec4899", "#f97316"],
  },

  "crystal": {
    name: "Crystal",
    description: "Symmetrical crystalline pattern with four-fold rotational structure",
    transforms: [
      { a: 0.255,  b: 0.0,   c: 0.0,   d: 0.255, e: 0.3726, f: 0.6714, p: 0.25 },
      { a: 0.255,  b: 0.0,   c: 0.0,   d: 0.255, e: 0.1146, f: 0.2232, p: 0.25 },
      { a: 0.255,  b: 0.0,   c: 0.0,   d: 0.255, e: 0.6306, f: 0.2232, p: 0.25 },
      { a: 0.370,  b: -0.642, c: 0.642, d: 0.370, e: 0.6356, f: -0.0061, p: 0.25 },
    ],
    defaultPoints: 80000,
    colors: ["#06b6d4", "#3b82f6", "#8b5cf6", "#a855f7"],
  },
};

/** Ordered list of IFS preset keys for UI display */
export const IFS_PRESET_ORDER = Object.keys(IFS_PRESETS);

/** Get an IFS preset by key */
export function getIFSPreset(key: string): IFSPreset | undefined {
  return IFS_PRESETS[key];
}
