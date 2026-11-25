---
"@verdocs/python-sdk": minor
"@verdocs/csharp-sdk": minor
---

- `verify_signer` (Python) and `Recipients.VerifySignerAsync` (C#) support ID verification. Pass `RecipientVerifyIdParams` in Python or `AuthenticateRecipientViaIdRequest` in C#, with the issuing country, the document type, and the front, optional back, and selfie photos. The photos go up as multipart form data, and the call allows at least three minutes because GBG checks them while the request waits.
- Added `is_id_retake_required` (Python) and `Recipients.IsIdRetakeRequired` (C#). They recognize an ID verification attempt whose photos need retaking; `IdRetakeResponse` lists each photo to retake and why.
- `Recipient` and the create-envelope recipient models gained `id_verification_level` (`base` or `plus`). Recipient auth method states can now be `pending`.
- Added the `id_verification` and `id_verification_plus` entitlements, which replace `id_auth`. The API no longer returns `id_auth`, so it has been removed.
- Added `proper_nounify` (Python) and `Strings.ProperNounify` (C#).
