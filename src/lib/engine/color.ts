/**
 * Color utilities for depth-based gradient interpolation.
 * Uses HSL color space for perceptually smooth gradients.
 */

interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

/** Parse a hex color string to HSL. */
export function hexToHsl(hex: string): HSL {
  // Remove # prefix
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: l * 100 };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let hue: number;
  if (max === r) {
    hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    hue = ((b - r) / d + 2) / 6;
  } else {
    hue = ((r - g) / d + 4) / 6;
  }

  return { h: hue * 360, s: s * 100, l: l * 100 };
}

/** Convert HSL to hex color string. */
export function hslToHex(hsl: HSL): string {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) {
    const val = Math.round(l * 255);
    return `#${val.toString(16).padStart(2, "0")}${val.toString(16).padStart(2, "0")}${val.toString(16).padStart(2, "0")}`;
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Interpolate between two HSL colors.
 * Takes the shortest path around the hue wheel.
 */
export function interpolateHsl(a: HSL, b: HSL, t: number): HSL {
  // Shortest path hue interpolation
  let dh = b.h - a.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;

  return {
    h: ((a.h + dh * t) % 360 + 360) % 360,
    s: a.s + (b.s - a.s) * t,
    l: a.l + (b.l - a.l) * t,
  };
}

/**
 * Build a color lookup table for depth-based gradient.
 * Returns an array of hex colors, one per depth level (0 to maxDepth).
 */
export function buildDepthGradient(
  startHex: string,
  endHex: string,
  maxDepth: number
): string[] {
  if (maxDepth <= 0) return [startHex];

  const startHsl = hexToHsl(startHex);
  const endHsl = hexToHsl(endHex);
  const colors: string[] = [];

  for (let d = 0; d <= maxDepth; d++) {
    const t = d / maxDepth;
    colors.push(hslToHex(interpolateHsl(startHsl, endHsl, t)));
  }

  return colors;
}
