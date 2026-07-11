# @verdocs/collections

Generates the Postman and Bruno collections committed at `collections/` in the repo root, using `packages/js-sdk/openapi.json` as the single input. The spec is produced by js-sdk's own pipeline, so this package never edits it; it only reads.

## Commands

```
pnpm --filter @verdocs/collections generate   # rebuild collections/ from the spec
pnpm --filter @verdocs/collections check      # regenerate into a temp dir and diff against collections/
pnpm --filter @verdocs/collections test       # unit tests for naming, sorting, and example derivation
```

`generate` deletes `collections/` and rewrites it, so files for endpoints that leave the spec do not linger. `check` is the CI staleness gate: it exits nonzero and lists the missing, stale, or unexpected files whenever the committed output no longer matches what the generator produces. When it fails, run `generate` and commit the result.

## Determinism

The committed output must be byte-stable, so the generator sorts groups and requests alphabetically (plain code point order, not locale collation), derives example values from fixed placeholders rather than clocks or RNGs, and never embeds generation timestamps or random ids. Running `generate` twice in a row always produces identical bytes.

## What gets emitted

- `collections/postman/verdocs-api.postman_collection.json`: one Postman collection with a folder per endpoint group, collection-level bearer auth reading `{{access_token}}`, a `{{base_url}}` variable defaulting to the beta environment, and example JSON bodies derived from the spec's schemas.
- `collections/bruno/`: a Bruno collection with `bruno.json`, a `collection.bru` carrying the bearer auth, an `environments/beta.bru`, and one `.bru` file per request inside a folder per group. Requests declare `auth: inherit` so the token is configured in exactly one place.

Both outputs carry a README covering import and token setup.

## Format references

Consulted while building the emitters (verified July 2026):

- Postman Collection Format v2.1.0 schema: https://schema.getpostman.com/json/collection/v2.1.0/collection.json (version index at https://schema.postman.com/), the current stable collection format.
- Bruno .bru language tag reference: https://docs.usebruno.com/bru-lang/tag-reference and overview at https://docs.usebruno.com/bru-lang/overview.
- Bruno collection layout (bruno.json, collection.bru, folder.bru, environments/): https://docs.usebruno.com/api-docs/collection-docs and https://docs.usebruno.com/variables/environment-variables.

Bruno's docs now steer new collections toward the OpenCollection YAML format, but the .bru format remains fully supported and opens in every current Bruno release, so we emit .bru per the original layout.
