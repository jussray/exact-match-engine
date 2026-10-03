import { Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, FileCheck2, ScanLine } from "lucide-react";

interface ReactorSceneProps {
  runResult: string;
  mismatchedCount: number;
  matchedCount: number;
  totalClaims: number;
  latestClaimId?: string;
}

/**
 * Legacy visual shell retained for compatibility with earlier layouts.
 * It must never invent authority, drift, latency, witness, hash, or verification state.
 * All visible status comes from reconciliation state passed by the caller.
 */
export function ReactorScene({
  runResult,
  mismatchedCount,
  matchedCount,
  totalClaims,
  latestClaimId,
}: ReactorSceneProps) {
  const hasResult = runResult !== "Awaiting comparison";
  const isMatch = runResult === "MATCH";
  const isMismatch = runResult === "MISMATCH";

  return (
    <section className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-950/80 p-6 backdrop-blur-xl md:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_35%_45%,rgba(6,182,212,0.16),transparent_34%),radial-gradient(circle_at_70%_45%,rgba(168,85,247,0.16),transparent_34%)]"
      />

      <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px_minmax(0,1fr)]">
        <div className="border border-cyan-500/40 bg-slate-950/70 p-5">
          <p className="font-mono text-xs font-bold uppercase text-cyan-300">Claimed state</p>
          <dl className="mt-5 space-y-3 font-mono text-xs">
            <div className="flex justify-between gap-4 border-b border-slate-800 pb-2">
              <dt className="text-slate-500">Claims</dt>
              <dd className="text-cyan-200">{totalClaims}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-800 pb-2">
              <dt className="text-slate-500">Latest claim</dt>
              <dd className="max-w-[12rem] truncate text-cyan-200">{latestClaimId ?? "Awaiting claim"}</dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-col items-center justify-center border-x border-slate-800 bg-slate-950/60 px-4 py-8 text-center">
          <span className="flex size-16 items-center justify-center rounded-full border border-cyan-500/60 text-cyan-300 shadow-[0_0_24px_rgba(6,182,212,0.25)]">
            {isMismatch ? <AlertTriangle size={28} /> : isMatch ? <CheckCircle2 size={28} /> : <ScanLine size={28} />}
          </span>
          <strong className="mt-4 font-mono text-sm text-white">{runResult}</strong>
          <span className="mt-1 font-mono text-[10px] uppercase text-slate-500">
            {hasResult ? "Derived from current receipts" : "No comparison result yet"}
          </span>
        </div>

        <div className="border border-purple-500/40 bg-slate-950/70 p-5">
          <p className="font-mono text-xs font-bold uppercase text-purple-300">Observed state</p>
          <dl className="mt-5 space-y-3 font-mono text-xs">
            <div className="flex justify-between gap-4 border-b border-slate-800 pb-2">
              <dt className="text-slate-500">Matched findings</dt>
              <dd className="text-emerald-300">{matchedCount}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-800 pb-2">
              <dt className="text-slate-500">Mismatches</dt>
              <dd className={mismatchedCount ? "text-amber-300" : "text-slate-300"}>{mismatchedCount}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="relative z-10 mt-6 flex flex-wrap justify-center gap-3 border-t border-slate-800 pt-5">
        <Link
          to="/claims"
          className="inline-flex items-center gap-2 border border-cyan-500/60 bg-cyan-500/10 px-5 py-3 font-mono text-xs font-bold text-cyan-200 hover:bg-cyan-500/20"
        >
          <ScanLine size={15} /> Inspect claims
        </Link>
        <Link
          to="/receipts"
          className="inline-flex items-center gap-2 border border-slate-700 px-5 py-3 font-mono text-xs text-slate-300 hover:border-slate-500"
        >
          <FileCheck2 size={15} /> Inspect receipts
        </Link>
      </div>
    </section>
  );
}
