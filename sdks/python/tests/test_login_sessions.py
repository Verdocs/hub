"""sessions resource: list, revoke, and revoke_others, sync and async.

These are the server-side login session records (js-sdk Users/Sessions.ts),
distinct from the decoded-token session models covered in
test_sessions_models.py.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

import pytest

from verdocs import AuthenticationError, RevokeSessionsResponse, UserLoginSession, VerdocsAPIError

SESSIONS_URL = "/v2/users/sessions"


def session_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": "session-1234",
        "current": True,
        "source": "password",
        "created_at": "2026-01-01T00:00:00.000Z",
        "last_seen_at": "2026-01-02T00:00:00.000Z",
        "browser": "Chrome",
        "platform": "macOS",
        "mobile": False,
        "location": "Austin, TX, US",
        "ip_address": "73.***.***.14",
    }
    payload.update(overrides)
    return payload


def test_list_returns_sessions_newest_first(endpoint, respx_mock, base_url):
    rows = [
        session_payload(),
        session_payload(id="session-5678", current=False, source="oauth2:client-1", browser=None, platform=None),
    ]
    respx_mock.get(f"{base_url}{SESSIONS_URL}").respond(200, json=rows)

    sessions = endpoint.sessions.list()

    assert len(sessions) == 2
    assert all(isinstance(session, UserLoginSession) for session in sessions)
    current, other = sessions
    assert current.id == "session-1234"
    assert current.current is True
    assert isinstance(current.created_at, datetime)
    assert isinstance(current.last_seen_at, datetime)
    assert current.browser == "Chrome"
    assert current.mobile is False
    assert current.location == "Austin, TX, US"
    assert current.ip_address == "73.***.***.14"
    # The source is an open string so oauth2:CLIENTID style values survive.
    assert other.source == "oauth2:client-1"
    assert other.current is False
    assert other.browser is None
    assert other.platform is None


def test_list_tolerates_null_optional_fields(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{SESSIONS_URL}").respond(
        200, json=[session_payload(browser=None, platform=None, location=None, ip_address=None)]
    )

    session = endpoint.sessions.list()[0]

    assert session.location is None
    assert session.ip_address is None


def test_list_unauthenticated_raises(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{SESSIONS_URL}").respond(401, json={"error": "unauthorized"})

    with pytest.raises(AuthenticationError):
        endpoint.sessions.list()


def test_revoke_deletes_the_session_route(endpoint, respx_mock, base_url):
    route = respx_mock.delete(f"{base_url}{SESSIONS_URL}/session-5678").respond(200, json={"status": "OK"})

    assert endpoint.sessions.revoke("session-5678") is None

    assert route.called
    assert route.calls.last.request.content == b""


def test_revoke_current_session_raises(endpoint, respx_mock, base_url):
    respx_mock.delete(f"{base_url}{SESSIONS_URL}/session-1234").respond(
        400, json={"error": "The current session cannot be revoked"}
    )

    with pytest.raises(VerdocsAPIError) as excinfo:
        endpoint.sessions.revoke("session-1234")

    assert excinfo.value.status_code == 400


def test_revoke_others_returns_the_count(endpoint, respx_mock, base_url):
    route = respx_mock.delete(f"{base_url}{SESSIONS_URL}").respond(200, json={"revoked": 3})

    result = endpoint.sessions.revoke_others()

    assert isinstance(result, RevokeSessionsResponse)
    assert result.revoked == 3
    assert route.calls.last.request.method == "DELETE"


def test_revoke_others_with_nothing_to_revoke(endpoint, respx_mock, base_url):
    respx_mock.delete(f"{base_url}{SESSIONS_URL}").respond(200, json={"revoked": 0})

    assert endpoint.sessions.revoke_others().revoked == 0


async def test_async_list_returns_sessions(async_endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{SESSIONS_URL}").respond(200, json=[session_payload()])

    sessions = await async_endpoint.sessions.list()

    assert len(sessions) == 1
    assert isinstance(sessions[0], UserLoginSession)
    assert sessions[0].current is True


async def test_async_revoke_and_revoke_others(async_endpoint, respx_mock, base_url):
    revoke_route = respx_mock.delete(f"{base_url}{SESSIONS_URL}/session-5678").respond(200, json={"status": "OK"})
    revoke_others_route = respx_mock.delete(f"{base_url}{SESSIONS_URL}").respond(200, json={"revoked": 2})

    revoked = await async_endpoint.sessions.revoke("session-5678")
    result = await async_endpoint.sessions.revoke_others()

    assert revoked is None
    assert revoke_route.called
    assert revoke_others_route.called
    assert result.revoked == 2


async def test_async_list_unauthenticated_raises(async_endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{SESSIONS_URL}").respond(401, json={"error": "unauthorized"})

    with pytest.raises(AuthenticationError):
        await async_endpoint.sessions.list()
