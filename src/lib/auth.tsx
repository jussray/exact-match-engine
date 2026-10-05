import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "./supabase";

export type ReviewerRole = "admin" | "reviewer";

type AuthContextValue = {
  ready: boolean;
  configured: boolean;
  user: User | null;
  role: ReviewerRole | null;
  canReview: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function reviewerRole(user: User | null): ReviewerRole | null {
  const role = user?.app_metadata?.["role"];
  return role === "admin" || role === "reviewer" ? role : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }

    let cancelled = false;
    void supabase.auth.getUser().then(({ data, error }) => {
      if (cancelled) return;
      setUser(error ? null : data.user);
      setReady(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) {
        setUser(session?.user ?? null);
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error("Exact Match persistence is not configured.");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const role = reviewerRole(data.user);
    if (!role) {
      await supabase.auth.signOut();
      throw new Error("This account is authenticated but is not an authorized Exact Match reviewer.");
    }
    setUser(data.user);
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) {
      setUser(null);
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  }, []);

  const role = reviewerRole(user);
  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      configured: supabaseConfigured,
      user,
      role,
      canReview: Boolean(user && role),
      signIn,
      signOut,
    }),
    [ready, user, role, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
