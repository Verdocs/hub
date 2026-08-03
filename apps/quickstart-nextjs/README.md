# Verdocs Next.js Quickstart

A minimal Next.js (App Router) app showing the intended integration pattern for `@verdocs/react-sdk`: a login page and an auth-guarded dashboard hosting the templates list.

## Run it

```bash
pnpm install
pnpm --filter verdocs-quickstart-nextjs dev
```

The app talks to the beta environment (`https://stage-api.verdocs.com`) by default. Point it elsewhere with an env var:

```bash
NEXT_PUBLIC_VERDOCS_API_BASE=https://api.verdocs.com pnpm --filter verdocs-quickstart-nextjs dev
```

## What to look at

- [app/providers.tsx](app/providers.tsx): the client-side provider boundary and the one-line stylesheet import in [app/layout.tsx](app/layout.tsx)
- [app/page.tsx](app/page.tsx): the root route, which always sends visitors into the dashboard
- [app/dashboard/layout.tsx](app/dashboard/layout.tsx): a session guard built on `useSession()` that bounces unauthenticated visitors to `/login`
- [app/login/page.tsx](app/login/page.tsx): `VerdocsAuth` with a redirect once a session exists
- [app/dashboard/page.tsx](app/dashboard/page.tsx): `VerdocsTemplatesList` with row-action callbacks

`@verdocs/react-sdk` has no `'use client'` directives of its own, so every route or component that touches its hooks or components is marked `'use client'` here. That is the boundary Next.js needs; the SDK does not need to know about it.
