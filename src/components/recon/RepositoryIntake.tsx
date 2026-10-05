import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { readGitHubHead } from "@/lib/recon/github.functions";
import { useRecon } from "@/lib/recon/store";
import { TruthBadge } from "./StateBadge";

const field = "w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground";

type Observation = { sha: string; source: string; retrieved_at: string };

export function RepositoryIntake() {
  const readHead = useServerFn(readGitHubHead);
  const { runRepositoryIntake, canMutate, persistence } = useRecon();
  const [repo, setRepo] = useState("jussray/ULTRATHINK-");
  const [branch, setBranch] = useState("main");
  const [expected, setExpected] = useState("");
  const [observation, setObservation] = useState<Observation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastRun, setLastRun] = useState<ReturnType<typeof runRepositoryIntake> | null>(null);

  const parseRepo = () => {
    const parts = repo.trim().replace(/^https:\/\/github\.com\//, "").replace(/\.git$/, "").split("/");
    return parts.length === 2 && parts.every(Boolean) ? { owner: parts[0], repo: parts[1] } : null;
  };

  async function observe() {
    const parsed = parseRepo();
    if (!parsed) {
      setError("Enter a GitHub repository as owner/repo.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await readHead({ data: { ...parsed, branch } });
      setObservation(result);
      setExpected((current) => current || result.sha);
      setLastRun(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "GitHub observation failed.");
    } finally {
      setBusy(false);
    }
  }

  function run() {
    const parsed = parseRepo();
    if (!parsed || !observation || !expected.trim()) return;
    try {
      const result = runRepositoryIntake({
        ...parsed,
        branch,
        expectedVersion: expected.trim(),
        observedVersion: observation.sha,
        source: observation.source,
        retrievedAt: observation.retrieved_at,
      });
      setLastRun(result);
      toast.success(`${result.outcome.receipts.length} receipt(s) · ${result.outcome.claim_truth_state}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Repository intake failed.";
      setError(message);
      toast.error(message);
    }
  }

  const firstReceipt = lastRun?.outcome.receipts[0];

  return (
    <section className="panel space-y-4 p-4" data-testid="repository-intake">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">ULTRATHINK intake</p>
        <h2 className="mt-1 text-base font-semibold">Repository claim → evidence → reconciliation → receipt</h2>
        <p className="mt-1 text-xs text-muted-foreground">The default target is the real public ULTRATHINK repository. Private repositories require a server-side GITHUB_TOKEN.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
        <label className="text-xs text-muted-foreground">Repository
          <input className={`${field} mt-1`} value={repo} onChange={(event) => { setRepo(event.target.value); setObservation(null); setLastRun(null); }} />
        </label>
        <label className="text-xs text-muted-foreground">Branch
          <input className={`${field} mt-1`} value={branch} onChange={(event) => { setBranch(event.target.value); setObservation(null); setLastRun(null); }} />
        </label>
        <Button type="button" onClick={() => void observe()} disabled={busy || !canMutate} className="self-end">
          {busy ? "Observing…" : "Observe head"}
        </Button>
      </div>

      <label className="block text-xs text-muted-foreground">Claimed head SHA
        <input className={`${field} mt-1 font-mono`} value={expected} onChange={(event) => { setExpected(event.target.value); setLastRun(null); }} placeholder="Observe first, or enter a claimed 40-character SHA" />
      </label>

      {observation && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded border border-border p-3 text-xs">
            <p className="text-muted-foreground">Observed GitHub head</p>
            <p className="mt-1 break-all font-mono text-observed">{observation.sha}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">as of {observation.retrieved_at}</p>
          </div>
          <div className="rounded border border-border p-3 text-xs">
            <p className="text-muted-foreground">Evidence checklist</p>
            <ul className="mt-2 space-y-1">
              <li>✓ repository + branch bound</li>
              <li>✓ direct GitHub witness captured</li>
              <li>{lastRun ? "✓" : "○"} deterministic reconciliation run</li>
              <li>{firstReceipt ? "✓" : "○"} receipt produced</li>
              <li>{persistence === "saved" ? "✓" : "○"} database state saved</li>
            </ul>
          </div>
        </div>
      )}

      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={run} disabled={!canMutate || !observation || !expected.trim()} data-testid="run-repository-intake">Run claim and reconcile</Button>
        <span className="text-xs text-muted-foreground">persistence: <strong data-testid="persistence-status">{persistence}</strong></span>
      </div>

      {lastRun && (
        <div className="rounded border border-border p-4" data-testid="intake-findings">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Findings</h3>
            <TruthBadge state={lastRun.outcome.claim_truth_state} />
          </div>
          <dl className="mt-3 grid gap-2 text-xs md:grid-cols-2">
            <div><dt className="text-muted-foreground">Expected</dt><dd className="break-all font-mono">{lastRun.claim.expected_version}</dd></div>
            <div><dt className="text-muted-foreground">Observed</dt><dd className="break-all font-mono text-observed">{lastRun.evidence.observed_version}</dd></div>
            <div><dt className="text-muted-foreground">Receipts</dt><dd>{lastRun.outcome.receipts.length}</dd></div>
            <div><dt className="text-muted-foreground">Result</dt><dd>{firstReceipt?.result ?? "no receipt"}</dd></div>
          </dl>
          <Link to="/claims/$claimId" params={{ claimId: lastRun.claim.id }} className="mt-3 inline-flex text-xs font-semibold text-primary underline">Open claim evidence + findings</Link>
        </div>
      )}
    </section>
  );
}
