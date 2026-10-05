import { describe, expect, it } from "vitest";
import {
  COMPLETION_SCHEMA,
  MODULE_NAME,
  SURFACE_COMMIT,
  SURFACE_ID,
  buildCompletionPayload,
} from "./completion";

const receipts = [
  { id: "RCP-AAA", truth_state: "BLOCKED" as const, result: "exact_version_mismatch" as const },
  { id: "RCP-BBB", truth_state: "VERIFIED" as const, result: "match" as const },
];

describe("completion payload", () => {
  const payload = buildCompletionPayload(receipts, {
    session_id: "sess-1",
    completed_at: "2026-09-23T03:00:00.000Z",
  });

  it("carries product identity", () => {
    expect(payload.schema).toBe(COMPLETION_SCHEMA);
    expect(payload.surface_id).toBe(SURFACE_ID);
    expect(payload.surface_commit).toBe(SURFACE_COMMIT);
    expect(payload.module).toBe(MODULE_NAME);
  });

  it("describes the database-backed non-authorizing workspace", () => {
    expect(payload.authorizing).toBe(false);
    expect(payload.browser_local_demo).toBe(false);
    expect(payload.persistence).toBe("reviewer_database");
    expect(payload.note.toLowerCase()).toContain("identity is not proven");
    expect(payload.note.toLowerCase()).toContain("database-backed reviewer workspace");
  });

  it("contains only allow-listed receipt fields", () => {
    expect(Object.keys(payload.receipts[0]!).sort()).toEqual(["id", "result", "truth_state"]);
    const json = JSON.stringify(payload).toLowerCase();
    for (const leak of ["@gmail", "mailto:", "password"]) expect(json.includes(leak)).toBe(false);
  });
});
