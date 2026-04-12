"use client";

import { useState, useCallback } from "react";
import type { FractalParams } from "@/lib/engine/types";

interface CustomRuleEditorProps {
  params: FractalParams;
  onParamChange: (key: keyof FractalParams, value: string | number | boolean) => void;
}

/**
 * Parse a multi-line rule string like "F=F+F-F\nG=GG" into a rules object.
 */
export function parseRuleString(ruleStr: string): Record<string, string> | null {
  const rules: Record<string, string> = {};
  const lines = ruleStr.split("\n").map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    const match = line.match(/^([A-Za-z])(?:\s*=\s*|\s*→\s*|\s*->\s*)(.+)$/);
    if (!match) return null;
    rules[match[1]] = match[2].trim();
  }

  return Object.keys(rules).length > 0 ? rules : null;
}

export function CustomRuleEditor({
  params,
  onParamChange,
}: CustomRuleEditorProps) {
  const [axiomInput, setAxiomInput] = useState(params.customAxiom);
  const [rulesInput, setRulesInput] = useState(params.customRules);
  const [error, setError] = useState<string | null>(null);

  const handleApply = useCallback(() => {
    // Validate axiom
    if (!axiomInput.trim()) {
      setError("Axiom cannot be empty");
      return;
    }

    // Validate rules
    const parsed = parseRuleString(rulesInput);
    if (!parsed) {
      setError("Invalid rules. Use format: F=F+F-F (one rule per line)");
      return;
    }

    setError(null);
    onParamChange("customAxiom", axiomInput.trim());
    onParamChange("customRules", rulesInput.trim());
    onParamChange("customMode", true);
  }, [axiomInput, rulesInput, onParamChange]);

  return (
    <div className="flex flex-col gap-3">
      {/* Axiom */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-[family-name:var(--font-mono)] text-text-tertiary uppercase tracking-wider">
          Axiom
        </label>
        <input
          type="text"
          value={axiomInput}
          onChange={(e) => setAxiomInput(e.target.value)}
          placeholder="F"
          className="w-full px-2.5 py-1.5 rounded-md bg-bg-tertiary/50 border border-border-subtle text-[11px] font-[family-name:var(--font-mono)] text-text-primary placeholder:text-text-tertiary focus:border-accent/40 focus:outline-none transition-colors"
        />
      </div>

      {/* Rules */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-[family-name:var(--font-mono)] text-text-tertiary uppercase tracking-wider">
          Rules (one per line)
        </label>
        <textarea
          value={rulesInput}
          onChange={(e) => setRulesInput(e.target.value)}
          placeholder={"F=F+F-F-F+F\nG=GG"}
          rows={3}
          className="w-full px-2.5 py-1.5 rounded-md bg-bg-tertiary/50 border border-border-subtle text-[11px] font-[family-name:var(--font-mono)] text-text-primary placeholder:text-text-tertiary focus:border-accent/40 focus:outline-none transition-colors resize-none leading-relaxed"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-[10px] font-[family-name:var(--font-mono)] text-[#f5a623]">
          {error}
        </p>
      )}

      {/* Help text */}
      <p className="text-[9px] font-[family-name:var(--font-mono)] text-text-tertiary leading-relaxed">
        F/G/A/B = draw · f = move · + = left · - = right · [ ] = branch · | = 180°
      </p>

      {/* Apply button */}
      <button
        onClick={handleApply}
        className="w-full py-1.5 px-3 rounded-md bg-accent/15 text-accent text-[10px] font-[family-name:var(--font-display)] font-semibold border border-accent/25 hover:bg-accent/20 transition-all"
      >
        Generate
      </button>
    </div>
  );
}
