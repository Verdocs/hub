# Conformance testing plan

This is the plan every Verdocs SDK lane follows: `js-sdk`, `python`, `csharp`, and any language we add later. The goal is narrow and boring on purpose: prove each SDK returns what the live API actually returns, and keep all lanes looking the same so a person (or an agent) can move between them without relearning anything.

## The one idea

For each covered endpoint, call it twice:

1. once with a plain HTTP client (no SDK in the path), and
2. once with the SDK,

then normalize volatile fields (tokens, timestamps, expiries) on both sides and assert the status and the JSON match. The raw call is the ruler; the SDK call is what we are measuring.

## Single source of truth

`packages/conformance/fixtures.json` is the only shared file. It holds the case list and the volatile-key policy, and nothing else. Every lane reads that exact file from the hub root. No lane keeps its own copy of the cases.

We deliberately share data, not code. Each language reimplements the small amount of logic (normalize, raw call, dispatch) in its own idiom rather than importing a shared library. That keeps the SDKs independent and the shared surface as small as one JSON file.

### fixtures.json shape

```json
{
  "volatileKeyPattern": "(_at|_exp)$|^(access_token|id_token|refresh_token|expires_in|last_polled)",
  "volatileKeyPatternFlags": "i",
  "cases": [
    {
      "id": "templates-list",
      "sdk": "getTemplates",
      "method": "GET",
      "path": "/v2/templates",
      "auth": true,
      "query": { "visibility": "private_shared", "rows": 10, "page": 0 }
    }
  ],
  "frozen": []
}
```

Top level:


| Field                     | Meaning                                                                  |
| ------------------------- | ------------------------------------------------------------------------ |
| `volatileKeyPattern`      | Regex of JSON keys whose values get masked before comparing              |
| `volatileKeyPatternFlags` | Flags for that regex. Today `"i"`. Honor it; do not hardcode flags       |
| `cases`                   | The active cases every lane runs                                         |
| `frozen`                  | Cases parked because the API is broken for all clients. Lanes skip these |


Each case:


| Field             | Meaning                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------- |
| `id`              | Stable test name. Use it as the test/parametrize id in every lane                       |
| `sdk`             | Logical operation name. Each lane maps this string to a real SDK call. Not a file path  |
| `method` / `path` | The raw HTTP call                                                                       |
| `auth`            | If true, send the session bearer on the raw call                                        |
| `query`           | Optional query params. Raw side serializes them; SDK side feeds them into typed options |
| `body`            | Optional JSON body. Placeholders like `$VERDOCS_TEST_EMAIL` are substituted by the lane |
| `note`            | Human and machine hint for a special compare (see Special cases)                        |




## Where each lane lives

Every lane sits next to the SDK it tests. `packages/conformance` owns only the shared fixture and these docs.

```
packages/
  conformance/
    fixtures.json          # the shared contract (data only)
    docs/                  # this plan
  js-sdk/
    test/conformance/      # the JS lane
sdks/
  python/
    tests/conformance/     # the Python lane
  csharp/
    tests/Verdocs.Sdk.Tests/Conformance/   # the C# lane
```

`js-sdk` stays under `packages/` because that is the pnpm workspace, and the other JS packages consume it with `workspace:^`. `python` and `csharp` live under `sdks/` because pnpm does not manage them. The home differs; the lane shape does not.

## The six roles every lane implements

Whatever the language, a lane is these six pieces and nothing more:

1. **Env and gate.** Load `VERDOCS_API_BASE` and credentials from the environment or the hub root `.env`. Keep the lane out of the default unit run so plain CI never calls beta. Missing credentials when the lane is explicitly invoked is a hard error with instructions, not a silent skip.
2. **Fixtures.** Find the hub root from the test file (walk up; do not trust the working directory) and read `packages/conformance/fixtures.json`.
3. **Normalize.** Mask volatile values using the shared pattern. Same algorithm everywhere (see below).
4. **Raw HTTP.** A plain client (httpx, HttpClient, curl). Never the SDK's own transport, or the two sides are not independent.
5. **Dispatch.** Map `case.sdk` to a real, language-native SDK call. An unknown `sdk` value fails loudly with a "add a mapping" message.
6. **The test.** Iterate the cases (parametrize, theory, or the closest equivalent), skip `frozen`, and assert normalized SDK output equals the normalized raw body.



## Normalize rules

Recurse through the value. For an object, if a key matches `volatileKeyPattern`, replace its value with a type marker; otherwise recurse. For an array, map over it. Everything else passes through.

