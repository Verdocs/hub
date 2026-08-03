# Verdocs Next.js Quickstart

Minimal Next.js App Router app: login page, session guard, templates dashboard. Same integration pattern as the React quickstart, adapted for Next's client boundary.

## Run

From the repo root:

```bash
pnpm install
pnpm --filter verdocs-quickstart-nextjs start
```

Defaults to the beta API (`https://stage-api.verdocs.com`).

Another environment:

```bash
NEXT_PUBLIC_VERDOCS_API_BASE=https://api.verdocs.com pnpm --filter verdocs-quickstart-nextjs start
```

## Files worth reading

| File | What it does |
| --- | --- |
| [`app/providers.tsx`](app/providers.tsx) | Client-side `VerdocsProvider` |
| [`app/layout.tsx`](app/layout.tsx) | Stylesheet import |
| [`app/dashboard/layout.tsx`](app/dashboard/layout.tsx) | Session guard with `useSession()` |
| [`app/login/page.tsx`](app/login/page.tsx) | `VerdocsAuth` |
| [`app/dashboard/page.tsx`](app/dashboard/page.tsx) | `VerdocsTemplatesList` |

`@verdocs/react-sdk` does not ship `'use client'` directives. Every route or component that imports its hooks or components is marked `'use client'` here. That is a Next.js requirement, not something the SDK needs to know about.

Package docs: [`packages/react-sdk/README.md`](../../packages/react-sdk/README.md)
