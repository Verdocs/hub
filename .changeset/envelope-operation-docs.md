---
"@verdocs/js-sdk": patch
---

- Clarify the `cancel` and `reset` actions for `PUT /v2/envelopes/:id`.
- Clarify the documentation on the `expired` envelope status, the `failed` recipient status, which envelopes the `inbox` view returns, that expiring an envelope doesn't set `canceled_at`, and that password sign-in always fails for accounts that only use social sign-in.
