"""Webhook operations (js-sdk: Organizations/Webhooks.ts).

An organization has at most one webhook configuration. It cannot be deleted;
disable it by setting active to False or the URL to an empty string. Every
call here requires an admin or owner.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from ..models.core import Webhook
from ..models.organizations import WebhookSetParams

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_WEBHOOKS_PATH = "/v2/webhooks"


def _write_body(params: WebhookSetParams) -> dict[str, Any]:
    return params.model_dump(mode="json", exclude_unset=True)


class Webhooks:
    """Webhook calls for a sync endpoint."""

    def __init__(self, endpoint: VerdocsEndpoint) -> None:
        self._endpoint = endpoint

    def get(self) -> Webhook:
        """Get the webhook configuration for the caller's organization via GET /v2/webhooks.

        The secret_key and client_secret come back masked to their last four
        characters; the full secret_key is only shown by rotate_secret().
        Mirrors js-sdk getWebhooks.

        Returns:
            The organization's webhook configuration.

        Raises:
            NotFoundError: The organization has never configured a webhook.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("GET", _WEBHOOKS_PATH)
        return Webhook.model_validate(response.json())

    def set(self, params: WebhookSetParams) -> Webhook:
        """Update (or first configure) the organization's webhook via PATCH /v2/webhooks.

        Mirrors js-sdk setWebhooks.

        Example:
            webhook = endpoint.webhooks.set(
                WebhookSetParams(
                    url="https://example.com/hooks/verdocs",
                    active=True,
                    events={"envelope_created": True, "envelope_completed": True},
                )
            )

        Args:
            params: The full configuration to apply. The URL must be HTTPS,
                or "" to disable deliveries.

        Returns:
            The updated webhook configuration.

        Raises:
            VerdocsAPIError: The API rejected the request.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("PATCH", _WEBHOOKS_PATH, json=_write_body(params))
        return Webhook.model_validate(response.json())

    def rotate_secret(self) -> Webhook:
        """Rotate (or first create) the webhook signing secret via PUT /v2/webhooks/rotate-secret.

        Until a secret exists, webhook calls carry no signature header. To
        authenticate a delivery, HMAC-SHA256 the JSON of the payload's inner
        "body" field with the secret and compare against the
        x-webhook-signature header. Pending deliveries keep the old secret
        until the next webhook fires. Mirrors js-sdk rotateWebhookSecret.

        Example:
            webhook = endpoint.webhooks.rotate_secret()
            signing_secret = webhook.secret_key  # unmasked only in this response

        Returns:
            The webhook configuration including the new secret_key.

        Raises:
            NotFoundError: The organization has never configured a webhook.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("PUT", f"{_WEBHOOKS_PATH}/rotate-secret")
        return Webhook.model_validate(response.json())


class AsyncWebhooks:
    """Webhook calls for an async endpoint."""

    def __init__(self, endpoint: AsyncVerdocsEndpoint) -> None:
        self._endpoint = endpoint

    async def get(self) -> Webhook:
        """Get the webhook configuration for the caller's organization via GET /v2/webhooks.

        The secret_key and client_secret come back masked to their last four
        characters; the full secret_key is only shown by rotate_secret().
        Mirrors js-sdk getWebhooks.

        Returns:
            The organization's webhook configuration.

        Raises:
            NotFoundError: The organization has never configured a webhook.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", _WEBHOOKS_PATH)
        return Webhook.model_validate(response.json())

    async def set(self, params: WebhookSetParams) -> Webhook:
        """Update (or first configure) the organization's webhook via PATCH /v2/webhooks.

        Mirrors js-sdk setWebhooks.

        Example:
            webhook = await endpoint.webhooks.set(
                WebhookSetParams(
                    url="https://example.com/hooks/verdocs",
                    active=True,
                    events={"envelope_created": True, "envelope_completed": True},
                )
            )

        Args:
            params: The full configuration to apply. The URL must be HTTPS,
                or "" to disable deliveries.

        Returns:
            The updated webhook configuration.

        Raises:
            VerdocsAPIError: The API rejected the request.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("PATCH", _WEBHOOKS_PATH, json=_write_body(params))
        return Webhook.model_validate(response.json())

    async def rotate_secret(self) -> Webhook:
        """Rotate (or first create) the webhook signing secret via PUT /v2/webhooks/rotate-secret.

        Until a secret exists, webhook calls carry no signature header. To
        authenticate a delivery, HMAC-SHA256 the JSON of the payload's inner
        "body" field with the secret and compare against the
        x-webhook-signature header. Pending deliveries keep the old secret
        until the next webhook fires. Mirrors js-sdk rotateWebhookSecret.

        Example:
            webhook = await endpoint.webhooks.rotate_secret()
            signing_secret = webhook.secret_key  # unmasked only in this response

        Returns:
            The webhook configuration including the new secret_key.

        Raises:
            NotFoundError: The organization has never configured a webhook.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("PUT", f"{_WEBHOOKS_PATH}/rotate-secret")
        return Webhook.model_validate(response.json())
