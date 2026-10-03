import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateGapChecklist } from "./ai-review.server";
const s=(n:number)=>z.string().max(n).optional();
const inputSchema=z.object({receipt:z.object({result:z.enum(["exact_version_mismatch","missing_evidence","scope_separation_violation","stale_evidence","unverified_witness"]),truth_state:z.string().max(40),subject:z.string().max(2000),expected_version:z.string().max(3000),observed_version:z.string().max(3000),evidence_domain:z.string().max(40),next_gate:z.string().max(1000),field:s(200),expected_field_value:s(3000),observed_field_value:s(3000),witness_provider:s(100),witness_class:s(100),witness_scope:s(100)})});
export const generateEvidenceChecklist=createServerFn({method:"POST"}).validator((data)=>inputSchema.parse(data)).handler(async({data})=>generateGapChecklist(data));
