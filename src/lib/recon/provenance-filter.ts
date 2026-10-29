import type { ReconciliationReceipt } from "./types";

/** Witness timestamp used for filtering: retrieval time, falling back to receipt creation. */
export function witnessTime(r: ReconciliationReceipt): string {
  return r.witness_retrieved_at || r.created_at;
}

/**
 * Convert a YYYY-MM-DD date (as typed in a date input, the reviewer's local calendar day)
 * into an inclusive UTC millisecond bound. `end` covers the whole local day.
 */
export function localDayBound(date: string, edge: "start" | "end"): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
  const day = new Date(0);
  day.setFullYear(y, mo, d);
  day.setHours(0, 0, 0, 0);
  if (day.getFullYear() !== y || day.getMonth() !== mo || day.getDate() !== d) return null;
  return edge === "start" ? day.getTime() : day.setHours(23, 59, 59, 999);
}

/** Inclusive filter on witness time. Empty bounds are open. Invalid timestamps are excluded once any bound is set. */
export function filterByWitnessDate<T extends ReconciliationReceipt>(
  receipts: T[],
  from: string,
  to: string,
): T[] {
  const lo = from ? localDayBound(from, "start") : null;
  const hi = to ? localDayBound(to, "end") : null;
  if ((from && lo === null) || (to && hi === null)) return [];
  if (lo === null && hi === null) return receipts;
  return receipts.filter((r) => {
    const t = Date.parse(witnessTime(r));
    if (Number.isNaN(t)) return false;
    return (lo === null || t >= lo) && (hi === null || t <= hi);
  });
}

export function localDateString(date: Date): string {
  return `${date.getFullYear().toString().padStart(4, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}

/** Today and the preceding N-1 local calendar days, including DST transitions. */
export function presetWitnessRange(days: 7 | 30 | 90, now = new Date()) {
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  return { from: localDateString(start), to: localDateString(now) };
}

export function formatWitnessUtc(iso: string | undefined): string {
  if (!iso) return "Not recorded";
  const time = Date.parse(iso);
  return Number.isNaN(time)
    ? "Invalid time"
    : `${new Date(time).toISOString().replace("T", " ").replace("Z", "")} UTC`;
}

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  // Prevent spreadsheet formula execution, including formulas hidden behind whitespace.
  const safe = /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Export receipt snapshots only; never reach into mutable claim/evidence records. */
export function witnessReceiptsCsv(receipts: ReconciliationReceipt[]): string {
  const header = [
    "receipt_id",
    "run_id",
    "claim_id",
    "field",
    "result",
    "truth_state",
    "witness_time_utc",
    "witness_time_source",
    "provider",
    "source",
    "retrieved_at_utc",
    "as_of_utc",
    "scope",
    "witness_type",
    "verification_class",
    "confidence",
    "evidence_domain",
    "evidence_refs",
    "raw_value",
    "normalized_value",
    "authorizing",
  ];
  const rows = receipts.map((r) => [
    r.id,
    r.run_id,
    r.claim_id,
    r.field,
    r.result,
    r.truth_state,
    formatWitnessUtc(witnessTime(r)),
    r.witness_retrieved_at ? "witness_retrieved_at" : "receipt_created_at",
    r.witness_provider,
    r.witness_source,
    formatWitnessUtc(r.witness_retrieved_at),
    formatWitnessUtc(r.witness_as_of),
    r.witness_scope,
    r.witness_type,
    r.witness_class,
    r.witness_confidence,
    r.evidence_domain,
    r.evidence_refs.join("; "),
    r.witness_raw_value,
    r.witness_normalized_value,
    "false",
  ]);
  return (
    "\uFEFF" + [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n"
  );
}

export function formatWitnessTime(iso: string | undefined): string {
  if (!iso) return "Not recorded";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "Invalid time";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(t);
}
