import { describe,expect,it } from "vitest";
import { scannerStatus } from "./scanner-status";
import type { ReconciliationReceipt } from "./types";
const receipt=(result:ReconciliationReceipt["result"])=>({result}) as ReconciliationReceipt;
describe("scanner announcements",()=>{it.each([[[],"Awaiting comparison"],[[receipt("match")],"MATCH"],[[receipt("missing_evidence")],"MISSING"],[[receipt("stale_evidence")],"STALE"],[[receipt("unverified_witness")],"BLOCKED"],[[receipt("match"),receipt("exact_version_mismatch")],"MISMATCH"]] as const)("classifies %j as %s",(receipts,expected)=>{expect(scannerStatus([...receipts])).toBe(expected);});});
