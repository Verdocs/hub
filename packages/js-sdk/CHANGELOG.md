# @verdocs/js-sdk

## 6.13.1

### Patch Changes

- - Added `getWebhookDeliveries` to list Webhook deliveries with filters for event, envelope, status, and date.
  - Added `getWebhookDelivery` to retrieve the payload for an individual delivery.
  - Added `resendWebhookDelivery` to retry a failed delivery.
  - Added `getWebhookDeliveryStats` to return daily Webhook delivery counts.
  - Failed deliveries are now retried automatically, and every attempt carries the same payload `id`. The signature docs now hash the payload's `data` field, which is what the API has always signed, and `getWebhooks`/`setWebhooks` note that secrets come back masked.

## 6.13.0

### Minor Changes

- - `addBrandAppDomain`, `removeBrandAppDomain`, and `verifyBrandAppDomain` allow creation and management of custom domains for hosting signing experiences.
- - The envelope status enum now provides an `expired` status (previously an expiration showed as `canceled`).
  - A recipient who fails authentication will have an explicit `failed` status.
  - `resetEnvelope()` now revives an expired envelope or one held up by a failed recipient.
  - `userCanResetEnvelope()` mirrors resetEnvelope's server-side checks, to help drive UI functionality like enabling/disabling a "Reset" button.
  - `requestFreshSigningLink()` allows a signer holding an expired invite to request a new one.
- - Field defaults accept booleans and numbers as well as strings in `createField`, `updateField`, as well as envelope field overrides. Note that to retain backwards compatibility, the API will still store them as text (e.g. `"true"`, `"10/08/2026"`, or `"1,234.50"`). This change is required to prepare for native type handling in field defaults and values.
- - Docs have been updated to clarify the role-rules for organization members, invitations, and API keys.
  - Refresh tokens will now be invalidated when keys are rotated, deleted, or reassigned to a different profile.
  - Docs have been updated to clarify how `default`, `readonly`, and `validator` work in template fields.
  - Docs have been updated to clarify that `duplicateTemplate` will assign ownership of the new template to the caller.
- - Added `endCurrentSession` to sign out of the current login session.
  - Added `sendTemplateFeedback` to send feedback about a template to the Verdocs team.
  - Refresh tokens are now only emitted by API-key based authentication flows.
  - Access tokens now include `grant` and `client_id` claims for API-key based authentication flows.
  - Docs for `updateOrganizationInvitation` clarified to note that `role` is the only field accepted.
  - Fixed an issue with `toggleTemplateStar` preventing it from working properly. Note that starring/unstarring a template does not count as an "update" and will not fire a Webhook or set `updated_at`.
  - `getTemplates` can now sort by `star_counter`.
  - Docs for `sender_name`, `sender_email`, `refreshToken`, `requestFreshSigningLink`, and `resetRecipient` now match the API.
  - `IBrand.email_display_name` is deprecated in favor of `email_sender_name`.

## 6.12.4

### Patch Changes

- Add `email_sender_name` to brands. This sets the default "from" name on emails when the brand is used. Note that custom email sender domain configurations will override this.

## 6.12.3

### Patch Changes

- Add `last_active_at` to the admin-only user record returned with organization members.

## 6.12.2

### Patch Changes

- Add `resetOrganizationMemberMFA` for org admins and owners, and `mfa_enabled` / `mfa_enrolled_at` on the admin-only user record returned with organization members.

## 6.12.1

### Patch Changes

- Envelope creation accepts an optional `brand_key`, pinning the new envelope to one of the organization's brands. The brand must belong to the organization the envelope is created under. Left unset, branding is resolved when the envelope is read, from the organization's default brand and then its parent's, which is the existing behavior.

## 6.12.0

### Minor Changes

- The JS SDK now lives in this monorepo and is published from here. This release merges the standalone repo's final state (6.11.1: login sessions, TOTP MFA, Google and Microsoft sign-in, the PKCE helpers, and the API key shape true-up) with the documentation and tooling work done here. Build moved from rollup-plugin-ts to tsup, TypeScript to 6.0, and TypeDoc to 0.28; the OpenAPI and SDK docs generators were updated for TypeDoc 0.28's comment placement. No runtime behavior changed beyond what the retry changeset already describes.
- Removed the axios-retry dependency. The four envelope-document retrieval calls that opted into it now use a small internal helper that retries once on timeout (ECONNABORTED/ETIMEDOUT); everything else is unchanged. This also fixes the broken CJS entry (dist/index.js previously threw at import time under Node's CJS loader due to an axios-retry interop bug) and adds a package exports map (types/import/require) alongside the existing main/module fields. Dual CJS+ESM output is unchanged. Note for consumers doing deep imports of dist paths: the exports map now restricts entry points to the package root.
