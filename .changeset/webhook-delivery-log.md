---
"@verdocs/js-sdk": patch
---

- Added `getWebhookDeliveries` to list Webhook deliveries with filters for event, envelope, status, and date.
- Added `getWebhookDelivery` to retrieve the payload for an individual delivery.
- Added `resendWebhookDelivery` to retry a failed delivery. Note: automatic and manual retries all retain the same payload `id` to support idempotency checks in receiver services.
- Added `getWebhookDeliveryStats` to return daily Webhook delivery counts. 