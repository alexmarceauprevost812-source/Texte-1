"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Codex global error:", error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          background: "#000",
          color: "#fff",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          margin: 0,
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: "28rem",
            width: "100%",
            padding: "1.5rem",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "1.5rem",
            textAlign: "center",
            background: "#09090b",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600 }}>
            Codex est inaccessible
          </h2>
          <p
            style={{
              marginTop: "0.5rem",
              fontSize: "0.875rem",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            {error.message || "Erreur inconnue."}
          </p>
          {error.digest ? (
            <p
              style={{
                marginTop: "0.25rem",
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.6875rem",
                color: "rgba(255,255,255,0.45)",
              }}
            >
              id : {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1.25rem",
              borderRadius: "9999px",
              background: "#f97316",
              color: "#000",
              fontWeight: 500,
              fontSize: "0.875rem",
              border: "none",
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
