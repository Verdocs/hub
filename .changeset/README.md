# Changesets

We use [Changesets](https://github.com/changesets/changesets) to record what should ship in the next release and to apply version bumps across the monorepo. Contributors add a changeset file in the same PR as the code change. When we are ready to cut a release, someone runs `pnpm changeset:version`, commits the bumped `package.json` files and generated `CHANGELOG.md` entries, and publishes the public packages when instructed.

The frozen Stencil line under `packages/web-sdk/` is outside the pnpm workspace and is not part of this workflow. It keeps its own version and publish scripts.

## Commands


| Script                   | What it does                                                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `pnpm changeset:add`     | Interactive prompt. Writes a new `.md` file in this directory.                                                         |
| `pnpm changeset:version` | Consumes pending changesets, bumps versions, updates changelogs, refreshes lockfile-dependent ranges. Does not commit. |
| `pnpm changeset:publish` | Publishes any/all npm packages that are being updated.                                                                 |
| `pnpm changeset:status`  | Shows the release plan from pending changesets without changing anything.                                              |


## Day-to-day workflow

1. Make your code change.
2. Run `pnpm changeset:add` and pick the package(s) you changed plus a semver bump (`patch`, `minor`, or `major`).
3. Write a short summary in the changeset body. This becomes the changelog entry.
4. Commit the new `.changeset/*.md` file with your PR.
5. After the PR merges, the changeset file stays in `.changeset/` until the next release.



### When cutting a release:

1. Make sure `main` has every changeset you want to ship.
2. Run `pnpm changeset:status` to preview the plan.
3. Run `pnpm changeset:version`.
4. Review the diff (`package.json` bumps, new `CHANGELOG.md` sections, deleted changeset files).
5. Commit the version bump as its own commit (or PR).
6. Publish the public packages when instructed.



## Which packages are covered

Changesets only sees packages in the pnpm workspace (`apps/*`, `packages/*`, `sdks/*`). Everything else, including `packages/web-sdk/`, is out of scope.

### Fixed groups

Packages in a **fixed** group always receive the same version number. A `minor` bump on any member bumps every member of that group to the same new version, even if only one package changed.

**Core SDK group** (tracks the API client surface across languages):

- `@verdocs/js-sdk`
- `@verdocs/python-sdk` (pnpm stub; real version lives in `pyproject.toml`)
- `@verdocs/csharp-sdk` (pnpm stub; real version lives in the `.csproj`)
- `@verdocs/conformance`

**UI SDK group** (native component SDKs and Storybook):

- `@verdocs/react-sdk`
- `@verdocs/angular-sdk`
- `@verdocs/vue-sdk`
- `@verdocs/wc-sdk`
- `verdocs-storybook`

When you changeset `@verdocs/js-sdk`, the Python and C# stubs and conformance move with it. You do not need separate changeset entries for those packages. The same applies within the UI group: a React SDK `minor` carries Angular, Vue, web components, and Storybook along.

Target the package you actually changed in the changeset frontmatter. The fixed group handles the rest.

### Ignored packages

These workspace packages are never versioned or published by Changesets:

- `verdocs-styled-builder`
- `verdocs-styled-signer`
- `@verdocs/collections`

Do not put ignored and non-ignored packages in the same changeset file. Changesets rejects mixed changesets.

### Everything else

Quick-starts and other private apps are in the workspace but not in a fixed group or in `ignore`. They only version if you explicitly add a changeset for them. In practice we do not changeset quick-starts.

## Changeset file format

Each file is markdown with YAML frontmatter:

```md
---
"@verdocs/react-sdk": minor
---

Short summary of what changed and why it matters to consumers.
```

Rules:

- One logical release note per file is fine; use multiple files if two unrelated changes should version independently.
- Pick the highest applicable bump for the change (`patch` for fixes, `minor` for backward-compatible features, `major` for breaking changes).
- The body is written for humans reading the changelog, not for git history.
- Only list packages that are not ignored. Fixed-group siblings do not need their own frontmatter lines.



## `config.json` reference

```json
{
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [ ... ],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [ ... ],
  "privatePackages": { "version": true, "tag": true }
}
```



### `changelog`

Uses the default Changesets changelog generator. Running `changeset version` creates or updates a `CHANGELOG.md` in each versioned package from the bodies of consumed changeset files.

### `commit`

`false` means `changeset version` leaves the version bump unstaged. We commit the result ourselves so the release commit can be reviewed like any other change.

### `fixed`

Array of package groups that share one version line. See [Fixed groups](#fixed-groups) above. `linked` is empty; we use fixed groups instead of linked versioning.

### `access`

`"public"` is the npm publish access level for scoped packages (`@verdocs/*`) when `changeset publish` runs. It does not make private packages public; it only applies to packages that are actually published.

### `baseBranch`

`"main"` is the branch Changesets treats as the integration line when comparing changes and assembling release plans.

### `updateInternalDependencies`

`"patch"` tells Changesets to bump `workspace:^` dependency ranges in dependent packages by a patch when an internal dependency versions. For example, if `@verdocs/react-sdk` versions and `verdocs-storybook` depends on it, Storybook's dependency range is updated as part of the release.

### `ignore`

Package names Changesets will not version or publish. See [Ignored packages](#ignored-packages). Removing a package from `ignore` is a config change and should be deliberate.

### `privatePackages`

```json
"privatePackages": {
  "version": true,
  "tag": true
}
```

By default Changesets skips `private: true` packages entirely. We override that:

- `version: true` lets private packages participate in versioning. This matters for `@verdocs/conformance`, the Python and C# pnpm stubs, and `verdocs-storybook`, which are private but sit in fixed groups and need their `package.json` versions to stay aligned.
- `tag: true` includes those private packages when creating git tags during a publish step. They still are not published to npm unless `private` is removed from their `package.json`.

Public, publishable packages today: `@verdocs/js-sdk`, `@verdocs/react-sdk`, `@verdocs/angular-sdk`, `@verdocs/vue-sdk`, and `@verdocs/wc-sdk`.

## Python and C# versioning

The workspace entries `@verdocs/python-sdk` and `@verdocs/csharp-sdk` exist so turbo and conformance can reach those trees. Their `package.json` versions follow the core SDK fixed group. The authoritative versions for PyPI and NuGet (when we publish them) live in `sdks/python/pyproject.toml` and the C# project file. Keep those in sync manually when cutting a language release.

## Tips

- Run `pnpm changeset:status` before opening a release PR to catch invalid changesets early.
- If you only changed an ignored package (for example `@verdocs/collections`), you do not need a changeset. CI and the committed artifacts are the source of truth.
- New public SDK packages start at `1.0.0`. `@verdocs/js-sdk` continues its existing semver line.
- Workspace packages are consumed with `workspace:^` during development. The version command rewrites those ranges at release time.

