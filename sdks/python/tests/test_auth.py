"""Auth resource: happy paths and error paths, sync and async.

Covers authenticate (every grant, including the MFA challenge round trip),
the OAuth2 authorize-URL builder, refresh_token, change_password,
reset_password, resend_verification, verify_email, and the social sign-in
calls.
"""

from __future__ import annotations

import httpx
import pytest

from verdocs import (
    AuthenticateResponse,
    AuthenticationError,
    AuthorizationCodeRequest,
    ClientCredentialsRequest,
    LoginCodeGrantRequest,
    MFAOtpGrantRequest,
    MFARecoveryCodeGrantRequest,
    MFARequiredError,
    PasswordGrantRequest,
    SocialProviders,
    VerdocsAPIError,
    VerdocsError,
)
from verdocs.models.users import ChangePasswordResponse, ResetPasswordResponse

TOKEN_URL = "/v2/oauth2/token"
AUTHORIZE_URL = "/v2/oauth2/authorize"
CHANGE_PASSWORD_URL = "/v2/users/change-password"
RESET_PASSWORD_URL = "/v2/users/reset-password"
RESEND_VERIFICATION_URL = "/v2/users/resend-verification"
VERIFY_URL = "/v2/users/verify"
SOCIAL_PROVIDERS_URL = "/v2/oauth2/social/providers"

MFA_CHALLENGE = {"error": "mfa_required", "error_description": "MFA required", "mfa_token": "mfa-token-1234"}


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


