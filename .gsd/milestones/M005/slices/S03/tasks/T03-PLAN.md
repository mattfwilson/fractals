---
estimated_steps: 7
estimated_files: 4
skills_used: []
---

# T03: Custom L-system rule editor

Add a custom L-system editor mode where users can enter their own axiom, production rules, and angle. Include a 'Custom' preset button that activates the editor.

Steps:
1. Add 'custom' mode state to params
2. Create a CustomRuleEditor component with axiom input, rule inputs, angle input
3. Wire custom rules into the L-system generation pipeline
4. Add validation (non-empty axiom, at least one rule)
5. Verify custom rules generate valid fractals

## Inputs

- `src/components/ControlPanel.tsx`
- `src/app/page.tsx`

## Expected Output

- `src/components/CustomRuleEditor.tsx`
- `Custom fractal generation working`

## Verification

Enter custom axiom 'F', rule 'F=F+F-F-F+F' at 90 degrees. Produces a valid fractal. Export works correctly.
