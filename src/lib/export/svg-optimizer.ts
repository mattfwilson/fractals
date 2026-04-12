/**
 * SVG structural optimizer.
 *
 * Provides post-processing on generated SVG strings:
 * - Coordinate precision reduction
 * - Redundant whitespace removal
 * - Path command shorthand (H/V for axis-aligned lines)
 * - Attribute deduplication via group lifting
 */

/** Round numbers in path d-attribute to N decimal places */
export function reducePrecision(svg: string, precision: number): string {
  // Match floating-point numbers in path data and attributes
  return svg.replace(/-?\d+\.\d+/g, (match) => {
    const n = parseFloat(match);
    const factor = Math.pow(10, precision);
    const rounded = Math.round(n * factor) / factor;
    // Remove trailing zeros: "12.30" → "12.3", "12.00" → "12"
    return rounded.toString();
  });
}

/** Remove unnecessary whitespace between path commands */
export function compactPathData(d: string): string {
  return (
    d
      // Remove space before negative numbers (the minus acts as separator)
      .replace(/(\d) (-)/g, "$1$2")
      // Remove space after command letters
      .replace(/([MmLlHhVvCcSsQqTtAaZz]) /g, "$1")
      // Collapse multiple spaces
      .replace(/ +/g, " ")
      .trim()
  );
}

/**
 * Detect axis-aligned relative line commands and convert to H/V shorthand.
 * "l10 0" → "h10", "l0 -5" → "v-5"
 */
export function useShorthandCommands(d: string): string {
  return d
    .replace(/l(-?\d+\.?\d*) 0/g, "h$1")
    .replace(/l0 (-?\d+\.?\d*)/g, "v$1");
}

/**
 * Apply all optimizations to an SVG string.
 */
export function optimizeSvgString(
  svg: string,
  precision: number = 2
): string {
  let result = svg;

  // Reduce coordinate precision
  result = reducePrecision(result, precision);

  // Compact path data within d="..." attributes
  result = result.replace(/d="([^"]+)"/g, (_match, d: string) => {
    let optimized = compactPathData(d);
    optimized = useShorthandCommands(optimized);
    return `d="${optimized}"`;
  });

  // Remove unnecessary trailing newline
  result = result.trimEnd();

  return result;
}

/**
 * Estimate the file size reduction from optimization.
 */
export function estimateOptimizationGain(
  originalSize: number,
  optimizedSize: number
): { savedBytes: number; savedPercent: number } {
  const savedBytes = originalSize - optimizedSize;
  const savedPercent = originalSize > 0 ? (savedBytes / originalSize) * 100 : 0;
  return { savedBytes, savedPercent: Math.round(savedPercent) };
}

/**
 * Format a byte count for display.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
