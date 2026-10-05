import type { ReconciliationReceipt } from "./types";

export const MODULE_NAME = "Exact Match Engine";
export const SURFACE_ID = "github:jussray/exact-match-engine";
export const SURFACE_COMMIT = "UNKNOWN";
export const COMPLETION_SCHEMA = "exact-match/completion@v2";
const SESSION_KEY = "exact-match-session-id";

export function getSessionId(): string {
  if (typeof window === "undefined") return "session-unavailable";
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `s-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    window.sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch { return "session-unavailable"; }
}

export interface CompletionReceiptPayload {
  schema: typeof COMPLETION_SCHEMA;
  surface_id: string;
  module: string;
  surface_commit: string;
  completed_at: string;
  session_id: string;
  receipt_ids: string[];
  receipts: { id: string; truth_state: string; result: string }[];
  persistence: "reviewer_database";
  browser_local_demo: false;
  authorizing: false;
  note: string;
}

export const COMPLETION_NOTE = "Identity is not proven by this receipt. This non-authorizing receipt records a user-triggered reconciliation run from the database-backed reviewer workspace; it grants no authority and authorizes no merge, deploy, publish, spend or external mutation.";

export function buildCompletionPayload(
  receipts: Pick<ReconciliationReceipt, "id" | "truth_state" | "result">[],
  opts: { session_id: string; completed_at: string },
): CompletionReceiptPayload {
  return {
    schema: COMPLETION_SCHEMA,
    surface_id: SURFACE_ID,
    module: MODULE_NAME,
    surface_commit: SURFACE_COMMIT,
    completed_at: opts.completed_at,
    session_id: opts.session_id,
    receipt_ids: receipts.map((r) => r.id),
    receipts: receipts.map((r) => ({ id: r.id, truth_state: r.truth_state, result: r.result })),
    persistence: "reviewer_database",
    browser_local_demo: false,
    authorizing: false,
    note: COMPLETION_NOTE,
  };
}
