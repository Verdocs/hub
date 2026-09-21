# Changesets

Release workflow for this monorepo. If you are integrating Verdocs into your app, you can ignore this file.

We use [Changesets](https://github.com/changesets/changesets) to record version bumps and changelog entries. 
Add a changeset in the same PR as your code change; cut a release when the team is ready to publish.

The C# and Python SDKs under `sdks/` are versioned through their private wrapper packages
(`@verdocs/python-sdk`, `@verdocs/csharp-sdk`), which exist so turbo and changesets can see those
directories. `pnpm changeset:version` bumps them like any other package and then runs
`scripts/sync-sdk-versions.mjs`, which copies the number into `pyproject.toml`, the package
`__version__`, and the csproj `<Version>`. Nothing there is bumped by hand, and `pnpm release`
refuses to publish if the copies disagree.

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
2. `pnpm changeset:status` to preview. Note that `changeset version` bumps every fixed group
   that has a pending changeset, so if only one group is releasing, revert the others.
3. `pnpm changeset:version`, review the diff, commit the version bump, push.
4. `pnpm release <name>` (for example `pnpm release js-sdk`, `pnpm release python`,
   `pnpm release csharp`) is a dry run: it builds, tests, and shows the artifact and the release
   notes it would use. `pnpm release <name> --publish` does the real thing from `main`: publishes
   to the package's registry, tags `<package>@<version>` (for example `@verdocs/js-sdk@6.12.0`,
   `verdocs@1.1.0`, `Verdocs.Sdk@1.1.0`), pushes the tag, creates the GitHub release from the
   package's CHANGELOG section, and runs a `docs` script if the package has one. npm uses your
   npm login; Python needs `TWINE_PASSWORD` set to a PyPI API token for that run; C# needs
   `NUGET_API_KEY`. The Python and C# SDKs take their version and CHANGELOG from changesets like
   everything else (see the note on `sdks/` above). Do not use `pnpm changeset:publish` while any public package in the
   workspace has never been published; it publishes every package whose version is missing
   from npm, not just the one you meant.

## Fixed groups

Packages in a **fixed** group share one version. Bumping one bumps all members.

**Core SDK** (API client across languages):

- `@verdocs/js-sdk`, `@verdocs/python-sdk`, `@verdocs/csharp-sdk`, `@verdocs/conformance`

**UI SDK**:

- `@verdocs/react-sdk`, `@verdocs/angular-sdk`, `@verdocs/vue-sdk`, `@verdocs/wc-sdk`, `verdocs-storybook`

Target the package you actually changed. The group handles siblings.

## Ignored packages

Never versioned or published by Changesets: `verdocs-styled-builder`, `verdocs-styled-signer`, `@verdocs/collections`. 
Do not mix ignored and non-ignored packages in one changeset file.

## Published packages

`@verdocs/js-sdk`, `@verdocs/react-sdk`, `@verdocs/angular-sdk`, `@verdocs/vue-sdk`, `@verdocs/wc-sdk`.

Python (`sdks/python/pyproject.toml`) and C# (`.csproj`) versions are copied from their wrapper packages by 
`scripts/sync-sdk-versions.mjs` during `pnpm changeset:version`.

## Changeset file format

```md
---
"@verdocs/react-sdk": minor
---

Short summary of what changed and why it matters to consumers.
```

`config.json` in this directory holds `fixed`, `ignore`, `access`, and `baseBranch` settings.
