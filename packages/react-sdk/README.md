# @verdocs/react-sdk

Native React 19 components, hooks, and provider for building document workflows with Verdocs.

## Install

```bash
npm install @verdocs/react-sdk @verdocs/js-sdk
```

React 19 is a peer dependency. TanStack Query is bundled as a regular dependency; if your app already uses it, pass your own QueryClient to the provider to share one cache.

## Usage

Wrap your app in the provider and import the stylesheet once:

```tsx
import '@verdocs/react-sdk/styles.css';
import { VerdocsProvider, VerdocsAuth } from '@verdocs/react-sdk';

export function App() {
  return (
    <VerdocsProvider baseUrl="https://api.verdocs.com">
      <VerdocsAuth onAuthenticated={status => console.log('Auth state', status)} />
    </VerdocsProvider>
  );
}
```

## Components

- `VerdocsAuth`: login, signup, email verification, and password reset flows
- `VerdocsTemplatesList`: filterable, sortable, paginated template list with starring
- Controls: `Button`, `TextInput`, `Spinner`, `QuickFilter`, `Dropdown`, `Pagination`

## Hooks

- `useVerdocs()`: the active VerdocsEndpoint from context
- `useSession()`: reactive session and profile state
- `useTemplates(params)`: template list query
- `useToggleTemplateStar()`: star toggle mutation with cache invalidation

## Theming

All design tokens are `--vdocs-*` CSS custom properties on `:root`. White-label by overriding them:

```css
:root {
  --vdocs-color-primary: #0f766e;
  --vdocs-font-sans: 'Custom Font', sans-serif;
}
```

Utilities are single-class and low-specificity, so plain CSS overrides work as an escape hatch. Nothing uses Shadow DOM.
