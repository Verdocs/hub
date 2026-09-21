"""api_keys resource: list/create/rotate/update/delete, sync and async.

Resources are constructed directly (ApiKeys(endpoint)) because endpoint
wiring for the Organizations namespaces belongs to the coordinator.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

import pytest

from verdocs import ApiKey, NotFoundError
from verdocs.models.organizations import ApiKeyCreateParams, ApiKeyUpdateParams
from verdocs.resources.api_keys import ApiKeys, AsyncApiKeys

API_KEYS_URL = "/v2/api-keys"


def api_key_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "client_id": "ck-1234",
        "name": "CI",
        "organization_id": "org-1234",
        "profile_id": "profile-1234",
        "global_admin": False,
        "created_at": "2026-01-01T00:00:00.000Z",
        "last_used_at": None,
    }
    payload.update(overrides)
    return payload


def test_list_returns_keys_without_secrets(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{API_KEYS_URL}").respond(200, json=[api_key_payload()])

    keys = ApiKeys(endpoint).list()

    assert len(keys) == 1
    assert isinstance(keys[0], ApiKey)
    assert keys[0].client_id == "ck-1234"
    assert keys[0].client_secret is None
    assert isinstance(keys[0].created_at, datetime)
    assert keys[0].last_used_at is None
    # The deployed key record has no permission field; global_admin is the only access control.
    assert "permission" not in ApiKey.model_fields


def test_list_parses_last_used_at(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{API_KEYS_URL}").respond(
        200, json=[api_key_payload(last_used_at="2026-02-01T12:00:00.000Z")]
    )

    keys = ApiKeys(endpoint).list()

    assert isinstance(keys[0].last_used_at, datetime)
    assert keys[0].last_used_at.year == 2026


def test_create_sends_params_and_returns_secret(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{API_KEYS_URL}").respond(200, json=api_key_payload(client_secret="cs-secret"))

    key = ApiKeys(endpoint).create(ApiKeyCreateParams(name="CI", profile_id="profile-1234"))

    assert payloads.request_json(route) == {"name": "CI", "profile_id": "profile-1234"}
    assert key.client_secret == "cs-secret"


def test_create_sends_global_admin_when_set(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{API_KEYS_URL}").respond(
        200, json=api_key_payload(global_admin=True, client_secret="cs")
    )

    key = ApiKeys(endpoint).create(ApiKeyCreateParams(name="Admin", profile_id="profile-1234", global_admin=True))

    assert payloads.request_json(route) == {"name": "Admin", "profile_id": "profile-1234", "global_admin": True}
    assert key.global_admin is True


def test_create_invalid_profile_raises_not_found(endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{API_KEYS_URL}").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        ApiKeys(endpoint).create(ApiKeyCreateParams(name="CI", profile_id="nope"))


def test_rotate_posts_to_rotate_route(endpoint, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{API_KEYS_URL}/ck-1234/rotate").respond(
        200, json=api_key_payload(client_secret="cs-new")
    )

    key = ApiKeys(endpoint).rotate("ck-1234")

    assert route.called
    assert key.client_secret == "cs-new"


def test_update_sends_only_set_fields(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{API_KEYS_URL}/ck-1234").respond(200, json=api_key_payload(name="Renamed"))

    key = ApiKeys(endpoint).update("ck-1234", ApiKeyUpdateParams(name="Renamed"))

    assert payloads.request_json(route) == {"name": "Renamed"}
    assert key.name == "Renamed"
    assert key.client_secret is None


def test_update_sends_profile_id_and_global_admin(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{API_KEYS_URL}/ck-1234").respond(
        200, json=api_key_payload(profile_id="profile-5678", global_admin=True)
    )

    key = ApiKeys(endpoint).update("ck-1234", ApiKeyUpdateParams(profile_id="profile-5678", global_admin=True))

    assert payloads.request_json(route) == {"profile_id": "profile-5678", "global_admin": True}
    assert key.profile_id == "profile-5678"
    assert key.global_admin is True


def test_delete_returns_none(endpoint, respx_mock, base_url):
    route = respx_mock.delete(f"{base_url}{API_KEYS_URL}/ck-1234").respond(200, json={"status": "OK"})

    assert ApiKeys(endpoint).delete("ck-1234") is None
    assert route.called


async def test_async_list_returns_keys(async_endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{API_KEYS_URL}").respond(200, json=[api_key_payload()])

    keys = await AsyncApiKeys(async_endpoint).list()

    assert keys[0].client_id == "ck-1234"


async def test_async_create_rotate_update_delete_round_trip(async_endpoint, payloads, respx_mock, base_url):
    create_route = respx_mock.post(f"{base_url}{API_KEYS_URL}").respond(200, json=api_key_payload(client_secret="cs-1"))
    rotate_route = respx_mock.post(f"{base_url}{API_KEYS_URL}/ck-1234/rotate").respond(
        200, json=api_key_payload(client_secret="cs-2")
    )
    update_route = respx_mock.patch(f"{base_url}{API_KEYS_URL}/ck-1234").respond(
        200, json=api_key_payload(name="Renamed")
    )
    delete_route = respx_mock.delete(f"{base_url}{API_KEYS_URL}/ck-1234").respond(200, json={"status": "OK"})

    api_keys = AsyncApiKeys(async_endpoint)
    created = await api_keys.create(ApiKeyCreateParams(name="CI", profile_id="profile-1234"))
    rotated = await api_keys.rotate("ck-1234")
    updated = await api_keys.update("ck-1234", ApiKeyUpdateParams(name="Renamed"))
    deleted = await api_keys.delete("ck-1234")

    assert payloads.request_json(create_route) == {"name": "CI", "profile_id": "profile-1234"}
    assert payloads.request_json(update_route) == {"name": "Renamed"}
    assert created.client_secret == "cs-1"
    assert rotated.client_secret == "cs-2"
    assert updated.name == "Renamed"
    assert deleted is None
    assert rotate_route.called
    assert delete_route.called
