# Exact Match Engine

**Claims to Reality.**

Exact Match Engine is a deterministic reconciliation product for comparing claimed state with independently observed evidence, field by field.

## Product contract

- No seeded `MATCH`, `VERIFIED`, authority, drift, hash, witness, or deployment state.
- Empty state is honest: if no claim/evidence comparison has run, the UI reports that it is awaiting comparison.
- AI-assisted review is advisory only. It cannot certify `MATCH`, create deterministic receipts, or become an authoritative witness by itself.
- Repository and external artifacts are discovery inputs until independently bound to a reconciliation scope.
- Mismatch, missing evidence, stale evidence, blocked witnesses, and scope-separation failures stay distinct.
- Receipts describe what the deterministic engine observed. They do not imply an external mutation, merge, deploy, spend, or publish action.

## Visual direction

The public product uses a precision verification-lab language: cyan for claimed state, violet for observed state, and explicit result states for `MATCH`, `MISMATCH`, `MISSING`, `STALE`, `BLOCKED`, or `Awaiting comparison`.

## Verification gate

Every push to `main` runs the GitHub `Verify` workflow: install, TypeScript typecheck, deterministic unit tests, and production build. A green workflow is required before treating the repository state as verified.

## Repository status

The complete customer-facing application is being restored here as the durable GitHub source. Internal portfolio labels are not part of the public product surface.

A rollback snapshot of the pre-repair `main` state is preserved at `snapshot/pre-canonical-sync-20261002`.
