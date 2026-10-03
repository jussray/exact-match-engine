import { useState } from "react";
import { Link, createFileRoute, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ClaimAiReview } from "@/components/recon/ClaimAiReview";
import { ClaimForm } from "@/components/recon/ClaimForm";
import { EvidenceForm } from "@/components/recon/EvidenceForm";
import { GitHubWitness } from "@/components/recon/GitHubWitness";
import { ReceiptGapChecklist } from "@/components/recon/ReceiptGapChecklist";
import { CookieBadge, Tag, TruthBadge } from "@/components/recon/StateBadge";
import { TesterLoop } from "@/components/recon/TesterLoop";
import { ruleForClaim } from "@/lib/recon/engine";
import { useRecon } from "@/lib/recon/store";
import { parseFields } from "@/lib/recon/witness";

export const Route = createFileRoute("/claims/$claimId")({ component: ClaimDetail });

function ClaimDetail() {
  const { claimId } = useParams({ from: "/claims/$claimId" });
  const { state, updateClaim, reconcile } = useRecon();
  const [editing, setEditing] = useState(false);
  const claim = state.claims.find((c) => c.id === claimId);
  if (!claim) return <div className="space-y-3"><h1 className="text-xl font-bold">Claim not found</h1><Link to="/claims" className="text-sm text-primary underline">Back to claims</Link></div>;

  const evidence = state.evidence.filter((e) => e.claim_id === claim.id);
  const receipts = state.receipts.filter((r) => r.claim_id === claim.id);
  const attacks = state.attacks.filter((a) => a.claim_id === claim.id && a.status === "open");
  const cookies = state.cookies.filter((c) => c.reconciliation_key.startsWith(`${claim.reconciliation_key}::`));
  const rule = ruleForClaim(claim, state.rules);

  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-xl font-bold">{claim.statement}</h1><p className="mt-1 text-xs text-muted-foreground">{claim.id} · key {claim.reconciliation_key} · rule {rule.id}</p></div><TruthBadge state={claim.truth_state}/></div>
    <div className="flex flex-wrap gap-1.5"><Tag>scope: {claim.scope}</Tag><Tag>evidence domain: {claim.evidence_domain}</Tag><Tag>lane: {claim.lane || "—"}</Tag><Tag>expects: {claim.expected_version}</Tag><Tag>next gate: {claim.next_gate || "—"}</Tag></div>

    <section className="panel space-y-3 p-4"><h2 className="text-sm font-semibold">Reconcile</h2><div className="grid gap-2 sm:grid-cols-3"><div className="rounded border border-border p-3"><p className="text-[11px] text-muted-foreground">Expected version</p><p className="break-all text-sm font-semibold">{claim.expected_version}</p></div><div className="rounded border border-border p-3"><p className="text-[11px] text-muted-foreground">Observed versions</p><p className="break-all text-sm font-semibold">{evidence.length ? evidence.map((e)=>e.observed_version).join(", ") : "none"}</p></div><div className="rounded border border-border p-3"><p className="text-[11px] text-muted-foreground">Evidence domains</p><p className="text-sm font-semibold">{evidence.length ? Array.from(new Set(evidence.map((e)=>e.domain))).join(", ") : "none"}</p></div></div>
      <div className="overflow-x-auto border border-border" data-testid="field-comparison"><table className="w-full min-w-[480px] text-left text-xs"><thead className="bg-secondary text-muted-foreground"><tr><th className="p-3">Field</th><th className="p-3">Claimed</th><th className="p-3">Observed</th><th className="p-3">Finding</th></tr></thead><tbody>{Object.entries(parseFields(claim.expected_version)).map(([field, expected])=>{const actual=evidence.map((e)=>parseFields(e.observed_version)[field]).filter((v)=>v!==undefined);const finding=[...receipts].reverse().find((r)=>r.field===field&&r.expected_version===claim.expected_version&&r.reconciliation_key.startsWith(`${claim.reconciliation_key}::`)&&(!claim.updated_at||r.created_at>=claim.updated_at));return <tr key={field} className="border-t border-border"><td className="p-3 font-mono text-primary">{field}</td><td className="break-all p-3">{expected}</td><td className="break-all p-3 text-observed">{actual.join(", ")||"Awaiting evidence"}</td><td className={`p-3 font-bold ${finding?.result==="exact_version_mismatch"?"text-destructive":"text-muted-foreground"}`}>{finding?finding.result.replaceAll("_"," ").toUpperCase():"Awaiting comparison"}</td></tr>;})}</tbody></table></div>
      <Button data-testid="reconcile" onClick={()=>{const out=reconcile(claim.id);if(out)toast.success(`${out.receipts.length} receipt(s) · ${out.claim_truth_state}`);}}>Run reconciliation</Button><p className="text-[11px] text-muted-foreground">Read-only. Produces receipts, continuity records and cookies; grants no authority.</p>
    </section>

    <ClaimAiReview claim={claim} evidence={evidence}/><ReceiptGapChecklist receipts={receipts}/><TesterLoop/>

    <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Claim definition</h2><button onClick={()=>setEditing((v)=>!v)} className="rounded border border-border px-3 py-1.5 text-xs hover:bg-secondary">{editing?"Cancel":"Edit claim"}</button></div>{editing&&<ClaimForm initial={claim} submitLabel="Save claim" onSubmit={(draft)=>{updateClaim(claim.id,draft);setEditing(false);toast.success("Claim updated. Re-reconcile to refresh proof.");}}/>}</section>

    <section className="space-y-3"><h2 className="text-sm font-semibold">Attach evidence</h2><EvidenceForm claimId={claim.id} lockClaim/><GitHubWitness claimId={claim.id}/><ul className="grid gap-2 sm:grid-cols-2">{evidence.map((e)=><li key={e.id} className="panel space-y-1 p-3 text-xs"><div className="flex items-center justify-between gap-2"><span>{e.kind}</span><Tag>{e.domain}</Tag></div><p className="break-all text-muted-foreground">observed {e.observed_version} · {e.reference}</p></li>)}</ul></section>

    <section className="space-y-2"><h2 className="text-sm font-semibold">Receipts ({receipts.length})</h2><ul className="grid gap-2" data-testid="claim-receipts">{receipts.map((r)=><li key={r.id} className="panel space-y-1 p-3 text-xs" data-testid="claim-receipt"><div className="flex flex-wrap items-center justify-between gap-2"><code className="text-primary">{r.id}</code><div className="flex gap-1.5"><Tag>{r.result}</Tag><TruthBadge state={r.truth_state}/></div></div><p className="text-muted-foreground">expected {r.expected_version} · observed {r.observed_version||"none"} · domain {r.evidence_domain}</p>{r.field&&<p className="font-mono text-xs">{r.field}: {r.expected_field_value} → <span className={r.result==="exact_version_mismatch"?"text-destructive":"text-observed"}>{r.observed_field_value||"missing"}</span></p>}{r.witness_provider&&<p className="break-all text-muted-foreground">Witness: {r.witness_provider} · {r.witness_class} · {r.witness_source} · as of {r.witness_as_of}</p>}</li>)}</ul>{receipts.length===0&&<p className="text-xs text-muted-foreground">No receipts yet.</p>}</section>

    <section className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><h2 className="text-sm font-semibold">Open attacks ({attacks.length})</h2>{attacks.map((a)=><div key={a.id} className="panel space-y-1 p-3 text-xs"><Tag>{a.attack_class}</Tag><p>{a.question}</p></div>)}{attacks.length===0&&<p className="text-xs text-muted-foreground">None.</p>}</div><div className="space-y-2"><h2 className="text-sm font-semibold">Cookies ({cookies.length})</h2>{cookies.map((c)=><div key={c.id} className="panel space-y-1 p-3 text-xs"><div className="flex items-center justify-between gap-2"><code className="text-muted-foreground">{c.id}</code><CookieBadge status={c.status}/></div><p className="text-muted-foreground">{c.invalidation_reason||"No conflict."}</p></div>)}{cookies.length===0&&<p className="text-xs text-muted-foreground">None.</p>}</div></section>
  </div>;
}
