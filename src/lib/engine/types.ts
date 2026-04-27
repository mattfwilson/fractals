/** A single line segment produced by turtle graphics interpretation */
export interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  depth: number;
  /** Branch origin index — segments within the same [...] block share this ID */
  branchId?: number;
  /** Which L-system iteration (1-based) produced the draw command for this segment.
   *  0 = from the original axiom. Useful for per-iteration coloring. */
  iteration?: number;
}

/** Complete fractal parameter state */
export interface FractalParams {
  /** Engine mode: 'lsystem' or 'ifs' */
  engineMode: "lsystem" | "ifs";
  preset: string;
  iterations: number;
  scale: number;
  strokeWidth: number;
  rotation: number;
  angle: number;
  lengthRatio: number;
  strokeColor: string;
  canvasWidth: number;
  canvasHeight: number;
  /** Enable depth-based color gradient */
  useGradient: boolean;
  /** Gradient start color (hex) */
  gradientStart: string;
  /** Gradient end color (hex) */
  gradientEnd: string;
  /** Color mode: 'single' = one color, 'gradient' = start→end interpolation, 'per-iteration' = user picks each */
  colorMode: "single" | "gradient" | "per-iteration";
  /** Per-iteration colors array (hex). Index 0 = iteration 0, etc. */
  iterationColors: string[];
  /** Angle jitter amount (0-1, where 1 = ±100% of base angle) */
  angleJitter: number;
  /** Length jitter amount (0-1, where 1 = ±50% of step length) */
  lengthJitter: number;
  /** PRNG seed for deterministic jitter */
  seed: number;
  /** Custom L-system mode */
  customMode: boolean;
  /** Custom axiom (when customMode is true) */
  customAxiom: string;
  /** Custom rules as string "F=F+F-F" format (when customMode is true) */
  customRules: string;
  /** Radial symmetry folds (1 = off, 2-12 = N-fold symmetry) */
  symmetryFolds: number;
  /** Enable tiling mode */
  tiling: boolean;
  /** Tiling grid columns */
  tileCols: number;
  /** Tiling grid rows */
  tileRows: number;
  /** Enable seamless pattern mode (wrap geometry at tile edges). */
  pattern: boolean;
  /** Tile edge length, as a fraction of the geometry's longer bbox side (0.3..2.0). */
  patternTileSize: number;
  /** How much to scale content inside the tile (0.3..2.0). */
  patternContentScale: number;
  /** Horizontal shift of the tile origin in tile units (-0.5..0.5). */
  patternOffsetX: number;
  /** Vertical shift of the tile origin in tile units (-0.5..0.5). */
  patternOffsetY: number;
  /** Preview repeats horizontally (1..6). */
  patternPreviewCols: number;
  /** Preview repeats vertically (1..6). */
  patternPreviewRows: number;
  /** Show the tile boundary overlay on the preview. */
  patternShowBounds: boolean;
  /** Background color for canvas and SVG export */
  bgColor: string;
  /** Whether background is transparent (no bg rect in SVG) */
  bgTransparent: boolean;
  // --- IFS-specific params ---
  /** Active IFS preset key */
  ifsPreset: string;
  /** Number of IFS points to generate */
  ifsPoints: number;
  /** Custom IFS mode */
  ifsCustomMode: boolean;
  /** Custom IFS transforms as JSON string */
  ifsCustomTransforms: string;
}

/** L-system production rules: character -> replacement string */
export type ProductionRules = Record<string, string>;

/** A preset fractal configuration */
export interface FractalPreset {
  name: string;
  description: string;
  axiom: string;
  rules: ProductionRules;
  angle: number;
  defaultIterations: number;
  maxIterations: number;
  initialAngle?: number;
}

/** Options for turtle graphics interpretation */
export interface TurtleOptions {
  angle: number;
  lengthRatio: number;
  initialAngle?: number;
  /** Angle jitter amount (0-1). 0.15 = ±15% of the base angle per step. */
  angleJitter?: number;
  /** Length jitter amount (0-1). 0.15 = ±15% of step length per step. */
  lengthJitter?: number;
  /** PRNG seed for deterministic jitter. Default: 42. */
  seed?: number;
}

/** Bounding box */
export interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** SVG export configuration */
export interface SvgExportOptions {
  /** Output width in px */
  width: number;
  /** Output height in px */
  height: number;
  strokeColor: string;
  strokeWidth: number;
  scale: number;
  rotation: number;
  /** Use defs/use for repeated sub-patterns (smaller file) vs expanded paths (Figma-editable) */
  optimized: boolean;
  /** Decimal precision for coordinates (2 = "12.34") */
  precision: number;
  /** Include background rect */
  background?: string;
  /** Optional per-depth color array. Index = depth, value = hex color. */
  depthColors?: string[];
  /** When true, color by segment.iteration instead of segment.depth */
  colorByIteration?: boolean;
}
