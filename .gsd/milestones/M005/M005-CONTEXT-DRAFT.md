# M005: Fractal Pattern Generator

**Gathered:** 2026-04-10
**Status:** Ready for planning

## Project Description

A client-side web application that generates creative fractal patterns with designer-grade controls and exports optimized SVG files for use in Figma design workflows. Built with Next.js, all processing happens in the browser.

## Why This Milestone

Designers need generative pattern tools that produce clean vector output. Existing fractal generators either produce raster images, lack fine-grained controls, or export bloated SVGs that choke design tools. This fills the gap: a web-based fractal studio that speaks the designer's language (SVG, Figma, precise control) while powered by proper math (L-systems, IFS).

## User-Visible Outcome

- Open the app, pick a preset fractal, tweak parameters with sliders, see real-time preview
- Export an optimized SVG that imports into Figma as editable vector paths
- Apply symmetry and tiling to create repeating design patterns
- Define custom L-system rules for novel fractal generation
- Share configurations via URL and export via download/clipboard/data URL

## Risks and Unknowns

- SVG element count explosion at high iteration depths — fractal geometry grows exponentially
- Real-time preview performance — users adjust sliders continuously, need sub-100ms feedback
- L-system string growth — strings grow exponentially, need caps and possibly Web Workers

## Relevant Requirements

R001-R012 — see REQUIREMENTS.md

## In Scope

- L-system fractal engine with turtle graphics
- 7+ classic fractal presets
- Core parameter controls with real-time Canvas preview
- SVG export with structural optimization
- Color, gradient, opacity, stroke tapering controls
- Randomness/jitter controls
- Custom L-system rule editor
- Symmetry modes (mirror, radial, rotational)
- Seamless tiling/repeat mode
- Canvas size presets and background toggle
- URL-based parameter sharing
- Undo/history for parameter changes

## Out of Scope

- Mandelbrot/Julia set fractals
- 3D fractals
- Server-side rendering
- User accounts or cloud storage
- Animation or video export
