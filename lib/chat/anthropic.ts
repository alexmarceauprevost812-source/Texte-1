import Anthropic from "@anthropic-ai/sdk";

let cachedClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (!cachedClient) cachedClient = new Anthropic({ apiKey });
  return cachedClient;
}

export function isAnthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export function isValidAnthropicKey(value: unknown): value is string {
  return typeof value === "string" && /^sk-ant-[A-Za-z0-9_-]{10,}$/.test(value);
}

/**
 * Returns an Anthropic client. If `userApiKey` is a well-formed key, it
 * builds a fresh client with that key (caller-provided, never cached so
 * the user can rotate freely). Otherwise it falls back to the
 * server-side ANTHROPIC_API_KEY env var via `getAnthropicClient()`.
 */
export function resolveAnthropicClient(
  userApiKey: unknown,
): Anthropic | null {
  if (isValidAnthropicKey(userApiKey)) {
    return new Anthropic({ apiKey: userApiKey });
  }
  return getAnthropicClient();
}

export type ChatMode = "codex" | "general";

const CODEX_SYSTEM_PROMPT = `Vous êtes Codex, un assistant de programmation IA propulsé par Claude.

- Vous êtes précis, intelligent et concis.
- Pour le code, utilisez des blocs Markdown avec le langage spécifié.
- Répondez dans la langue de l'utilisateur (français par défaut, anglais si l'utilisateur écrit en anglais).
- Si l'utilisateur joint un fichier ou une archive zip, lisez son contenu avant de répondre.
- Citez les chemins de fichier au format \`path:line\` quand pertinent.`;

const GENERAL_SYSTEM_PROMPT = `Vous êtes un assistant IA général propulsé par Claude, intégré dans Codex sous la forme d'un petit fantôme.

- Vous répondez à toutes sortes de questions : vie quotidienne, culture, conseils, idées, voyage, santé, recettes, etc.
- Vous n'êtes pas spécialisé en programmation : si l'utilisateur a une question de code, suggérez-lui poliment d'utiliser le chat principal de Codex.
- Vous êtes amical, concis, et direct.
- Répondez dans la langue de l'utilisateur (français par défaut, anglais si l'utilisateur écrit en anglais).`;

export function getSystemPrompt(mode: ChatMode): string {
  return mode === "general" ? GENERAL_SYSTEM_PROMPT : CODEX_SYSTEM_PROMPT;
}

// Kept for backward-compatibility with any older import.
export const SYSTEM_PROMPT = CODEX_SYSTEM_PROMPT;

export function isChatMode(value: unknown): value is ChatMode {
  return value === "codex" || value === "general";
}
