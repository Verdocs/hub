# sdk-sync pipeline

`.github/workflows/sdk-sync.yml` is what keeps `sdks/python` and `sdks/csharp` true to `packages/js-sdk` (the hand-maintained source of truth, per `multi-language-ci.md`). It runs on every push to `main` that touches `packages/js-sdk/src`, its generated-doc extractor, or its TSDoc/typedoc config. It never pushes to `main` directly and never publishes anything; `release.yml` is still the only, manual publish path.

## What it does, in order

1. **generate** - resets a long-lived `sdk-sync/main` branch from `main`, then runs a Claude Code agent against a prompt built from the diff plus pointers to the binding authority docs (see below). The agent ports the change into both languages, updates `sdks/parity/dispositions.json`, extends `packages/conformance/fixtures.json`, writes native doc comments, runs each language's own lint/build/test loop, and finishes by writing `sync-summary.json` at the repo root. Commits and pushes whatever it produced.
2. **verify** and **docs-sync** run in parallel once `generate` finishes:
   - **verify** runs every language's lint/build/test/conformance command (`scripts/sdk-sync/run-verify-lanes.mjs`) and uploads `verify-results.json` as a workflow artifact. It does not push anything.
   - **docs-sync** regenerates each language's `sdk-docs.json`, js-sdk's `unified-sdks.json`, and `sdks/API-PARITY.md`, then runs `scripts/sdk-sync/check-doc-parity.mjs` - a structural check that every operation the agent touched has a merged doc entry with a runnable example for every language it isn't marked `skipped`/`frozen` for. Commits regenerated files and uploads `docs-parity-results.json`.
3. **changelog** (after docs-sync) authors `.changeset/sdk-sync-<sha>.md` from `sync-summary.json`'s `changesetBumps`, if any package needs one.
4. **open-pr** (after verify and changelog) assembles the PR title/body from the three structured files (`scripts/sdk-sync/write-pr-body.mjs`) and opens or updates a PR from `sdk-sync/main` into `main`. Labeled `sdk-sync` always, plus `needs-attention` if any verify lane failed, any doc-parity check failed, the agent reported blockers, or it didn't produce a summary at all. This is the human review gate - nothing here merges on its own.

## Authority docs, in the order the agent is told to read them

1. `sdks/WIRE-NOTES.md` - wire truth beats js-sdk's own doc comments.
2. `sdks/PORTING-MAP.md` - naming/namespace/file-ownership contract.
3. `docs/standards/csharp.md` / `python.md` / `comments.md` - binding style.
4. `packages/conformance/docs/multi-language-ci.md` - how to extend fixtures and dispatch.
5. `sdks/API-PARITY.md` + `sdks/parity/dispositions.json` - current disposition per symbol.

If you change how porting should work, change these docs, not the workflow - the prompt only points at them, it doesn't duplicate their content.

## Why a bot-authored PR is fine here

CLAUDE.md rule 1 ("only the developer should commit or push new work") is about this repo's interactive Claude Code sessions, not about a reviewed CI bot. This pipeline never pushes to `main` and never merges its own PR; a human always has to approve it first, same as any other contributor.

## If something goes wrong

- **A run is stuck or you want to re-run it**: cancel the in-flight run in the Actions tab (the `sdk-sync` concurrency group serializes runs, so a stuck run blocks the next push's sync until it's cancelled), then re-push or re-trigger.
- **The PR is flagged (`needs-attention`)**: read the PR body - it lists exactly which verify lane failed, which operations are missing a doc entry or example, and anything the agent itself couldn't resolve. Fix by hand on the `sdk-sync/main` branch (or push a follow-up commit to it) and re-request review; the pipeline won't overwrite manual fixes unless another js-sdk change lands on `main` and re-triggers it (it resets the branch from `main` each time, so merge the PR before the next js-sdk push if you don't want manual fixes clobbered).
- **The agent is missing tools it needs**: `.github/workflows/sdk-sync.yml`'s `generate` job sets up pnpm/node/dotnet/python the same way `health_check.yml` does. If the agent can't run something, check that step first.
- **Nothing happened on a push that should have triggered it**: the workflow's `on.push.paths` filter only matches `packages/js-sdk/src/**`, `packages/js-sdk/generated/sdks/**`, and the TSDoc/typedoc config files. A change elsewhere in js-sdk (e.g. `package.json` alone) won't trigger it.

## Known open items

- `ANTHROPIC_API_KEY` is not yet in secrets; the `generate` job references it as a placeholder.
- The exact non-interactive permission flags for the Claude Code CLI invocation in the `generate` job are marked as unverified in the workflow's comments - confirm them against the current CLI docs before relying on this in production.
- No reviewer/team is configured yet (`SDK_SYNC_REVIEWERS` is empty in the workflow's `env:` block).
- Whether the default `GITHUB_TOKEN` has enough permission to push branches and open PRs depends on this repo's branch protection rules; a PAT may be needed instead.
