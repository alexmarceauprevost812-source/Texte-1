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
