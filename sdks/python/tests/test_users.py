"""users.me and users.notifications: happy paths and error paths, sync and async."""

from __future__ import annotations

from datetime import datetime
from typing import Any

import pytest

from verdocs import AuthenticationError, User

ME_URL = "/v2/users/me"
NOTIFICATIONS_URL = "/v2/notifications"


def _notification_row(**overrides: Any) -> dict[str, Any]:
    """One notification row as the deployed API actually sends it.

    The wire rows carry store fields (type/recipient/delivered) that do not
    match the documented Notification model, which is why users.notifications
    returns plain dicts.
    """
    row: dict[str, Any] = {
        "id": "notification-1234",
        "type": "app",
        "recipient": "profile-1234",
        "event_name": "envelope:completed",
        "from_profile_id": "profile-5678",
        "from_organization_id": "org-1234",
        "envelope_id": "envelope-1234",
        "role_name": None,
        "data": None,
        "delivered": False,
        "message_id": None,
        "brand_id": None,
        "created_at": "2026-01-01T00:00:00.000Z",
        "updated_at": "2026-01-01T00:00:00.000Z",
    }
    row.update(overrides)
    return row


def test_me_returns_user(endpoint, payloads, respx_mock, base_url):
    respx_mock.get(f"{base_url}{ME_URL}").respond(200, json=payloads.user())

    user = endpoint.users.me()

    assert isinstance(user, User)
    assert user.id == "user-1234"
    assert user.email == "test@example.com"
    assert user.email_verified is True
    assert isinstance(user.created_at, datetime)


def test_me_keeps_unknown_fields(endpoint, payloads, respx_mock, base_url):
    payload = payloads.user(some_future_field={"nested": True})
    respx_mock.get(f"{base_url}{ME_URL}").respond(200, json=payload)

    user = endpoint.users.me()

    # Wire models keep undocumented server fields (extra="allow"); live beta
    # sends fields on user shapes that the js-sdk types do not document.
    assert user.id == "user-1234"
    assert user.some_future_field == {"nested": True}


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


def test_notifications_returns_raw_rows(endpoint, respx_mock, base_url):
    rows = [_notification_row(), _notification_row(id="notification-5678", delivered=True)]
    respx_mock.get(f"{base_url}{NOTIFICATIONS_URL}").respond(200, json=rows)

    notifications = endpoint.users.notifications()

    # The js-sdk leaves this response untyped and the deployed rows do not
    # match the Notification model, so they stay plain dicts.
    assert notifications == rows
    assert notifications[0]["recipient"] == "profile-1234"
    assert notifications[1]["delivered"] is True


def test_notifications_unauthenticated_raises(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{NOTIFICATIONS_URL}").respond(401, json={"error": "unauthorized"})

    with pytest.raises(AuthenticationError):
        endpoint.users.notifications()


async def test_async_notifications_returns_raw_rows(async_endpoint, respx_mock, base_url):
    rows = [_notification_row()]
    respx_mock.get(f"{base_url}{NOTIFICATIONS_URL}").respond(200, json=rows)

    notifications = await async_endpoint.users.notifications()

    assert notifications == rows
