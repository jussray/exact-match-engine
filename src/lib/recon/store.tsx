import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../auth";
import { supabase } from "../supabase";
import { DEFAULT_RULES, fingerprint, reconcileClaim, retainById, upsertById } from "./engine";
import type { Claim, Evidence, ReconOutcome, ReconState } from "./types";

const WORKSPACE_KEY = "exact-match";

export function emptyState(): ReconState {
  return { claims: [], evidence: [], receipts: [], runs: [], continuity: [], cookies: [], attacks: [], rules: DEFAULT_RULES };
}

export interface SessionRun {
  completed_at: string;
  receipts: { id: string; truth_state: string; result: string }[];
}

export type PersistenceStatus = "loading" | "unconfigured" | "unauthorized" | "saving" | "saved" | "error";

type RepositoryIntakeInput = {
  owner: string;
  repo: string;
  branch: string;
  expectedVersion: string;
  observedVersion: string;
  source: string;
  retrievedAt: string;
};

type RepositoryIntakeResult = {
  claim: Claim;
  evidence: Evidence;
  outcome: ReconOutcome;
};

interface Ctx {
  state: ReconState;
  sessionRun: SessionRun | null;
  ready: boolean;
  canReview: boolean;
  canMutate: boolean;
  persistence: PersistenceStatus;
  persistenceError: string;
  lastSavedAt: string | null;
  addClaim: (c: Omit<Claim, "id" | "created_at" | "truth_state">) => Claim;
  updateClaim: (id: string, patch: Partial<Claim>) => void;
  addEvidence: (e: Omit<Evidence, "id" | "observed_at">) => Evidence;
  reconcile: (claimId: string) => ReconOutcome | null;
  runRepositoryIntake: (input: RepositoryIntakeInput) => RepositoryIntakeResult;
  resolveAttack: (id: string) => void;
  reset: () => void;
}

const ReconContext = createContext<Ctx | null>(null);

function normalizePersistedState(value: unknown): ReconState {
  if (!value || typeof value !== "object") return emptyState();
  return { ...emptyState(), ...(value as Partial<ReconState>), rules: DEFAULT_RULES };
}

