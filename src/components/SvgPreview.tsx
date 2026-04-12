"use client";

import { useMemo } from "react";

interface SvgPreviewProps {
  svgString: string;
  maxHeight?: number;
}

/**
 * Renders an SVG string as an inline preview image.
 * Uses a data URL in an <img> tag for safe rendering
 * (avoids dangerouslySetInnerHTML XSS surface).
 */
export function SvgPreview({ svgString, maxHeight = 200 }: SvgPreviewProps) {
  const dataUrl = useMemo(() => {
    if (!svgString) return null;
    try {
      return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
    } catch {
      return null;
    }
  }, [svgString]);

  if (!dataUrl) {
    return (
      <div className="flex items-center justify-center h-20 bg-bg-tertiary/20 rounded border border-border-subtle">
        <span className="text-[10px] font-[family-name:var(--font-mono)] text-text-tertiary">
          No preview available
        </span>
      </div>
    );
  }

  return (
    <div
      className="relative rounded border border-border-subtle overflow-hidden bg-bg-tertiary/20"
      style={{ maxHeight }}
    >
      {/* Checkerboard background for transparency */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(45deg, var(--text-secondary) 25%, transparent 25%),
            linear-gradient(-45deg, var(--text-secondary) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, var(--text-secondary) 75%),
            linear-gradient(-45deg, transparent 75%, var(--text-secondary) 75%)
          `,
          backgroundSize: "8px 8px",
          backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
        }}
      />
      <img
        src={dataUrl}
        alt="SVG export preview"
        className="relative w-full h-auto object-contain"
        style={{ maxHeight }}
        draggable={false}
      />
    </div>
  );
}
