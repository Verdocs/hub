# Verdocs Platform API Postman collection

`verdocs-api.postman_collection.json` is a Postman collection (Collection Format v2.1) covering every endpoint in the Verdocs Platform API, grouped into folders by endpoint area.

## Import

In Postman, click Import and select `verdocs-api.postman_collection.json` (drag and drop works too).

## Set your token

The collection sends `Authorization: Bearer {{access_token}}` on every request via collection-level auth. Open the collection's Variables tab and set:

- `access_token`: your bearer token. Obtain one with the requests in the Authentication folder.
- `base_url`: defaults to the beta environment at https://stage-api.verdocs.com. Point it at https://api.verdocs.com for production.

Optional query parameters are listed on each request but disabled; enable the ones you need. Path parameters appear under Path Variables and must be filled in before sending. Request bodies are pre-filled with example JSON derived from the API schemas.

## These files are generated

Everything in this folder is generated from `packages/js-sdk/openapi.json`. Do not edit these files by hand. To make a change, edit the generator in `packages/collections` (or the spec inputs in js-sdk) and run:

```
pnpm --filter @verdocs/collections generate
```

CI runs `pnpm --filter @verdocs/collections check` and fails if the committed output no longer matches what the generator produces.
