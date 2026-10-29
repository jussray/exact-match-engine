import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download, RotateCcw, Fingerprint, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReconciliationReceipt } from "@/lib/recon/types";
import {
  filterByWitnessDate,
  formatWitnessTime,
  witnessTime,
  localDayBound,
  presetWitnessRange,
  witnessReceiptsCsv,
} from "@/lib/recon/provenance-filter";
import { deliverFile } from "@/lib/download";

function DateControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0">
      <label
        className="mb-2 block text-xs text-muted-foreground"
        htmlFor={`prov-${label.toLowerCase()}`}
      >
        {label}
      </label>
      <div className="flex h-10 items-center rounded-md border border-border bg-background">
        <input
          id={`prov-${label.toLowerCase()}`}
          aria-label={label}
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm"
          data-testid={`prov-${label.toLowerCase()}`}
        />
      </div>
    </div>
  );
}

export function ProvenanceFilter({
  receipts,
  from,
  to,
  onRangeChange,
}: {
  receipts: ReconciliationReceipt[];
  from: string;
  to: string;
  onRangeChange: (range: { from: string; to: string }) => void;
}) {
  const rows = [...filterByWitnessDate(receipts, from, to)].sort((a, b) =>
    witnessTime(b).localeCompare(witnessTime(a)),
  );
  const inverted = Boolean(from && to && from > to);
  const invalid = Boolean(
    (from && localDayBound(from, "start") === null) || (to && localDayBound(to, "end") === null),
  );
  const [exportError, setExportError] = useState("");
  return (
    <section className="border-t border-border py-12" aria-labelledby="prov-h">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs uppercase text-primary">
            <Fingerprint size={15} /> Witness provenance
          </p>
          <h2 id="prov-h" className="mt-2 font-display text-3xl">
            Receipts by witness date
          </h2>
        </div>
        <Button
          variant="outline"
          disabled={!rows.length}
          onClick={() => {
            setExportError("");
            void deliverFile(
              new Blob([witnessReceiptsCsv(rows)], { type: "text/csv;charset=utf-8" }),
              `witness-receipts-${from || "all"}-${to || "all"}.csv`,
            ).catch(() => setExportError("The download could not start. Please try again."));
          }}
        >
          <Download /> Export CSV
        </Button>
      </div>
      <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <div
            className="mb-5 flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Quick date ranges"
          >
            <span className="mr-2 text-xs text-muted-foreground">Quick range</span>
            {([7, 30, 90] as const).map((days) => {
              const range = presetWitnessRange(days);
              const active = from === range.from && to === range.to;
              return (
                <Button
                  key={days}
                  variant={active ? "default" : "outline"}
                  size="sm"
                  aria-pressed={active}
                  onClick={() => onRangeChange(range)}
                >
                  Last {days} days
                </Button>
              );
            })}
          </div>
          <form
            className="grid grid-cols-2 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
            aria-label="Filter receipts by witness date"
            onSubmit={(event) => event.preventDefault()}
          >
            <DateControl
              label="From"
              value={from}
              onChange={(value) => onRangeChange({ from: value, to })}
            />
            <DateControl
              label="To"
              value={to}
              onChange={(value) => onRangeChange({ from, to: value })}
            />
            <Button
              type="button"
              variant="ghost"
              disabled={!from && !to}
              onClick={() => onRangeChange({ from: "", to: "" })}
              className="col-span-2 sm:col-span-1"
            >
              <RotateCcw /> Reset
            </Button>
          </form>
          <p className="mt-4 text-xs text-muted-foreground" role="status" aria-live="polite">
            {invalid
              ? "Choose valid calendar dates to see receipts."
              : inverted
                ? "The From date is after the To date, so nothing can match."
                : `${rows.length} of ${receipts.length} receipts shown.`}
          </p>
          {exportError && (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {exportError}
            </p>
          )}
          {rows.length ? (
            <ul
              className="mt-4 divide-y divide-border border-y border-border"
              data-testid="prov-results"
            >
              {rows.map((r) => (
                <li
                  key={r.id}
                  className="grid min-w-0 gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
                >
                  <div className="min-w-0">
                    <Link
                      to="/claims/$claimId"
                      params={{ claimId: r.claim_id }}
                      className="break-all text-sm hover:text-primary"
                    >
                      <span className="text-primary">{r.field || "Receipt"}</span> ·{" "}
                      {r.result.replace(/_/g, " ")}
                    </Link>
                    <p className="mt-1 break-all text-[10px] text-muted-foreground">{r.id}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {r.witness_provider || "Provider not recorded"} ·{" "}
                      {r.witness_class || "Class not recorded"}
                      {r.witness_scope ? ` · ${r.witness_scope}` : ""}
                    </p>
                  </div>
                  <div className="min-w-0 text-xs sm:text-right">
                    <time dateTime={witnessTime(r)}>{formatWitnessTime(witnessTime(r))}</time>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {r.witness_retrieved_at
                        ? "Witness retrieved"
                        : "Receipt creation · retrieval not recorded"}
                    </p>
                    {r.witness_source &&
                      (/^https?:\/\//i.test(r.witness_source) ? (
                        <a
                          href={r.witness_source}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex max-w-full items-start gap-1 text-primary"
                        >
                          <span className="break-all">{r.witness_source}</span>
                          <ExternalLink size={12} className="shrink-0" />
                        </a>
                      ) : (
                        <p className="mt-2 break-all text-muted-foreground">{r.witness_source}</p>
                      ))}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p
              className="mt-5 border-l-2 border-primary py-2 pl-4 text-sm text-muted-foreground"
              data-testid="prov-empty"
            >
              {receipts.length
                ? "No receipts have a witness date in this range."
                : "Awaiting evidence. No receipts exist in this browser yet."}
            </p>
          )}
        </div>
        <aside className="border-l border-observed/50 pl-5 text-xs leading-6 text-muted-foreground">
          <h3 className="font-semibold text-foreground">Choose a witness date range</h3>
          <p className="mt-2">
            Choose From and To, or a quick range ending today. Both days are included in your time
            zone. Leave a date empty for no limit; Reset shows all receipts.
          </p>
          <p className="mt-3">
            Each result is a finding from reconciliation, dated when its witness was retrieved. If
            retrieval was not recorded, its receipt creation date is used.
          </p>
          <p className="mt-3">
            The page link restores your dates, not your records. CSV downloads include the shown
            receipts and UTC times. These records are browser-local and do not approve anything.
          </p>
        </aside>
      </div>
    </section>
  );
}
