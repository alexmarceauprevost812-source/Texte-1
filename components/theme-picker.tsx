"use client";

import { ACCENT_COLORS } from "@/lib/themes";

import { useTheme } from "./theme-provider";

export function ThemePicker() {
  const { accent, setAccent } = useTheme();
  return (
    <div className="flex flex-wrap gap-2">
      {ACCENT_COLORS.map((color) => {
        const selected = accent === color.id;
        return (
          <button
            key={color.id}
            type="button"
            onClick={() => setAccent(color.id)}
            title={color.label}
            aria-label={color.label}
            aria-pressed={selected}
            className={`h-8 w-8 rounded-full border-2 transition ${
              selected
                ? "scale-110 border-white"
                : "border-white/20 hover:scale-105 hover:border-white/40"
            }`}
            style={{ backgroundColor: color.value }}
          />
        );
      })}
    </div>
  );
}
