import type { FractalParams } from "@/lib/engine/types";

/**
 * Compact parameter keys for URL encoding.
 * Maps FractalParams keys to short URL parameter names.
 */
const KEY_MAP: Record<string, string> = {
  preset: "p",
  iterations: "i",
  scale: "sc",
  strokeWidth: "sw",
  rotation: "ro",
  angle: "a",
  lengthRatio: "lr",
  strokeColor: "c",
  canvasWidth: "cw",
  canvasHeight: "ch",
  useGradient: "ug",
  gradientStart: "gs",
  gradientEnd: "ge",
  angleJitter: "aj",
  lengthJitter: "lj",
  seed: "sd",
  customMode: "cm",
  customAxiom: "ca",
  customRules: "cr",
  symmetryFolds: "sf",
  tiling: "ti",
  tileCols: "tc",
  tileRows: "tr",
  bgColor: "bg",
  bgTransparent: "bt",
};

/** Reverse map: short key → full key */
const REVERSE_KEY_MAP: Record<string, string> = {};
for (const [full, short] of Object.entries(KEY_MAP)) {
  REVERSE_KEY_MAP[short] = full;
}

/**
 * Serialize FractalParams to a URL search string.
 * Only includes non-default values to keep URLs short.
 */
export function serializeParams(params: FractalParams): string {
  const parts: string[] = [];

  // Always include preset or custom mode
  if (params.customMode) {
    parts.push(`cm=1`);
    parts.push(`ca=${encodeURIComponent(params.customAxiom)}`);
    parts.push(`cr=${encodeURIComponent(params.customRules)}`);
  } else {
    parts.push(`p=${encodeURIComponent(params.preset)}`);
  }

  // Include all params that differ from "obvious" defaults
  parts.push(`i=${params.iterations}`);
  parts.push(`a=${params.angle}`);

  if (params.scale !== 1) parts.push(`sc=${params.scale}`);
  if (params.strokeWidth !== 1.5) parts.push(`sw=${params.strokeWidth}`);
  if (params.rotation !== 0) parts.push(`ro=${params.rotation}`);
  if (params.lengthRatio !== 0.5) parts.push(`lr=${params.lengthRatio}`);
  if (params.strokeColor !== "#5bf5a0") parts.push(`c=${encodeURIComponent(params.strokeColor)}`);

  // Color mode
  if (params.colorMode === "gradient") {
    parts.push(`ug=1`);
    parts.push(`gs=${encodeURIComponent(params.gradientStart)}`);
    parts.push(`ge=${encodeURIComponent(params.gradientEnd)}`);
  } else if (params.colorMode === "per-iteration") {
    // Encode colors as comma-separated hex without # prefix
    parts.push(`cm2=iter`);
    parts.push(`ic=${params.iterationColors.map((c) => c.replace("#", "")).join(",")}`);
  }

  // Jitter
  if (params.angleJitter > 0) parts.push(`aj=${params.angleJitter}`);
  if (params.lengthJitter > 0) parts.push(`lj=${params.lengthJitter}`);
  if (params.seed !== 42) parts.push(`sd=${params.seed}`);

  // Symmetry & tiling
  if (params.symmetryFolds > 1) parts.push(`sf=${params.symmetryFolds}`);
  if (params.tiling) {
    parts.push(`ti=1`);
    parts.push(`tc=${params.tileCols}`);
    parts.push(`tr=${params.tileRows}`);
  }

  // Background
  if (!params.bgTransparent) {
    parts.push(`bt=0`);
    parts.push(`bg=${encodeURIComponent(params.bgColor)}`);
  }

  return parts.join("&");
}

/**
 * Deserialize URL search params into a partial FractalParams update.
 * Returns only the fields found in the URL — caller merges with defaults.
 */
export function deserializeParams(
  search: string
): Partial<FractalParams> | null {
  if (!search || search === "?") return null;

  const params = new URLSearchParams(search);
  if (params.size === 0) return null;

  const result: Record<string, unknown> = {};

  // Helper: get a param by short key
  const get = (short: string): string | null => params.get(short);
  const getNum = (short: string): number | undefined => {
    const v = get(short);
    return v != null ? parseFloat(v) : undefined;
  };

  // Preset or custom mode
  if (get("cm") === "1") {
    result.customMode = true;
    const ca = get("ca");
    if (ca) result.customAxiom = ca;
    const cr = get("cr");
    if (cr) result.customRules = cr;
  } else {
    const p = get("p");
    if (p) result.preset = p;
    result.customMode = false;
  }

  // Core params
  const i = getNum("i");
  if (i != null) result.iterations = i;
  const a = getNum("a");
  if (a != null) result.angle = a;
  const sc = getNum("sc");
  if (sc != null) result.scale = sc;
  const sw = getNum("sw");
  if (sw != null) result.strokeWidth = sw;
  const ro = getNum("ro");
  if (ro != null) result.rotation = ro;
  const lr = getNum("lr");
  if (lr != null) result.lengthRatio = lr;
  const c = get("c");
  if (c) result.strokeColor = c;

  // Color mode
  if (get("ug") === "1") {
    result.useGradient = true;
    result.colorMode = "gradient";
    const gs = get("gs");
    if (gs) result.gradientStart = gs;
    const ge = get("ge");
    if (ge) result.gradientEnd = ge;
  } else if (get("cm2") === "iter") {
    result.colorMode = "per-iteration";
    result.useGradient = false;
    const ic = get("ic");
    if (ic) {
      result.iterationColors = ic.split(",").map((c) => `#${c}`);
    }
  }

  // Jitter
  const aj = getNum("aj");
  if (aj != null) result.angleJitter = aj;
  const lj = getNum("lj");
  if (lj != null) result.lengthJitter = lj;
  const sd = getNum("sd");
  if (sd != null) result.seed = sd;

  // Symmetry & tiling
  const sf = getNum("sf");
  if (sf != null) result.symmetryFolds = sf;
  if (get("ti") === "1") {
    result.tiling = true;
    const tc = getNum("tc");
    if (tc != null) result.tileCols = tc;
    const tr = getNum("tr");
    if (tr != null) result.tileRows = tr;
  }

  // Background
  if (get("bt") === "0") {
    result.bgTransparent = false;
    const bg = get("bg");
    if (bg) result.bgColor = bg;
  }

  return result as Partial<FractalParams>;
}
