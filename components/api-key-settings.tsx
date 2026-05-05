"use client";

import { useEffect, useState } from "react";

import { useTheme } from "./theme-provider";

export function ApiKeySettings() {
  const { apiKey, setApiKey } = useTheme();
  const [draft, setDraft] = useState(apiKey ?? "");
  const [reveal, setReveal] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setDraft(apiKey ?? "");
  }, [apiKey]);

  const trimmed = draft.trim();
  const valid = trimmed.startsWith("sk-ant-");
  const dirty = trimmed !== (apiKey ?? "");

  function save() {
    if (!valid) return;
    setApiKey(trimmed);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1500);
  }

  function clear() {
    setApiKey(null);
    setDraft("");
    setReveal(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm text-[var(--fg-80)]">
          <span aria-hidden="true">🔑</span>
          <span>Votre clé Anthropic</span>
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
            apiKey
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-[var(--soft-surface)] text-[var(--fg-50)]"
          }`}
        >
          {apiKey ? "Configurée" : "Non configurée"}
        </span>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--soft-surface)] px-3 py-2">
        <span aria-hidden="true" className="text-base">
          🔑
        </span>
        <input
          type={reveal ? "text" : "password"}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="sk-ant-..."
          autoComplete="off"
          spellCheck={false}
          className="flex-1 bg-transparent text-sm text-[var(--fg)] placeholder:text-[var(--fg-40)] focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setReveal((r) => !r)}
          className="rounded-full p-1.5 text-[var(--fg-60)] transition hover:bg-[var(--user-bubble)] hover:text-[var(--fg)]"
          aria-label={reveal ? "Masquer la clé" : "Afficher la clé"}
          title={reveal ? "Masquer" : "Afficher"}
        >
          {reveal ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-[var(--fg-50)]">
          Stockée localement dans votre navigateur. Récupérez-en une sur{" "}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-[var(--accent)] decoration-2 underline-offset-2 hover:text-[var(--fg)]"
          >
            console.anthropic.com
          </a>
          .
        </p>
        <div className="flex items-center gap-2">
          {apiKey ? (
            <button
              type="button"
              onClick={clear}
              className="rounded-full border border-[var(--border-soft)] bg-[var(--soft-surface)] px-3 py-1.5 text-xs font-medium text-[var(--fg-70)] transition hover:text-[var(--fg)]"
            >
              Effacer
            </button>
          ) : null}
          <button
            type="button"
            onClick={save}
            disabled={!valid || !dirty}
            className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--accent-text)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {savedFlash ? "Enregistré ✓" : "Enregistrer"}
          </button>
        </div>
      </div>

      {trimmed && !valid ? (
        <p className="text-xs text-red-400">
          La clé doit commencer par <code>sk-ant-</code>.
        </p>
      ) : null}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c6.5 0 10 7 10 7a18.45 18.45 0 0 1-3.17 4.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}
