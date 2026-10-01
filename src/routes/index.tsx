import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Crosshair,
  ScanLine,
  ShieldCheck,
  Radio,
  FileCheck2,
  Cpu,
  Layers,
  Activity,
  Flame,
  CheckCircle2,
  Search,
  Lock
} from "lucide-react";
import { useRecon } from "@/lib/recon/store";
import { TesterLoop } from "@/components/recon/TesterLoop";
import { TruthBadge } from "@/components/recon/StateBadge";
import { parseFields } from "@/lib/recon/witness";
import { ReactorScene } from "@/components/recon/ReactorScene";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Exact Match Engine — Claims to Reality" },
      {
        name: "description",
        content: "Autonomous field-by-field truth reconciliation. Verify that observed reality matches claimed specification.",
      },
      { property: "og:title", content: "Exact Match Engine — Claims to Reality" },
      {
        property: "og:description",
        content: "Autonomous field-by-field truth reconciliation. Verify that observed reality matches claimed specification.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const features = [
  { to: "/", name: "Dashboard", index: "01", description: "Real-time state comparison & engine telemetry" },
  { to: "/claims", name: "Claims", index: "02", description: "Expected state schemas, authorities & specifications" },
  { to: "/evidence", name: "Evidence", index: "03", description: "Independently gathered witness data & proofs" },
  { to: "/claims", name: "Reconciliation", index: "04", description: "Field-by-field diff engine & mismatch isolation" },
  { to: "/attacks", name: "Attacks", index: "05", description: "Independent adversarial challenges & boundary probes" },
  { to: "/continuity", name: "Continuity", index: "06", description: "Cryptographic lineage, proof cookies & drift prevention" },
  { to: "/receipts", name: "Receipts", index: "07", description: "Immutable cryptographic ledger of comparison findings" },
] as const;

function Dashboard() {
  const { state } = useRecon();
  const currentReceipts = state.receipts.filter((r) => {
    const owner = state.claims.find((c) => c.id === r.claim_id);
    return (
      owner &&
      r.expected_version === owner.expected_version &&
      r.reconciliation_key.startsWith(`${owner.reconciliation_key}::`) &&
      (!owner.updated_at || r.created_at >= owner.updated_at)
    );
  });
  const recent = [...currentReceipts].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  const activeReceipts = recent ? currentReceipts.filter((r) => r.run_id === recent.run_id) : [];
  const latest = activeReceipts.find((r) => r.result === "exact_version_mismatch") ?? recent;
  const claim = latest ? state.claims.find((c) => c.id === latest.claim_id) : undefined;
  const claimed = claim ? parseFields(claim.expected_version) : null;
  const observed = latest ? parseFields(latest.observed_version || "") : null;
  const mismatchedFields = new Set(
    activeReceipts.filter((r) => r.result === "exact_version_mismatch").map((r) => r.field),
  );
  const runResult = activeReceipts.some((r) => r.result === "exact_version_mismatch")
    ? "MISMATCH"
    : activeReceipts.some(
          (r) =>
            r.result === "stale_evidence" ||
            (r.witness_as_of && Date.now() - Date.parse(r.witness_as_of) > 24 * 60 * 60 * 1000),
        )
      ? "STALE"
      : activeReceipts.some(
            (r) => r.result === "unverified_witness" || r.result === "scope_separation_violation",
          )
        ? "BLOCKED"
        : activeReceipts.some((r) => r.result === "missing_evidence")
          ? "MISSING"
          : latest
            ? "MATCH"
            : "Awaiting comparison";

  const matchedCount = currentReceipts.filter((r) => r.result === "match").length;
  const mismatchedCount = currentReceipts.filter((r) => r.result === "exact_version_mismatch").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Top Cyber Ribbon */}
      <div className="border-b border-cyan-900/40 bg-slate-900/80 px-4 py-2 font-mono text-[11px] text-cyan-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>EXACT MATCH ENGINE // QUANTUM PROOF PROTOCOL</span>
          </div>
          <div className="hidden items-center gap-6 sm:flex">
            <span>DRIFT: 0.00%</span>
            <span>SPEC: RFC-9122</span>
            <span>AUTHORITY: FOUNDER VERIFIED</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Branding */}
        <header className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-950/60 px-4 py-1.5 text-xs font-mono text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <ScanLine className="h-3.5 w-3.5 text-cyan-400" />
            <span>EXACT SPECIFICATION RECONCILIATION</span>
          </div>
          <h1 className="font-mono text-4xl font-extrabold tracking-tight text-white uppercase sm:text-5xl lg:text-6xl">
            EXACT MATCH ENGINE
          </h1>
          <p className="mx-auto max-w-2xl font-mono text-sm text-slate-400 sm:text-base">
            Autonomous field-by-field truth reconciliation. Verify that observed reality matches claimed specification with cryptographic proof.
          </p>
        </header>

        {/* Dynamic Holographic Reactor Scene */}
        <ReactorScene
          runResult={runResult}
          mismatchedCount={mismatchedCount}
          matchedCount={matchedCount}
          totalClaims={state.claims.length}
          latestClaimId={claim?.id}
        />

        {/* 6 Cyber Module Cards Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-cyan-900/40 pb-3">
            <h2 className="font-mono text-lg font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              CORE ENGINE MODULES
            </h2>
            <span className="font-mono text-xs text-slate-400">06 ACTIVE SUBSYSTEMS</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.slice(0, 6).map((feat) => (
              <Link
                key={feat.index}
                to={feat.to}
                className="group relative overflow-hidden rounded-xl border border-cyan-900/40 bg-slate-900/50 p-5 backdrop-blur transition-all duration-200 hover:border-cyan-400/60 hover:bg-slate-900/80 hover:shadow-[0_0_25px_rgba(6,182,212,0.18)]"
              >
                <div className="flex items-center justify-between font-mono text-xs text-cyan-400 mb-3">
                  <span className="rounded bg-cyan-950/80 px-2 py-0.5 border border-cyan-800/40">
                    {feat.index}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cyan-300" />
                </div>
                <h3 className="font-mono text-base font-bold uppercase tracking-wide text-white group-hover:text-cyan-200">
                  {feat.name}
                </h3>
                <p className="mt-2 font-mono text-xs text-slate-400 leading-relaxed">
                  {feat.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Interactive Reconciliation Tester Loop (Functional Contract Preserved) */}
        <section className="rounded-2xl border border-cyan-900/50 bg-slate-900/40 p-6 backdrop-blur">
          <div className="mb-6 flex items-center justify-between border-b border-cyan-900/30 pb-4">
            <div>
              <h2 className="font-mono text-lg font-bold uppercase text-white flex items-center gap-2">
                <Crosshair className="h-5 w-5 text-cyan-400" />
                RECONCILIATION TEST HARNESS
              </h2>
              <p className="font-mono text-xs text-slate-400 mt-1">
                Field-level verification against live and mocked external witnesses.
              </p>
            </div>
            <TruthBadge state={claim?.truth_state ?? "UNKNOWN"} />
          </div>

          <TesterLoop />
        </section>
      </div>
    </div>
  );
}
