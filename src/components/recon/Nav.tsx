import { Link } from "@tanstack/react-router";
import { Search, UserRound, ShoppingBag, Settings2, ScanLine } from "lucide-react";
import { useAuth } from "@/lib/auth";

const links = [
  { to: "/", label: "Home" },
  { to: "/claims", label: "Claims" },
  { to: "/evidence", label: "Evidence" },
  { to: "/receipts", label: "Receipts" },
  { to: "/attacks", label: "Attacks" },
  { to: "/continuity", label: "Continuity" },
  { to: "/rules", label: "Rules" },
  { to: "/connectors", label: "Connectors" },
  { to: "/admin", label: "Admin" }
] as const;

export function Nav() {
  const auth = useAuth();
  return <>
    <div className="border-b border-border bg-background px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">CLAIM • CHECK • COMPARE • RECONCILE • PROVE <span className="mx-2 text-primary">|</span> EXACT EVIDENCE. REAL RESULTS.</div>
    <header className="relative z-20 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-4 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="Exact Match Engine home">
          <span className="flex size-10 items-center justify-center border border-primary text-primary"><ScanLine size={23}/></span>
          <span className="leading-tight"><strong className="block text-xs font-bold uppercase tracking-widest">Exact Match Engine</strong><span className="text-[10px] uppercase text-muted-foreground">Claims to reality</span></span>
        </Link>
        <nav aria-label="Main" className="hidden xl:block"><ul className="flex items-center gap-5">{links.map((l)=><li key={l.to}><Link to={l.to} activeOptions={{exact:l.to==="/"}} className="text-xs text-muted-foreground transition hover:text-primary" activeProps={{className:"text-primary"}}>{l.label}</Link></li>)}</ul></nav>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Link to="/claims" aria-label="Search claims" title="Search claims"><Search size={17}/></Link>
          <Link to={auth.canReview?"/admin":"/admin/login"} aria-label={auth.canReview?"Reviewer dashboard":"Reviewer login"} title={auth.canReview?`Reviewer: ${auth.user?.email??"authorized"}`:"Reviewer login"}><UserRound size={17}/></Link>
          <span title="Cart not configured" aria-label="Cart not configured"><ShoppingBag size={17}/></span>
          <Link to="/connectors" aria-label="Connector Center" title="Connector Center"><Settings2 size={17}/></Link>
        </div>
      </div>
      <nav aria-label="Module pages" className="overflow-x-auto border-t border-border px-4 xl:hidden"><ul className="mx-auto flex max-w-screen-2xl items-center gap-5 whitespace-nowrap py-3">{links.map((l)=><li key={l.to}><Link to={l.to} className="text-xs text-muted-foreground" activeProps={{className:"text-primary"}}>{l.label}</Link></li>)}</ul></nav>
    </header>
  </>;
}
