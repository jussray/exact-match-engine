import { createContext,useCallback,useContext,useEffect,useMemo,useState,type ReactNode } from "react";
import { DEFAULT_RULES,fingerprint,reconcileClaim,retainById,upsertById } from "./engine";
import type { Claim,Evidence,ReconOutcome,ReconState } from "./types";

const STORAGE_KEY="recon-state-v2";
export function emptyState():ReconState{return {claims:[],evidence:[],receipts:[],runs:[],continuity:[],cookies:[],attacks:[],rules:DEFAULT_RULES};}
function load():ReconState{if(typeof window==="undefined")return emptyState();try{const raw=window.localStorage.getItem(STORAGE_KEY);if(!raw)return emptyState();const parsed=JSON.parse(raw) as ReconState;return {...emptyState(),...parsed,rules:DEFAULT_RULES};}catch{return emptyState();}}
export interface SessionRun{completed_at:string;receipts:{id:string;truth_state:string;result:string}[];}
interface Ctx{state:ReconState;sessionRun:SessionRun|null;addClaim:(c:Omit<Claim,"id"|"created_at"|"truth_state">)=>Claim;updateClaim:(id:string,patch:Partial<Claim>)=>void;addEvidence:(e:Omit<Evidence,"id"|"observed_at">)=>Evidence;reconcile:(claimId:string)=>ReconOutcome|null;resolveAttack:(id:string)=>void;reset:()=>void;}
const ReconContext=createContext<Ctx|null>(null);

export function ReconProvider({children}:{children:ReactNode}){
  const [state,setState]=useState<ReconState>(()=>emptyState()); const [hydrated,setHydrated]=useState(false); const [sessionRun,setSessionRun]=useState<SessionRun|null>(null);
  useEffect(()=>{setState(load());setHydrated(true);},[]);
  useEffect(()=>{if(hydrated)window.localStorage.setItem(STORAGE_KEY,JSON.stringify(state));},[state,hydrated]);
  const addClaim=useCallback<Ctx["addClaim"]>((input)=>{const now=new Date().toISOString();const claim:Claim={...input,id:`claim-${fingerprint(input.reconciliation_key+now).slice(0,10).toLowerCase()}`,truth_state:"UNKNOWN",created_at:now};setState((s)=>({...s,claims:[...s.claims,claim]}));return claim;},[]);
  const updateClaim=useCallback<Ctx["updateClaim"]>((id,patch)=>{setState((s)=>{const previous=s.claims.find((c)=>c.id===id);if(!previous)return s;const changed=["expected_version","scope","evidence_domain","reconciliation_key","depends_on"].some((key)=>JSON.stringify(previous[key as keyof Claim])!==JSON.stringify(patch[key as keyof Claim]??previous[key as keyof Claim]));return {...s,claims:s.claims.map((c)=>c.id===id?{...c,...patch,...(changed?{truth_state:"UNKNOWN" as const,updated_at:new Date().toISOString()}: {})}:c),cookies:changed?s.cookies.map((c)=>c.reconciliation_key.startsWith(`${previous.reconciliation_key}::`)&&c.status!=="superseded"?{...c,status:"superseded" as const,invalidation_reason:"Claim definition changed; re-reconciliation required."}:c):s.cookies};});},[]);
  const addEvidence=useCallback<Ctx["addEvidence"]>((input)=>{const now=new Date().toISOString();const ev:Evidence={...input,id:`ev-${fingerprint(input.claim_id+input.reference+input.observed_version+now).slice(0,10).toLowerCase()}`,observed_at:now};setState((s)=>({...s,evidence:[...s.evidence,ev]}));return ev;},[]);
  const reconcile=useCallback<Ctx["reconcile"]>((claimId)=>{const claim=state.claims.find((c)=>c.id===claimId);if(!claim)return null;const res=reconcileClaim(claim,state.evidence,state.rules,new Date().toISOString());const newCookieIds=new Set(res.cookies.map((c)=>c.id));setState((s)=>({...s,claims:s.claims.map((c)=>c.id===claimId?{...c,truth_state:res.claim_truth_state}:c),receipts:retainById(s.receipts,res.receipts),runs:upsertById(s.runs,[res.run]),continuity:upsertById(s.continuity,res.continuity),cookies:upsertById(s.cookies.map((c)=>c.reconciliation_key.startsWith(`${claim.reconciliation_key}::`)&&!newCookieIds.has(c.id)&&(c.status==="current"||c.status==="stale")?{...c,status:"superseded" as const,invalidation_reason:"Superseded by a newer reconciliation run."}:c),res.cookies),attacks:upsertById(s.attacks,res.attacks)}));if(res.receipts.length>0)setSessionRun({completed_at:new Date().toISOString(),receipts:res.receipts.map((r)=>({id:r.id,truth_state:r.truth_state,result:r.result}))});return res;},[state.claims,state.evidence,state.rules]);
  const resolveAttack=useCallback<Ctx["resolveAttack"]>((id)=>setState((s)=>({...s,attacks:s.attacks.map((a)=>a.id===id?{...a,status:"resolved"}:a)})),[]);
  const reset=useCallback(()=>{setState(emptyState());setSessionRun(null);},[]);
  const value=useMemo(()=>({state,sessionRun,addClaim,updateClaim,addEvidence,reconcile,resolveAttack,reset}),[state,sessionRun,addClaim,updateClaim,addEvidence,reconcile,resolveAttack,reset]);
  return <ReconContext.Provider value={value}>{children}</ReconContext.Provider>;
}
export function useRecon():Ctx{const ctx=useContext(ReconContext);if(!ctx)throw new Error("useRecon must be used inside ReconProvider");return ctx;}
