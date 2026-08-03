# Verdocs Platform API — Postman

`verdocs-api.postman_collection.json` is a Postman Collection (v2.1) covering the Verdocs Platform API, grouped by endpoint area.

## Import

In Postman: **Import** → select `verdocs-api.postman_collection.json`.

## Variables

Collection auth sends `Authorization: Bearer {{access_token}}` on every request. Set these on the collection **Variables** tab:

| Variable | Value |
| --- | --- |
| `access_token` | Bearer token from the Authentication folder |
| `base_url` | `https://stage-api.verdocs.com` (beta) or `https://api.verdocs.com` (production) |

Optional query params are listed but disabled — enable what you need. Path variables must be filled before send. Request bodies include example JSON from the API schemas.

## Regeneration

This folder is generated from the OpenAPI spec in `@verdocs/js-sdk`. Do not edit by hand. If you maintain the hub repo and need to refresh the collection, run `pnpm --filter @verdocs/collections generate` and commit the result.
