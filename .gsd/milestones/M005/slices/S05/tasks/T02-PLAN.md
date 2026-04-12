---
estimated_steps: 6
estimated_files: 2
skills_used: []
---

# T02: URL state sharing for reproducible patterns

Serialize all fractal params to URL query string. Parse URL params on load to restore state. Use compact encoding for efficiency.

Steps:
1. Create url-state.ts with serialize/deserialize functions
2. Update page.tsx to sync params ↔ URL
3. Add 'Copy Link' button to the header or export panel
4. Verify round-trip: configure pattern → copy URL → open in new tab → identical pattern

## Inputs

- `src/app/page.tsx`
- `src/lib/engine/types.ts`

## Expected Output

- `src/lib/sharing/url-state.ts`
- `URL sharing working end-to-end`

## Verification

Configure a complex pattern (custom preset, jitter, gradient, symmetry). Copy URL. Open in new tab. Verify identical pattern renders.
