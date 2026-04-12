"use client";

import { useCallback, useState } from "react";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
  decimals?: number;
  /** Tooltip text shown on hover over the label */
  tooltip?: string;
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit = "",
  decimals = 1,
  tooltip,
}: SliderProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseFloat(e.target.value));
    },
    [onChange]
  );

  const displayValue =
    decimals === 0 ? Math.round(value).toString() : value.toFixed(decimals);

  // Calculate fill percentage for visual track
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <LabelWithTooltip label={label} tooltip={tooltip} />
        <span className="text-[11px] font-[family-name:var(--font-mono)] text-accent tabular-nums">
          {displayValue}
          {unit}
        </span>
      </div>
      <div className="relative">
        <div
          className="absolute top-[9px] left-0 h-[3px] rounded-full bg-accent/30"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="w-full relative z-10"
        />
      </div>
    </div>
  );
}

/** Reusable label + tooltip for non-slider controls too */
export function LabelWithTooltip({
  label,
  tooltip,
}: {
  label: string;
  tooltip?: string;
}) {
  const [show, setShow] = useState(false);

  if (!tooltip) {
    return (
      <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider font-[family-name:var(--font-display)]">
        {label}
      </label>
    );
  }

  return (
    <div
      className="relative inline-flex items-center gap-1"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider font-[family-name:var(--font-display)] cursor-help">
        {label}
      </label>
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        className="text-text-tertiary opacity-50"
      >
        <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1" />
        <text
          x="5"
          y="7.5"
          textAnchor="middle"
          fill="currentColor"
          fontSize="7"
          fontFamily="sans-serif"
        >
          ?
        </text>
      </svg>
      {show && (
        <div className="absolute left-0 bottom-full mb-1.5 z-50 w-52 px-2.5 py-2 rounded-md bg-bg-elevated border border-border-default shadow-lg shadow-black/30">
          <p className="text-[10px] font-[family-name:var(--font-mono)] text-text-primary leading-relaxed normal-case tracking-normal">
            {tooltip}
          </p>
          {/* Arrow */}
          <div className="absolute left-3 top-full w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-border-default" />
        </div>
      )}
    </div>
  );
}