export function ReconProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [state, setState] = useState<ReconState>(() => emptyState());
  const [hydrated, setHydrated] = useState(false);
  const [backendLoaded, setBackendLoaded] = useState(false);
  const [sessionRun, setSessionRun] = useState<SessionRun | null>(null);
  const [persistence, setPersistence] = useState<PersistenceStatus>("loading");
  const [persistenceError, setPersistenceError] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const saveChain = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!auth.ready) return;

    setSessionRun(null);
    setPersistenceError("");
    setLastSavedAt(null);
    setBackendLoaded(false);

    if (!supabase) {
      setState(emptyState());
      setPersistence("unconfigured");
      setHydrated(true);
      return;
    }

    if (!auth.canReview) {
      setState(emptyState());
      setPersistence("unauthorized");
      setHydrated(true);
      return;
    }

    let cancelled = false;
    setHydrated(false);
    setPersistence("loading");

    void supabase
      .from("recon_workspace_state")
      .select("state,updated_at")
      .eq("workspace_key", WORKSPACE_KEY)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setState(emptyState());
          setPersistence("error");
          setPersistenceError(error.message);
          setHydrated(true);
          return;
        }
        const row = data as { state?: unknown; updated_at?: string } | null;
        setState(normalizePersistedState(row?.state));
        setLastSavedAt(row?.updated_at ?? null);
        setBackendLoaded(true);
        setPersistence("saved");
        setHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, [auth.ready, auth.canReview, auth.user?.id]);

  useEffect(() => {
    const db = supabase;
    if (!hydrated || !backendLoaded || !auth.canReview || !db) return;
    const snapshot = state;
    const updatedBy = auth.user?.id ?? null;
    setPersistence("saving");

    saveChain.current = saveChain.current.then(async () => {
      const { error } = await db.from("recon_workspace_state").upsert(
        {
          workspace_key: WORKSPACE_KEY,
          state: snapshot,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy,
        },
        { onConflict: "workspace_key" },
      );

      if (error) {
        setPersistence("error");
        setPersistenceError(error.message);
        return;
      }

      setPersistenceError("");
      setPersistence("saved");
      setLastSavedAt(new Date().toISOString());
    });
  }, [state, hydrated, backendLoaded, auth.canReview, auth.user?.id]);

  const canMutate = auth.canReview && backendLoaded && persistence !== "error";

  const requireWritable = useCallback(() => {
    if (!auth.canReview) throw new Error("Reviewer authorization is required.");
    if (!backendLoaded || !supabase) throw new Error("Exact Match database is not ready.");
    if (persistence === "error") throw new Error(`Exact Match persistence is blocked: ${persistenceError || "unknown database error"}`);
  }, [auth.canReview, backendLoaded, persistence, persistenceError]);

  const addClaim = useCallback<Ctx["addClaim"]>(
    (input) => {
      requireWritable();
      const now = new Date().toISOString();
      const claim: Claim = {
        ...input,
        id: `claim-${fingerprint(input.reconciliation_key + now).slice(0, 10).toLowerCase()}`,
        truth_state: "UNKNOWN",
        created_at: now,
      };
      setState((s) => ({ ...s, claims: [...s.claims, claim] }));
      return claim;
    },
    [requireWritable],
  );

  const updateClaim = useCallback<Ctx["updateClaim"]>(
    (id, patch) => {
      requireWritable();
      setState((s) => {
        const previous = s.claims.find((c) => c.id === id);
        if (!previous) return s;
        const changed = ["expected_version", "scope", "evidence_domain", "reconciliation_key", "depends_on"].some(
          (key) => JSON.stringify(previous[key as keyof Claim]) !== JSON.stringify(patch[key as keyof Claim] ?? previous[key as keyof Claim]),
        );
        return {
          ...s,
          claims: s.claims.map((c) =>
            c.id === id
              ? { ...c, ...patch, ...(changed ? { truth_state: "UNKNOWN" as const, updated_at: new Date().toISOString() } : {}) }
              : c,
          ),
          cookies: changed
            ? s.cookies.map((c) =>
                c.reconciliation_key.startsWith(`${previous.reconciliation_key}::`) && c.status !== "superseded"
                  ? { ...c, status: "superseded" as const, invalidation_reason: "Claim definition changed; re-reconciliation required." }
                  : c,
              )
            : s.cookies,
        };
      });
    },
    [requireWritable],
  );

  const addEvidence = useCallback<Ctx["addEvidence"]>(
    (input) => {
      requireWritable();
      const now = new Date().toISOString();
      const evidence: Evidence = {
        ...input,
        id: `ev-${fingerprint(input.claim_id + input.reference + input.observed_version + now).slice(0, 10).toLowerCase()}`,
        observed_at: now,
      };
      setState((s) => ({ ...s, evidence: [...s.evidence, evidence] }));
      return evidence;
    },
    [requireWritable],
  );

  const reconcile = useCallback<Ctx["reconcile"]>(
    (claimId) => {
      requireWritable();
      const claim = state.claims.find((c) => c.id === claimId);
      if (!claim) return null;
      const result = reconcileClaim(claim, state.evidence, state.rules, new Date().toISOString());
      const newCookieIds = new Set(result.cookies.map((c) => c.id));
      setState((s) => ({
        ...s,
        claims: s.claims.map((c) => (c.id === claimId ? { ...c, truth_state: result.claim_truth_state } : c)),
        receipts: retainById(s.receipts, result.receipts),
        runs: upsertById(s.runs, [result.run]),
        continuity: upsertById(s.continuity, result.continuity),
        cookies: upsertById(
          s.cookies.map((c) =>
            c.reconciliation_key.startsWith(`${claim.reconciliation_key}::`) &&
            !newCookieIds.has(c.id) &&
            (c.status === "current" || c.status === "stale")
              ? { ...c, status: "superseded" as const, invalidation_reason: "Superseded by a newer reconciliation run." }
              : c,
          ),
          result.cookies,
        ),
        attacks: upsertById(s.attacks, result.attacks),
      }));
      if (result.receipts.length > 0) {
        setSessionRun({
          completed_at: new Date().toISOString(),
          receipts: result.receipts.map((r) => ({ id: r.id, truth_state: r.truth_state, result: r.result })),
        });
      }
      return result;
    },
    [requireWritable, state.claims, state.evidence, state.rules],
  );

  const runRepositoryIntake = useCallback<Ctx["runRepositoryIntake"]>(
    (input) => {
      requireWritable();
      const now = new Date().toISOString();
      const reconciliationKey = `github/${input.owner}/${input.repo}/${input.branch}`;
      const claim: Claim = {
        id: `claim-${fingerprint(reconciliationKey + input.expectedVersion + now).slice(0, 10).toLowerCase()}`,
        statement: `GitHub ${input.owner}/${input.repo}@${input.branch} matches the claimed head SHA`,
        truth_state: "UNKNOWN",
        scope: "repository",
        evidence_domain: "project",
        lane: "ultrathink-intake",
        expected_version: input.expectedVersion,
        reconciliation_key: reconciliationKey,
        depends_on: [],
        next_gate: "Re-observe the repository head when the branch changes.",
        created_at: now,
      };
      const evidence: Evidence = {
        id: `ev-${fingerprint(claim.id + input.source + input.observedVersion + now).slice(0, 10).toLowerCase()}`,
        claim_id: claim.id,
        domain: "project",
        kind: "GitHub branch head",
        description: `Direct GitHub observation of ${input.owner}/${input.repo} at ${input.branch}`,
        reference: input.source,
        observed_version: input.observedVersion,
        observed_at: now,
        reconciliation_key: reconciliationKey,
        provider: "github",
        retrieved_at: input.retrievedAt,
        as_of: input.retrievedAt,
        scope: "repository",
        witness_type: "branch head SHA",
        verification_class: "authoritative",
      };
      const evidenceForRun = [...state.evidence, evidence];
      const outcome = reconcileClaim(claim, evidenceForRun, state.rules, now);
      const finalClaim: Claim = { ...claim, truth_state: outcome.claim_truth_state };
      const newCookieIds = new Set(outcome.cookies.map((c) => c.id));

      setState((s) => ({
        ...s,
        claims: [...s.claims, finalClaim],
        evidence: [...s.evidence, evidence],
        receipts: retainById(s.receipts, outcome.receipts),
        runs: upsertById(s.runs, [outcome.run]),
        continuity: upsertById(s.continuity, outcome.continuity),
        cookies: upsertById(
          s.cookies.map((c) =>
            c.reconciliation_key.startsWith(`${claim.reconciliation_key}::`) &&
            !newCookieIds.has(c.id) &&
            (c.status === "current" || c.status === "stale")
              ? { ...c, status: "superseded" as const, invalidation_reason: "Superseded by a newer reconciliation run." }
              : c,
          ),
          outcome.cookies,
        ),
        attacks: upsertById(s.attacks, outcome.attacks),
      }));

      if (outcome.receipts.length > 0) {
        setSessionRun({
          completed_at: now,
          receipts: outcome.receipts.map((r) => ({ id: r.id, truth_state: r.truth_state, result: r.result })),
        });
      }

      return { claim: finalClaim, evidence, outcome };
    },
    [requireWritable, state.evidence, state.rules],
  );

  const resolveAttack = useCallback<Ctx["resolveAttack"]>(
    (id) => {
      requireWritable();
      setState((s) => ({ ...s, attacks: s.attacks.map((a) => (a.id === id ? { ...a, status: "resolved" } : a)) }));
    },
    [requireWritable],
  );

  const reset = useCallback(() => {
    requireWritable();
    setState(emptyState());
    setSessionRun(null);
  }, [requireWritable]);

  const value = useMemo<Ctx>(
    () => ({
      state,
      sessionRun,
      ready: auth.ready && hydrated,
      canReview: auth.canReview,
      canMutate,
      persistence,
      persistenceError,
      lastSavedAt,
      addClaim,
      updateClaim,
      addEvidence,
      reconcile,
      runRepositoryIntake,
      resolveAttack,
      reset,
    }),
    [
      state,
      sessionRun,
      auth.ready,
      auth.canReview,
      hydrated,
      canMutate,
      persistence,
      persistenceError,
      lastSavedAt,
      addClaim,
      updateClaim,
      addEvidence,
      reconcile,
      runRepositoryIntake,
      resolveAttack,
      reset,
    ],
  );

  return <ReconContext.Provider value={value}>{children}</ReconContext.Provider>;
}

export function useRecon(): Ctx {
  const ctx = useContext(ReconContext);
  if (!ctx) throw new Error("useRecon must be used inside ReconProvider");
  return ctx;
}