The type marker uses JavaScript `typeof` semantics so all lanes agree:

- `null` becomes `"null"`
- boolean becomes `"boolean"`
- number becomes `"number"`
- string becomes `"string"`
- anything else (objects, arrays) becomes `"object"`

A masked value renders as `<<type>>`, for example `<<string>>`. Compile the pattern from the JSON every time with its flags. Do not hardcode a second copy of the regex.

## Typed-SDK adaptation

Some SDKs drop unknown wire fields by design (pydantic in Python, System.Text.Json models in C#). Comparing a full raw body against a model that silently ignores extras would fail forever, so those lanes prune the raw body to the keys the SDK actually returned, then compare. Everything the SDK surfaces is still checked in full, and required model fields guarantee load-bearing keys cannot vanish. Pass-through SDKs (js-sdk) usually compare without pruning. Document which choice a lane makes right next to its runner.

## Special cases

When an SDK reshapes a response on purpose, record it once in the case `note` and branch on `case.id` the same way in every lane. Keep this to a few id branches; do not invent a transform mini-language in the fixture.

Current example: `profiles-current`. The raw response is an array; the SDK returns the entry with `current=true`, so each lane picks that entry as the comparison target.

## Running a lane

Each lane is opt-in. The mechanism is language-native; the semantics are identical (offline by default, live when asked).


| Lane   | Command                                                                       |
| ------ | ----------------------------------------------------------------------------- |
| JS     | `pnpm conformance`                                                       |
| Python | `python -m pytest -m conformance`                                             |
| C#     | `VERDOCS_CONFORMANCE=1 dotnet test --filter "FullyQualifiedName~Conformance"` |


All three read the same `fixtures.json` and the same credentials.

## Adding a case

1. Add the operation to `js-sdk` first (the hand-maintained north star).
2. Add one entry to `cases` in `fixtures.json` (`id`, `sdk`, `method`, `path`, `auth`, optional `query`/`body`).
3. Add one dispatch arm per lane mapping the new `sdk` name to that language's call.
4. Run each lane's conformance command. The same `id` should be green everywhere.
5. If the endpoint is broken for every client, move the case to `frozen` with a note instead of deleting it.



## Adding a language

1. Create the lane folder next to that SDK's tests.
2. Implement the six roles above.
3. Read `fixtures.json` from the hub root; do not fork it.
4. Reuse the same env var names and the same opt-in semantics.
5. Add its command to the table above and to the nightly CI matrix.



## SDK operations

Every public SDK method is tagged with `@sdkOperation` in js-sdk (see `docs/sdk-docs-generation.md`). The `sdk` field in `fixtures.json` uses that same id. The table below lists all 239 operations from js-sdk today; check a row when it has a conformance case in `fixtures.json` (`cases` or `chain.steps`).

| Covered | Operation | Group |
| ------- | --------- | ----- |
| [ ] | `apiKey.createApiKey` | apiKey |
| [ ] | `apiKey.deleteApiKey` | apiKey |
| [x] | `apiKey.getApiKeys` | apiKey |
| [ ] | `apiKey.rotateApiKey` | apiKey |
| [ ] | `apiKey.updateApiKey` | apiKey |
| [x] | `auth.authenticate` | auth |
| [ ] | `auth.changePassword` | auth |
| [x] | `auth.getMyUser` | auth |
| [ ] | `auth.getOAuth2AuthorizeUrl` | auth |
| [ ] | `auth.refreshToken` | auth |
| [ ] | `auth.resendVerification` | auth |
| [ ] | `auth.resetPassword` | auth |
| [ ] | `auth.verifyEmail` | auth |
| [ ] | `brand.addBrandEmailDomain` | brand |
| [ ] | `brand.createBrand` | brand |
| [ ] | `brand.deleteBrand` | brand |
| [ ] | `brand.getBrand` | brand |
| [x] | `brand.getBrands` | brand |
| [ ] | `brand.removeBrandEmailDomain` | brand |
| [ ] | `brand.updateBrand` | brand |
| [ ] | `brand.updateBrandLogo` | brand |
| [ ] | `brand.updateBrandThumbnail` | brand |
| [ ] | `brand.verifyBrandEmailDomain` | brand |
| [ ] | `color.getRGB` | color |
| [ ] | `color.getRGBA` | color |
| [ ] | `color.getRoleColor` | color |
| [ ] | `color.nameToRGBA` | color |
| [ ] | `contact.createOrganizationContact` | contact |
| [ ] | `contact.deleteOrganizationContact` | contact |
| [x] | `contact.getOrganizationContacts` | contact |
| [ ] | `contact.updateOrganizationContact` | contact |
| [ ] | `dateTime.formatShortTimeAgo` | dateTime |
| [ ] | `endpoint.VerdocsEndpoint` | endpoint |
| [ ] | `endpoint.clearSession` | endpoint |
| [ ] | `endpoint.clearSignerSession` | endpoint |
| [ ] | `endpoint.constructor` | endpoint |
| [ ] | `endpoint.getBaseURL` | endpoint |
| [ ] | `endpoint.getClientID` | endpoint |
| [ ] | `endpoint.getDefault` | endpoint |
| [ ] | `endpoint.getEnvironment` | endpoint |
| [ ] | `endpoint.getSession` | endpoint |
| [ ] | `endpoint.getSessionType` | endpoint |
| [ ] | `endpoint.getTimeout` | endpoint |
| [ ] | `endpoint.getToken` | endpoint |
| [ ] | `endpoint.loadSession` | endpoint |
| [ ] | `endpoint.logRequests` | endpoint |
| [ ] | `endpoint.onSessionChanged` | endpoint |
| [ ] | `endpoint.setBaseURL` | endpoint |
| [ ] | `endpoint.setClientID` | endpoint |
| [ ] | `endpoint.setDefault` | endpoint |
| [ ] | `endpoint.setEnvironment` | endpoint |
| [ ] | `endpoint.setSessionType` | endpoint |
| [ ] | `endpoint.setTimeout` | endpoint |
| [ ] | `endpoint.setToken` | endpoint |
| [ ] | `entitlement.collapseEntitlements` | entitlement |
| [ ] | `envelope.canAccessEnvelope` | envelope |
| [x] | `envelope.cancelEnvelope` | envelope |
| [x] | `envelope.createEnvelope` | envelope |
| [ ] | `envelope.deleteEnvelopeFieldAttachment` | envelope |
| [ ] | `envelope.downloadEnvelopeDocument` | envelope |
| [ ] | `envelope.envelopeIsActive` | envelope |
| [ ] | `envelope.envelopeIsComplete` | envelope |
| [ ] | `envelope.getCombinedEnvelopeDocumentDownloadLink` | envelope |
| [x] | `envelope.getEnvelope` | envelope |
| [ ] | `envelope.getEnvelopeDocument` | envelope |
| [ ] | `envelope.getEnvelopeDocumentDownloadLink` | envelope |
| [ ] | `envelope.getEnvelopeDocumentPageDisplayUri` | envelope |
| [ ] | `envelope.getEnvelopeDocumentPreviewLink` | envelope |
| [ ] | `envelope.getEnvelopeFile` | envelope |
| [x] | `envelope.getEnvelopes` | envelope |
| [ ] | `envelope.getEnvelopesZip` | envelope |
| [ ] | `envelope.getMyRecipient` | envelope |
| [ ] | `envelope.getNextRecipient` | envelope |
| [ ] | `envelope.getRecipient` | envelope |
| [ ] | `envelope.getRecipientWithActions` | envelope |
| [ ] | `envelope.getRecipientsWithActions` | envelope |
| [ ] | `envelope.isEnvelopeOwner` | envelope |
| [ ] | `envelope.isEnvelopeRecipient` | envelope |
| [ ] | `envelope.isFieldFilled` | envelope |
| [ ] | `envelope.isFieldValid` | envelope |
| [ ] | `envelope.recipientCanAct` | envelope |
| [ ] | `envelope.recipientHasAction` | envelope |
| [ ] | `envelope.sortDocuments` | envelope |
| [ ] | `envelope.sortFields` | envelope |
| [ ] | `envelope.sortRecipients` | envelope |
| [ ] | `envelope.updateEnvelope` | envelope |
| [ ] | `envelope.updateEnvelopeField` | envelope |
| [ ] | `envelope.uploadEnvelopeFieldAttachment` | envelope |
| [ ] | `envelope.useCanAccessEnvelope` | envelope |
| [ ] | `envelope.userCanAct` | envelope |
| [ ] | `envelope.userCanCancelEnvelope` | envelope |
| [ ] | `envelope.userCanFinishEnvelope` | envelope |
| [ ] | `envelope.userCanSignNow` | envelope |
| [ ] | `envelope.userIsEnvelopeOwner` | envelope |
| [ ] | `envelope.userIsEnvelopeRecipient` | envelope |
| [ ] | `field.blobToBase64` | field |
| [x] | `field.createField` | field |
| [ ] | `field.deleteField` | field |
| [ ] | `field.getRLeft` | field |
| [ ] | `field.getRTop` | field |
| [ ] | `field.getRValue` | field |
| [ ] | `field.rescale` | field |
| [ ] | `field.updateField` | field |
| [ ] | `file.downloadBlob` | file |
| [ ] | `file.fileToDataUrl` | file |
| [ ] | `group.addGroupMember` | group |
| [ ] | `group.createGroup` | group |
| [ ] | `group.deleteGroup` | group |
| [ ] | `group.deleteGroupMember` | group |
| [ ] | `group.getGroup` | group |
| [x] | `group.getGroups` | group |
| [ ] | `group.updateGroup` | group |
| [ ] | `initial.createInitials` | initial |
| [ ] | `invitation.acceptOrganizationInvitation` | invitation |
| [ ] | `invitation.createOrganizationInvitation` | invitation |
| [ ] | `invitation.declineOrganizationInvitation` | invitation |
| [ ] | `invitation.deleteOrganizationInvitation` | invitation |
| [ ] | `invitation.getOrganizationInvitation` | invitation |
| [x] | `invitation.getOrganizationInvitations` | invitation |
| [ ] | `invitation.resendOrganizationInvitation` | invitation |
| [ ] | `invitation.updateOrganizationInvitation` | invitation |
| [ ] | `kba.getKbaStep` | kba |
| [ ] | `kba.submitKbaChallengeResponse` | kba |
| [ ] | `kba.submitKbaIdentity` | kba |
| [ ] | `kba.submitKbaPin` | kba |
| [ ] | `locale.getCountryByCode` | locale |
| [ ] | `locale.getMatchingCountry` | locale |
| [ ] | `locale.getPlusOneCountry` | locale |
| [ ] | `locale.isAmericanSamoa` | locale |
| [ ] | `locale.isCanada` | locale |
| [ ] | `locale.isDominicanRepublic` | locale |
| [ ] | `locale.isFrenchGuiana` | locale |
| [ ] | `locale.isGuadeloupe` | locale |
| [ ] | `locale.isMartinique` | locale |
| [ ] | `locale.isMayotte` | locale |
| [ ] | `locale.isPuertoRico` | locale |
| [ ] | `member.createOrganizationMember` | member |
| [ ] | `member.deleteOrganizationMember` | member |
| [x] | `member.getOrganizationMembers` | member |
| [ ] | `member.lockOrganizationMember` | member |
| [ ] | `member.unlockOrganizationMember` | member |
| [ ] | `member.updateOrganizationMember` | member |
| [ ] | `notification.createNotificationTemplate` | notification |
| [ ] | `notification.deleteNotificationTemplate` | notification |
| [ ] | `notification.getNotificationTemplate` | notification |
| [x] | `notification.getNotificationTemplates` | notification |
| [x] | `notification.getNotifications` | notification |
| [ ] | `notification.updateNotificationTemplate` | notification |
| [ ] | `organization.createOrganization` | organization |
| [ ] | `organization.deleteOrganization` | organization |
| [ ] | `organization.getActiveEntitlements` | organization |
| [x] | `organization.getEntitlements` | organization |
| [x] | `organization.getOrganization` | organization |
| [x] | `organization.getOrganizationChildren` | organization |
| [x] | `organization.getOrganizationPipelineSettings` | organization |
| [x] | `organization.getOrganizationUsage` | organization |
| [ ] | `organization.updateOrganization` | organization |
| [ ] | `organization.updateOrganizationLogo` | organization |
| [ ] | `organization.updateOrganizationPipelineSettings` | organization |
| [ ] | `organization.updateOrganizationThumbnail` | organization |
| [ ] | `permission.userHasPermissions` | permission |
| [ ] | `primitive.formatFullName` | primitive |
| [ ] | `primitive.formatInitials` | primitive |
| [ ] | `primitive.fullNameToInitials` | primitive |
| [ ] | `primitive.integerSequence` | primitive |
| [ ] | `profile.createProfile` | profile |
| [ ] | `profile.deleteProfile` | profile |
| [x] | `profile.getCurrentProfile` | profile |
| [x] | `profile.getProfiles` | profile |
| [ ] | `profile.switchProfile` | profile |
| [ ] | `profile.updateProfile` | profile |
| [ ] | `profile.updateProfilePhoto` | profile |
| [ ] | `recipient.askQuestion` | recipient |
| [ ] | `recipient.delegateRecipient` | recipient |
| [ ] | `recipient.envelopeRecipientAgree` | recipient |
| [ ] | `recipient.envelopeRecipientDecline` | recipient |
| [ ] | `recipient.envelopeRecipientSubmit` | recipient |
| [ ] | `recipient.getInPersonLink` | recipient |
| [ ] | `recipient.remindRecipient` | recipient |
| [ ] | `recipient.resetRecipient` | recipient |
| [ ] | `recipient.startSigningSession` | recipient |
| [ ] | `recipient.updateRecipient` | recipient |
| [ ] | `recipient.verifySigner` | recipient |
| [ ] | `retry.retryOnceOnTimeout` | retry |
| [x] | `role.createTemplateRole` | role |
| [ ] | `role.deleteTemplateRole` | role |
| [ ] | `role.updateTemplateRole` | role |
| [ ] | `signature.createSignature` | signature |
| [ ] | `string.capitalize` | string |
| [ ] | `string.convertToE164` | string |
| [ ] | `string.randomString` | string |
| [ ] | `template.canPerformTemplateAction` | template |
| [x] | `template.createTemplate` | template |
| [ ] | `template.createTemplateFromSharepoint` | template |
| [ ] | `template.deleteTemplate` | template |
| [ ] | `template.duplicateTemplate` | template |
| [ ] | `template.getFieldsForRole` | template |
| [ ] | `template.getTemplate` | template |
| [x] | `template.getTemplates` | template |
| [ ] | `template.hasRequiredPermissions` | template |
| [ ] | `template.toggleTemplateStar` | template |
| [ ] | `template.updateTemplate` | template |
| [ ] | `template.userCanBuildTemplate` | template |
| [ ] | `template.userCanChangeOrgVisibility` | template |
| [ ] | `template.userCanCreateOrgTemplate` | template |
| [ ] | `template.userCanCreatePersonalTemplate` | template |
| [ ] | `template.userCanCreatePublicTemplate` | template |
| [ ] | `template.userCanCreateTemplate` | template |
| [ ] | `template.userCanDeleteTemplate` | template |
| [ ] | `template.userCanMakeTemplatePrivate` | template |
| [ ] | `template.userCanMakeTemplatePublic` | template |
| [ ] | `template.userCanMakeTemplateShared` | template |
| [ ] | `template.userCanPreviewTemplate` | template |
| [ ] | `template.userCanReadTemplate` | template |
| [ ] | `template.userCanSendTemplate` | template |
| [ ] | `template.userCanUpdateTemplate` | template |
| [ ] | `template.userHasSharedTemplate` | template |
| [ ] | `template.userIsTemplateCreator` | template |
| [ ] | `templateDocument.createTemplateDocument` | templateDocument |
| [ ] | `templateDocument.deleteTemplateDocument` | templateDocument |
| [ ] | `templateDocument.downloadTemplateDocument` | templateDocument |
| [ ] | `templateDocument.getTemplateDocument` | templateDocument |
| [ ] | `templateDocument.getTemplateDocumentDownloadLink` | templateDocument |
| [ ] | `templateDocument.getTemplateDocumentFile` | templateDocument |
| [ ] | `templateDocument.getTemplateDocumentPageDisplayUri` | templateDocument |
| [ ] | `templateDocument.getTemplateDocumentPreviewLink` | templateDocument |
| [ ] | `templateDocument.getTemplateDocumentThumbnail` | templateDocument |
| [ ] | `token.AtoB` | token |
| [ ] | `token.decodeAccessTokenBody` | token |
| [ ] | `token.decodeJWTBody` | token |
| [ ] | `validator.getValidators` | validator |
| [ ] | `validator.isValidEmail` | validator |
| [ ] | `validator.isValidInput` | validator |
| [ ] | `validator.isValidPhone` | validator |
| [ ] | `validator.isValidRoleName` | validator |
| [ ] | `validator.isValidTag` | validator |
| [x] | `webhook.getWebhooks` | webhook |
| [ ] | `webhook.rotateWebhookSecret` | webhook |
| [ ] | `webhook.setWebhooks` | webhook |

**26 of 239** operations have fixture coverage today.

## Current state

- `python` follows this plan: it parametrizes from `fixtures.json` and mirrors normalize.
- `csharp` follows this plan: a single theory loads `fixtures.json` and iterates the cases, dispatching each `sdk` name to its typed call.
- The JS lane currently lives in `packages/conformance/src`. Moving it into `packages/js-sdk/test/conformance` (leaving only `fixtures.json` and docs behind) is the open item there.

Done, operationally, is one sentence: edit the JSON, add a dispatch arm per language, run each opt-in command, and the same case ids pass in every lane.