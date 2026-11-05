# Exact Match — blueprint restore + deploy-path diagnosis (2026-11-05)

## Canonical design spec

`docs/blueprints/exact-match-blueprint.jpg` is the founder-supplied reference
screenshot and is the canonical spec for the landing hero (machine artwork,
Claimed vs Observed panels with the six field rows, headline, footer line
"EXACT TRUTH. STRONGER DECISIONS. FAIRER OUTCOMES.").

Note: the blueprint's "98.7% MATCH" is design-mock state. Per the README the
product deliberately renders the honest empty state ("Awaiting comparison")
until a real comparison runs — do not seed a fake percentage.

## Restore (PR #5, merged 2026-11-05, merge `c788d39f`)

- New `src/components/recon/MachineBackdrop.tsx` — layered SVG machine
  (concentric claimed-cyan / observed-violet rings, tick ring, glowing core),
  aria-hidden, behind the hero panels on large screens.
- Hero panels' empty states now render the six blueprint field rows
  (deployment_sha, route, version, artifact, receipt, authority) with honest
  values ("Awaiting claim" / "Not observed").
- Footer line added to the root shell.
- Standing main failure fixed on the way: the e2e test "gracefully handles
  invalid query parameters" failed on unmodified main because
  `ProvenanceFilter`'s root element lacked `data-testid="provenance-filter"`.
  Fixed in the same PR; full e2e 28 passed / 2 skipped locally.

## Deploy-path diagnosis

The GitHub check "Workers Builds: exact-match-engine" fails in 0 seconds
(build never starts) on PR branches. Diagnosis via the Cloudflare API:
production does NOT deploy through that check. Production deploys by Worker
version upload (wrangler): deployments list shows v7 `58564ac2` (2026-11-02,
old main) replaced by v8 `b3ba67f6`, uploaded seconds after PR #5 merged —
the git pipeline deployed the merged code automatically. The failing check
is a GitHub-integration preview trigger; its root cause is still unknown
but it is deployment-irrelevant.

## Manual deploy tool

`scripts/deploy-worker-api.py` deploys this Worker through the Cloudflare
REST API (asset upload session → version upload → 100% deployment),
mirroring wrangler's configuration (main `index.mjs`, ASSETS binding,
compat date 2026-11-02, `nodejs_compat`). It was used to upload version v9
`ae3d3421` from the merged tree as a proof of the route; v9 was never
deployed because production v8 already carried the same code.

Rollback: redeploy v7 `58564ac2` via the deployments API.
