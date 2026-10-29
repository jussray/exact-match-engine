import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Crosshair,
  ScanLine,
  ShieldCheck,
  Radio,
  FileCheck2,
} from "lucide-react";
import labImage from "@/assets/verification-scanner.jpg";
import { useRecon } from "@/lib/recon/store";
import { TesterLoop } from "@/components/recon/TesterLoop";
import { ProvenanceFilter } from "@/components/recon/ProvenanceFilter";
import { TruthBadge } from "@/components/recon/StateBadge";
import { parseFields } from "@/lib/recon/witness";
import { Button } from "@/components/ui/button";
import { scannerStatus } from "@/lib/recon/scanner-status";
export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { from?: string; to?: string } => ({
    from: typeof search["from"] === "string" ? search["from"] : "",
    to: typeof search["to"] === "string" ? search["to"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Exact Match Engine — Claims to Reality" },
      {
        name: "description",
        content: "Compare claimed state with independently observed evidence, field by field.",
      },
      { property: "og:title", content: "Exact Match Engine — Claims to Reality" },
      {
        property: "og:description",
        content: "Compare claimed state with independently observed evidence, field by field.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});
const features = [
  { to: "/", name: "Dashboard", index: "01", description: "Current comparison state" },
  { to: "/claims", name: "Claims", index: "02", description: "Expected state & scope" },
  { to: "/evidence", name: "Evidence", index: "03", description: "Observed witness values" },
  { to: "/claims", name: "Reconciliation", index: "04", description: "Field-by-field comparison" },
  { to: "/attacks", name: "Attacks", index: "05", description: "Independent challenges" },
  { to: "/continuity", name: "Continuity", index: "06", description: "Stale proof & lineage" },
  { to: "/receipts", name: "Receipts", index: "07", description: "Traceable findings" },
] as const;
function Dashboard() {
  const { state } = useRecon();
  const { from = "", to = "" } = Route.useSearch();
  const navigate = Route.useNavigate();
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
  const runResult = scannerStatus(activeReceipts);
  const counts = [
    {
      label: "Awaiting proof",
      value: state.claims.filter((c) => c.truth_state === "UNKNOWN").length,
      to: "/claims",
    },
    {
      label: "Matched",
      value: currentReceipts.filter((r) => r.result === "match").length,
      to: "/receipts",
    },
    {
      label: "Mismatched",
      value: currentReceipts.filter((r) => r.result === "exact_version_mismatch").length,
      to: "/receipts",
    },
    {
      label: "Missing / blocked",
      value: currentReceipts.filter((r) =>
        [
          "missing_evidence",
          "scope_separation_violation",
          "stale_evidence",
          "unverified_witness",
        ].includes(r.result),
      ).length,
      to: "/receipts",
    },
    {
      label: "Stale cookies",
      value: state.cookies.filter((c) => c.status === "stale").length,
      to: "/continuity",
    },
    {
      label: "Open attacks",
      value: state.attacks.filter((a) => a.status === "open").length,
      to: "/attacks",
    },
  ] as const;
  return (
    <div className="space-y-0">
      <section
        className="relative isolate -mx-4 overflow-hidden border-b border-border lg:-mx-8"
        aria-label="Verification laboratory"
      >
        <img
          src={labImage}
          width={1536}
          height={1024}
          alt="Two glass witness chambers facing a precision scanning core"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-90"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background/95 via-background/60 to-background/20" />
        <div className="mx-auto grid min-h-[570px] max-w-screen-2xl items-center gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.1fr)] lg:py-16">
          <div className="max-w-xl">
            <p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase text-primary">
              <Crosshair size={15} /> No assumptions. Just evidence.
            </p>
            <h1 className="font-display text-5xl leading-[1.08] sm:text-6xl xl:text-7xl">
              Does It Exactly
              <br />
              <em className="not-italic text-primary">Match Reality?</em>
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-foreground/80">
              The Exact Match Engine compares what is claimed against what is actually observed.
              Every field has a finding. Every finding has a traceable receipt.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 px-6">
                <Link to="/claims/new">
                  Run an Exact Match <ArrowRight size={16} />
                </Link>
              </Button>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 border border-border px-5 py-3 text-xs font-bold uppercase text-foreground hover:border-primary"
              >
                See How It Works <ArrowUpRight size={15} />
              </a>
            </div>
          </div>
          <div
            className="relative grid grid-cols-[minmax(0,1fr)_60px_minmax(0,1fr)] items-stretch gap-1 sm:grid-cols-[minmax(0,1fr)_88px_minmax(0,1fr)] sm:gap-3"
            data-testid="comparison-lab"
          >
            <div className="min-h-64 lab-lane-claimed border border-primary/70 bg-background/75 p-3 backdrop-blur-md sm:min-h-80 sm:p-5">
              <p className="text-xs font-bold uppercase text-primary sm:text-sm">
                01 / Claimed state
              </p>
              <p className="mt-2 text-[10px] text-muted-foreground">EXPECTED / ASSERTED</p>
              <dl className="mt-8 space-y-4">
                {claimed ? (
                  Object.entries(claimed).map(([k, v]) => (
                    <div key={k} className="border-b border-primary/30 pb-2">
                      <dt className="text-[10px] text-muted-foreground break-all">{k}</dt>
                      <dd className="mt-1 break-all font-mono text-xs text-primary">{v}</dd>
                    </div>
                  ))
                ) : (
                  <p className="text-xs leading-6 text-muted-foreground">Awaiting claim</p>
                )}
              </dl>
            </div>
            <div
              className="relative flex flex-col items-center justify-center gap-4 overflow-hidden border-x border-border/70 bg-background/70 text-center"
              aria-label="Comparison scanner"
            >
              <span className="absolute inset-x-0 top-0 h-px bg-primary/60" />
              <span className="absolute inset-x-0 bottom-0 h-px bg-observed/60" />
              <span className="h-12 w-px bg-primary/60 sm:h-16" />
              <span
                aria-hidden="true"
                className="scan-pulse flex size-11 items-center justify-center rounded-full border border-primary/70 bg-background text-primary scanner-glow sm:size-16"
              >
                <ScanLine size={28} strokeWidth={1.5} />
              </span>
              <span className="h-12 w-px bg-observed/60 sm:h-16" />
              <span
                aria-hidden="true"
                className="text-[9px] font-bold uppercase text-muted-foreground"
              >
                Scan
              </span>
            </div>
            <div className="min-h-64 lab-lane-observed border border-observed/70 bg-background/75 p-3 backdrop-blur-md sm:min-h-80 sm:p-5">
              <p className="text-xs font-bold uppercase text-observed sm:text-sm">
                02 / Observed state
              </p>
              <p className="mt-2 text-[10px] text-muted-foreground">WITNESS / EVIDENCE</p>
              <dl className="mt-8 space-y-4">
                {latest && observed ? (
                  Object.entries(observed).map(([k, v]) => (
                    <div
                      key={k}
                      className={`border-b pb-2 ${mismatchedFields.has(k) ? "border-destructive motion-safe:translate-x-1" : "border-observed/30"}`}
                    >
                      <dt className="text-[10px] text-muted-foreground break-all">{k}</dt>
                      <dd
                        className={`mt-1 break-all font-mono text-xs ${mismatchedFields.has(k) ? "text-destructive" : "text-observed"}`}
                      >
                        {v || "Not observed"}
                      </dd>
                    </div>
                  ))
                ) : (
                  <p className="text-xs leading-6 text-muted-foreground">Awaiting evidence</p>
                )}
              </dl>
            </div>
            <div
              className="col-span-3 mt-2 flex flex-wrap items-center justify-between gap-2 border border-border bg-background/90 px-4 py-3 text-xs"
              role="status"
              aria-live="polite"
              aria-atomic="true"
              aria-label={`Comparison status: ${runResult}`}
            >
              <span className="text-muted-foreground" aria-hidden="true">
                MATCH RESULT
              </span>
              <strong
                className={
                  runResult === "MATCH"
                    ? "text-verified"
                    : runResult === "MISMATCH"
                      ? "text-destructive"
                      : "text-unknown"
                }
              >
                {runResult === "MISMATCH"
                  ? `MISMATCH · ${[...mismatchedFields].join(", ")}`
                  : runResult}
              </strong>
            </div>
          </div>
        </div>
      </section>
      <section id="how-it-works" className="-mx-4 border-b border-border bg-surface lg:-mx-8">
        <div className="mx-auto grid max-w-screen-2xl grid-cols-1 divide-y divide-border px-4 sm:grid-cols-5 sm:divide-x sm:divide-y-0 lg:px-8">
          {[
            "Compare claims to reality",
            "Identify mismatches and gaps",
            "Verify with real evidence",
            "Resolve and document",
            "Move forward with confidence",
          ].map((s, i) => (
            <div key={s} className="flex items-center gap-3 px-3 py-5 text-xs">
              <span className="font-mono text-primary">0{i + 1}</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="py-12" aria-label="Current results">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase text-primary">Local workspace / browser-only</p>
            <h2 className="mt-2 font-display text-3xl">Current Results</h2>
          </div>
          <Link to="/claims/new" className="text-xs text-primary">
            New claim ↗
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-3 xl:grid-cols-6">
          {counts.map((c) => (
            <Link to={c.to} key={c.label} className="bg-background p-5 hover:bg-surface">
              <strong className="block text-2xl">{c.value}</strong>
              <span className="mt-2 block text-xs text-muted-foreground">{c.label}</span>
            </Link>
          ))}
        </div>
        {state.claims.length ? (
          <div className="mt-6 space-y-px bg-border">
            {state.claims.map((c) => (
              <Link
                key={c.id}
                to="/claims/$claimId"
                params={{ claimId: c.id }}
                className="flex flex-wrap items-center justify-between gap-3 bg-background p-4 text-sm hover:bg-surface"
              >
                <span className="min-w-0 break-words">{c.statement}</span>
                <TruthBadge state={c.truth_state} />
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-6 border-l-2 border-primary pl-4 text-sm text-muted-foreground">
            Awaiting evidence. No claims or results exist in this browser yet.
          </p>
        )}
      </section>
      <ProvenanceFilter
        receipts={state.receipts}
        from={from}
        to={to}
        onRangeChange={(range) => {
          void navigate({
            search: (previous) => ({ ...previous, ...range }),
            replace: false,
            resetScroll: false,
          });
        }}
      />
      <section className="border-t border-border py-12">
        <TesterLoop />
      </section>
      <section className="border-t border-border py-12">
        <p className="text-xs uppercase text-primary">System surfaces</p>
        <h2 className="mt-2 font-display text-3xl">The Verification Stack</h2>
        <div className="mt-6 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Link
              key={f.name}
              to={f.to}
              className="group flex min-h-40 flex-col justify-between bg-background p-5 hover:bg-surface"
            >
              <span className="text-xs text-primary">{f.index} / MODULE</span>
              <span>
                <strong className="block text-lg">{f.name}</strong>
                <small className="text-xs text-muted-foreground">{f.description}</small>
              </span>
              <ArrowUpRight
                size={16}
                className="self-end text-muted-foreground group-hover:text-primary"
              />
            </Link>
          ))}
        </div>
      </section>
      <section className="grid gap-6 border-t border-border py-12 md:grid-cols-3">
        {[
          {
            icon: ShieldCheck,
            title: "Deterministic Verification",
            body: "Exact field comparisons, not averaged confidence.",
          },
          {
            icon: Radio,
            title: "Works Across Your Tools",
            body: "Witness provenance is explicit. Connections are never assumed.",
          },
          {
            icon: FileCheck2,
            title: "Built for Real Work",
            body: "Distinct findings retain distinct, non-authorizing receipts.",
          },
        ].map((t) => (
          <div key={t.title} className="border-l border-border pl-5">
            <t.icon size={22} className="text-primary" />
            <h3 className="mt-4 font-semibold">{t.title}</h3>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">{t.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
