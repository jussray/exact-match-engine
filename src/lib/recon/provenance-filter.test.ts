import { describe, expect, it } from "vitest";
import type { ReconciliationReceipt } from "./types";
import {
  filterByWitnessDate,
  localDayBound,
  localDateString,
  presetWitnessRange,
  witnessReceiptsCsv,
  witnessTime,
} from "./provenance-filter";

function receipt(id: string, created_at: string, patch: Partial<ReconciliationReceipt> = {}): ReconciliationReceipt {
  return {
    id,
    run_id: "run-1",
    reconciliation_key: "project/repository",
    claim_id: "claim-1",
    subject: "Snapshot witness",
    result: "match",
    truth_state: "VERIFIED",
    expected_version: "v1",
    observed_version: "v1",
    evidence_domain: "project",
    evidence_refs: ["witness:1"],
    attack_id: null,
    cookie_id: "cookie-1",
    continuity_id: "continuity-1",
    rule_id: "rule-1",
    next_gate: "Reviewer decision",
    created_at,
    authorizing: false,
    ...patch,
  };
}

describe("provenance date and export integrity", () => {
  it("includes both boundaries of a local day and excludes adjacent instants", () => {
    const start = localDayBound("2026-10-20", "start");
    const end = localDayBound("2026-10-20", "end");
    expect(start).not.toBeNull();
    expect(end).not.toBeNull();
    const rows = [
      receipt("previous", new Date(start! - 1).toISOString()),
      receipt("first", new Date(start!).toISOString()),
      receipt("last", new Date(end!).toISOString()),
      receipt("next", new Date(end! + 1).toISOString()),
    ];
    expect(filterByWitnessDate(rows, "2026-10-20", "2026-10-20").map((r) => r.id)).toEqual(["first", "last"]);
  });

  it("uses retrieval time rather than creation time when present", () => {
    const start = localDayBound("2026-10-20", "start")!;
    const created = new Date(start + 3600_000).toISOString();
    const older = new Date(start - 3600_000).toISOString();
    const row = receipt("older-witness", created, { witness_retrieved_at: older });
    expect(witnessTime(row)).toBe(older);
    expect(filterByWitnessDate([row], "2026-10-20", "2026-10-20")).toEqual([]);
  });

  it("rejects impossible and inverted dates without admitting receipts", () => {
    const row = receipt("test", "2026-10-20T12:00:00.000Z");
    expect(localDayBound("2026-02-30", "start")).toBeNull();
    expect(filterByWitnessDate([row], "2026-02-30", "")).toEqual([]);
    expect(filterByWitnessDate([row], "2026-10-21", "2026-10-19")).toEqual([]);
    expect(filterByWitnessDate([row], "", "")).toEqual([row]);
  });

  it("generates local-calendar presets with an inclusive range", () => {
    const now = new Date(2026, 9, 29, 12);
    for (const days of [7, 30, 90] as const) {
      const range = presetWitnessRange(days, now);
      const first = new Date(now);
      first.setDate(first.getDate() - (days - 1));
      expect(range).toEqual({ from: localDateString(first), to: localDateString(now) });
    }
  });

  it("exports only non-authorizing receipt rows and neutralizes spreadsheet formulas", () => {
    const row = receipt("receipt-1", "2026-10-20T12:00:00.000Z", {
      witness_source: " =HYPERLINK(\"https://example.invalid\",\"click\")",
      witness_raw_value: "+2+2",
    });
    const csv = witnessReceiptsCsv([row]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("witness_time_utc");
    expect(csv).toContain("\"false\"");
    expect(csv).toContain("2026-10-20 12:00:00.000 UTC");
    expect(csv).toContain(" '=HYPERLINK");
    expect(csv).toContain("'+2+2");
    expect(csv.split("\r\n").filter(Boolean)).toHaveLength(2);
  });
});
