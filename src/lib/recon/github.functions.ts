import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const input = z.object({
  owner: z.string().regex(/^[\w.-]{1,39}$/),
  repo: z.string().regex(/^[\w.-]{1,100}$/),
  branch: z.string().min(1).max(150).regex(/^[\w./-]+$/),
});

export const readGitHubHead = createServerFn({ method: "GET" })
  .validator((data) => input.parse(data))
  .handler(async ({ data }) => {
    const url = `https://api.github.com/repos/${encodeURIComponent(data.owner)}/${encodeURIComponent(data.repo)}/commits/${encodeURIComponent(data.branch)}`;
    const token = process.env["GITHUB_TOKEN"]?.trim();
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "Exact-Match-Engine",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) {
      const visibilityHint = token ? "Check repository access and branch." : "Check public repository access and branch, or configure GITHUB_TOKEN server-side for private repositories.";
      throw new Error(`GitHub read failed (${response.status}). ${visibilityHint}`);
    }
    const body: unknown = await response.json();
    const sha = z.object({ sha: z.string().regex(/^[a-f0-9]{40}$/) }).parse(body).sha;
    return { sha, source: url, retrieved_at: new Date().toISOString() };
  });
