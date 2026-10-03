import { createFileRoute,useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ClaimForm } from "@/components/recon/ClaimForm";
import { useRecon } from "@/lib/recon/store";
export const Route=createFileRoute("/claims/new")({component:NewClaim});
function NewClaim(){const {addClaim}=useRecon();const navigate=useNavigate();return <div className="space-y-4"><h1 className="text-xl font-bold">New claim</h1><ClaimForm submitLabel="Create claim" onSubmit={(draft)=>{const claim=addClaim(draft);toast.success("Claim created as UNKNOWN until evidence is reconciled");void navigate({to:"/claims/$claimId",params:{claimId:claim.id}});}}/></div>;}
