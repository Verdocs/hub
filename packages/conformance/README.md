# @verdocs/conformance

The curl-vs-SDK conformance baseline described in `platform/specs/sdk-restructure/SDKS.md`. Every covered endpoint is called twice, once with raw curl in a child process and once with `@verdocs/js-sdk`, and the two responses are diffed on status, shape, and data (volatile fields like timestamps and tokens are normalized to type markers).

POC coverage: authenticate (password grant), current user and profile, getTemplates, and the star toggle.

## Running it

The suite hits the live beta API, so it runs only via an explicit script and is excluded from CI until secrets are set up there:

```bash
cp .env.example .env   # at the hub root; fill in a beta test account
pnpm test:conformance
```

The star toggle check needs the test account to have at least one template.
