import { Link, createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { RepositoryIntake } from "@/components/recon/RepositoryIntake";
import { Tag, TruthBadge } from "@/components/recon/StateBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useRecon } from "@/lib/recon/store";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

function AdminDashboard() {
  const auth = useAuth();
  const { state, ready, persistence, persistenceError, lastSavedAt } = useRecon();

  if (!auth.ready || !ready) return <p className="text-sm text-muted-foreground">Loading reviewer workspace…</p>;

  if (!auth.canReview) {
    return <div className="panel mx-auto max-w-xl space-y-3 p-5"><h1 className="text-xl font-bold">Reviewer authorization required</h1><p className="text-sm text-muted-foreground">Claims, evidence, receipts and reconciliation runs are not loaded until an authorized reviewer signs in.</p><Link to="/admin/login" className="inline-flex rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Reviewer login</Link></div>;
  }

  const stats = [
    ["Claims", state.claims.length],
    ["Evidence", state.evidence.length],
    ["Receipts", state.receipts.length],
    ["Reconciliation runs", state.runs.length],
  ] as const;

  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Exact Match control plane</p><h1 className="mt-1 text-2xl font-bold">Reviewer dashboard</h1><p className="mt-2 text-sm text-muted-foreground">{auth.user?.email ?? "Authorized reviewer"} · role {auth.role}</p></div>
      <div className="flex flex-wrap items-center gap-2"><span className="rounded border border-border px-3 py-2 text-xs">DB: <strong data-testid="admin-persistence-status">{persistence}</strong></span><Button type="button" variant="outline" onClick={async()=>{try{await auth.signOut();toast.success("Signed out");}catch(err){toast.error(err instanceof Error?err.message:"Sign out failed");}}}>Sign out</Button></div>
    </header>

    {persistence === "error" && <div role="alert" className="panel border-destructive/50 p-4 text-sm"><p className="font-semibold text-destructive">Persistence blocked</p><p className="mt-1 text-muted-foreground">{persistenceError}</p></div>}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label,value])=><div key={label} className="panel p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>)}</section>

    <div className="flex flex-wrap gap-2 text-xs"><Link to="/claims/new" className="rounded bg-primary px-3 py-2 font-semibold text-primary-foreground">Create claim</Link><Link to="/claims" className="rounded border border-border px-3 py-2 font-semibold">Manage claims</Link><Link to="/evidence" className="rounded border border-border px-3 py-2 font-semibold">Evidence</Link><Link to="/receipts" className="rounded border border-border px-3 py-2 font-semibold">Receipts</Link></div>

    <RepositoryIntake />

    <section className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-semibold">Claims</h2><span className="text-[11px] text-muted-foreground">last database save: {lastSavedAt ?? "not yet"}</span></div><div className="overflow-x-auto border border-border"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-secondary text-muted-foreground"><tr><th className="p-3">Claim</th><th className="p-3">Scope</th><th className="p-3">Expected</th><th className="p-3">State</th><th className="p-3">Evidence</th><th className="p-3">Receipts</th></tr></thead><tbody>{state.claims.map((claim)=>{const evidenceCount=state.evidence.filter((item)=>item.claim_id===claim.id).length;const receiptCount=state.receipts.filter((item)=>item.claim_id===claim.id).length;return <tr key={claim.id} className="border-t border-border"><td className="p-3"><Link to="/claims/$claimId" params={{claimId:claim.id}} className="font-medium text-primary underline">{claim.statement}</Link><p className="mt-1 font-mono text-[10px] text-muted-foreground">{claim.id}</p></td><td className="p-3"><Tag>{claim.scope}</Tag></td><td className="max-w-64 break-all p-3 font-mono">{claim.expected_version}</td><td className="p-3"><TruthBadge state={claim.truth_state}/></td><td className="p-3">{evidenceCount}</td><td className="p-3">{receiptCount}</td></tr>;})}</tbody></table></div>{state.claims.length===0&&<p className="text-sm text-muted-foreground">No reviewer claims are stored yet.</p>}</section>

    <section className="grid gap-4 xl:grid-cols-2">
      <div className="space-y-2"><h2 className="text-base font-semibold">Recent evidence</h2><ul className="space-y-2">{[...state.evidence].reverse().slice(0,8).map((item)=><li key={item.id} className="panel p-3 text-xs"><div className="flex justify-between gap-2"><span className="font-medium">{item.kind}</span><Tag>{item.domain}</Tag></div><p className="mt-1 break-all font-mono text-observed">{item.observed_version}</p><p className="mt-1 break-all text-muted-foreground">{item.reference}</p></li>)}</ul>{state.evidence.length===0&&<p className="text-sm text-muted-foreground">No evidence.</p>}</div>
      <div className="space-y-2"><h2 className="text-base font-semibold">Recent receipts</h2><ul className="space-y-2">{[...state.receipts].reverse().slice(0,8).map((receipt)=><li key={receipt.id} className="panel p-3 text-xs"><div className="flex flex-wrap justify-between gap-2"><code className="text-primary">{receipt.id}</code><TruthBadge state={receipt.truth_state}/></div><p className="mt-1">{receipt.result}</p><p className="mt-1 break-all text-muted-foreground">expected {receipt.expected_version} · observed {receipt.observed_version||"none"}</p></li>)}</ul>{state.receipts.length===0&&<p className="text-sm text-muted-foreground">No receipts.</p>}</div>
    </section>

    <section className="space-y-2"><h2 className="text-base font-semibold">Reconciliation runs</h2><div className="overflow-x-auto border border-border"><table className="w-full min-w-[620px] text-left text-xs"><thead className="bg-secondary text-muted-foreground"><tr><th className="p-3">Run</th><th className="p-3">Claim</th><th className="p-3">Started</th><th className="p-3">Receipts</th><th className="p-3">Result</th></tr></thead><tbody>{[...state.runs].reverse().map((run)=><tr key={run.id} className="border-t border-border"><td className="p-3 font-mono text-primary">{run.id}</td><td className="p-3 font-mono">{run.claim_id}</td><td className="p-3">{run.started_at}</td><td className="p-3">{run.receipt_ids.length}</td><td className="p-3"><TruthBadge state={run.resulting_truth_state}/></td></tr>)}</tbody></table></div>{state.runs.length===0&&<p className="text-sm text-muted-foreground">No reconciliation runs.</p>}</section>
  </div>;
}
