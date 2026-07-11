# @verdocs/vue-sdk

Native Vue 3 components, composables, and provider for building document workflows with Verdocs. Script setup SFCs with TypeScript, server state on TanStack Vue Query.

## Install

```bash
npm install @verdocs/vue-sdk @verdocs/js-sdk
```

Vue 3.5+ is a peer dependency. TanStack Vue Query is bundled as a regular dependency; if your app already uses it, pass your own QueryClient to the provider to share one cache.

## Usage

Wrap your app in the provider and import the stylesheet once:

```vue
<script setup lang="ts">
import '@verdocs/vue-sdk/styles.css';
import { VerdocsProvider, VerdocsAuth } from '@verdocs/vue-sdk';
</script>

<template>
  <VerdocsProvider base-url="https://api.verdocs.com">
    <VerdocsAuth @authenticated="status => console.log('Auth state', status)" />
  </VerdocsProvider>
</template>
```

## Components

- `VerdocsAuth`: login, signup, email verification, and password reset flows
- `VerdocsTemplatesList`: filterable, sortable, paginated template list
- Controls: `VerdocsButton`, `VerdocsTextInput`, `VerdocsSpinner`, `VerdocsQuickFilter`, `VerdocsDropdown`, `VerdocsPagination`

## Composables

- `useVerdocs()`: the active VerdocsEndpoint from the provider
- `useSession()`: reactive session and profile state
- `useTemplates(params)`: template list query. Query keys mirror `@verdocs/react-sdk` exactly, so the two SDKs stay wire-identical.

## Theming

All design tokens are `--vdocs-*` CSS custom properties on `:root`, shared with the React SDK. White-label by overriding them:

```css
:root {
  --vdocs-color-primary: #0f766e;
  --vdocs-font-sans: 'Custom Font', sans-serif;
}
```

Utilities are single-class and low-specificity, so plain CSS overrides work as an escape hatch. Nothing uses Shadow DOM, and library components ship no scoped styles.
