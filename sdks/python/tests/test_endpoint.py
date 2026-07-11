"""Endpoint construction, session duality, and transport error mapping."""

from __future__ import annotations

import httpx
import pytest

from verdocs import (
    DEFAULT_BASE_URL,
    DEFAULT_TIMEOUT,
    AsyncVerdocsEndpoint,
    SigningSession,
    UserSession,
    VerdocsConnectionError,
    VerdocsEndpoint,
)


def test_defaults():
    with VerdocsEndpoint() as endpoint:
        assert endpoint.base_url == DEFAULT_BASE_URL
        assert endpoint.timeout == DEFAULT_TIMEOUT
        assert endpoint.session_type == "user"
        assert endpoint.token is None
        assert endpoint.session is None
        assert endpoint.sub is None


def test_constructor_options():
    with VerdocsEndpoint(base_url="https://api.test", timeout=5.0, session_type="signing", client_id="cid") as ep:
        assert ep.base_url == "https://api.test"
        assert ep.timeout == 5.0
        assert ep.session_type == "signing"
        assert ep._client.headers["X-Client-ID"] == "cid"


def test_context_manager_closes_client():
    with VerdocsEndpoint() as endpoint:
        assert not endpoint._client.is_closed
    assert endpoint._client.is_closed


def test_close_is_explicit_alternative():
    endpoint = VerdocsEndpoint()
    endpoint.close()
    assert endpoint._client.is_closed


def test_set_token_user_session(endpoint, token_factory):
    token = token_factory("user")
    endpoint.set_token(token)

    assert endpoint.token == token
    assert endpoint.session_type == "user"
    assert isinstance(endpoint.session, UserSession)
    assert endpoint.session.profile_id == "profile-1234"
    assert endpoint.sub == "user-1234"
    assert endpoint._client.headers["Authorization"] == f"Bearer {token}"
    assert "signer" not in endpoint._client.headers


def test_set_token_signing_session_uses_signer_header(endpoint, token_factory):
    token = token_factory("signing")
    endpoint.set_token(token)

    # The endpoint was created as a user endpoint, but the token declares
    # itself a signing token and that claim wins when no override is given.
    assert endpoint.session_type == "signing"
    assert isinstance(endpoint.session, SigningSession)
    assert endpoint.session.envelope_id == "envelope-1234"
    assert endpoint._client.headers["signer"] == f"Bearer {token}"
    assert "Authorization" not in endpoint._client.headers


def test_set_token_explicit_session_type_overrides_claim(endpoint, token_factory):
    token = token_factory("user")
    endpoint.set_token(token, session_type="signing")

    assert endpoint.session_type == "signing"
    assert "signer" in endpoint._client.headers
    assert "Authorization" not in endpoint._client.headers


def test_switching_session_types_swaps_headers(endpoint, token_factory):
    endpoint.set_token(token_factory("user"))
    assert "Authorization" in endpoint._client.headers

    endpoint.set_token(token_factory("signing"))
    assert "signer" in endpoint._client.headers
    assert "Authorization" not in endpoint._client.headers

    endpoint.set_token(token_factory("user"))
    assert "Authorization" in endpoint._client.headers
    assert "signer" not in endpoint._client.headers


def test_clear_session(endpoint, token_factory):
    endpoint.set_token(token_factory("user"))
    endpoint.clear_session()

    assert endpoint.token is None
    assert endpoint.session is None
    assert endpoint.sub is None
    assert "Authorization" not in endpoint._client.headers
    assert "signer" not in endpoint._client.headers


def test_set_token_none_clears_session(endpoint, token_factory):
    endpoint.set_token(token_factory("user"))
    endpoint.set_token(None)
    assert endpoint.session is None
    assert "Authorization" not in endpoint._client.headers


def test_expired_token_clears_session(endpoint, token_factory):
    endpoint.set_token(token_factory("user", exp_offset=-60))
    assert endpoint.token is None
    assert endpoint.session is None
    assert "Authorization" not in endpoint._client.headers


def test_malformed_token_clears_session(endpoint, token_factory):
    endpoint.set_token(token_factory("user"))
    endpoint.set_token("not-a-jwt")
    assert endpoint.token is None
    assert endpoint.session is None
    assert "Authorization" not in endpoint._client.headers


def test_user_and_signing_endpoints_run_side_by_side(token_factory):
    # The core duality promise: two endpoints, two independent sessions.
    user_token = token_factory("user")
    signing_token = token_factory("signing")
    with VerdocsEndpoint() as user_ep, VerdocsEndpoint(session_type="signing") as signing_ep:
        user_ep.set_token(user_token)
        signing_ep.set_token(signing_token)

        assert user_ep.session_type == "user"
        assert signing_ep.session_type == "signing"
        assert user_ep._client.headers["Authorization"] == f"Bearer {user_token}"
        assert signing_ep._client.headers["signer"] == f"Bearer {signing_token}"
        assert "signer" not in user_ep._client.headers
        assert "Authorization" not in signing_ep._client.headers


def test_auth_header_reaches_the_wire(endpoint, token_factory, payloads, respx_mock, base_url):
    token = token_factory("user")
    endpoint.set_token(token)
    route = respx_mock.get(f"{base_url}/v2/users/me").respond(200, json=payloads.user())

    endpoint.users.me()

    assert route.calls.last.request.headers["Authorization"] == f"Bearer {token}"


def test_client_id_header_reaches_the_wire(payloads, respx_mock, base_url):
    route = respx_mock.get(f"{base_url}/v2/users/me").respond(200, json=payloads.user())
    with VerdocsEndpoint(base_url=base_url, client_id="cid-1234") as endpoint:
        endpoint.users.me()

    assert route.calls.last.request.headers["X-Client-ID"] == "cid-1234"


def test_transport_error_maps_to_connection_error(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}/v2/users/me").mock(side_effect=httpx.ConnectError("boom"))
    with pytest.raises(VerdocsConnectionError):
        endpoint.users.me()


async def test_async_defaults_and_close():
    endpoint = AsyncVerdocsEndpoint()
    assert endpoint.base_url == DEFAULT_BASE_URL
    assert endpoint.session_type == "user"
    await endpoint.aclose()
    assert endpoint._client.is_closed


async def test_async_context_manager_closes_client():
    async with AsyncVerdocsEndpoint() as endpoint:
        assert not endpoint._client.is_closed
    assert endpoint._client.is_closed


async def test_async_session_duality(async_endpoint, token_factory):
    token = token_factory("signing")
    async_endpoint.set_token(token)
    assert async_endpoint.session_type == "signing"
    assert async_endpoint._client.headers["signer"] == f"Bearer {token}"


async def test_async_transport_error_maps_to_connection_error(async_endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}/v2/users/me").mock(side_effect=httpx.ConnectError("boom"))
    with pytest.raises(VerdocsConnectionError):
        await async_endpoint.users.me()
