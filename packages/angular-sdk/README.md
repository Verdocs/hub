# @verdocs/angular-sdk

Native Angular components, services, and provider for building document workflows with Verdocs. Standalone components, signal-based inputs and outputs, zoneless-compatible.

## Install

```bash
npm install @verdocs/angular-sdk @verdocs/js-sdk
```

## Usage

Register the provider at bootstrap and import the stylesheet once (for example in your root styles file):

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

Then use the components:

```html
<verdocs-auth (authenticated)="onAuthenticated($event)" />
<verdocs-templates-list (viewTemplate)="onViewTemplate($event)" />
```

## Components

- `verdocs-auth`: login, signup, email verification, and password reset flows
- `verdocs-templates-list`: filterable, sortable, paginated template list with starring
- Controls: `verdocs-button`, `verdocs-text-input`, `verdocs-spinner`, `verdocs-quick-filter`, `verdocs-dropdown`, `verdocs-pagination`

## Services

- `VerdocsSessionService`: reactive session and profile signals, for guards and headers
- `VerdocsTemplatesService`: signal-based template queries and the star toggle. Query keys and invalidation semantics mirror `@verdocs/react-sdk`.

## Theming

All design tokens are `--vdocs-*` CSS custom properties on `:root`, shared with the React SDK. White-label by overriding them:

```css
:root {
  --vdocs-color-primary: #0f766e;
  --vdocs-font-sans: 'Custom Font', sans-serif;
}
```

Utilities are single-class and low-specificity, so plain CSS overrides work as an escape hatch. Nothing uses Shadow DOM.
