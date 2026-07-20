"""Auth resource: grant types, password flows, and helpers; sync and async."""

from __future__ import annotations

import pytest

from verdocs import (
    AuthenticateResponse,
    AuthenticationError,
    AuthorizationCodeRequest,
    ChangePasswordRequest,
    ChangePasswordResponse,
    ClientCredentialsRequest,
    OAuth2AuthorizeParams,
    PasswordGrantRequest,
    ResendVerificationResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    User,
    VerdocsError,
    VerifyEmailRequest,
)

TOKEN_URL = "/v2/oauth2/token"
CHANGE_PASSWORD_URL = "/v2/users/change-password"
RESET_PASSWORD_URL = "/v2/users/reset-password"
RESEND_VERIFICATION_URL = "/v2/users/resend-verification"
VERIFY_URL = "/v2/users/verify"
ME_URL = "/v2/users/me"


def test_authenticate_password_grant(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{TOKEN_URL}").respond(200, json=payloads.auth())

    tokens = endpoint.auth.authenticate(PasswordGrantRequest(username="test@example.com", password="secret"))

    assert isinstance(tokens, AuthenticateResponse)
    assert tokens.expires_in == 3600
    assert tokens.access_token
    body = payloads.request_json(route)
    expected = {
        "grant_type": "password",
        "username": "test@example.com",
        "password": "secret",
    }
    assert {k: body[k] for k in expected} == expected
    assert "client_id" not in body


def test_authenticate_sends_optional_client_id_and_scope(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{TOKEN_URL}").respond(200, json=payloads.auth())

    endpoint.auth.authenticate(
        PasswordGrantRequest(username="test@example.com", password="secret", client_id="cid", scope="limited")
    )

    body = payloads.request_json(route)
    assert body["client_id"] == "cid"
    assert body["scope"] == "limited"


def test_authenticate_client_credentials(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{TOKEN_URL}").respond(200, json=payloads.auth())

    endpoint.auth.authenticate(ClientCredentialsRequest(client_id="cid", client_secret="secret"))

    body = payloads.request_json(route)
    assert body == {"grant_type": "client_credentials", "client_id": "cid", "client_secret": "secret"}


def test_authenticate_authorization_code(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{TOKEN_URL}").respond(200, json=payloads.auth())

    endpoint.auth.authenticate(
        AuthorizationCodeRequest(
            code="auth-code",
            client_id="cid",
            client_secret="secret",
            redirect_uri="https://app.example/callback",
        )
    )

    body = payloads.request_json(route)
    assert body["grant_type"] == "authorization_code"
    assert body["code"] == "auth-code"
    assert body["redirect_uri"] == "https://app.example/callback"


def test_authenticate_rejection_raises_authentication_error(endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{TOKEN_URL}").respond(401, json={"error": "invalid_grant"})

    with pytest.raises(AuthenticationError) as excinfo:
        endpoint.auth.authenticate(PasswordGrantRequest(username="test@example.com", password="wrong"))

    assert excinfo.value.status_code == 401
    assert excinfo.value.body == {"error": "invalid_grant"}
    assert isinstance(excinfo.value, VerdocsError)


def test_refresh_token(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{TOKEN_URL}").respond(200, json=payloads.auth())

    tokens = endpoint.auth.refresh_token("refresh-token-value")

    assert isinstance(tokens, AuthenticateResponse)
    body = payloads.request_json(route)
    assert body == {"grant_type": "refresh_token", "refresh_token": "refresh-token-value"}


def test_get_oauth2_authorize_url(endpoint, base_url):
    url = endpoint.auth.get_oauth2_authorize_url(
        OAuth2AuthorizeParams(
            client_id="cid",
            redirect_uri="https://app.example/callback",
            state="csrf",
            scope="openid",
        )
    )

    expected = (
        f"{base_url}/v2/oauth2/authorize"
        "?client_id=cid"
        "&redirect_uri=https%3A%2F%2Fapp.example%2Fcallback"
        "&response_type=code"
        "&state=csrf"
        "&scope=openid"
    )
    assert url == expected


def test_change_password(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{CHANGE_PASSWORD_URL}").respond(
        200, json={"status": "OK", "message": "Password updated"}
    )

    result = endpoint.auth.change_password(ChangePasswordRequest(old_password="old", new_password="new"))

    assert isinstance(result, ChangePasswordResponse)
    assert result.status == "OK"
    assert payloads.request_json(route) == {"old_password": "old", "new_password": "new"}


def test_reset_password_initiate(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{RESET_PASSWORD_URL}").respond(200, json={"success": True})

    result = endpoint.auth.reset_password(ResetPasswordRequest(email="you@example.com"))

    assert isinstance(result, ResetPasswordResponse)
    assert result.success is True
    assert payloads.request_json(route) == {"email": "you@example.com"}


def test_reset_password_complete(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{RESET_PASSWORD_URL}").respond(200, json={"success": True})

    endpoint.auth.reset_password(ResetPasswordRequest(email="you@example.com", code="123456", new_password="new"))

    assert payloads.request_json(route) == {
        "email": "you@example.com",
        "code": "123456",
        "new_password": "new",
    }


def test_resend_verification_without_override(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{RESEND_VERIFICATION_URL}").respond(200, json={"result": "done"})

    result = endpoint.auth.resend_verification()

    assert isinstance(result, ResendVerificationResponse)
    assert result.result == "done"
    assert "Authorization" not in route.calls.last.request.headers


def test_resend_verification_with_override_token(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{RESEND_VERIFICATION_URL}").respond(200, json={"result": "done"})

    endpoint.auth.resend_verification(access_token="override-token")

    assert route.calls.last.request.headers["Authorization"] == "Bearer override-token"


def test_verify_email(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{VERIFY_URL}").respond(200, json=payloads.auth())

    tokens = endpoint.auth.verify_email(VerifyEmailRequest(email="you@example.com", token="verify-token"))

    assert isinstance(tokens, AuthenticateResponse)
    assert payloads.request_json(route) == {"email": "you@example.com", "token": "verify-token"}


def test_get_my_user(endpoint, payloads, respx_mock, base_url):
    respx_mock.get(f"{base_url}{ME_URL}").respond(200, json=payloads.user())

    user = endpoint.auth.get_my_user()

    assert isinstance(user, User)
    assert user.id == "user-1234"


async def test_async_authenticate_password_grant(async_endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{TOKEN_URL}").respond(200, json=payloads.auth())

    tokens = await async_endpoint.auth.authenticate(
        PasswordGrantRequest(username="test@example.com", password="secret")
    )

    assert isinstance(tokens, AuthenticateResponse)
    assert payloads.request_json(route)["grant_type"] == "password"


async def test_async_authenticate_rejection(async_endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{TOKEN_URL}").respond(401, json={"error": "invalid_grant"})

    with pytest.raises(AuthenticationError):
        await async_endpoint.auth.authenticate(PasswordGrantRequest(username="test@example.com", password="wrong"))


async def test_async_refresh_token(async_endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{TOKEN_URL}").respond(200, json=payloads.auth())

    await async_endpoint.auth.refresh_token("refresh-token-value")

    assert payloads.request_json(route)["grant_type"] == "refresh_token"


async def test_async_change_password(async_endpoint, payloads, respx_mock, base_url):
    respx_mock.post(f"{base_url}{CHANGE_PASSWORD_URL}").respond(200, json={"status": "OK", "message": "ok"})

    result = await async_endpoint.auth.change_password(ChangePasswordRequest(old_password="old", new_password="new"))

    assert result.status == "OK"


async def test_async_get_my_user(async_endpoint, payloads, respx_mock, base_url):
    respx_mock.get(f"{base_url}{ME_URL}").respond(200, json=payloads.user())

    user = await async_endpoint.auth.get_my_user()

    assert user.email == "test@example.com"
