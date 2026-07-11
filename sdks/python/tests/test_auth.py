"""authenticate: happy path and error path, sync and async."""

from __future__ import annotations

import pytest

from verdocs import AuthenticateResponse, AuthenticationError, VerdocsError

TOKEN_URL = "/v2/oauth2/token"


def test_authenticate_password_grant(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{TOKEN_URL}").respond(200, json=payloads.auth())

    tokens = endpoint.auth.authenticate(username="test@example.com", password="secret")

    assert isinstance(tokens, AuthenticateResponse)
    assert tokens.expires_in == 3600
    assert tokens.access_token
    body = payloads.request_json(route)
    assert body["grant_type"] == "password"
    assert body["username"] == "test@example.com"
    assert body["password"] == "secret"
    assert "client_id" not in body


def test_authenticate_sends_optional_client_id_and_scope(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{TOKEN_URL}").respond(200, json=payloads.auth())

    endpoint.auth.authenticate(username="test@example.com", password="secret", client_id="cid", scope="limited")

    body = payloads.request_json(route)
    assert body["client_id"] == "cid"
    assert body["scope"] == "limited"


def test_authenticate_rejection_raises_authentication_error(endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{TOKEN_URL}").respond(401, json={"error": "invalid_grant"})

    with pytest.raises(AuthenticationError) as excinfo:
        endpoint.auth.authenticate(username="test@example.com", password="wrong")

    assert excinfo.value.status_code == 401
    assert excinfo.value.body == {"error": "invalid_grant"}
    # One except VerdocsError catches everything the SDK throws.
    assert isinstance(excinfo.value, VerdocsError)


async def test_async_authenticate_password_grant(async_endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{TOKEN_URL}").respond(200, json=payloads.auth())

    tokens = await async_endpoint.auth.authenticate(username="test@example.com", password="secret")

    assert isinstance(tokens, AuthenticateResponse)
    assert payloads.request_json(route)["grant_type"] == "password"


async def test_async_authenticate_rejection(async_endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{TOKEN_URL}").respond(401, json={"error": "invalid_grant"})

    with pytest.raises(AuthenticationError):
        await async_endpoint.auth.authenticate(username="test@example.com", password="wrong")
