# Verdocs Hub

SDKs, quick-starts, and API collections for integrating with Verdocs.

## SDKs

### JavaScript and TypeScript


| Package                                         | Use when                                              |
| ----------------------------------------------- | ----------------------------------------------------- |
| `[js-sdk](packages/js-sdk/README.md)`           | You need the core API client for Node or the browser. |
| `[react-sdk](packages/react-sdk/README.md)`     | You're building with React.                           |
| `[angular-sdk](packages/angular-sdk/README.md)` | You're building with Angular.                         |
| `[vue-sdk](packages/vue-sdk/README.md)`         | You're building with Vue 3.                           |
| `[wc-sdk](packages/wc-sdk/README.md)`           | You want framework-agnostic web components.           |


`js-sdk` is the foundation: `VerdocsEndpoint` handles user and signing sessions, and the UI SDKs build on the same model. Check each package's README (or [Storybook](#component-reference) for React) for supported components and flows.

### Supported Languages (SDKs)


| SDK    | Location                               |
| ------ | -------------------------------------- |
| Python | `[sdks/python](sdks/python/README.md)` |
| C#     | `[sdks/csharp](sdks/csharp/README.md)` |




## Quick-starts

Runnable examples live in `[apps/](apps/)`. Most web quick-starts are a minimal login + dashboard you can use as a starting point for your own app.

### Web apps


| App                                                       | Framework      |
| --------------------------------------------------------- | -------------- |
| `[quickstart-react](apps/quickstart-react/README.md)`     | React (Vite)   |
| `[quickstart-nextjs](apps/quickstart-nextjs/README.md)`   | Next.js        |
| `[quickstart-angular](apps/quickstart-angular/README.md)` | Angular        |
| `[quickstart-vue](apps/quickstart-vue/README.md)`         | Vue            |
| `[quickstart-wc](apps/quickstart-wc/README.md)`           | Web components |




### Server and CLI

> The tem "console script" refers to a quickstart workflow, using the respective native language. The script consists of the following workflow: `Authenticate → Create an envelope → Get a signing link → Cancel the envelope.


| App                                                                     | What it shows                            |
| ----------------------------------------------------------------------- | ---------------------------------------- |
| `[quickstart-node](apps/quickstart-node/README.md)`                     | Console script using the JS SDK.         |
| `[quickstart-python](apps/quickstart-python/README.md)`                       | Console script using the Python SDK.     |
| `[quickstart-python-server](apps/quickstart-python-server/README.md)`         | Django web app backed by the Python SDK. |
| `[quickstart-csharp](apps/quickstart-csharp/README.md)`                 | Console script using the C# SDK.         |




### Theming examples


| App                                               | What it shows                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------- |
| `[styled-builder](apps/styled-builder/README.md)` | White-labeled template builder using `--vdocs-*` CSS custom properties. |
| `[styled-signer](apps/styled-signer/README.md)`   | White-labeled signing ceremony with the same theming approach.          |


No live API calls in these two; they're reference UIs for styling your integration.

### Component reference

`[storybook](apps/storybook/README.md)` catalogs React SDK components. Angular, Vue, and web-component examples are in their quick-starts and package READMEs.

## API collections

Postman and Bruno collections for exploring the API are in `[collections/](collections/)`, generated from the OpenAPI spec behind `js-sdk`.

## Getting started

Requires Node >= 24 and pnpm 10.

```bash
pnpm install
```

Run a quick-start:

```bash
pnpm --filter verdocs-quickstart-react dev       # Vite, :5173
pnpm --filter verdocs-quickstart-nextjs dev      # Next.js
pnpm --filter verdocs-quickstart-angular dev     # :4200
pnpm --filter verdocs-storybook dev              # :6006
```

Quick-starts default to Verdocs' beta API. Copy `.env.example` to `.env` at the repo root and fill in your API base URL and test account credentials.

To build or test the whole monorepo:

```bash
pnpm exec turbo run lint typecheck test build
```

