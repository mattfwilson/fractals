import type { IFSPoint } from "@/lib/engine/ifs-types";
import { getIFSBBox } from "@/lib/engine/ifs";

interface PointRenderOptions {
  strokeColor: string;
  scale: number;
  rotation: number;
  canvasWidth: number;
  canvasHeight: number;
  /** Optional per-transform color array */
  transformColors?: string[];
  /** Point size in pixels (1-3) */
  pointSize?: number;
}

/**
 * Parse a hex color to RGB values.
 */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

/**
 * Render IFS point cloud to a Canvas 2D context.
 * Uses ImageData for maximum performance with large point counts.
 * Falls back to fillRect for small counts or when point size > 1.
 */
export function renderPointsToCanvas(
  ctx: CanvasRenderingContext2D,
  points: IFSPoint[],
  options: PointRenderOptions
): void {
  const {
    strokeColor,
    scale,
    rotation,
    canvasWidth,
    canvasHeight,
    transformColors,
    pointSize = 1,
  } = options;

  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const w = canvasWidth * dpr;
  const h = canvasHeight * dpr;

  ctx.clearRect(0, 0, w, h);

  if (points.length === 0) return;

  const bbox = getIFSBBox(points);
  const geoWidth = bbox.maxX - bbox.minX || 1;
  const geoHeight = bbox.maxY - bbox.minY || 1;

  const padding = 40 * dpr;
  const availW = w - padding * 2;
  const availH = h - padding * 2;
  const fitScale = Math.min(availW / geoWidth, availH / geoHeight) * scale;

  const centerX = w / 2;
  const centerY = h / 2;
  const geoCenterX = (bbox.minX + bbox.maxX) / 2;
  const geoCenterY = (bbox.minY + bbox.maxY) / 2;

  const rotRad = (rotation * Math.PI) / 180;
  const cosR = Math.cos(rotRad);
  const sinR = Math.sin(rotRad);

  // Precompute transform colors as RGB
  const defaultRgb = hexToRgb(strokeColor);
  const colorLut: [number, number, number][] = transformColors
    ? transformColors.map(hexToRgb)
    : [];

  if (pointSize <= 1 && points.length > 1000) {
    // Use ImageData for performance (1px points)
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const stride = w * 4;

    for (const p of points) {
      // Transform point: center, scale, rotate
      const px = (p.x - geoCenterX) * fitScale;
      let py = (p.y - geoCenterY) * fitScale;

      // Flip Y (canvas Y goes down, math Y goes up)
      py = -py;

      // Apply rotation
      const rx = px * cosR - py * sinR + centerX;
      const ry = px * sinR + py * cosR + centerY;

      const ix = Math.round(rx);
      const iy = Math.round(ry);

      if (ix >= 0 && ix < w && iy >= 0 && iy < h) {
        const offset = iy * stride + ix * 4;
        const [r, g, b] =
          colorLut.length > 0
            ? colorLut[p.transformIndex % colorLut.length]
            : defaultRgb;

        // Alpha blend with existing pixel (additive-ish for density)
        const existing = data[offset + 3];
        if (existing === 0) {
          data[offset] = r;
          data[offset + 1] = g;
          data[offset + 2] = b;
          data[offset + 3] = 200;
        } else {
          // Brighten on overlap — creates density visualization
          data[offset] = Math.min(255, data[offset] + ((255 - data[offset]) >> 2));
          data[offset + 1] = Math.min(255, data[offset + 1] + ((255 - data[offset + 1]) >> 2));
          data[offset + 2] = Math.min(255, data[offset + 2] + ((255 - data[offset + 2]) >> 2));
          data[offset + 3] = Math.min(255, existing + 30);
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  } else {
    // Use fillRect for larger point sizes or small counts
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotRad);

    const ps = pointSize * dpr;

    for (const p of points) {
      const px = (p.x - geoCenterX) * fitScale;
      const py = -(p.y - geoCenterY) * fitScale;

      const [r, g, b] =
        colorLut.length > 0
          ? colorLut[p.transformIndex % colorLut.length]
          : defaultRgb;

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(px - ps / 2, py - ps / 2, ps, ps);
    }

    ctx.restore();
  }
}
