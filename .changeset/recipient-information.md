---
"@verdocs/js-sdk": patch
"@verdocs/python-sdk": patch
"@verdocs/csharp-sdk": patch
---

- Added `IRecipientInformation` (Python `RecipientInformation`, C# `Verdocs.Models.RecipientInformation`): the identity details a recipient supplies for SMS, KBA, and ID verification, kept apart from the recipient so they can be purged. Recipients carry it as an optional `recipientInformation`.
- The recipient's `phone`, `address`, `city`, `state`, `zip`, `ssn_last_4`, `dob`, and `kba_questions` are deprecated and moving to `recipientInformation`. The API still returns them on the recipient for now.
