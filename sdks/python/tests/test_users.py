"""users.me: happy path and error path, sync and async."""

from __future__ import annotations

from datetime import datetime

import pytest

from verdocs import AuthenticationError, User

ME_URL = "/v2/users/me"


def test_me_returns_user(endpoint, payloads, respx_mock, base_url):
    respx_mock.get(f"{base_url}{ME_URL}").respond(200, json=payloads.user())

    user = endpoint.users.me()

    assert isinstance(user, User)
    assert user.id == "user-1234"
    assert user.email == "test@example.com"
    assert user.email_verified is True
    assert isinstance(user.created_at, datetime)


def test_me_ignores_unknown_fields(endpoint, payloads, respx_mock, base_url):
    payload = payloads.user(some_future_field={"nested": True})
    respx_mock.get(f"{base_url}{ME_URL}").respond(200, json=payload)

    user = endpoint.users.me()

    assert user.id == "user-1234"
    assert not hasattr(user, "some_future_field")


def test_me_unauthenticated_raises(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{ME_URL}").respond(401, json={"error": "unauthorized"})

    with pytest.raises(AuthenticationError) as excinfo:
        endpoint.users.me()

    assert excinfo.value.status_code == 401


async def test_async_me_returns_user(async_endpoint, payloads, respx_mock, base_url):
    respx_mock.get(f"{base_url}{ME_URL}").respond(200, json=payloads.user())

    user = await async_endpoint.users.me()

    assert isinstance(user, User)
    assert user.email == "test@example.com"


async def test_async_me_unauthenticated_raises(async_endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{ME_URL}").respond(401, json={"error": "unauthorized"})

    with pytest.raises(AuthenticationError):
        await async_endpoint.users.me()
