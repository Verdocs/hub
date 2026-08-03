# @verdocs/angular-sdk

Angular components and services for auth, template management, envelope workflows, and signing. Standalone components, signal-based inputs and outputs, zoneless-compatible. Built on `@verdocs/js-sdk`.

Install:

```bash
npm install @verdocs/angular-sdk @verdocs/js-sdk
```

## Setup

Register the provider at bootstrap and import the stylesheet once (for example in `styles.css`):

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideVerdocs } from '@verdocs/angular-sdk';

bootstrapApplication(AppComponent, {
  providers: [provideVerdocs({ baseUrl: 'https://api.verdocs.com' })],
});
```

```css
@import '@verdocs/angular-sdk/styles.css';
```

Use the components in templates:

```html
<verdocs-auth (authenticated)="onAuthenticated($event)" />
<verdocs-templates-list (viewTemplate)="onViewTemplate($event)" />
```

## What's in the box

Same feature set as `@verdocs/react-sdk`, expressed as Angular standalone components with `verdocs-*` selectors:

- **Auth and lists** — `verdocs-auth`, `verdocs-templates-list`, `verdocs-envelopes-list`
- **Template builder** — `verdocs-template-create`, `verdocs-template-settings`, `verdocs-template-attachments`, `verdocs-template-roles`, `verdocs-template-fields`, and the rest of the build flow
- **Envelopes and signing** — `verdocs-envelope-sidebar`, `verdocs-envelope-recipient-summary`, `verdocs-envelope-update-recipient`, `verdocs-sign-footer`, field renderers, dialogs, and shared controls

See `src/public-api.ts` for the full export list.

## Services

- `VerdocsSessionService` — session and profile signals for route guards and headers
- `VerdocsTemplatesService` — template queries and star toggle
- `VerdocsEnvelopesService` — envelope list and detail queries, updates

Inject `VERDOCS_ENDPOINT` or use `injectVerdocsEndpoint()` when you need the underlying `VerdocsEndpoint`.

## Theming

Same `--vdocs-*` tokens as the React SDK. Override on `:root`; no Shadow DOM.

```css
:root {
  --vdocs-color-primary: #0f766e;
  --vdocs-font-sans: 'Your Font', sans-serif;
}
```

## Quick-start

[`apps/quickstart-angular`](../../apps/quickstart-angular/README.md) — login route, session guard, templates dashboard.
