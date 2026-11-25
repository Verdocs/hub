---
"@verdocs/js-sdk": minor
---

- `verifySigner` supports ID verification: pass `auth_method: 'id'` with the country, document type, and the front, back, and selfie photos, and it uploads them as multipart form data with a three minute timeout.
- Added `isIdRetakeRequired` to recognize an ID verification attempt whose photos need retaking, with the photos to retake and why in `images`.
- Added the `id_verification` and `id_verification_plus` entitlements, which replace `id_auth`. The API no longer returns `id_auth`, so it has been removed from `TEntitlement`.
- Recipient auth method states include `pending`.
