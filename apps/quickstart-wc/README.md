# Verdocs WC Quickstart

A minimal Vite + TypeScript app (no framework) showing the intended integration pattern for `@verdocs/wc-sdk`: a login route and an auth-guarded dashboard hosting the templates list, wired together with plain DOM APIs and a tiny hash router.

## Run it

```bash
pnpm install
pnpm --filter verdocs-quickstart-wc dev
```

The app serves on port 5175 and talks to the beta environment (`https://stage-api.verdocs.com`) by default. Point it elsewhere with an env var:

```bash
VITE_VERDOCS_API_BASE=https://api.verdocs.com pnpm --filter verdocs-quickstart-wc dev
```

Note the dev server resolves `@verdocs/wc-sdk` from its built output, so run `pnpm --filter @verdocs/wc-sdk build` (or the repo-wide `pnpm build`) once first.

## What to look at

- [src/main.ts](src/main.ts): the one-line stylesheet import, the element-registering SDK import, and default-endpoint setup (the web-component equivalent of the React provider)
- [src/router.ts](src/router.ts): hash routes for `#/login` and `#/dashboard` with a session guard built on `onSessionChanged`
- [src/views/login.ts](src/views/login.ts): `<vdocs-auth>`; navigation happens through the session listener, not a callback
- [src/views/dashboard.ts](src/views/dashboard.ts): `<vdocs-templates-list>` with row-action event listeners, all fully typed thanks to the SDK's HTMLElementTagNameMap augmentation
