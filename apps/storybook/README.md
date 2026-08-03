# Verdocs Storybook

Interactive catalog for `@verdocs/react-sdk` components. Stories live next to the components in `packages/react-sdk/src/**/*.stories.tsx`; this app hosts them.

## Run

From the repo root:

```bash
pnpm install
pnpm --filter verdocs-storybook start
```

http://localhost:6006

## Live data

Copy [`.env.example`](.env.example) to `.env` in this directory.

| Variable | Purpose |
| --- | --- |
| `VITE_VERDOCS_API_BASE` | API host (defaults to beta) |
| `VITE_VERDOCS_TEST_EMAIL` | Auto sign-in on startup |
| `VITE_VERDOCS_TEST_PASSWORD` | Auto sign-in on startup |

With email and password set and no saved session, Storybook signs in when it loads so template and envelope stories have data. Without them, open the Auth story once; the session persists across reloads.

Package docs: [`packages/react-sdk/README.md`](../../packages/react-sdk/README.md)
