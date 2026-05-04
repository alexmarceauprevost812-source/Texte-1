"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Codex page error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md space-y-4 rounded-3xl border border-[var(--border-soft)] bg-[var(--modal-surface)] p-6 text-center shadow-2xl">
        <h2 className="text-lg font-semibold text-[var(--fg)]">
          Une erreur est survenue
        </h2>
        <p className="text-sm text-[var(--fg-70)]">
          {error.message || "Erreur inconnue côté serveur."}
        </p>
        {error.digest ? (
          <p className="font-mono text-[11px] text-[var(--fg-45)]">
            id : {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-medium text-[var(--accent-text)] transition hover:opacity-90"
        >
          Réessayer
        </button>
      </div>
    </main>
  );
}
