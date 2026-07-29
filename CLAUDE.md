# CLAUDE.md

Guidance for AI sessions working in this repo.

## Orientation

This is Verdocs' public monorepo (pnpm + Turborepo): all SDKs, quick-starts, samples, and cookbooks. The private counterpart is the platform repo, which holds the internal apps and the shared schema/types/config packages. The specs behind this repo's structure live at `platform/specs/sdk-restructure` (sibling checkout: `../platform/specs/sdk-restructure/` from this repo's root); read them before structural work.

Layout notes:

- `packages/js-sdk`: the flagship JS SDK. Its `VerdocsEndpoint` class handles our two concurrent session types (user and signing); every other SDK mirrors that capability.
- `packages/web-sdk`: the frozen Stencil 6.x line and its wrapper packages. Bugfix-only, and only when instructed. Do not modernize or refactor it.
- `packages/react-sdk`, `packages/angular-sdk`: the new native SDKs (React 19 is primary; Angular, Vue, and raw web components are mirrored independently from the React work, never generated).
- `apps/`: Storybook, quick-starts, and other runnable projects.
- `sdks/`: Collection of SDKs that cover a variety of programming languages.

New SDK packages are versioned 1.0.0 and consumed via `workspace:^`. Publishing to npm happens only when instructed.

## Rules

1. Never commit or push anything unless instructed.
2. If instructed to commit, keep commit messages short and focused on the specific change. Never add attribution or authored-by notes.
3. Never use AI markers in commit messages, code comments, or documentation: no em-dashes, no emoji, no smart quotes or other high-ASCII characters, no overly formal or structured language.
4. The standards docs in `docs/standards/` are binding for all code in this repo. `comments.md` applies to every line; each framework doc applies to its SDK and apps. Read the relevant one before writing code. The frozen Stencil line (`packages/web-sdk`) is exempt and untouched.