def test_resend_verification_with_override_token(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{RESEND_VERIFICATION_URL}").respond(200, json={"result": "done"})

    endpoint.auth.resend_verification(access_token="override-token")

    assert route.calls.last.request.headers["Authorization"] == "Bearer override-token"


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


def test_get_oauth2_authorize_url_builds_the_url(endpoint, base_url):
    url = endpoint.auth.get_oauth2_authorize_url(
        client_id="cid",
        redirect_uri="https://app.example/cb",
        state="csrf-123",
        scope="limited",
    )

    # A pure URL builder: no route is stubbed because no request is made.
    assert url == (
        f"{base_url}{AUTHORIZE_URL}"
        "?client_id=cid&redirect_uri=https%3A%2F%2Fapp.example%2Fcb&response_type=code&state=csrf-123&scope=limited"
    )


def test_get_oauth2_authorize_url_skips_unset_state_and_scope(endpoint, base_url):
    url = endpoint.auth.get_oauth2_authorize_url(client_id="cid", redirect_uri="https://app.example/cb")

    assert url == (
        f"{base_url}{AUTHORIZE_URL}?client_id=cid&redirect_uri=https%3A%2F%2Fapp.example%2Fcb&response_type=code"
    )


async def test_async_get_oauth2_authorize_url_is_a_plain_method(async_endpoint, base_url):
    # No I/O happens, so the async twin returns the string directly, no await.
    url = async_endpoint.auth.get_oauth2_authorize_url(client_id="cid", redirect_uri="https://app.example/cb")

    assert isinstance(url, str)
    assert url.startswith(f"{base_url}{AUTHORIZE_URL}?")


def test_refresh_token_sends_the_refresh_grant(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{TOKEN_URL}").respond(200, json=payloads.auth())

    tokens = endpoint.auth.refresh_token("refresh-token-value")

    assert isinstance(tokens, AuthenticateResponse)
    assert payloads.request_json(route) == {"grant_type": "refresh_token", "refresh_token": "refresh-token-value"}


def test_refresh_token_rejection_raises_authentication_error(endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{TOKEN_URL}").respond(401, json={"error": "invalid_grant"})

    with pytest.raises(AuthenticationError):
        endpoint.auth.refresh_token("stale-refresh-token")


async def test_async_refresh_token(async_endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{TOKEN_URL}").respond(200, json=payloads.auth())

    tokens = await async_endpoint.auth.refresh_token("refresh-token-value")

    assert isinstance(tokens, AuthenticateResponse)
    assert payloads.request_json(route)["grant_type"] == "refresh_token"


def test_change_password_sends_both_passwords(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{CHANGE_PASSWORD_URL}").respond(200, json={"status": "OK"})

    result = endpoint.auth.change_password(old_password="old-secret", new_password="new-secret!A1")

    assert isinstance(result, ChangePasswordResponse)
    assert result.status == "OK"
    # The deployed success body carries no message.
    assert result.message is None
    assert payloads.request_json(route) == {"old_password": "old-secret", "new_password": "new-secret!A1"}


def test_change_password_wrong_old_password_raises(endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{CHANGE_PASSWORD_URL}").respond(401, json={"error": "access denied"})

    with pytest.raises(AuthenticationError):
        endpoint.auth.change_password(old_password="wrong", new_password="new-secret!A1")


async def test_async_change_password(async_endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{CHANGE_PASSWORD_URL}").respond(200, json={"status": "OK"})

    result = await async_endpoint.auth.change_password(old_password="old-secret", new_password="new-secret!A1")

    assert result.status == "OK"
    assert payloads.request_json(route)["new_password"] == "new-secret!A1"


def test_reset_password_initiate_sends_only_the_email(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{RESET_PASSWORD_URL}").respond(200, json={"status": "OK"})

    result = endpoint.auth.reset_password(email="test@example.com")

    assert isinstance(result, ResetPasswordResponse)
    assert result.status == "OK"
    assert payloads.request_json(route) == {"email": "test@example.com"}


def test_reset_password_complete_sends_code_and_new_password(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{RESET_PASSWORD_URL}").respond(
        200, json={"status": "OK", "message": "Please check your email for reset instructions."}
    )

    result = endpoint.auth.reset_password(email="test@example.com", code="12345", new_password="new-secret!A1")

    assert result.message == "Please check your email for reset instructions."
    assert payloads.request_json(route) == {
        "email": "test@example.com",
        "code": "12345",
        "new_password": "new-secret!A1",
    }


async def test_async_reset_password(async_endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{RESET_PASSWORD_URL}").respond(200, json={"status": "OK"})

    result = await async_endpoint.auth.reset_password(email="test@example.com")

    assert result.status == "OK"
    assert payloads.request_json(route) == {"email": "test@example.com"}


def test_resend_verification_returns_none_and_sends_empty_json(endpoint, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{RESEND_VERIFICATION_URL}").respond(200, json={"status": "OK"})

    assert endpoint.auth.resend_verification() is None

    request = route.calls.last.request
    assert request.content == b"{}"
    # No session and no override: nothing to send.
    assert "authorization" not in request.headers


def test_resend_verification_access_token_override_wins(endpoint, token_factory, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{RESEND_VERIFICATION_URL}").respond(200, json={"status": "OK"})
    endpoint.set_token(token_factory())

    endpoint.auth.resend_verification(access_token="SIGNUP-SESSION-TOKEN")

    # The per-call token replaces the endpoint session's header for this
    # request only, mirroring the js-sdk's accessToken parameter.
    assert route.calls.last.request.headers["Authorization"] == "Bearer SIGNUP-SESSION-TOKEN"


def test_resend_verification_unauthenticated_raises(endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{RESEND_VERIFICATION_URL}").respond(401, json={"error": "unauthorized"})

    with pytest.raises(AuthenticationError):
        endpoint.auth.resend_verification()


async def test_async_resend_verification(async_endpoint, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{RESEND_VERIFICATION_URL}").respond(200, json={"status": "OK"})

    assert await async_endpoint.auth.resend_verification(access_token="SIGNUP-SESSION-TOKEN") is None

    assert route.calls.last.request.headers["Authorization"] == "Bearer SIGNUP-SESSION-TOKEN"


def test_verify_email_carries_the_signup_bearer(endpoint, token_factory, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{VERIFY_URL}").respond(200, json=payloads.auth())
    signup_token = token_factory()
    endpoint.set_token(signup_token)

    tokens = endpoint.auth.verify_email(email="test@example.com", token="EMAILED-CODE")

    assert isinstance(tokens, AuthenticateResponse)
    request = route.calls.last.request
    # Weekend finding 1: the deployed endpoint requires the signup session's
    # bearer token despite the js-sdk doc comment saying otherwise.
    assert request.headers["Authorization"] == f"Bearer {signup_token}"
    assert payloads.request_json(route) == {"email": "test@example.com", "token": "EMAILED-CODE"}


def test_verify_email_without_session_raises(endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{VERIFY_URL}").respond(401, json={"error": "unauthorized"})

    with pytest.raises(AuthenticationError):
        endpoint.auth.verify_email(email="test@example.com", token="EMAILED-CODE")


async def test_async_verify_email(async_endpoint, token_factory, payloads, respx_mock, base_url):
    respx_mock.post(f"{base_url}{VERIFY_URL}").respond(200, json=payloads.auth())
    async_endpoint.set_token(token_factory())

    tokens = await async_endpoint.auth.verify_email(email="test@example.com", token="EMAILED-CODE")

    assert isinstance(tokens, AuthenticateResponse)


def test_authenticate_mfa_otp_grant(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{TOKEN_URL}").respond(200, json=payloads.auth())

    tokens = endpoint.auth.authenticate(MFAOtpGrantRequest(mfa_token="mfa-token-1234", otp="123456"))

    assert isinstance(tokens, AuthenticateResponse)
    assert payloads.request_json(route) == {
        "grant_type": "urn:verdocs:params:oauth:grant-type:mfa-otp",
        "mfa_token": "mfa-token-1234",
        "otp": "123456",
    }


def test_authenticate_mfa_recovery_code_grant(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{TOKEN_URL}").respond(200, json=payloads.auth())

    endpoint.auth.authenticate(MFARecoveryCodeGrantRequest(mfa_token="mfa-token-1234", recovery_code="ab12-cd34"))

    assert payloads.request_json(route) == {
        "grant_type": "urn:verdocs:params:oauth:grant-type:mfa-recovery-code",
        "mfa_token": "mfa-token-1234",
        "recovery_code": "ab12-cd34",
    }


def test_authenticate_login_code_grant(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{TOKEN_URL}").respond(200, json=payloads.auth())

    endpoint.auth.authenticate(LoginCodeGrantRequest(login_code="login-code-1234", code_verifier="verifier-1234"))

    assert payloads.request_json(route) == {
        "grant_type": "urn:verdocs:params:oauth:grant-type:login-code",
        "login_code": "login-code-1234",
        "code_verifier": "verifier-1234",
    }


def test_authenticate_mfa_challenge_raises_mfa_required_error(endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{TOKEN_URL}").respond(403, json=MFA_CHALLENGE)

    with pytest.raises(MFARequiredError) as excinfo:
        endpoint.auth.authenticate(PasswordGrantRequest(username="test@example.com", password="secret"))

    error = excinfo.value
    assert error.status_code == 403
    assert error.mfa_token == "mfa-token-1234"
    assert error.error_description == "MFA required"
    assert error.body == MFA_CHALLENGE
    # Still an API error, so a blanket except VerdocsAPIError catches it too.
    assert isinstance(error, VerdocsAPIError)
    assert isinstance(error, VerdocsError)


def test_authenticate_mfa_challenge_round_trip(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{TOKEN_URL}")
    route.side_effect = [
        httpx.Response(403, json=MFA_CHALLENGE),
        httpx.Response(200, json=payloads.auth()),
    ]

    try:
        endpoint.auth.authenticate(PasswordGrantRequest(username="test@example.com", password="secret"))
        raise AssertionError("expected an MFA challenge")
    except MFARequiredError as error:
        tokens = endpoint.auth.authenticate(MFAOtpGrantRequest(mfa_token=error.mfa_token, otp="123456"))

    assert isinstance(tokens, AuthenticateResponse)
    assert payloads.request_json(route)["mfa_token"] == "mfa-token-1234"


def test_plain_403_is_not_an_mfa_challenge(endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{TOKEN_URL}").respond(403, json={"error": "access denied"})

    with pytest.raises(VerdocsAPIError) as excinfo:
        endpoint.auth.authenticate(PasswordGrantRequest(username="test@example.com", password="secret"))

    assert not isinstance(excinfo.value, MFARequiredError)
    assert excinfo.value.status_code == 403


def test_mfa_challenge_without_token_is_a_plain_api_error(endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{TOKEN_URL}").respond(403, json={"error": "mfa_required"})

    with pytest.raises(VerdocsAPIError) as excinfo:
        endpoint.auth.authenticate(PasswordGrantRequest(username="test@example.com", password="secret"))

    assert not isinstance(excinfo.value, MFARequiredError)


async def test_async_authenticate_mfa_challenge_raises_mfa_required_error(async_endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{TOKEN_URL}").respond(403, json=MFA_CHALLENGE)

    with pytest.raises(MFARequiredError) as excinfo:
        await async_endpoint.auth.authenticate(PasswordGrantRequest(username="test@example.com", password="secret"))

    assert excinfo.value.mfa_token == "mfa-token-1234"


async def test_async_authenticate_mfa_otp_grant(async_endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{TOKEN_URL}").respond(200, json=payloads.auth())

    tokens = await async_endpoint.auth.authenticate(MFAOtpGrantRequest(mfa_token="mfa-token-1234", otp="123456"))

    assert isinstance(tokens, AuthenticateResponse)
    assert payloads.request_json(route)["grant_type"] == "urn:verdocs:params:oauth:grant-type:mfa-otp"


def test_get_social_providers(endpoint, respx_mock, base_url):
    route = respx_mock.get(f"{base_url}{SOCIAL_PROVIDERS_URL}").respond(200, json={"google": True, "microsoft": False})

    providers = endpoint.auth.get_social_providers()

    assert isinstance(providers, SocialProviders)
    assert providers.google is True
    assert providers.microsoft is False
    # No session is needed to ask which providers are on.
    assert "authorization" not in route.calls.last.request.headers


async def test_async_get_social_providers(async_endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{SOCIAL_PROVIDERS_URL}").respond(200, json={"google": False, "microsoft": True})

    providers = await async_endpoint.auth.get_social_providers()

    assert providers.microsoft is True


def test_get_social_login_url_builds_the_url(endpoint, base_url):
    url = endpoint.auth.get_social_login_url(
        "google",
        return_uri="https://app.example/login",
        code_challenge="E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
        state="csrf-123",
    )

    # A pure URL builder: no route is stubbed because no request is made.
    assert url == (
        f"{base_url}/v2/oauth2/social/google/start"
        "?return_uri=https%3A%2F%2Fapp.example%2Flogin"
        "&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
        "&code_challenge_method=S256"
        "&state=csrf-123"
    )


def test_get_social_login_url_uses_the_provider_path(endpoint, base_url):
    url = endpoint.auth.get_social_login_url(
        "microsoft", return_uri="https://app.example/login", code_challenge="challenge", state="state"
    )

    assert url.startswith(f"{base_url}/v2/oauth2/social/microsoft/start?")


async def test_async_get_social_login_url_is_a_plain_method(async_endpoint, base_url):
    # No I/O happens, so the async twin returns the string directly, no await.
    url = async_endpoint.auth.get_social_login_url(
        "google", return_uri="https://app.example/login", code_challenge="challenge", state="state"
    )

    assert isinstance(url, str)
    assert url.startswith(f"{base_url}/v2/oauth2/social/google/start?")
