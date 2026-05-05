"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function ConnectionsSettings() {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  const supabase = createClient();
  const supabaseConfigured = supabase !== null;

  useEffect(() => {
    if (!supabase) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUser(data.user);
      setLoaded(true);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!cancelled) setUser(session?.user ?? null);
      },
    );
    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  async function signInWithGitHub() {
    if (!supabase || busy) return;
    setBusy(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!supabase || busy) return;
    setBusy(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <ConnectionRow
        icon="🟩"
        title="Supabase"
        statusLabel={supabaseConfigured ? "Configurée" : "Non configurée"}
        statusColor={supabaseConfigured ? "ok" : "muted"}
      >
        {supabaseConfigured ? (
          <p className="text-xs text-[var(--fg-50)]">
            Le serveur utilise <code>NEXT_PUBLIC_SUPABASE_URL</code> et{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
          </p>
        ) : (
          <p className="text-xs text-[var(--fg-50)]">
            Définissez <code>NEXT_PUBLIC_SUPABASE_URL</code> et{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dans Vercel
            (Project&nbsp;Settings → Environment Variables) pour activer
            la connexion.
          </p>
        )}
      </ConnectionRow>

      <ConnectionRow
        icon="🐙"
        title="GitHub"
        statusLabel={
          !loaded
            ? "Chargement…"
            : !supabaseConfigured
              ? "Indisponible"
              : user
                ? "Connecté"
                : "Déconnecté"
        }
        statusColor={user ? "ok" : "muted"}
      >
        {!supabaseConfigured ? (
          <p className="text-xs text-[var(--fg-50)]">
            La connexion GitHub passe par Supabase Auth — configurez
            Supabase d'abord.
          </p>
        ) : !loaded ? (
          <p className="text-xs text-[var(--fg-50)]">Vérification…</p>
        ) : user ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm text-[var(--fg)]">
                {(user.user_metadata?.user_name as string | undefined) ??
                  user.email ??
                  "Connecté"}
              </p>
              {user.email ? (
                <p className="truncate text-xs text-[var(--fg-50)]">
                  {user.email}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={signOut}
              disabled={busy}
              className="rounded-full border border-[var(--border-soft)] bg-[var(--soft-surface)] px-3 py-1.5 text-xs font-medium text-[var(--fg-70)] transition hover:text-[var(--fg)] disabled:opacity-50"
            >
              Déconnexion
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={signInWithGitHub}
            disabled={busy}
            className="flex items-center gap-2 rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--accent-text)] transition hover:opacity-90 disabled:opacity-50"
          >
            <GitHubIcon />
            Se connecter avec GitHub
          </button>
        )}
      </ConnectionRow>
    </div>
  );
}

function ConnectionRow({
  icon,
  title,
  statusLabel,
  statusColor,
  children,
}: {
  icon: string;
  title: string;
  statusLabel: string;
  statusColor: "ok" | "muted";
  children: React.ReactNode;
}) {
  const statusClasses =
    statusColor === "ok"
      ? "bg-emerald-500/15 text-emerald-400"
      : "bg-[var(--soft-surface)] text-[var(--fg-50)]";
  return (
    <div className="space-y-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--soft-surface)] p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[var(--fg)]">
          <span aria-hidden="true">{icon}</span>
          <span className="font-medium">{title}</span>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${statusClasses}`}
        >
          {statusLabel}
        </span>
      </div>
      {children}
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}
