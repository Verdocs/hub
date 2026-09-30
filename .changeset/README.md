# Changesets

How we use [Changesets](https://github.com/changesets/changesets) in this monorepo. The full walkthrough, from a feature branch to a published release, is in [docs/WORKFLOW.md](../docs/WORKFLOW.md). If you are integrating Verdocs into your app, you can ignore this file.

Add a changeset in the same PR as your code change. Versions and changelogs are applied when we cut a release, by `pnpm changeset:version`.

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
| `pnpm changeset:status` | Preview the release plan without changing anything |
| `pnpm changeset:version` | Applies pending changesets (versions and changelogs), syncs the Python and C# versions, then runs `pnpm generate:docs` |
| `pnpm changeset:publish` | Publishes npm packages that changed. Use `pnpm release <name>` instead |

Publish with `pnpm release <name>`, one package at a time. Do not use `pnpm changeset:publish` while any public package in the workspace has never been published; it publishes every package whose version is missing from npm, not just the one you meant.

## Fixed groups

Packages in a fixed group share one version. Bumping one bumps all members.

Core SDK: `@verdocs/js-sdk`, `@verdocs/conformance`

UI SDK: `@verdocs/react-sdk`, `@verdocs/angular-sdk`, `@verdocs/vue-sdk`, `@verdocs/wc-sdk`, `verdocs-storybook`

`@verdocs/python-sdk` and `@verdocs/csharp-sdk` are not in a group. Each has its own version line.

Target the package you actually changed. The group handles siblings.

`changeset version` bumps every group and package that has a pending changeset, so if only one of them is releasing, revert the others after `pnpm changeset:version`.

## Ignored packages

Never versioned or published by Changesets: `verdocs-styled-builder`, `verdocs-styled-signer`, `@verdocs/collections`.
Do not mix ignored and non-ignored packages in one changeset file.

## Registries

| Package | Registry |
| --- | --- |
| `@verdocs/js-sdk`, `@verdocs/react-sdk`, `@verdocs/angular-sdk`, `@verdocs/vue-sdk`, `@verdocs/wc-sdk` | npm |
| `verdocs` (`sdks/python`) | PyPI |
| `Verdocs.Sdk` (`sdks/csharp`) | NuGet |

Everything else is private and never published. Which of these are live today is in the [root README](../README.md) and each SDK's own README.

## Changeset file format

```md
---
"@verdocs/react-sdk": minor
---

Short summary of what changed and why it matters to consumers.
```

`config.json` in this directory holds `fixed`, `ignore`, `access`, and `baseBranch` settings.
