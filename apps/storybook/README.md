# Verdocs Storybook

The component catalog for the React SDK. Stories are colocated with the components in `packages/react-sdk/src/**/*.stories.tsx`; this app just hosts them.

```bash
pnpm --filter verdocs-storybook dev   # port 6006
```

## Environment

Copy `.env.example` to `.env` (same directory). `VITE_VERDOCS_API_BASE` picks the API (defaults to beta). If `VITE_VERDOCS_TEST_EMAIL` and `VITE_VERDOCS_TEST_PASSWORD` are set and no session is persisted, Storybook signs in on startup, so live-data stories (templates, envelopes) render immediately. Without them, run the Auth story once to log in; the session persists across stories and reloads.
