import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateClaimReview } from "./ai-review.server";
const inputSchema=z.object({claim:z.object({statement:z.string().min(1).max(2000),expected_version:z.string().max(3000),scope:z.string().max(100),evidence_domain:z.string().max(100)}),evidence:z.array(z.object({kind:z.string().max(200),description:z.string().max(2000),reference:z.string().max(1000),observed_version:z.string().max(3000),domain:z.string().max(100),scope:z.string().max(100).optional(),verification_class:z.string().max(100).optional()})).max(20)});
export const reviewClaimEvidence=createServerFn({method:"POST"}).validator((data)=>inputSchema.parse(data)).handler(async({data})=>generateClaimReview(data));
