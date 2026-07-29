# CI

## Github - Workflows

Checklist of workflow coverage needed across the monorepo. Checked items exist today (`.github/workflows/ci.yml`, `conformance.yml`, `nightly.yml`); unchecked items are gaps found while auditing the repo.

### JS/TS workspace (pnpm + turbo)

- [x] Lint / typecheck / test / build on push to `main` and on PRs (`ci.yml`, `turbo run lint typecheck test build`)
- [x] `@verdocs/collections` schema check (`pnpm --filter @verdocs/collections check`)
- [x] JS SDK conformance on PRs to `main` (`conformance.yml`)
- [x] JS SDK conformance nightly (`nightly.yml`, 7am UTC)
- [ ] Angular SDK's test builder (`@angular/build:unit-test`) runs headless in CI today only because it's Vitest-based, not Karma — worth a one-time confirmation run rather than an assumption
- [ ] Path filtering / affected-only runs (turbo supports `--filter` on changed packages) so a docs-only or single-package PR doesn't rebuild everything — optional, only worth it if CI time becomes a problem



### Python SDK (`sdks/python`)

Currently **no CI runs at all** for this package. `sdks/python/package.json` only wires `generate-sdk-docs` and `conformance` into turbo, so `turbo run lint typecheck test build` silently no-ops for it.

- [x] Ruff lint on PRs
- [x] `pytest` unit suite on PRs (default `addopts` already excludes the `conformance` marker, so this is safe to run on every PR without secrets)
- [x] Gated conformance lane mirroring the JS SDK's nightly pattern (`pytest -m conformance`, needs the same `VERDOCS_CONFORMANCE_*` secrets style)



### C# SDK (`sdks/csharp`)

Also **no CI today**. `sdks/csharp/package.json` only wires `generate-sdk-docs` and `conformance`.

- [x] `dotnet build` on PRs (`Verdocs.Sdk.sln`)
- [x] `dotnet test` unit suite on PRs (excluding the `Conformance` filter, so no secrets needed)
- [x] Gated conformance lane mirroring the JS SDK's nightly pattern (`dotnet test --filter FullyQualifiedName~Conformance`, needs `VERDOCS_CONFORMANCE=1` + the same secrets)



### `packages/web-sdk` (frozen Stencil line)

This tree is npm-based and outside the pnpm workspace glob (its five sub-packages — `verdocs-web-sdk`, `-react`, `-vue`, `-angular`, `storybook` — each carry their own `package-lock.json`), so **turbo never touches it and it has zero CI today**. Per `CLAUDE.md` this line is bugfix-only and not to be modernized, but an untested frozen package is still a regression risk on the bugfixes it does get.

- [ ] Build + test workflow for `verdocs-web-sdk` (`stencil build`, `stencil test --spec`), scoped with a path filter so it only runs when `packages/web-sdk/**` changes
- [ ] Build workflow for `verdocs-web-sdk-react` / `-vue` / `-angular` wrapper packages (no test scripts exist for react/vue; angular's `test` script is a placeholder stub — build-only is the realistic bar here)
- [ ] Decide whether `storybook` sub-package needs a CI build check or is dev-only tooling



### Docs generation (`generate:docs`, `generate-sdk-docs` turbo task)

The root `generate:docs` script and `js-sdk`'s `docs`/`generate-openapi`/`unify-sdks` scripts write output (`openapi.json`, `unified-sdks.json`, `sdk-docs.json`) directly into `../../../platform/apps/dev-docs/app/` — a sibling checkout of the private platform repo. The old per-package `generate-docs.yml` (deleted from `packages/js-sdk/.github/workflows/`) deployed to `gh-pages` and no longer reflects how docs are produced.

- [ ] Decide if/how this should run in CI at all, since it needs a second repo checked out with write access — may be intentionally local/manual-only, or may belong in the platform repo's own CI rather than this one
- [ ] If automated here, needs a path filter (`src/**`, `docs/**`, etc.) and a token/checkout step for the private repo



### Changesets

`.changeset/config.json` is configured (fixed groups for JS/Python/C#/conformance and for react/angular/vue/wc-sdk/storybook), but no workflow uses it yet.

- [ ] PR gate that fails if a PR touching a versioned package has no changeset (common `changeset status` check) — lightweight, doesn't publish anything
- [ ] Release automation (e.g. `changesets/action` opening a "Version Packages" PR) — per `CLAUDE.md`, actual `npm publish` only happens when instructed, so at most this should stop at opening the version PR, never auto-publish



### Quickstarts (`apps/quickstart-*`)

- [x] `quickstart-angular` / `-react` / `-vue` / `-wc` already get lint/typecheck/build via the root turbo pipeline
- [ ] `quickstart-node`, `quickstart-python`, `quickstart-python-console`, `quickstart-csharp` have no lint/test/build scripts and no CI — likely low priority since they're live-API demos, but flag whether even a smoke build/import check is wanted



### Housekeeping (not asked for, flagging as optional)

- [ ] Dependabot config (none currently exists)
- [x] PR template / issue templates (none currently exist)
- [ ] CODEOWNERS (none currently exists)