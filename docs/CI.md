# CI

## Github - Workflows

Checklist of workflow coverage needed across the monorepo. Checked items exist today (`health_check.yml`, `conformance.yml`, `nightly.yml`, `sdk-sync.yml`); unchecked items are gaps found while auditing the repo.

### JS/TS workspace (pnpm + turbo)

- [x] Lint / typecheck / test / build on push to `main` and on PRs (`health_check.yml`, `turbo run lint typecheck test build`)
- [x] `@verdocs/collections` schema check (`pnpm --filter @verdocs/collections check`)
- [x] JS SDK conformance on PRs to `main` (`conformance.yml`)
- [x] JS SDK conformance nightly (`nightly.yml`, 7am UTC)
- [ ] Angular SDK's test builder (`@angular/build:unit-test`) runs headless in CI today only because it's Vitest-based, not Karma, so it is worth a one-time confirmation run rather than an assumption
- [x] Path filtering / affected-only runs (turbo supports `--filter` on changed packages) so a docs-only or single-package PR doesn't rebuild everything. `health_check.yml` already does this on PRs (`--filter="...[origin/<base>]"`); push to `main` runs the full pipeline as the safety net



### Python SDK (`sdks/python`)

`sdks/python/package.json` wires `lint`, `typecheck`, `test`, and `conformance` into turbo, so `health_check.yml`'s `turbo run lint typecheck test build` on every push to `main` (and affected-only on PRs) already exercises all of them (`build` has nothing to do for an interpreted package and correctly no-ops). Confirmed with `pnpm exec turbo run lint typecheck test build --dry-run=json`, which schedules real commands for `python-sdk#lint` and `python-sdk#test` (and, since the typecheck fix below landed, `python-sdk#typecheck`).

- [x] Ruff lint on PRs and push to `main` (`health_check.yml` via turbo)
- [x] `mypy` typecheck on PRs and push to `main` (`health_check.yml` via turbo; closed gap - `pyproject.toml`'s `dev` group had no type checker until now, despite `docs/standards/python.md` rule 21 asserting `py.typed` support)
- [x] `pytest` unit suite on PRs (default `addopts` already excludes the `conformance` marker, so this is safe to run on every PR without secrets)
- [x] Gated conformance lane mirroring the JS SDK's nightly pattern (`pytest -m conformance`, needs the same `VERDOCS_CONFORMANCE_*` secrets style)



### C# SDK (`sdks/csharp`)

`sdks/csharp/package.json` wires `build` and `test` into turbo, both already running via `health_check.yml` today (confirmed via the same `--dry-run=json` check). `docs/standards/csharp.md` rule 24's "CI builds with `-warnaserror`" promise is implemented in `Directory.Build.props` (`TreatWarningsAsErrors` gated on the `CI` MSBuild property), which GitHub Actions sets automatically for every job - no separate `lint` script is needed or wired, since analyzers already run as part of `build` in CI.

- [x] `dotnet build` on PRs and push to `main`, analyzers-as-errors in CI (`Verdocs.Sdk.sln`, `Directory.Build.props`)
- [x] `dotnet test` unit suite on PRs and push to `main` (excluding the `Conformance` filter, so no secrets needed)
- [x] Gated conformance lane mirroring the JS SDK's nightly pattern (`dotnet test --filter FullyQualifiedName~Conformance`, needs `VERDOCS_CONFORMANCE=1` + the same secrets)



### SDK sync (`sdk-sync.yml`)

- [x] On push to `main` touching `packages/js-sdk`, an agent-driven pipeline ports the change into `sdks/python` and `sdks/csharp`, extends `packages/conformance/fixtures.json`, regenerates doc tags/`API-PARITY.md`, authors a changeset, and opens a PR for human review (never auto-merges, never publishes). See `packages/conformance/docs/sdk-sync-agent.md`.



### Docs generation (`generate:docs`, `generate-sdk-docs` turbo task)

The root `generate:docs` script and `js-sdk`'s `docs`/`generate-openapi`/`unify-sdks` scripts write output (`openapi.json`, `unified-sdks.json`, `sdk-docs.json`) directly into `../../../platform/apps/dev-docs/app/`, a sibling checkout of the private platform repo. The old per-package `generate-docs.yml` (deleted from `packages/js-sdk/.github/workflows/`) deployed to `gh-pages` and no longer reflects how docs are produced.

- [x] Decide if/how this should run in CI at all, since it needs a second repo checked out with write access. It may be intentionally local/manual-only, or may belong in the platform repo's own CI rather than this one
- [ ] If automated here, needs a path filter (`src/**`, `docs/**`, etc.) and a token/checkout step for the private repo



### Changesets

`.changeset/config.json` is configured (fixed groups for JS/Python/C#/conformance and for react/angular/vue/wc-sdk/storybook).

- [x] PR gate that fails if a PR touching a versioned package has no changeset (common `changeset status` check). Lightweight, and doesn't publish anything (`changeset-check.yml`)
- [x] Release automation (`changesets/action` opening a "Version Packages" PR on pushes to `main` that carry unreleased changesets, `changeset-release.yml`). Per `CLAUDE.md`, actual `npm publish` only happens when instructed, so this stops at opening the version PR and never auto-publishes



### Quickstarts (`apps/quickstart-*`)

- [x] `quickstart-angular` / `-react` / `-vue` / `-wc` already get lint/typecheck/build via the root turbo pipeline
- [ ] `quickstart-node`, `quickstart-python`, `quickstart-python-server`, `quickstart-csharp` have no lint/test/build scripts and no CI. Likely low priority since they're live-API demos, but flag whether even a smoke build/import check is wanted



### Housekeeping (not asked for, flagging as optional)

- [ ] Dependabot config (none currently exists)
- [x] PR template / issue templates (none currently exist)
- [ ] CODEOWNERS (none currently exists)