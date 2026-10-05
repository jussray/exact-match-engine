import { useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin/login")({ component: AdminLogin });

const field = "w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground";

function AdminLogin() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!auth.ready) return <p className="text-sm text-muted-foreground">Checking reviewer access…</p>;

  if (auth.canReview) {
    return <div className="panel mx-auto max-w-lg space-y-3 p-5"><h1 className="text-xl font-bold">Reviewer session active</h1><p className="text-sm text-muted-foreground">Signed in as {auth.user?.email ?? "authorized reviewer"}.</p><Link to="/admin" className="inline-flex rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Open admin dashboard</Link></div>;
  }

  return <div className="mx-auto max-w-lg space-y-4">
    <div><p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Reviewer access</p><h1 className="mt-1 text-xl font-bold">Admin login</h1><p className="mt-2 text-sm text-muted-foreground">There is no public sign-up. Only accounts with an Exact Match <code>admin</code> or <code>reviewer</code> role in trusted app metadata can mutate proof state.</p></div>

    {!auth.configured && <div className="panel border-destructive/50 p-4 text-sm"><p className="font-semibold text-destructive">Backend not configured</p><p className="mt-2 text-muted-foreground">Provision an Exact Match-owned Supabase project, apply <code>infra/supabase/recon_persistence.sql</code>, then configure <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>.</p></div>}

    <form className="panel space-y-4 p-5" onSubmit={async (event) => {
      event.preventDefault();
      setBusy(true);
      setError("");
      try {
        await auth.signIn(email.trim(), password);
        toast.success("Reviewer authenticated");
        await navigate({ to: "/admin" });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Login failed.";
        setError(message);
      } finally {
        setBusy(false);
      }
    }}>
      <label className="block text-xs text-muted-foreground">Email<input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className={`${field} mt-1`} /></label>
      <label className="block text-xs text-muted-foreground">Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className={`${field} mt-1`} /></label>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      <Button type="submit" disabled={busy || !auth.configured}>{busy ? "Signing in…" : "Sign in"}</Button>
    </form>
  </div>;
}
