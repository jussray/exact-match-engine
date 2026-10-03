import type { AttackCard, Claim, ContinuityCookie, ContinuityRecord, Evidence, ReconOutcome, ReconciliationReceipt, ReconciliationRule, TruthState } from "./types";
import { classifyEvidence, normalizeValue, parseFields } from "./witness";

export function fingerprint(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 + c + 0x9e3779b9, 2654435761) >>> 0;
  }
  return h1.toString(16).padStart(8, "0").concat(h2.toString(16).padStart(8, "0")).toUpperCase();
}

const SEVERITY: Record<TruthState, number> = { VERIFIED:0, INFERRED:1, SUPERSEDED:2, UNKNOWN:3, BLOCKED:4 };
function worst(states: TruthState[]): TruthState { return states.reduce<TruthState>((acc,s)=>SEVERITY[s]>SEVERITY[acc]?s:acc,"VERIFIED"); }

export const DEFAULT_RULES: ReconciliationRule[] = [
  { id:"rule-exact-version", name:"Exact version match", description:"A claim may reach VERIFIED only when project-domain evidence in the claim's scope reports the exact expected version.", applies_to_scope:"any", on_exact_match:"VERIFIED", on_mismatch:"BLOCKED", on_missing_evidence:"UNKNOWN", world_evidence_can_verify_project:false },
  { id:"rule-runtime-strict", name:"Runtime / deployment strictness", description:"Runtime and deployment claims without project-domain evidence are BLOCKED, never UNKNOWN, because absence of runtime proof is itself a blocker.", applies_to_scope:"runtime", on_exact_match:"VERIFIED", on_mismatch:"BLOCKED", on_missing_evidence:"BLOCKED", world_evidence_can_verify_project:false },
  { id:"rule-deployment-strict", name:"Deployment strictness", description:"Deployment claims require project-domain deployment evidence or they are BLOCKED.", applies_to_scope:"deployment", on_exact_match:"VERIFIED", on_mismatch:"BLOCKED", on_missing_evidence:"BLOCKED", world_evidence_can_verify_project:false }
];

export function ruleForClaim(claim:Claim,rules:ReconciliationRule[]):ReconciliationRule { return rules.find((r)=>r.applies_to_scope===claim.scope)??rules.find((r)=>r.applies_to_scope==="any")??DEFAULT_RULES[0]!; }

