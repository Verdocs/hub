"""webhooks resource: get/set/rotate_secret, sync and async.

Resources are constructed directly (Webhooks(endpoint)) because endpoint
wiring for the Organizations namespaces belongs to the coordinator.
"""

from __future__ import annotations

from typing import Any

import pytest

from verdocs import NotFoundError, Webhook
from verdocs.models.organizations import WebhookSetParams
from verdocs.resources.webhooks import AsyncWebhooks, Webhooks

WEBHOOKS_URL = "/v2/webhooks"


def webhook_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": "webhook-1234",
        "organization_id": "org-1234",
        "url": "https://example.com/hooks/verdocs",
        "secret_key": "...abcd",
        "client_id": None,
        "client_secret": None,
        "scope": None,
        "token_endpoint": None,
        "auth_method": "none",
        "active": True,
        "events": {"envelope_created": True, "envelope_completed": False},
        "status": None,
        "last_success": None,
        "last_failure": None,
    }
    payload.update(overrides)
    return payload


def test_get_returns_webhook_with_masked_secret(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{WEBHOOKS_URL}").respond(200, json=webhook_payload())

    webhook = Webhooks(endpoint).get()

    assert isinstance(webhook, Webhook)
    assert webhook.url == "https://example.com/hooks/verdocs"
    assert webhook.secret_key == "...abcd"
    assert webhook.events["envelope_created"] is True


def test_get_unconfigured_raises_not_found(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{WEBHOOKS_URL}").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        Webhooks(endpoint).get()


def test_set_sends_configuration(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{WEBHOOKS_URL}").respond(200, json=webhook_payload())

    webhook = Webhooks(endpoint).set(
        WebhookSetParams(
            url="https://example.com/hooks/verdocs",
            active=True,
            events={"envelope_created": True, "envelope_completed": False},
        )
    )

    # auth_method and the client-credentials fields were never set, so they
    # stay off the wire.
    assert payloads.request_json(route) == {
        "url": "https://example.com/hooks/verdocs",
        "active": True,
        "events": {"envelope_created": True, "envelope_completed": False},
    }
    assert webhook.active is True


def test_set_sends_client_credentials_fields(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{WEBHOOKS_URL}").respond(
        200, json=webhook_payload(auth_method="client_credentials", client_id="wh-client")
    )

    webhook = Webhooks(endpoint).set(
        WebhookSetParams(
            url="https://example.com/hooks/verdocs",
            active=True,
            auth_method="client_credentials",
            client_id="wh-client",
            client_secret="wh-secret",
            token_endpoint="https://auth.example.com/token",
            events={},
        )
    )

    body = payloads.request_json(route)
    assert body["auth_method"] == "client_credentials"
    assert body["client_id"] == "wh-client"
    assert body["client_secret"] == "wh-secret"
    assert body["token_endpoint"] == "https://auth.example.com/token"
    assert webhook.auth_method == "client_credentials"


def test_set_disabling_with_empty_url(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{WEBHOOKS_URL}").respond(200, json=webhook_payload(url="", active=False))

    webhook = Webhooks(endpoint).set(WebhookSetParams(url="", active=False, events={}))

    assert payloads.request_json(route) == {"url": "", "active": False, "events": {}}
    assert webhook.active is False


def test_rotate_secret_returns_unmasked_secret(endpoint, respx_mock, base_url):
    route = respx_mock.put(f"{base_url}{WEBHOOKS_URL}/rotate-secret").respond(
        200, json=webhook_payload(secret_key="full-secret-key-value")
    )

    webhook = Webhooks(endpoint).rotate_secret()

    assert route.called
    assert webhook.secret_key == "full-secret-key-value"


async def test_async_get_returns_webhook(async_endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{WEBHOOKS_URL}").respond(200, json=webhook_payload())

    webhook = await AsyncWebhooks(async_endpoint).get()

    assert webhook.id == "webhook-1234"


async def test_async_set_and_rotate_secret(async_endpoint, payloads, respx_mock, base_url):
    set_route = respx_mock.patch(f"{base_url}{WEBHOOKS_URL}").respond(200, json=webhook_payload())
    rotate_route = respx_mock.put(f"{base_url}{WEBHOOKS_URL}/rotate-secret").respond(
        200, json=webhook_payload(secret_key="new-secret")
    )

    webhooks = AsyncWebhooks(async_endpoint)
    updated = await webhooks.set(
        WebhookSetParams(url="https://example.com/hooks/verdocs", active=True, events={"envelope_created": True})
    )
    rotated = await webhooks.rotate_secret()

    assert payloads.request_json(set_route)["active"] is True
    assert updated.url == "https://example.com/hooks/verdocs"
    assert rotated.secret_key == "new-secret"
    assert rotate_route.called
