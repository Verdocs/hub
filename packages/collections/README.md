# @verdocs/collections

Build tooling that generates the Postman and Bruno collections in [`collections/`](../../collections/) from the OpenAPI spec in `@verdocs/js-sdk`.

You do not need this package to integrate with Verdocs. Use the committed collections directly, or call the API through an SDK.

## Commands

```bash
pnpm --filter @verdocs/collections generate   # rewrite collections/
pnpm --filter @verdocs/collections check        # fail if committed output is stale
pnpm --filter @verdocs/collections test         # generator unit tests
```

`generate` deletes and recreates `collections/` so removed endpoints do not linger. `check` is what CI runs before merge.

Output is deterministic: sorted folders and requests, fixed example values, no timestamps.

## Output

- `collections/postman/verdocs-api.postman_collection.json` — single collection, bearer auth via `{{access_token}}`, `{{base_url}}` defaulting to beta
- `collections/bruno/` — `bruno.json`, `collection.bru`, `environments/beta.bru`, one `.bru` per request

Each output folder has its own README for import and token setup.
