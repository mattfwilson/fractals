---
estimated_steps: 1
estimated_files: 8
skills_used: []
---

# T02: UI integration — engine mode selector, IFS controls, custom editor, animation

1. Add engineMode to FractalParams: 'lsystem' | 'ifs'\n2. Add IFS-specific params: ifsPreset, ifsPoints, ifsCustomTransforms\n3. Add engine mode selector at top of ControlPanel (L-System / IFS toggle)\n4. Create IFSControlPanel component with preset selector, point count slider, custom transform editor\n5. Update page.tsx: when engineMode is 'ifs', compute IFS point cloud instead of L-system segments, render with point cloud renderer\n6. Update FractalCanvas to handle both segment and point rendering\n7. Update ExportPanel to handle point cloud SVG export\n8. Update animation interpolation for new IFS params\n9. Update URL serialization for IFS params

## Inputs

- `src/lib/engine/ifs-types.ts`
- `src/lib/engine/ifs.ts`
- `src/lib/presets/ifs-presets.ts`
- `src/lib/renderer/canvas-points.ts`
- `src/lib/export/svg-points.ts`

## Expected Output

- `src/components/IFSControlPanel.tsx`

## Verification

npm run build && manual browser verification that IFS presets render correctly and animation works
