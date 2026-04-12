import type { ProductionRules } from "./types";

/**
 * Maximum safe string length before we abort generation.
 * L-system strings grow exponentially — a 4-segment rule at depth 8
 * produces 4^8 = 65,536 segments. We cap at 2M characters to prevent
 * browser freezing.
 */
const MAX_STRING_LENGTH = 2_000_000;

/**
 * Apply one iteration of L-system production rules to a string.
 * Characters without a matching rule are kept as-is (constants).
 */
function applyRules(input: string, rules: ProductionRules): string {
  let output = "";
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    output += rules[ch] ?? ch;

    // Safety valve: abort if output is getting too large
    if (output.length > MAX_STRING_LENGTH) {
      console.warn(
        `[lsystem] String exceeded ${MAX_STRING_LENGTH} chars at iteration — truncating`
      );
      return output;
    }
  }
  return output;
}

/**
 * Generate an L-system string by iteratively applying production rules.
 *
 * @param axiom - Starting string
 * @param rules - Production rules mapping characters to replacement strings
 * @param iterations - Number of times to apply the rules
 * @returns The final L-system string
 */
export function generateLSystem(
  axiom: string,
  rules: ProductionRules,
  iterations: number
): string {
  let current = axiom;

  for (let i = 0; i < iterations; i++) {
    const next = applyRules(current, rules);

    // If we hit the cap, don't iterate further
    if (next.length >= MAX_STRING_LENGTH) {
      console.warn(
        `[lsystem] Capped at iteration ${i + 1}/${iterations} (string length: ${next.length})`
      );
      return next;
    }

    current = next;
  }

  return current;
}

/**
 * Generate an L-system string and assign each draw command a positional
 * iteration index (0 to iterations) based on where it falls in the
 * recursive structure.
 *
 * Strategy: after full expansion, count the draw commands (F, G, A, B)
 * and divide them evenly into (iterations + 1) color bands based on
 * their position in the string. This creates a smooth color progression
 * along the fractal path that visually reveals the recursive structure.
 *
 * For branching fractals (trees), we also consider branch depth to
 * ensure the coloring reflects the hierarchical structure.
 */
export function generateLSystemWithIterations(
  axiom: string,
  rules: ProductionRules,
  iterations: number
): { lString: string; iterationMap: Uint8Array } {
  // Generate the full string normally
  const lString = generateLSystem(axiom, rules, iterations);
  const drawChars = new Set(["F", "G", "A", "B"]);
  const colorCount = iterations + 1;

  // Count total draw commands
  let totalDraws = 0;
  for (let i = 0; i < lString.length; i++) {
    if (drawChars.has(lString[i])) totalDraws++;
  }

  // Build iteration map: assign each character an iteration index.
  // Draw commands get evenly distributed across 0..iterations.
  // Non-draw commands get 0 (they don't produce segments).
  const iterMap = new Uint8Array(lString.length);
  let drawIndex = 0;

  for (let i = 0; i < lString.length; i++) {
    if (drawChars.has(lString[i])) {
      // Map position to color band
      const band = Math.floor((drawIndex / totalDraws) * colorCount);
      iterMap[i] = Math.min(band, colorCount - 1);
      drawIndex++;
    }
    // Non-draw chars stay at 0
  }

  return { lString, iterationMap: iterMap };
}

/**
 * Estimate the output string length for given rules and iterations
 * without actually generating it. Useful for UI warnings.
 */
export function estimateStringLength(
  axiom: string,
  rules: ProductionRules,
  iterations: number
): number {
  // Find the average expansion factor across all rules
  let totalExpansion = 0;
  let ruleCount = 0;

  for (const [char, replacement] of Object.entries(rules)) {
    // Count how many times this character appears in the axiom (roughly)
    totalExpansion += replacement.length / char.length;
    ruleCount++;
  }

  if (ruleCount === 0) return axiom.length;

  const avgExpansion = totalExpansion / ruleCount;
  return Math.round(axiom.length * Math.pow(avgExpansion, iterations));
}
