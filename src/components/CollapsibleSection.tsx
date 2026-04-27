"use client";

import { useCallback, useState } from "react";

/** Persistent boolean state backed by localStorage.
 *  Uses a lazy initializer so the stored value is read exactly once on mount.
 *  SSR renders `defaultOpen`; the client hydrates with the persisted value —
 *  acceptable here because these panels are interactive-only UI, not SEO content. */
export function usePersistedOpen(key: string, defaultOpen: boolean) {
  const storageKey = `fractals.panel.${key}`;
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return defaultOpen;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw === "1") return true;
      if (raw === "0") return false;
    } catch {}
    return defaultOpen;
  });
  const toggle = useCallback(() => {
    setOpen((v) => {
      const next = !v;
      try { window.localStorage.setItem(storageKey, next ? "1" : "0"); } catch {}
      return next;
    });
  }, [storageKey]);
  return [open, toggle] as const;
}

interface CollapsibleSectionProps {
  title: string;
  /** localStorage key suffix — stored under `fractals.panel.<persistKey>` */
  persistKey: string;
  defaultOpen?: boolean;
  /** Optional body gap override (default: 4 = gap-4) */
  gap?: "3" | "4";
  children: React.ReactNode;
}

export function CollapsibleSection({
  title,
  persistKey,
  defaultOpen = false,
  gap = "4",
  children,
}: CollapsibleSectionProps) {
  const [open, toggle] = usePersistedOpen(persistKey, defaultOpen);
  return (
    <div className="px-4 py-3">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between group py-1 cursor-pointer"
      >
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-tertiary group-hover:text-text-secondary transition-colors font-[family-name:var(--font-display)]">
          {title}
        </h3>
        <svg
          width="9"
          height="9"
          viewBox="0 0 9 9"
          className={`text-text-tertiary group-hover:text-text-secondary transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
        >
          <path d="M3 2l3 2.5L3 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className={`flex flex-col mt-3 ${gap === "3" ? "gap-3" : "gap-4"}`}>
          {children}
        </div>
      )}
    </div>
  );
}
