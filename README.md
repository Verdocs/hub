# Verdocs Hub

Official SDKs, quick-starts, and API collections for building on the Verdocs e-signing platform.

Pick the language or framework you work in, then follow that package's README. If a running app
teaches you faster than a README does, the quick-starts in [apps/](apps/) are small, complete
integrations you can copy from.

API reference and guides live at [developers.verdocs.com](https://developers.verdocs.com).

## What you can use today

We publish a package when it is genuinely ready, so this table is the honest state of things rather
than a roadmap.

| Package | Status | Install |
| --- | --- | --- |
| [@verdocs/js-sdk](packages/js-sdk/README.md) | Stable | `npm install @verdocs/js-sdk` |
| [Verdocs.Sdk](sdks/csharp/README.md) (.NET) | Stable | `dotnet add package Verdocs.Sdk` |
| [verdocs](sdks/python/README.md) (Python) | Complete, publishing soon | Install from this repo for now |
| [@verdocs/react-sdk](packages/react-sdk/README.md) | In development | Not yet on npm |
| [@verdocs/angular-sdk](packages/angular-sdk/README.md) | In development | Not yet on npm |
| [@verdocs/vue-sdk](packages/vue-sdk/README.md) | In development | Not yet on npm |
| [@verdocs/wc-sdk](packages/wc-sdk/README.md) | In development | Not yet on npm |

The four framework SDKs are real, tested code with a growing component catalog, and you are welcome
to read them or build against them from a checkout. They are not on npm yet because the catalog is
still filling in, and we would rather you hit a missing package than a missing component halfway
through an integration.

## How the pieces fit

`VerdocsEndpoint` in js-sdk owns authentication and session state. One endpoint holds one session,
and Verdocs distinguishes a user session from a signing session, so an app that authenticates a user
and also runs a signing ceremony keeps two endpoints side by side. Every other package builds on
that same object, and the framework SDKs wrap the same flows as components in your stack.

The C# and Python SDKs mirror the js-sdk surface method for method, so an integration you have
already written in one language reads the same in another.

Component stories run locally through [Storybook](apps/storybook/README.md).

## Quick-starts

Every server and CLI quick-start runs the same workflow end to end: authenticate with an API key,
create an envelope from a PDF, fetch an in-person signing link, then cancel the envelope so a test
run leaves nothing open.

| App | Stack |
| --- | --- |
| [quickstart-node](apps/quickstart-node/README.md) | Node.js |
| [quickstart-python](apps/quickstart-python/README.md) | Python |
| [quickstart-python-server](apps/quickstart-python-server/README.md) | Django |
| [quickstart-csharp](apps/quickstart-csharp/README.md) | .NET |

The web quick-starts each build a login route, a session guard, and a templates dashboard.

| App | Stack |
| --- | --- |
| [quickstart-react](apps/quickstart-react/README.md) | Vite and React |
| [quickstart-nextjs](apps/quickstart-nextjs/README.md) | Next.js App Router |
| [quickstart-angular](apps/quickstart-angular/README.md) | Angular |
| [quickstart-vue](apps/quickstart-vue/README.md) | Vue |
| [quickstart-wc](apps/quickstart-wc/README.md) | Web components |

Two more demos show theming without touching the API. [styled-builder](apps/styled-builder/README.md)
white-labels the template builder and [styled-signer](apps/styled-signer/README.md) white-labels the
signing ceremony. Both are static UIs and make no network calls.

## API collections

Postman and Bruno collections for the REST API live in [collections/](collections/). We generate
them from the OpenAPI spec that ships with js-sdk, so they track the API rather than drifting from
it.

## Working in this repo

You need Node 24 or newer and pnpm 10.

```bash
pnpm install
pnpm --filter verdocs-quickstart-react start
```

That serves the React quick-start at http://localhost:5173 against the beta API at
`https://stage-api.verdocs.com`. Every quick-start defaults to beta, so you can explore without
touching production data. When you need credentials for live calls, copy
[.env.example](.env.example) to `.env` at the repo root and fill it in.

Run the full gate the way CI does:

```bash
pnpm exec turbo run lint typecheck test build
```

Release mechanics, including how to add a changeset, are in [.changeset/README.md](.changeset/README.md).

## Getting help

Questions about the API belong at [developers.verdocs.com](https://developers.verdocs.com). If you
find a bug in an SDK or a quick-start, open an issue here with the package name and enough detail to
reproduce it, and we will take a look.

## License

MIT. See [LICENSE](LICENSE).
