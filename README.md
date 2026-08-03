# Verdocs Hub

Official SDKs, quick-starts, and API collections for building on the Verdocs e-signing platform.

Pick your language or framework below and follow that package's README. If you learn better from a running app, the quick-starts in `[apps/](apps/)` are minimal login-and-dashboard examples you can copy from.

API reference and guides: [https://developers.verdocs.com](https://developers.verdocs.com)

## JavaScript and TypeScript


| Package                                                | When to use it                                                             |
| ------------------------------------------------------ | -------------------------------------------------------------------------- |
| [@verdocs/js-sdk](packages/js-sdk/README.md)           | API client for Node or the browser. Every other JS package builds on this. |
| [@verdocs/react-sdk](packages/react-sdk/README.md)     | React 19                                                                   |
| [@verdocs/angular-sdk](packages/angular-sdk/README.md) | Angular                                                                    |
| [@verdocs/vue-sdk](packages/vue-sdk/README.md)         | Vue 3                                                                      |
| [@verdocs/wc-sdk](packages/wc-sdk/README.md)           | Framework-agnostic web components                                          |


`VerdocsEndpoint` in js-sdk owns authentication and session state. The UI packages expose the same flows as components in your stack. See [Storybook](apps/storybook/README.md) for the React component catalog.

## Supported Language SDKs


| SDK                             | Install                          |
| ------------------------------- | -------------------------------- |
| [Python](sdks/python/README.md) | `pip install verdocs`            |
| [C#](sdks/csharp/README.md)     | `dotnet add package Verdocs.Sdk` |




## Quick-starts



### Web apps


| App                                                     | Stack              |
| ------------------------------------------------------- | ------------------ |
| [quickstart-react](apps/quickstart-react/README.md)     | Vite + React       |
| [quickstart-nextjs](apps/quickstart-nextjs/README.md)   | Next.js App Router |
| [quickstart-angular](apps/quickstart-angular/README.md) | Angular            |
| [quickstart-vue](apps/quickstart-vue/README.md)         | Vue                |
| [quickstart-wc](apps/quickstart-wc/README.md)           | Web components     |




### Server and CLI

Each server quick-start runs the same workflow: authenticate with an API key, create an envelope from a PDF, fetch an in-person signing link, then cancel the envelope so nothing is left open.


| App                                                                 | Stack   |
| ------------------------------------------------------------------- | ------- |
| [quickstart-node](apps/quickstart-node/README.md)                   | Node.js |
| [quickstart-python](apps/quickstart-python/README.md)               | Python  |
| [quickstart-python-server](apps/quickstart-python-server/README.md) | Django  |
| [quickstart-csharp](apps/quickstart-csharp/README.md)               | .NET    |




### Theming demos


| App                                             | What it shows                  |
| ----------------------------------------------- | ------------------------------ |
| [styled-builder](apps/styled-builder/README.md) | White-labeled template builder |
| [styled-signer](apps/styled-signer/README.md)   | White-labeled signing ceremony |


Static UIs only. No API calls.

## API collections

Postman and Bruno collections for the REST API live in `[collections/](collections/)`. They are generated from the OpenAPI spec that ships with js-sdk.

## Cloning this repo

Requires Node >= 24 and pnpm 10.

```bash
pnpm install
pnpm --filter verdocs-quickstart-react start   # http://localhost:5173
```

Quick-starts default to the beta API (`https://stage-api.verdocs.com`). Copy `[.env.example](.env.example)` to `.env` at the repo root when you need credentials for live calls.

```bash
pnpm exec turbo run lint typecheck test build
```

