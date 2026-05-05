"use client";

import { BG_MODES } from "@/lib/themes";

import { useTheme } from "./theme-provider";

export function BgModePicker() {
  const { bgMode, setBgMode } = useTheme();
  return (
    <div className="inline-flex rounded-full border border-[var(--border-soft)] bg-[var(--soft-surface)] p-1">
      {BG_MODES.map((mode) => {
        const selected = bgMode === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => setBgMode(mode.id)}
            aria-pressed={selected}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              selected
                ? "bg-[var(--accent)] text-[var(--accent-text)] shadow"
                : "text-[var(--fg-70)] hover:text-[var(--fg)]"
            }`}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
