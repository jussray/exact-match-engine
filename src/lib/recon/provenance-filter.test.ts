import { describe, expect, it } from "vitest";
import type { ReconciliationReceipt } from "./types";
import {
  csvCell,
  filterByWitnessDate,
  formatWitnessUtc,
  isValidDateString,
  localDayBound,
  localDateString,
  presetWitnessRange,
  sanitizeDateRange,
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

describe("Query Parameter Validation & Date Sanitization", () => {
  it("validates strict YYYY-MM-DD calendar dates", () => {
    expect(isValidDateString("2026-10-29")).toBe(true);
    expect(isValidDateString("2024-02-29")).toBe(true); // Leap year
    expect(isValidDateString("2026-02-29")).toBe(false); // Non-leap year
    expect(isValidDateString("2026-02-31")).toBe(false); // Non-existent date
    expect(isValidDateString("2026-13-01")).toBe(false); // Invalid month
  });

  it("handles incomplete query parameters gracefully", () => {
    expect(isValidDateString("2026")).toBe(false);
    expect(isValidDateString("2026-10")).toBe(false);
    expect(isValidDateString("2026-10-")).toBe(false);
    expect(isValidDateString("2026-1-1")).toBe(false);

    expect(sanitizeDateRange("2026-10", "2026-10-31")).toEqual({ from: "", to: "2026-10-31" });
    expect(sanitizeDateRange("2026-10-01", "2026")).toEqual({ from: "2026-10-01", to: "" });
  });

  it("handles invalid query parameters gracefully", () => {
    expect(isValidDateString(null)).toBe(false);
    expect(isValidDateString(undefined)).toBe(false);
    expect(isValidDateString("garbage-text")).toBe(false);
    expect(isValidDateString("2026-99-99")).toBe(false);

    expect(sanitizeDateRange("garbage", "2026-10-31")).toEqual({ from: "", to: "2026-10-31" });
    expect(sanitizeDateRange("not-a-date", "2026-99-99")).toEqual({ from: "", to: "" });
  });

  it("handles reversed query parameters gracefully by swapping bounds into chronological order", () => {
    expect(sanitizeDateRange("2026-10-31", "2026-10-01")).toEqual({ from: "2026-10-01", to: "2026-10-31" });
    expect(sanitizeDateRange("2026-10-21", "2026-10-19")).toEqual({ from: "2026-10-19", to: "2026-10-21" });
  });

  it("preserves valid in-order ranges", () => {
    expect(sanitizeDateRange("2026-10-01", "2026-10-31")).toEqual({ from: "2026-10-01", to: "2026-10-31" });
  });
});

describe("CSV Export Formatting & Sanitization", () => {
  it("formats valid ISO timestamp to YYYY-MM-DD HH:mm:ss.sss UTC", () => {
    expect(formatWitnessUtc("2026-10-29T04:29:19.974Z")).toBe("2026-10-29 04:29:19.974 UTC");
    expect(formatWitnessUtc("2026-01-01T00:00:00.000Z")).toBe("2026-01-01 00:00:00.000 UTC");
  });

  it("handles undefined, empty, or invalid timestamps gracefully", () => {
    expect(formatWitnessUtc(undefined)).toBe("Not recorded");
    expect(formatWitnessUtc("")).toBe("Not recorded");
    expect(formatWitnessUtc("invalid-iso-string")).toBe("Invalid time");
  });

  it("wraps strings in double quotes and escapes embedded quotes", () => {
    expect(csvCell('Hello "World"')).toBe('"Hello ""World"""');
    expect(csvCell('Quote "A" and "B"')).toBe('"Quote ""A"" and ""B"""');
  });

  it("preserves commas inside quoted fields without corrupting CSV columns", () => {
    expect(csvCell("Smith, John, Jr.")).toBe('"Smith, John, Jr."');
  });

  it("preserves Unix and Windows newlines inside quoted fields", () => {
    expect(csvCell("Line 1\nLine 2")).toBe('"Line 1\nLine 2"');
    expect(csvCell("Line 1\r\nLine 2")).toBe('"Line 1\r\nLine 2"');
  });

  it("neutralizes formula-like values to prevent spreadsheet code execution", () => {
    expect(csvCell("=SUM(A1:B10)")).toBe('"\'=SUM(A1:B10)"');
    expect(csvCell("+123456")).toBe('"\'\+123456"');
    expect(csvCell("-789012")).toBe('"\'\-789012"');
    expect(csvCell("@cmd")).toBe('"\'@cmd"');
  });

  it("neutralizes formula-like values preceded by whitespace or tabs", () => {
    expect(csvCell("   =1+1")).toBe('"\'   =1+1"');
    expect(csvCell("\t+cmd")).toBe('"\'\t+cmd"');
  });

  it("exports only non-authorizing receipt rows with BOM, formatted UTC timestamps and formula escaping", () => {
    const row = receipt("receipt-1", "2026-10-20T12:00:00.000Z", {
      witness_source: " =HYPERLINK(\"https://example.invalid\",\"click\")",
      witness_raw_value: "+2+2",
    });
    const csv = witnessReceiptsCsv([row]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("witness_time_utc");
    expect(csv).toContain("\"false\"");
    expect(csv).toContain("2026-10-20 12:00:00.000 UTC");
    expect(csv).toContain("\"' =HYPERLINK");
    expect(csv).toContain("'+2+2");
    expect(csv.split("\r\n").filter(Boolean)).toHaveLength(2);
  });
});

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

  it("rejects impossible dates without admitting receipts and handles open ranges", () => {
    const row = receipt("test", "2026-10-20T12:00:00.000Z");
    expect(localDayBound("2026-02-30", "start")).toBeNull();
    expect(filterByWitnessDate([row], "2026-02-30", "")).toEqual([]);
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
});
