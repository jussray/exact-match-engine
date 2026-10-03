import type { Evidence, Claim } from "./types";

export type VerificationClass = "authoritative" | "manual" | "discovery";
export type ComparisonStatus = "MATCH" | "MISMATCH" | "MISSING" | "STALE" | "BLOCKED";
export type FieldObservation = { field:string; raw:string; normalized:string; provider:string; source:string; retrieved_at:string; as_of:string; scope:string; witness_type:string; confidence:"direct"|"reported"; verification_class:VerificationClass; };
export type FieldFinding = { field:string; expected:string; observed:string; status:ComparisonStatus; source:string; };

export function normalizeValue(value:string):string { return value.trim().normalize("NFC"); }
export function parseFields(value:string):Record<string,string> {
  try {
    const parsed:unknown = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const fields = Object.entries(parsed).filter((entry): entry is [string,string] => typeof entry[1] === "string");
      if (fields.length && fields.length === Object.keys(parsed).length && fields.every(([k]) => k.trim().length > 0) && new Set(fields.map(([k]) => k.trim())).size === fields.length) {
        return Object.fromEntries(fields.map(([k,v]) => [k, normalizeValue(v)]));
      }
    }
  } catch { /* scalar */ }
  return { version: normalizeValue(value) };
}
export function classifyEvidence(e:Evidence):VerificationClass { return e.verification_class ?? "manual"; }
export function observation(e:Evidence):FieldObservation[] { return Object.entries(parseFields(e.observed_version)).map(([field,normalized]) => ({ field, raw:e.observed_version, normalized, provider:e.provider??"manual", source:e.reference, retrieved_at:e.retrieved_at??e.observed_at, as_of:e.as_of??e.observed_at, scope:e.scope??"unspecified", witness_type:e.witness_type??e.kind, confidence:classifyEvidence(e)==="authoritative"?"direct":"reported", verification_class:classifyEvidence(e) })); }
export function compareFields(claim:Claim,evidence:Evidence[],now:string):FieldFinding[] {
  const expected=parseFields(claim.expected_version);
  const eligible=evidence.filter((e)=>e.domain===claim.evidence_domain&&e.scope===claim.scope&&classifyEvidence(e)==="authoritative");
  return Object.entries(expected).map(([field,value])=>{
    const observations=eligible.flatMap(observation).filter((o)=>o.field===field);
    if(!observations.length) return {field,expected:value,observed:"",status:evidence.length?"BLOCKED":"MISSING",source:""};
    const fresh=observations.filter((o)=>{const age=Date.parse(now)-Date.parse(o.as_of);return Number.isFinite(age)&&age>=0&&age<=24*60*60*1000;});
    if(!fresh.length) return {field,expected:value,observed:observations.map((o)=>o.normalized).join(", "),status:"STALE",source:observations.map((o)=>o.source).join(", ")};
    const conflicts=fresh.filter((o)=>o.normalized!==value);
    if(conflicts.length) return {field,expected:value,observed:conflicts.map((o)=>o.normalized).join(", "),status:"MISMATCH",source:conflicts.map((o)=>o.source).join(", ")};
    return {field,expected:value,observed:value,status:"MATCH",source:fresh.map((o)=>o.source).join(", ")};
  });
}

export const CONNECTORS = [
  { id:"github", name:"GitHub", role:"Deterministic witness", mode:"public-read" },
  { id:"http", name:"Live URL / HTTP", role:"Deterministic witness when version is directly observed", mode:"setup" },
  { id:"shopify", name:"Shopify", role:"Catalog witness when configured", mode:"setup" },
  { id:"openai", name:"OpenAI / ChatGPT", role:"Discovery and explanation only", mode:"available" },
  { id:"claude", name:"Anthropic Claude", role:"Discovery and explanation only", mode:"available" },
  { id:"gemini", name:"Google Gemini", role:"Discovery and explanation only", mode:"available" },
  { id:"perplexity", name:"Perplexity", role:"Discovery and explanation only", mode:"setup" },
  { id:"muse", name:"Meta Muse", role:"Discovery and explanation only", mode:"custom" }
] as const;

export function connectorStatus(mode:string,configured=false):"Connected"|"Available"|"Needs setup"|"Not configured" {
  if(mode==="public-read") return "Available";
  if(mode==="custom") return configured?"Connected":"Not configured";
  return configured?"Connected":mode==="available"?"Available":"Needs setup";
}
