# @verdocs/js-sdk

## 6.12.1

### Patch Changes

- Envelope creation accepts an optional `brand_key`, pinning the new envelope to one of the organization's brands. The brand must belong to the organization the envelope is created under. Left unset, branding is resolved when the envelope is read, from the organization's default brand and then its parent's, which is the existing behavior.

## 6.12.0

### Minor Changes

- The JS SDK now lives in this monorepo and is published from here. This release merges the standalone repo's final state (6.11.1: login sessions, TOTP MFA, Google and Microsoft sign-in, the PKCE helpers, and the API key shape true-up) with the documentation and tooling work done here. Build moved from rollup-plugin-ts to tsup, TypeScript to 6.0, and TypeDoc to 0.28; the OpenAPI and SDK docs generators were updated for TypeDoc 0.28's comment placement. No runtime behavior changed beyond what the retry changeset already describes.
- Removed the axios-retry dependency. The four envelope-document retrieval calls that opted into it now use a small internal helper that retries once on timeout (ECONNABORTED/ETIMEDOUT); everything else is unchanged. This also fixes the broken CJS entry (dist/index.js previously threw at import time under Node's CJS loader due to an axios-retry interop bug) and adds a package exports map (types/import/require) alongside the existing main/module fields. Dual CJS+ESM output is unchanged. Note for consumers doing deep imports of dist paths: the exports map now restricts entry points to the package root.
