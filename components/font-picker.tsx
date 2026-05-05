"use client";

import { FONTS } from "@/lib/themes";

import { useTheme } from "./theme-provider";

const PREVIEWS: Record<string, { font: string; sample: string }> = {
  standard: { font: "inherit", sample: "Aa" },
  manuscrit: { font: "var(--font-caveat)", sample: "Aa" },
  feutre: { font: "var(--font-marker)", sample: "Aa" },
};

export function FontPicker() {
  const { font, setFont } = useTheme();

  return (
    <div className="grid grid-cols-3 gap-2">
      {FONTS.map((f) => {
        const selected = font === f.id;
        const preview = PREVIEWS[f.id] ?? PREVIEWS.standard;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => setFont(f.id)}
            aria-pressed={selected}
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl border px-3 py-3 transition ${
              selected
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--fg)]"
                : "border-[var(--border-soft)] bg-[var(--soft-surface)] text-[var(--fg-70)] hover:text-[var(--fg)]"
            }`}
          >
            <span
              className="text-2xl"
              style={{ fontFamily: preview.font }}
              aria-hidden="true"
            >
              {preview.sample}
            </span>
            <span className="text-xs">{f.label}</span>
          </button>
        );
      })}
    </div>
  );
}
