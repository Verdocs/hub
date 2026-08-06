# Changesets

Release workflow for this monorepo. If you are integrating Verdocs into your app, you can ignore this file.

We use [Changesets](https://github.com/changesets/changesets) to record version bumps and changelog entries. Add a changeset in the same PR as your code change; cut a release when the team is ready to publish.

The C# and Python SDKs under `sdks/` carry their own version numbers in `pyproject.toml` and the
csproj, because changesets only tracks npm package.json files. Bump those by hand when you release
them. The `@verdocs/python-sdk` and `@verdocs/csharp-sdk` package.json files exist only so turbo can
run tasks against those directories, which is why both are marked private.

## Commands

| Script | What it does |
| --- | --- |
| `pnpm changeset:add` | Interactive prompt; writes a new file in `.changeset/` |
| `pnpm changeset:version` | Applies pending changesets, bumps versions, updates changelogs |
| `pnpm changeset:publish` | Publishes npm packages that changed |
| `pnpm changeset:status` | Preview the release plan without changing anything |

## Day to day

1. Make your change.
2. Run `pnpm changeset:add`, pick the package(s) and semver bump.
3. Write a short summary for the changelog.
4. Commit the new `.changeset/*.md` with your PR.

## Cutting a release

1. Confirm `main` has every changeset you want to ship.
2. `pnpm changeset:status` to preview.
3. `pnpm changeset:version`, review the diff, commit the version bump.
4. Publish when instructed.

## Fixed groups

Packages in a **fixed** group share one version. Bumping one bumps all members.

**Core SDK** (API client across languages):

- `@verdocs/js-sdk`, `@verdocs/python-sdk`, `@verdocs/csharp-sdk`, `@verdocs/conformance`

**UI SDK**:

- `@verdocs/react-sdk`, `@verdocs/angular-sdk`, `@verdocs/vue-sdk`, `@verdocs/wc-sdk`, `verdocs-storybook`

Target the package you actually changed. The group handles siblings.

## Ignored packages

Never versioned or published by Changesets: `verdocs-styled-builder`, `verdocs-styled-signer`, `@verdocs/collections`. Do not mix ignored and non-ignored packages in one changeset file.

## Published packages

`@verdocs/js-sdk`, `@verdocs/react-sdk`, `@verdocs/angular-sdk`, `@verdocs/vue-sdk`, `@verdocs/wc-sdk`.

Python (`sdks/python/pyproject.toml`) and C# (`.csproj`) versions are kept in sync manually when cutting a language release.

## Changeset file format

```md
---
"@verdocs/react-sdk": minor
---

Short summary of what changed and why it matters to consumers.
```

`config.json` in this directory holds `fixed`, `ignore`, `access`, and `baseBranch` settings.
