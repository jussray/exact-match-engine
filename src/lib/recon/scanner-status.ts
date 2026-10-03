import type { ReconciliationReceipt } from "./types";

export type ScannerStatus = "Awaiting comparison" | "MATCH" | "MISMATCH" | "MISSING" | "STALE" | "BLOCKED";

export function scannerStatus(receipts: ReconciliationReceipt[]): ScannerStatus {
  if (!receipts.length) return "Awaiting comparison";
  if (receipts.some((r) => r.result === "exact_version_mismatch")) return "MISMATCH";
  if (receipts.some((r) => r.result === "stale_evidence")) return "STALE";
  if (receipts.some((r) => ["unverified_witness", "scope_separation_violation"].includes(r.result))) return "BLOCKED";
  if (receipts.some((r) => r.result === "missing_evidence")) return "MISSING";
  return receipts.every((r) => r.result === "match") ? "MATCH" : "BLOCKED";
}
