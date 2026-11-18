# Workers Builds verification run — 2026-11-18

Purpose: verify, through GitHub, whether Cloudflare is connected to this
repository — a push/PR must trigger the `Workers Builds: exact-match-engine`
check run from Cloudflare's GitHub integration.

- Probe type: docs-only, no code, no config changes.
- Expected witness: the check run appears on this PR's head commit with a
  details_url on Cloudflare's dashboard naming the build it created.
- This PR is a probe. It gets closed unmerged after the check runs are read.
