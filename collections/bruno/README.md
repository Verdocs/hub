# Verdocs Platform API, Bruno Collection

[Bruno](https://www.usebruno.com/) collection in `.bru` format. One folder per endpoint area, one file per request.

## Open

In Bruno: **Open Collection** -> select this folder (`collections/bruno`).

## Token and environment

Select the `beta` environment and set `access_token` (secret) to your bearer token. Obtain one from the Authentication folder. Bruno stores secrets locally; they are not committed.

Collection auth sends `Authorization: Bearer {{access_token}}`; each request uses `auth: inherit`.

| Environment | `base_url` |
| --- | --- |
| beta (included) | `https://stage-api.verdocs.com` |
| production (add your own) | `https://api.verdocs.com` |

Optional query params are unchecked by default. Path params live in each request's `params` block. Bodies include example JSON from the API schemas.

## Regeneration

This folder is generated from the OpenAPI spec in `@verdocs/js-sdk`. Do not edit by hand. If you maintain the hub repo and need to refresh the collection, run `pnpm --filter @verdocs/collections generate` and commit the result.
