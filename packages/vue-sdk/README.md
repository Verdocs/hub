# @verdocs/vue-sdk

Vue 3 components and composables for auth, template management, envelope workflows, and signing. Built on `@verdocs/js-sdk` and TanStack Vue Query.

Install:

```bash
npm install @verdocs/vue-sdk @verdocs/js-sdk
```

Vue 3.5+ is a peer dependency. Pass your own `QueryClient` to `VerdocsProvider` if you already run TanStack Query in the app.

## Setup

```vue
<script setup lang="ts">
import '@verdocs/vue-sdk/styles.css';
import { VerdocsProvider, VerdocsAuth } from '@verdocs/vue-sdk';
</script>

<template>
  <VerdocsProvider base-url="https://api.verdocs.com">
    <VerdocsAuth @authenticated="status => console.log(status)" />
  </VerdocsProvider>
</template>
```

## What's in the box

Parity with `@verdocs/react-sdk`:

- **Auth and lists** — `VerdocsAuth`, `VerdocsTemplatesList`, `VerdocsEnvelopesList`
- **Template builder** — `VerdocsTemplateCreate`, `VerdocsTemplateSettings`, `VerdocsTemplateAttachments`, `VerdocsTemplateRoles`, `VerdocsTemplateFields`, and related components
- **Envelopes and signing** — `VerdocsEnvelopeSidebar`, `VerdocsEnvelopeRecipientSummary`, `VerdocsEnvelopeUpdateRecipient`, `VerdocsSignFooter`, field components, dialogs, controls

Component names are prefixed with `Verdocs`. See `src/index.ts` for exports.

## Composables

- `useVerdocs()` — the active `VerdocsEndpoint`
- `useSession()` — session and profile state
- `useTemplates()` — template list query

## Theming

`--vdocs-*` CSS custom properties on `:root`, shared with the React and Angular SDKs. Library components ship without scoped styles so your overrides stick.

```css
:root {
  --vdocs-color-primary: #0f766e;
  --vdocs-font-sans: 'Your Font', sans-serif;
}
```

## Quick-start

[`apps/quickstart-vue`](../../apps/quickstart-vue/README.md) — Vite app with login, session guard, templates dashboard.
