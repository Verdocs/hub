# @verdocs/wc-sdk

Framework-agnostic web components for auth, template management, envelope workflows, and signing. Lit 3, same behavior and events as `@verdocs/react-sdk`.

Install:

```bash
npm install @verdocs/wc-sdk @verdocs/js-sdk
```

## Setup

Import the stylesheet and register the elements. Configure a default `VerdocsEndpoint` once at startup (the web-component equivalent of `VerdocsProvider`):

```ts
import '@verdocs/wc-sdk/styles.css';
import '@verdocs/wc-sdk';
import { VerdocsEndpoint } from '@verdocs/js-sdk';

new VerdocsEndpoint({ baseURL: 'https://api.verdocs.com' }).setDefault();

const auth = document.querySelector('vdocs-auth');
auth?.addEventListener('vdocs-authenticated', e => {
  console.log(e.detail);
});
```

```html
<vdocs-auth></vdocs-auth>
<vdocs-templates-list></vdocs-templates-list>
```

Any component that calls the API also accepts an `endpoint` property when you need a non-default client (for example a signing session alongside your user session).

## Elements

Custom element tags use the `vdocs-` prefix:

- **Auth and lists** — `vdocs-auth`, `vdocs-templates-list`, `vdocs-envelopes-list`
- **Template builder** — `vdocs-template-create`, `vdocs-template-settings`, `vdocs-template-attachments`, `vdocs-template-roles`, `vdocs-template-fields`, and the rest of the build flow
- **Envelopes and signing** — `vdocs-envelope-sidebar`, `vdocs-envelope-recipient-summary`, `vdocs-envelope-update-recipient`, `vdocs-sign-footer`, field elements, dialogs, controls

Public events are `vdocs-*` custom events with typed `detail` payloads (`vdocs-authenticated`, `vdocs-view-template`, `vdocs-sdk-error`, …). Objects and arrays are properties, not attributes.

## Styling and SSR

Components render to the light DOM so host-page CSS reaches the markup. Theming is `--vdocs-*` tokens on `:root`, same as the React SDK.

These elements are client-only. Do not render them on the server.

## Quick-start

[`apps/quickstart-wc`](../../apps/quickstart-wc/README.md) — Vite app with hash routing, login, and templates dashboard.
