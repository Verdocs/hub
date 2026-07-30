## Orientation

This is Verdocs' public monorepo (pnpm + Turborepo): all SDKs, quick-starts, samples, and cookbooks. The specs behind this repo's structure live at `platform/specs/sdk-restructure`; read them before structural work.

Layout notes:

- `packages/js-sdk`: the flagship JS SDK. Its `VerdocsEndpoint` class handles our two concurrent session types (user and signing); every other SDK mirrors that capability.
- `packages/web-sdk`: the frozen Stencil 6.x line and its wrapper packages. Bugfix-only, and only when instructed. Do not modernize or refactor it.
- `packages/react-sdk`, `packages/angular-sdk`: the new native SDKs (React 19 is primary; Angular, Vue, and raw web components are mirrored independently from the React work, never generated).
- `apps/`: Storybook, quick-starts, and other runnable projects.
- `sdks/`: Collection of SDKs that cover a variety of programming languages.

Packages are internally consumed via `workspace:^` where compatible.

## Rules

1. Only the developer should commit or push new work.
2. Write comments briefly as a senior engineer speaking to another without overly structured language, emojis, em-dashes, etc.
3. The standards docs in `docs/standards/` are binding for all code in this repo.
4. `comments.md` applies to every line; each framework doc applies to its SDK and apps. Read the relevant one before writing code. The frozen Stencil line (`packages/web-sdk`) is exempt and untouched.
5. Never publish packages - only CI/CD flows may do that.
