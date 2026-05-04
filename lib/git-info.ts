import { promises as fs } from "node:fs";
import path from "node:path";

export type GitInfo = {
  branch: string | null;
  added: number;
  removed: number;
};

export async function getGitInfo(): Promise<GitInfo> {
  return {
    branch: await readBranch(),
    added: parseIntEnv(process.env.NEXT_PUBLIC_DIFF_ADDED),
    removed: parseIntEnv(process.env.NEXT_PUBLIC_DIFF_REMOVED),
  };
}

async function readBranch(): Promise<string | null> {
  if (process.env.VERCEL_GIT_COMMIT_REF) {
    return process.env.VERCEL_GIT_COMMIT_REF;
  }
  if (process.env.GIT_BRANCH) {
    return process.env.GIT_BRANCH;
  }
  try {
    const head = await fs.readFile(
      path.join(process.cwd(), ".git", "HEAD"),
      "utf8",
    );
    const trimmed = head.trim();
    const match = trimmed.match(/^ref: refs\/heads\/(.+)$/);
    if (match) return match[1];
    return trimmed.slice(0, 7);
  } catch {
    return null;
  }
}

function parseIntEnv(value: string | undefined): number {
  if (!value) return 0;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
}
