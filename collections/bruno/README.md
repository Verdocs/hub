# Verdocs Platform API Bruno collection

This folder is a [Bruno](https://www.usebruno.com/) collection in the .bru file format, covering every endpoint in the Verdocs Platform API. Each endpoint area is a folder, and each request is one .bru file.

## Open

In Bruno, choose Open Collection and select this folder (`collections/bruno`).

## Set your token

Select the `beta` environment, then edit it and fill in the `access_token` secret variable with your bearer token. Obtain one with the requests in the Authentication folder. Bruno stores secret values locally, so your token never lands in these committed files.

Collection-level auth sends `Authorization: Bearer {{access_token}}` on every request; each request declares `auth: inherit`.

The beta environment points base_url at https://stage-api.verdocs.com. For production, add an environment with base_url set to https://api.verdocs.com.

Optional query parameters are present but unchecked. Path parameters live in each request's params and must be filled in before sending. Request bodies are pre-filled with example JSON derived from the API schemas.

## These files are generated

Everything in this folder is generated from `packages/js-sdk/openapi.json`. Do not edit these files by hand. To make a change, edit the generator in `packages/collections` (or the spec inputs in js-sdk) and run:

```
pnpm --filter @verdocs/collections generate
```

CI runs `pnpm --filter @verdocs/collections check` and fails if the committed output no longer matches what the generator produces.
