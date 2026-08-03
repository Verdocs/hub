# @verdocs/js-sdk

Typed JavaScript/TypeScript client for the Verdocs REST API. Runs in Node and the browser.

Install:

```bash
npm install @verdocs/js-sdk
```

Full API reference: [https://developers.verdocs.com/docs/reference/SDK/languages/js-sdk](https://developers.verdocs.com/docs/reference/SDK/languages/js-sdk)

## VerdocsEndpoint

Everything goes through `VerdocsEndpoint`. It holds your API base URL, the active bearer token, and decoded session claims.

```ts
import { VerdocsEndpoint, authenticate } from '@verdocs/js-sdk';

const endpoint = new VerdocsEndpoint({ baseURL: 'https://api.verdocs.com' });
endpoint.setDefault(); // optional singleton for browser apps

const { access_token } = await authenticate(endpoint, {
  username: 'you@example.com',
  password: 'secret',
});
endpoint.setToken(access_token);
```

Verdocs has two session types: **user** (your app, managing templates and envelopes) and **signing** (an ephemeral recipient session). Run one of each in parallel when you need both: create two endpoints, pass `sessionType: 'signing'` on the signing one, and call `setToken` on each with the right token.

## API surface

Functions are grouped by domain and mirror the REST API:

- **Users / Auth** — login, signup, password reset, profile management
- **Templates** — template CRUD, documents, roles, fields
- **Envelopes** — send, track, cancel, recipient management
- **Organizations** — members, groups, brands, webhooks, API keys
- **Documents** — direct document operations outside templates

Import what you need from the package root or from subpaths if your bundler supports it. Types for request and response bodies ship with the functions.

## UI SDKs

If you are embedding Verdocs in a web app, you probably want a UI package on top of this client:

- [@verdocs/react-sdk](../react-sdk/README.md)
- [@verdocs/angular-sdk](../angular-sdk/README.md)
- [@verdocs/vue-sdk](../vue-sdk/README.md)
- [@verdocs/wc-sdk](../wc-sdk/README.md)

Those packages call the same endpoints through `VerdocsEndpoint` under the hood.

## Quick-start

A minimal Node script that creates and cancels an envelope lives at `[apps/quickstart-node](../../apps/quickstart-node/README.md)`.