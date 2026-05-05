"use client";

import { useEffect, useState } from "react";

import { useTheme } from "./theme-provider";

export function PersonalizationForm() {
  const { userName, customInstructions, savePersonalization } = useTheme();
  const [nameDraft, setNameDraft] = useState(userName);
  const [instructionsDraft, setInstructionsDraft] =
    useState(customInstructions);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setNameDraft(userName);
  }, [userName]);
  useEffect(() => {
    setInstructionsDraft(customInstructions);
  }, [customInstructions]);

  const dirty =
    nameDraft !== userName || instructionsDraft !== customInstructions;

  function handleSave() {
    savePersonalization({
      userName: nameDraft.trim(),
      customInstructions: instructionsDraft.trim(),
    });
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1500);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-sm text-[var(--fg-80)]">Nom affiché</label>
        <input
          type="text"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          placeholder="Votre nom"
          className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--soft-surface)] px-4 py-2.5 text-sm placeholder:text-[var(--fg-40)] focus:border-[var(--accent)] focus:outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm text-[var(--fg-80)]">
          Personnalité de l'agent — instructions personnalisées
        </label>
        <textarea
          value={instructionsDraft}
          onChange={(e) => setInstructionsDraft(e.target.value)}
          placeholder="Comment Codex devrait-il vous répondre ? Ex. : 'Réponds toujours de manière concise et avec des emojis.'"
          rows={4}
          className="w-full resize-none rounded-2xl border border-[var(--border-soft)] bg-[var(--soft-surface)] px-4 py-2.5 text-sm placeholder:text-[var(--fg-40)] focus:border-[var(--accent)] focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-[var(--fg-50)]">
          Ces instructions sont envoyées à Codex dans le system prompt de
          chaque nouvelle conversation.
        </p>
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty}
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-medium text-[var(--accent-text)] shadow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {savedFlash ? "Enregistré ✓" : "Valider"}
        </button>
      </div>
    </div>
  );
}
