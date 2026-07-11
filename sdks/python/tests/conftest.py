"""Shared fixtures for the unit tests.

Unit tests never touch the live API: every route is stubbed with respx. The
payload builders carry the full set of required fields for each model so
tests only spell out what they care about. Helpers are handed to tests as
fixtures because importlib import mode does not let test modules import each
other.
"""

from __future__ import annotations

import base64
import json
import time
from types import SimpleNamespace
from typing import Any

import pytest

from verdocs import AsyncVerdocsEndpoint, VerdocsEndpoint

BASE_URL = "https://api.test"


def make_token(session_type: str = "user", *, exp_offset: int = 3600, **extra_claims: Any) -> str:
    """Build an unsigned JWT carrying the claims our decoder reads.

    The SDK never verifies signatures, so a fake signature segment is enough.
    """
    claims: dict[str, Any] = {
        "sub": "user-1234",
        "iat": int(time.time()),
        "exp": int(time.time()) + exp_offset,
        "session_type": session_type,
        "email": "test@example.com",
        "profile_id": "profile-1234",
    }
    if session_type == "user":
        claims.update({"jti": "jti-1234", "organization_id": "org-1234", "global_admin": False})
    else:
        claims.update({"envelope_id": "envelope-1234", "role_name": "Recipient 1", "key_type": "email"})
    claims.update(extra_claims)

    def encode(part: dict[str, Any]) -> str:
        return base64.urlsafe_b64encode(json.dumps(part).encode()).decode().rstrip("=")

    return f"{encode({'alg': 'none', 'typ': 'JWT'})}.{encode(claims)}.signature"


def auth_payload() -> dict[str, Any]:
    now = int(time.time())
    return {
        "access_token": make_token(),
        "id_token": "id-token-value",
        "refresh_token": "refresh-token-value",
        "expires_in": 3600,
        "access_token_exp": now + 3600,
        "refresh_token_exp": now + 86400,
    }


def user_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": "user-1234",
        "email": "test@example.com",
        "email_verified": True,
        "first_name": "Test",
        "last_name": "User",
        "phone": None,
        "picture": None,
        "b2cId": None,
        "googleId": None,
        "appleId": None,
        "created_at": "2026-01-01T00:00:00.000Z",
        "updated_at": "2026-01-02T00:00:00.000Z",
    }
    payload.update(overrides)
    return payload


def profile_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": "profile-1234",
        "user_id": "user-1234",
        "organization_id": "org-1234",
        "first_name": "Test",
        "last_name": "User",
        "email": "test@example.com",
        "phone": None,
        "picture": None,
        "current": True,
        "permissions": ["template:creator:create"],
        "roles": ["member"],
        "created_at": "2026-01-01T00:00:00.000Z",
        "updated_at": "2026-01-02T00:00:00.000Z",
    }
    payload.update(overrides)
    return payload


def template_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": "template-1234",
        "profile_id": "profile-1234",
        "organization_id": "org-1234",
        "sender": "envelope_creator",
        "name": "Test Template",
        "counter": 0,
        "star_counter": 0,
        "initial_reminder": None,
        "followup_reminders": None,
        "max_reminder_days": 14,
        "is_personal": True,
        "is_public": False,
        "visibility": "private",
        "is_sendable": False,
        "created_at": "2026-01-01T00:00:00.000Z",
        "updated_at": "2026-01-02T00:00:00.000Z",
        "last_used_at": None,
        "search_key": "test template",
        "data": None,
    }
    payload.update(overrides)
    return payload


def template_list_payload(*templates: dict[str, Any]) -> dict[str, Any]:
    entries = list(templates) or [template_payload()]
    return {"count": len(entries), "rows": len(entries), "page": 0, "templates": entries}


def request_json(route: Any) -> Any:
    """The JSON body of the last request a respx route captured."""
    return json.loads(route.calls.last.request.content)


@pytest.fixture
def base_url() -> str:
    return BASE_URL


@pytest.fixture
def token_factory():
    return make_token


@pytest.fixture
def payloads() -> SimpleNamespace:
    """Payload builders bundled into one fixture to keep test signatures short."""
    return SimpleNamespace(
        auth=auth_payload,
        user=user_payload,
        profile=profile_payload,
        template=template_payload,
        template_list=template_list_payload,
        request_json=request_json,
    )


@pytest.fixture
def endpoint():
    with VerdocsEndpoint(base_url=BASE_URL) as ep:
        yield ep


@pytest.fixture
async def async_endpoint():
    async with AsyncVerdocsEndpoint(base_url=BASE_URL) as ep:
        yield ep
