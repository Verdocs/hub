# @verdocs/react-sdk

React 19 components and hooks for auth, template management, envelope workflows, and signing. Built on `@verdocs/js-sdk` and TanStack Query.

This package is still in development and is not on npm yet. The component catalog is filling in, and
we would rather you find that out here than halfway through an integration. Build against it from a
checkout in the meantime, and use [@verdocs/js-sdk](../js-sdk/README.md) directly for anything the
catalog does not cover yet.

Once it ships, installing looks like this:

```bash
npm install @verdocs/react-sdk @verdocs/js-sdk
```

React 19 is a peer dependency. If your app already uses TanStack Query, pass your `QueryClient` to `VerdocsProvider` so the SDK shares your cache.

Docs and live examples: https://developers.verdocs.com. Component stories also run locally via [`apps/storybook`](../../apps/storybook/README.md).

## Setup

Import the stylesheet once, wrap your app in the provider, and point `baseUrl` at your Verdocs environment:

```tsx
import '@verdocs/react-sdk/styles.css';
import { VerdocsProvider, VerdocsAuth } from '@verdocs/react-sdk';

export function App() {
  return (
    <VerdocsProvider baseUrl="https://api.verdocs.com">
      <VerdocsAuth onAuthenticated={status => console.log(status)} />
    </VerdocsProvider>
  );
}
```

Pass a preconfigured `VerdocsEndpoint` instead of `baseUrl` when you manage the client yourself (dual user/signing sessions, custom axios instance, etc.).

## What's in the box

**Auth and lists**

- `VerdocsAuth`: login, signup, email verification, password reset
- `VerdocsTemplatesList`: searchable template list with starring and row actions
- `VerdocsEnvelopesList`: envelope list with status filters and actions

**Template builder pieces**

- `TemplateCreate`, `TemplateSettings`, `TemplateAttachments`, `TemplateRoles`, `TemplateRoleProperties`, `TemplateFields`, `TemplateFieldProperties`, `TemplateBuildTabs`, `TemplateDocumentPage`, `TemplateCard`, `TemplateTags`

**Envelope and signing**

- `EnvelopeSidebar`, `EnvelopeRecipientSummary`, `EnvelopeUpdateRecipient`, `EnvelopeRecipientLink`, `ContactPicker`, `EnvelopeDocumentPage`, `SignFooter`, `StatusIndicator`

**Primitives**

- Form controls (`Button`, `TextInput`, `SelectInput`, `Checkbox`, ...), dialogs (signature adoption, KBA, OTP, delegate, download, ...), field renderers for each template field type, and layout helpers (`Table`, `Tabs`, `Pagination`, ...)

Export list is in `src/index.ts`. TypeScript types ship for every component prop and event.

## Hooks

- `useVerdocs()`: the active `VerdocsEndpoint`
- `useSession()`: session and profile state, updates when the token changes
- `useTemplates`, `useTemplate`, `useCreateTemplate`, `useUpdateTemplate`, `useDeleteTemplate`, `useToggleTemplateStar`
- `useEnvelopes`, `useEnvelope`

## Theming

Design tokens are `--vdocs-*` CSS custom properties on `:root`. Override them to white-label:

```css
:root {
  --vdocs-color-primary: #0f766e;
  --vdocs-font-sans: 'Your Font', sans-serif;
}
```

Components render in the light DOM (no Shadow DOM), so your global CSS and token overrides apply directly. See [`apps/styled-builder`](../../apps/styled-builder/README.md) and [`apps/styled-signer`](../../apps/styled-signer/README.md) for interactive demos.

## Quick-start

[`apps/quickstart-react`](../../apps/quickstart-react/README.md) is a Vite app with a login route, a session guard, and a templates dashboard. [`apps/quickstart-nextjs`](../../apps/quickstart-nextjs/README.md) is the same pattern on the App Router.