export function reconcileClaim(claim:Claim,evidence:Evidence[],rules:ReconciliationRule[],observedAt:string):ReconOutcome {
  const rule=ruleForClaim(claim,rules);
  const mine=evidence.filter((e)=>e.claim_id===claim.id).slice().sort((a,b)=>a.id.localeCompare(b.id));
  const projectEvidence=mine.filter((e)=>e.domain==="project");
  const worldEvidence=mine.filter((e)=>e.domain==="world");
  const runId=`RUN-${fingerprint(claim.reconciliation_key+"|"+observedAt)}`;
  const receipts:ReconciliationReceipt[]=[]; const continuity:ContinuityRecord[]=[]; const cookies:ContinuityCookie[]=[]; const attacks:AttackCard[]=[];

  const emit=(args:{findingKey:string;result:ReconciliationReceipt["result"];truth_state:TruthState;observed_version:string;evidence_domain:ReconciliationReceipt["evidence_domain"];evidence_refs:string[];conflict_type:ContinuityRecord["conflict_type"];cookie_status:ContinuityCookie["status"];invalidation_reason:string;field?:string;expectedField?:string;observedField?:string;witness?:Evidence;attack?:{attack_class:AttackCard["attack_class"];question:string;required_evidence:string;priority_score:number;};})=>{
    const key=`${claim.reconciliation_key}::${args.findingKey}`;
    const stamp=fingerprint([key,claim.expected_version,args.observed_version,args.result,args.evidence_refs.join(","),args.witness?.id??"",args.witness?.scope??"",args.witness?.verification_class??"manual",args.witness?.retrieved_at??args.witness?.observed_at??"",args.witness?.as_of??args.witness?.observed_at??""].join("|"));
    const continuityId=`CONT-${stamp}`; const cookieId=`CKE-${stamp}`; const attackId=args.attack?`ATK-${stamp}`:null;
    continuity.push({id:continuityId,reconciliation_key:key,claim_id:claim.id,subject:claim.statement,expected_version:claim.expected_version,observed_version:args.observed_version,conflict_type:args.conflict_type,observed_state:args.truth_state,evidence_refs:args.evidence_refs,next_gate:claim.next_gate,observed_at:observedAt});
    cookies.push({id:cookieId,reconciliation_key:key,subject:claim.statement,expected_version:claim.expected_version,observed_version:args.observed_version,evidence_fingerprint:stamp,status:args.cookie_status,invalidation_reason:args.invalidation_reason,authorizing:false,standing_merge_authority:false,approval_carry_forward:false,observed_at:observedAt,next_gate:claim.next_gate});
    if(args.attack&&attackId){attacks.push({id:attackId,reconciliation_key:key,claim_id:claim.id,claim_under_attack:claim.statement,attack_class:args.attack.attack_class,question:args.attack.question,required_evidence:args.attack.required_evidence,pass_condition:`Project-domain evidence in scope "${claim.scope}" reports exactly ${claim.expected_version}.`,fail_condition:`Evidence reports a version other than ${claim.expected_version}.`,blocked_condition:"Required evidence cannot be observed read-only.",authority:"read_only",priority_score:args.attack.priority_score,status:"open",created_at:observedAt});}
    receipts.push({id:`RCP-${stamp}`,run_id:runId,reconciliation_key:key,claim_id:claim.id,subject:claim.statement,result:args.result,truth_state:args.truth_state,expected_version:claim.expected_version,observed_version:args.observed_version,evidence_domain:args.evidence_domain,evidence_refs:args.evidence_refs,attack_id:attackId,cookie_id:cookieId,continuity_id:continuityId,rule_id:rule.id,next_gate:claim.next_gate,created_at:observedAt,authorizing:false,...(args.field?{field:args.field}:{}),...(args.expectedField!==undefined?{expected_field_value:args.expectedField}:{}),...(args.observedField!==undefined?{observed_field_value:args.observedField}:{}),...(args.witness?{witness_provider:args.witness.provider??"manual",witness_source:args.witness.reference,witness_retrieved_at:args.witness.retrieved_at??args.witness.observed_at,witness_as_of:args.witness.as_of??args.witness.observed_at,witness_class:classifyEvidence(args.witness),witness_scope:args.witness.scope??"unspecified",witness_type:args.witness.witness_type??args.witness.kind,witness_raw_value:args.witness.observed_version,witness_normalized_value:args.observedField===undefined?"":normalizeValue(args.observedField),witness_confidence:classifyEvidence(args.witness)==="authoritative"?"direct" as const:"reported" as const}:{})});
  };

  const projectTruthRequired=claim.evidence_domain==="project";
  if(projectTruthRequired&&projectEvidence.length===0&&worldEvidence.length>0){for(const w of worldEvidence) emit({findingKey:`scope:${w.id}`,result:"scope_separation_violation",truth_state:rule.on_missing_evidence,observed_version:w.observed_version,evidence_domain:"world",evidence_refs:[w.reference],conflict_type:"missing_evidence",cookie_status:"blocked",invalidation_reason:"World-domain evidence cannot verify project-domain truth; project evidence still missing.",attack:{attack_class:"scope_promotion",question:`World evidence "${w.kind}" was offered for a project ${claim.scope} claim. Where is the project-domain proof?`,required_evidence:`Project-domain ${claim.scope} evidence reporting ${claim.expected_version}.`,priority_score:80}});}
  if(projectTruthRequired&&projectEvidence.length===0&&worldEvidence.length===0) emit({findingKey:"missing",result:"missing_evidence",truth_state:rule.on_missing_evidence,observed_version:"",evidence_domain:"none",evidence_refs:[],conflict_type:"missing_evidence",cookie_status:"blocked",invalidation_reason:"No evidence observed for this claim.",attack:{attack_class:"missing_evidence",question:`No evidence exists for "${claim.statement}". What observation would prove it?`,required_evidence:`Project-domain ${claim.scope} evidence reporting ${claim.expected_version}.`,priority_score:90}});
  if(!projectTruthRequired&&mine.length===0) emit({findingKey:"missing",result:"missing_evidence",truth_state:rule.on_missing_evidence,observed_version:"",evidence_domain:"none",evidence_refs:[],conflict_type:"missing_evidence",cookie_status:"blocked",invalidation_reason:"No evidence observed for this claim.",attack:{attack_class:"missing_evidence",question:`No evidence exists for "${claim.statement}". What observation would prove it?`,required_evidence:`Independent ${claim.scope} evidence reporting ${claim.expected_version}.`,priority_score:90}});

  const relevant=mine.filter((e)=>e.domain===claim.evidence_domain); const expectedFields=parseFields(claim.expected_version);
  for(const e of relevant){const observedFields=parseFields(e.observed_version);for(const [field,expected] of Object.entries(expectedFields)){const observed=observedFields[field];const age=Date.parse(observedAt)-Date.parse(e.as_of??e.observed_at);const details={field,expectedField:expected,observedField:observed??"",witness:e};
    if(observed===undefined) emit({...details,findingKey:`missing-field:${e.id}:${field}`,result:"missing_evidence",truth_state:rule.on_missing_evidence,observed_version:"",evidence_domain:e.domain,evidence_refs:[e.reference],conflict_type:"missing_evidence",cookie_status:"blocked",invalidation_reason:`Required field ${field} is absent.`,attack:{attack_class:"missing_evidence",question:`Where is independently observed ${field}?`,required_evidence:`Evidence for ${field}.`,priority_score:90}});
    else if(!Number.isFinite(age)||age<0||age>24*60*60*1000) emit({...details,findingKey:`stale:${e.id}:${field}`,result:"stale_evidence",truth_state:"BLOCKED",observed_version:e.observed_version,evidence_domain:e.domain,evidence_refs:[e.reference],conflict_type:"missing_evidence",cookie_status:"stale",invalidation_reason:`Evidence for ${field} is older than 24 hours or has an invalid timestamp.`,attack:{attack_class:"freshness",question:`Is ${field} still current?`,required_evidence:`Fresh observation of ${field}.`,priority_score:90}});
    else if(classifyEvidence(e)!=="authoritative"||e.scope!==claim.scope) emit({...details,findingKey:`unverified:${e.id}:${field}`,result:"unverified_witness",truth_state:"BLOCKED",observed_version:e.observed_version,evidence_domain:e.domain,evidence_refs:[e.reference],conflict_type:"missing_evidence",cookie_status:"blocked",invalidation_reason:`Witness class or scope cannot certify ${field} for ${claim.scope}; reported value ${observed} is not a verified comparison.`,attack:{attack_class:"authority",question:`Which independent source proves ${field}?`,required_evidence:`Direct authoritative observation of ${field}.`,priority_score:90}});
    else if(observed===expected) emit({...details,findingKey:`match:${e.id}:${field}`,result:"match",truth_state:rule.on_exact_match,observed_version:e.observed_version,evidence_domain:e.domain,evidence_refs:[e.reference],conflict_type:"none",cookie_status:"current",invalidation_reason:""});
    else emit({...details,findingKey:`mismatch:${e.id}:${field}`,result:"exact_version_mismatch",truth_state:rule.on_mismatch,observed_version:e.observed_version,evidence_domain:e.domain,evidence_refs:[e.reference],conflict_type:"exact_version_mismatch",cookie_status:"stale",invalidation_reason:`Expected ${claim.expected_version}, observed ${e.observed_version}.`,attack:{attack_class:"version",question:`Claim expects ${field} = ${expected} but ${e.kind} reports ${observed}. Which value is actually live?`,required_evidence:`Re-observed ${claim.scope} evidence at ${claim.expected_version}.`,priority_score:95}});
  }}
  const truth=worst(receipts.map((r)=>r.truth_state));
  return {run:{id:runId,claim_id:claim.id,reconciliation_key:claim.reconciliation_key,started_at:observedAt,receipt_ids:receipts.map((r)=>r.id),resulting_truth_state:truth},receipts,continuity,cookies,attacks,claim_truth_state:truth};
}

export function upsertById<T extends {id:string}>(existing:T[],incoming:T[]):T[]{const map=new Map(existing.map((x)=>[x.id,x]));for(const item of incoming)map.set(item.id,item);return Array.from(map.values());}
export function retainById<T extends {id:string}>(existing:T[],incoming:T[]):T[]{const map=new Map(existing.map((x)=>[x.id,x]));for(const item of incoming)if(!map.has(item.id))map.set(item.id,item);return Array.from(map.values());}
