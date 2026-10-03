import { describe,expect,it } from "vitest";
import { DEFAULT_RULES,reconcileClaim,retainById } from "./engine";
import type { Claim,Evidence } from "./types";
const AT="2026-09-10T00:00:00.000Z";
function claim(patch:Partial<Claim>={}):Claim{return {id:"c1",statement:"Component ships at v1.0.0",truth_state:"UNKNOWN",scope:"repository",evidence_domain:"project",lane:"core",expected_version:"v1.0.0",reconciliation_key:"core/repo",depends_on:[],next_gate:"Human review",created_at:AT,...patch};}
function evidence(patch:Partial<Evidence>={}):Evidence{return {id:"e1",claim_id:"c1",domain:"project",kind:"repo tag",description:"tag",reference:"repo://tag",observed_version:"v1.0.0",observed_at:AT,reconciliation_key:"core/repo",verification_class:"authoritative",scope:"repository",...patch};}
describe("reconcileClaim",()=>{
  it("verifies exact authoritative scoped evidence",()=>{const r=reconcileClaim(claim(),[evidence()],DEFAULT_RULES,AT);expect(r.receipts[0]!.result).toBe("match");expect(r.claim_truth_state).toBe("VERIFIED");});
  it("emits mismatch receipt and blocker",()=>{const r=reconcileClaim(claim(),[evidence({observed_version:"v0.9.0"})],DEFAULT_RULES,AT);expect(r.receipts[0]!.result).toBe("exact_version_mismatch");expect(r.claim_truth_state).toBe("BLOCKED");expect(r.attacks[0]!.attack_class).toBe("version");});
  it("never passes missing evidence",()=>{const r=reconcileClaim(claim(),[],DEFAULT_RULES,AT);expect(r.receipts[0]!.result).toBe("missing_evidence");expect(r.claim_truth_state).toBe("UNKNOWN");});
  it("blocks runtime claims with no project evidence",()=>{expect(reconcileClaim(claim({scope:"runtime"}),[],DEFAULT_RULES,AT).claim_truth_state).toBe("BLOCKED");});
  it("refuses world evidence for project truth",()=>{const r=reconcileClaim(claim(),[evidence({domain:"world"})],DEFAULT_RULES,AT);expect(r.receipts[0]!.result).toBe("scope_separation_violation");expect(r.claim_truth_state).not.toBe("VERIFIED");});
  it("does not let manual/discovery/wrong scope certify",()=>{for(const patch of [{verification_class:"manual" as const},{verification_class:"discovery" as const,provider:"openai"},{scope:"runtime" as const}]){const r=reconcileClaim(claim(),[evidence({...patch,observed_version:"v2"})],DEFAULT_RULES,AT);expect(r.receipts[0]?.result).toBe("unverified_witness");expect(r.claim_truth_state).toBe("BLOCKED");}});
  it("emits non-authorizing proof only",()=>{const r=reconcileClaim(claim(),[evidence()],DEFAULT_RULES,AT);expect(r.cookies[0]!.authorizing).toBe(false);expect(r.cookies[0]!.standing_merge_authority).toBe(false);expect(r.receipts[0]!.authorizing).toBe(false);});
  it("retains first identical receipt snapshot",()=>{const first=reconcileClaim(claim(),[evidence()],DEFAULT_RULES,AT);const later=reconcileClaim(claim(),[evidence()],DEFAULT_RULES,"2026-09-10T01:00:00.000Z");const ledger=retainById(first.receipts,later.receipts);expect(ledger).toHaveLength(1);expect(ledger[0]).toEqual(first.receipts[0]);});
  it("keeps independent failures separate",()=>{const r=reconcileClaim(claim(),[evidence({id:"e1",observed_version:"v0.9.0",reference:"repo://a"}),evidence({id:"e2",observed_version:"v0.8.0",reference:"repo://b"})],DEFAULT_RULES,AT);expect(r.receipts).toHaveLength(2);expect(new Set(r.receipts.map((x)=>x.id)).size).toBe(2);});
});
