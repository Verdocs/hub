# CI

## Github - Workflows

Checklist of workflow coverage needed across the monorepo. Checked items exist and run today (`.github/workflows/ci.yml`, `conformance.yml`); unchecked items are gaps, including workflow files whose steps are commented out.

### JS/TS workspace (pnpm + turbo)

- [x] Lint / typecheck / test / build on push to `main` and on PRs (`ci.yml`, `turbo run lint typecheck test build`)
- [x] `@verdocs/collections` schema check (`pnpm --filter @verdocs/collections check`)
- [x] JS SDK conformance on PRs to `main` (`conformance.yml`)
- [ ] JS SDK conformance nightly (`nightly.yml`, 7am UTC). The workflow file exists, but its steps are commented out.
- [ ] Angular SDK's test builder (`@angular/build:unit-test`) runs headless in CI today only because it's Vitest-based, not Karma, so it is worth a one-time confirmation run rather than an assumption
- [x] Path filtering / affected-only runs (turbo supports `--filter` on changed packages) so a docs-only or single-package PR doesn't rebuild everything. Optional, and only worth it if CI time becomes a problem



### Python SDK (`sdks/python`)

`ci.yml` builds the package's `.venv` (`pip install -e . --group dev`), and turbo runs its `lint` and `test` scripts.

- [x] Ruff lint on PRs
- [x] `pytest` unit suite on PRs (default `addopts` already excludes the `conformance` marker, so this is safe to run on every PR without secrets)
- [ ] Gated conformance lane mirroring the JS SDK's nightly pattern (`pytest -m conformance`, needs the same `VERDOCS_CONFORMANCE_*` secrets style). The `python-conformance` job in `nightly.yml` is commented out.



### C# SDK (`sdks/csharp`)

`ci.yml` installs .NET, and turbo runs the package's `build` and `test` scripts.

- [x] `dotnet build` on PRs (`Verdocs.Sdk.sln`)
- [x] `dotnet test` unit suite on PRs (excluding the `Conformance` filter, so no secrets needed)
- [ ] Gated conformance lane mirroring the JS SDK's nightly pattern (`dotnet test --filter FullyQualifiedName~Conformance`, needs `VERDOCS_CONFORMANCE=1` + the same secrets). The `csharp-conformance` job in `nightly.yml` is commented out.



### Docs generation (`generate:docs`, `generate-sdk-docs` turbo task)

The root `generate:docs` script regenerates every `sdk-docs.json`, `openapi.json`, and `unified-sdks.json`, and js-sdk's `copy-openapi` and `copy-unified-sdk` scripts copy the last two into `../../../platform/apps/dev-docs/app/`, a sibling checkout of the private platform repo. `pnpm changeset:version` runs `generate:docs`, so every version bump regenerates and copies the docs. The full sequence is in [WORKFLOW.md](WORKFLOW.md). The old per-package `generate-docs.yml` (deleted from `packages/js-sdk/.github/workflows/`) deployed to `gh-pages` and no longer reflects how docs are produced.

- [x] Decide if/how this should run in CI. Decided: a GitHub Action with an access token for the platform repo will replace the relative-path copy
- [ ] Build that Action. It needs a token/checkout step for the platform repo, and possibly a path filter (`src/**`, `docs/**`, etc.)



### Changesets

`.changeset/config.json` is configured (fixed groups for js-sdk/conformance and for react/angular/vue/wc-sdk/storybook; Python and C# are each versioned on their own), but no workflow uses it yet. Releases are cut locally, following [WORKFLOW.md](WORKFLOW.md).

- [ ] PR gate that fails if a PR touching a versioned package has no changeset (common `changeset status` check). Lightweight, and doesn't publish anything. `changeset-check.yml` exists, but its steps are commented out.
- [ ] Release automation (e.g. `changesets/action` opening a "Version Packages" PR). Per `CLAUDE.md`, actual `npm publish` only happens when instructed, so at most this should stop at opening the version PR, never auto-publish. `changeset-release.yml` exists, but its steps are commented out. Its version step runs `pnpm changeset:version`, which includes `generate:docs`, so before it's enabled the job needs .NET, the Python venv from `ci.yml`, and write access to the platform repo.
- [ ] Manual publish workflow (`release.yml`), also commented out. Before enabling it, delete its "Sync Python and C# SDK versions" step: `pnpm changeset:version` already runs `scripts/sync-sdk-versions.mjs`, and that step would overwrite the synced versions after the docs are generated. It also needs the Python venv setup from `ci.yml` and platform repo access, and its comment points to a `RELEASE-STATUS.md` that doesn't exist.



### Quickstarts (`apps/quickstart-*`)

- [x] `quickstart-angular` / `-react` / `-vue` / `-wc` already get lint/typecheck/build via the root turbo pipeline
- [ ] `quickstart-node`, `quickstart-python`, `quickstart-python-server`, `quickstart-csharp` have no lint/test/build scripts and no CI. Likely low priority since they're live-API demos, but flag whether even a smoke build/import check is wanted



### Housekeeping (not asked for, flagging as optional)

- [ ] Dependabot config (none currently exists)
- [x] PR template / issue templates (none currently exist)
- [ ] CODEOWNERS (none currently exists)