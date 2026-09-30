---
'@verdocs/js-sdk': patch
---

Add `resetEnvelope` to revive expired envelopes or ones stalled on a failed recipient authentication, and `requestFreshInvite` to email a signer a new link. `TEnvelopeStatus` gains `'expired'` (expiry no longer marks envelopes canceled), `THistoryEvent` gains `'envelope:reset'`, and user sessions from API keys carry `grant` and `client_id`.
