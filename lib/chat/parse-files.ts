export type ParsedFile = {
  path: string;
  content: string;
  language: string;
};

/**
 * Matches the opening fence of a Codex code block. Tolerates:
 *   ```ts file:lib/x.ts
 *   ```typescript file: lib/x.ts
 *   ```js file=lib.js
 *   ```ts file:"lib/x.ts"
 *   ``` file:lib/x.ts            (no language)
 *   ```ts file:./lib/x.ts        (./ stripped at normalization)
 */
const FENCE_RE =
  /^([\t ]*)```([A-Za-z0-9_+#-]*)\s*file[:=]\s*["']?([^\s`'"]+)["']?\s*$/;

const CLOSING_FENCE_RE = /^[\t ]*```\s*$/;

/**
 * Extracts code blocks tagged with `file:<path>` from a markdown body.
 * If the same path appears multiple times, the last occurrence wins.
 */
export function parseFileBlocks(text: string): ParsedFile[] {
  const out: ParsedFile[] = [];
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length) {
    const match = lines[i].match(FENCE_RE);
    if (!match) {
      i++;
      continue;
    }
    const language = match[2] ?? "";
    const rawPath = match[3];
    const path = normalizePath(rawPath);
    i++;
    const buffer: string[] = [];
    while (i < lines.length && !CLOSING_FENCE_RE.test(lines[i])) {
      buffer.push(lines[i]);
      i++;
    }
    if (i < lines.length) i++; // consume closing fence
    if (path === null) continue; // unsafe path, skip
    out.push({
      path,
      content: buffer.join("\n") + (buffer.length > 0 ? "\n" : ""),
      language,
    });
  }
  const seen = new Map<string, ParsedFile>();
  for (const file of out) seen.set(file.path, file);
  return Array.from(seen.values());
}

function normalizePath(raw: string): string | null {
  let p = raw.trim();
  if (!p) return null;
  // Strip "./" prefix
  while (p.startsWith("./")) p = p.slice(2);
  // Strip leading slashes
  while (p.startsWith("/")) p = p.slice(1);
  if (!p) return null;
  if (p.includes("..")) return null;
  if (p.includes("\\")) return null;
  if (p.length > 512) return null;
  if (!/^[A-Za-z0-9_./-]+$/.test(p)) return null;
  return p;
}
