"""Authentication operations (js-sdk: Users/Auth.ts)."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Literal
from urllib.parse import urlencode, urljoin

import httpx

from ..errors import VerdocsConnectionError, api_error_from_response
from ..models.users import (
    AuthenticateResponse,
    AuthenticationRequest,
    ChangePasswordRequest,
    ChangePasswordResponse,
    ResetPasswordResponse,
    SocialLoginProvider,
    SocialProviders,
    VerifyEmailRequest,
)

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_TOKEN_PATH = "/v2/oauth2/token"
_AUTHORIZE_PATH = "/v2/oauth2/authorize"
_CHANGE_PASSWORD_PATH = "/v2/users/change-password"
_RESET_PASSWORD_PATH = "/v2/users/reset-password"
_RESEND_VERIFICATION_PATH = "/v2/users/resend-verification"
_VERIFY_PATH = "/v2/users/verify"
_SOCIAL_PROVIDERS_PATH = "/v2/oauth2/social/providers"


def _auth_body(params: AuthenticationRequest) -> dict[str, Any]:
    # exclude_none so optional client_id/scope stay off the wire when unset.
    return params.model_dump(mode="json", exclude_none=True)


def _reset_password_body(email: str, code: str | None, new_password: str | None) -> dict[str, str]:
    body = {"email": email}
    if code is not None:
        body["code"] = code
    if new_password is not None:
        body["new_password"] = new_password
    return body


def _authorize_url(
    base_url: str,
    *,
    client_id: str,
    redirect_uri: str,
    response_type: str,
    state: str | None,
    scope: str | None,
) -> str:
    query = {"client_id": client_id, "redirect_uri": redirect_uri, "response_type": response_type}
    # The js-sdk skips falsy state/scope; an empty string is as meaningless
    # as None here, so we mirror that.
    if state:
        query["state"] = state
    if scope:
        query["scope"] = scope
    return urljoin(base_url, _AUTHORIZE_PATH) + "?" + urlencode(query)


def _social_login_url(
    base_url: str,
    provider: SocialLoginProvider,
    *,
    return_uri: str,
    code_challenge: str,
    state: str,
) -> str:
    query = {
        "return_uri": return_uri,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        "state": state,
    }
    return urljoin(base_url, f"/v2/oauth2/social/{provider}/start") + "?" + urlencode(query)


class Auth:
    """Authentication calls for a sync endpoint."""

    def __init__(self, endpoint: VerdocsEndpoint) -> None:
        self._endpoint = endpoint

    def authenticate(self, params: AuthenticationRequest) -> AuthenticateResponse:
        """Authenticate to Verdocs.

        Tokens are returned, not applied: call set_token() with the access
        token to start using the session, the same flow as the js-sdk.

        Example:
            tokens = endpoint.auth.authenticate(
                PasswordGrantRequest(username="test@example.com", password="secret")
            )
            endpoint.set_token(tokens.access_token)

        A user with MFA enabled does not get tokens on the first call: the
        API answers 403 with an mfa_required challenge, raised here as
        MFARequiredError. Collect a code from the user and call again with
        MFAOtpGrantRequest or MFARecoveryCodeGrantRequest carrying the
        error's mfa_token. A Google or Microsoft sign-in started with
        get_social_login_url() finishes here with LoginCodeGrantRequest.

        Args:
            params: OAuth2 token request (password, client_credentials,
                refresh_token, authorization_code, or one of the MFA and
                login-code grants).

        Returns:
            The token set for the new session.

        Raises:
            MFARequiredError: The credentials were accepted but the user must
                supply a second factor; carries mfa_token.
            AuthenticationError: The credentials were rejected.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation auth.authenticate
        @sdkGroup Auth
        @sdkPage Endpoints
        @sdkGettingStarted
        """
        response = self._endpoint._request("POST", _TOKEN_PATH, json=_auth_body(params))
        return AuthenticateResponse.model_validate(response.json())

    def get_oauth2_authorize_url(
        self,
        *,
        client_id: str,
        redirect_uri: str,
        response_type: Literal["code"] = "code",
        state: str | None = None,
        scope: str | None = None,
    ) -> str:
        """Build the URL that starts an OAuth2 authorization code flow.

        A pure URL builder, no request is made (the js-sdk function is the
        same). Send the user's browser to the URL; after they authenticate
        and authorize, they are redirected to redirect_uri with a `code`
        query parameter to exchange for tokens via the authorization_code
        grant on POST /v2/oauth2/token. Mirrors js-sdk getOAuth2AuthorizeUrl.

        Args:
            client_id: Client ID of the registered OAuth2 application.
            redirect_uri: Where to send the user afterwards. Must match a registered redirect URI.
            response_type: Always "code" for the authorization code flow.
            state: Opaque CSRF-protection value, returned unchanged in the redirect.
            scope: Optional scope to request.

        Returns:
            The authorization URL to redirect the user to.

        @sdkOperation auth.getOAuth2AuthorizeUrl
        @sdkGroup Auth
        @sdkPage Endpoints
        """
        return _authorize_url(
            self._endpoint.base_url,
            client_id=client_id,
            redirect_uri=redirect_uri,
            response_type=response_type,
            state=state,
            scope=scope,
        )

    def refresh_token(self, refresh_token: str) -> AuthenticateResponse:
        """Refresh the session before it expires, via the OAuth2 refresh_token grant.

        Like authenticate(), and like the js-sdk, the new tokens are
        returned, not applied: call set_token() with the new access token
        and keep the new refresh_token for the next renewal.

        Example:
            tokens = endpoint.auth.refresh_token(tokens.refresh_token)
            endpoint.set_token(tokens.access_token)

        Args:
            refresh_token: The refresh token from a previous AuthenticateResponse.

        Returns:
            A fresh token set for the session.

        Raises:
            AuthenticationError: The refresh token is invalid or expired.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation auth.refreshToken
        @sdkGroup Auth
        @sdkPage Endpoints
        """
        body = {"grant_type": "refresh_token", "refresh_token": refresh_token}
        response = self._endpoint._request("POST", _TOKEN_PATH, json=body)
        return AuthenticateResponse.model_validate(response.json())

    def change_password(self, *, old_password: str, new_password: str) -> ChangePasswordResponse:
        """Change the caller's password when the old one is known, via POST /v2/users/change-password.

        Requires a user session. Mirrors js-sdk changePassword.

        Args:
            old_password: The caller's current password.
            new_password: The new password. Must meet strength requirements.

        Returns:
            The status result; a wrong old password raises instead.

        Raises:
            AuthenticationError: The endpoint has no valid user session, or the old password is wrong.
            VerdocsAPIError: The API returned another non-2xx status (e.g. a too-weak new password).
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation auth.changePassword
        @sdkGroup Auth
        @sdkPage Endpoints
        """
        body = ChangePasswordRequest(old_password=old_password, new_password=new_password)
        response = self._endpoint._request("POST", _CHANGE_PASSWORD_PATH, json=body.model_dump(mode="json"))
        return ChangePasswordResponse.model_validate(response.json())

    def reset_password(
        self,
        *,
        email: str,
        code: str | None = None,
        new_password: str | None = None,
    ) -> ResetPasswordResponse:
        """Reset a password when the old one is not known, via POST /v2/users/reset-password.

        A two-step flow that needs no session. Call with just the email to
        have a reset code sent, then again with the emailed code and the new
        password to complete it. The response is deliberately identical
        whether or not the email matched an account, so it cannot be used to
        probe for addresses. Mirrors js-sdk resetPassword.

        Example:
            endpoint.auth.reset_password(email="test@example.com")
            # ... user reads the code from their email ...
            endpoint.auth.reset_password(email="test@example.com", code="12345", new_password="hunter2!")

        Args:
            email: Email address of the account.
            code: The emailed reset code; omit when initiating the flow.
            new_password: The new password; omit when initiating the flow.

        Returns:
            The status result, with an advisory message on some paths.

        Raises:
            VerdocsAPIError: The code was wrong or expired, or the request was rejected.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation auth.resetPassword
        @sdkGroup Auth
        @sdkPage Endpoints
        """
        body = _reset_password_body(email, code, new_password)
        response = self._endpoint._request("POST", _RESET_PASSWORD_PATH, json=body)
        return ResetPasswordResponse.model_validate(response.json())

    def resend_verification(self, access_token: str | None = None) -> None:
        """Resend the email verification message, via POST /v2/users/resend-verification.

        Intended for the post-signup state where the caller holds a partial
        session (signed up, email not yet verified). Pass the access token
        returned by profiles.create(), or attach it with set_token() first
        and pass nothing. Mirrors js-sdk resendVerification.

        The API answers with a constant status body that nothing consumes,
        so this returns None and relies on exceptions for failure.

        Args:
            access_token: Optional bearer token to use for just this call,
                instead of the endpoint's current session.

        Raises:
            AuthenticationError: Neither the endpoint nor access_token carries a valid session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation auth.resendVerification
        @sdkGroup Auth
        @sdkPage Endpoints
        """
        headers = {"Authorization": f"Bearer {access_token}"} if access_token else None
        # _request has no per-request header hook, so the Authorization
        # override goes through the raw client with the same error mapping.
        try:
            response = self._endpoint._client.request("POST", _RESEND_VERIFICATION_PATH, json={}, headers=headers)
        except httpx.TransportError as exc:
            raise VerdocsConnectionError(f"POST {_RESEND_VERIFICATION_PATH} failed: {exc}") from exc
        if response.status_code >= 400:
            raise api_error_from_response(response)

    def verify_email(self, *, email: str, token: str) -> AuthenticateResponse:
        """Verify the caller's email address, via POST /v2/users/verify.

        The deployed endpoint requires the signup session's bearer token:
        call set_token() with the access token returned by profiles.create()
        before calling this (the js-sdk doc comment describing
        unauthenticated verification is stale). Mirrors js-sdk verifyEmail.

        Example:
            tokens = endpoint.profiles.create(CreateProfileRequest(...))
            endpoint.set_token(tokens.access_token)
            # ... user reads the verification code from their email ...
            verified = endpoint.auth.verify_email(email="test@example.com", token="CODE")
            endpoint.set_token(verified.access_token)

        Args:
            email: Email address of the account being verified.
            token: The verification code from the email.

        Returns:
            A fresh token set for the now-verified session; apply it with set_token().

        Raises:
            AuthenticationError: The endpoint does not carry the signup session token.
            NotFoundError: The verification code is wrong or expired.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation auth.verifyEmail
        @sdkGroup Auth
        @sdkPage Endpoints
        """
        body = VerifyEmailRequest(email=email, token=token)
        response = self._endpoint._request("POST", _VERIFY_PATH, json=body.model_dump(mode="json"))
        return AuthenticateResponse.model_validate(response.json())

    def get_social_providers(self) -> SocialProviders:
        """Get the identity providers enabled in the current environment, via GET /v2/oauth2/social/providers.

        Google and Microsoft are configured per-environment, and a provider
        that is not configured will 404 from its sign-in URL, so call this
        before rendering provider buttons and hide the ones that are off.
        Mirrors js-sdk getSocialProviders.

        Example:
            providers = endpoint.auth.get_social_providers()
            if providers.google:
                show_google_button()

        Returns:
            Which of google and microsoft are enabled.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation auth.getSocialProviders
        @sdkGroup Auth
        @sdkPage Endpoints
        """
        response = self._endpoint._request("GET", _SOCIAL_PROVIDERS_PATH)
        return SocialProviders.model_validate(response.json())

    def get_social_login_url(
        self,
        provider: SocialLoginProvider,
        *,
        return_uri: str,
        code_challenge: str,
        state: str,
    ) -> str:
        """Build the URL that starts a Google or Microsoft sign-in.

        A pure URL builder, no request is made. Send the browser to it. The
        provider exchange happens server-side, and the user comes back to
        return_uri with login_code and state query parameters. Exchange the
        code for tokens with authenticate() using LoginCodeGrantRequest and
        the verifier that produced code_challenge. Mirrors js-sdk
        getSocialLoginUrl.

        Example:
            from verdocs import LoginCodeGrantRequest, create_code_challenge, create_code_verifier

            # Starting the flow. Keep the verifier and state somewhere that
            # survives the redirect, the browser is leaving.
            code_verifier = create_code_verifier()
            state = create_code_verifier()
            url = endpoint.auth.get_social_login_url(
                "google",
                return_uri="https://your-app.com/login",
                code_challenge=create_code_challenge(code_verifier),
                state=state,
            )

            # Back at return_uri, with ?login_code=...&state=...
            tokens = endpoint.auth.authenticate(
                LoginCodeGrantRequest(login_code=login_code, code_verifier=code_verifier)
            )

        Args:
            provider: "google" or "microsoft".
            return_uri: Where to send the user after the provider returns. Must belong to a registered origin.
            code_challenge: The PKCE challenge, the base64url SHA-256 of the verifier the app keeps.
            state: An opaque value returned unchanged to the app, used to prevent CSRF attacks.

        Returns:
            The sign-in URL to redirect the user to.

        @sdkOperation auth.getSocialLoginUrl
        @sdkGroup Auth
        @sdkPage Endpoints
        """
        return _social_login_url(
            self._endpoint.base_url,
            provider,
            return_uri=return_uri,
            code_challenge=code_challenge,
            state=state,
        )


class AsyncAuth:
    """Authentication calls for an async endpoint."""

    def __init__(self, endpoint: AsyncVerdocsEndpoint) -> None:
        self._endpoint = endpoint

    async def authenticate(self, params: AuthenticationRequest) -> AuthenticateResponse:
        """Authenticate to Verdocs.

        Tokens are returned, not applied: call set_token() with the access
        token to start using the session, the same flow as the js-sdk.

        Example:
            tokens = await endpoint.auth.authenticate(
                PasswordGrantRequest(username="test@example.com", password="secret")
            )
            endpoint.set_token(tokens.access_token)

        A user with MFA enabled does not get tokens on the first call: the
        API answers 403 with an mfa_required challenge, raised here as
        MFARequiredError. Collect a code from the user and call again with
        MFAOtpGrantRequest or MFARecoveryCodeGrantRequest carrying the
        error's mfa_token. A Google or Microsoft sign-in started with
        get_social_login_url() finishes here with LoginCodeGrantRequest.

        Args:
            params: OAuth2 token request (password, client_credentials,
                refresh_token, authorization_code, or one of the MFA and
                login-code grants).

        Returns:
            The token set for the new session.

        Raises:
            MFARequiredError: The credentials were accepted but the user must
                supply a second factor; carries mfa_token.
            AuthenticationError: The credentials were rejected.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", _TOKEN_PATH, json=_auth_body(params))
        return AuthenticateResponse.model_validate(response.json())

    def get_oauth2_authorize_url(
        self,
        *,
        client_id: str,
        redirect_uri: str,
        response_type: Literal["code"] = "code",
        state: str | None = None,
        scope: str | None = None,
    ) -> str:
        """Build the URL that starts an OAuth2 authorization code flow.

        A pure URL builder, no request is made, so this is a plain method on
        the async endpoint too (nothing to await). Send the user's browser
        to the URL; after they authenticate and authorize, they are
        redirected to redirect_uri with a `code` query parameter to exchange
        for tokens via the authorization_code grant on POST /v2/oauth2/token.
        Mirrors js-sdk getOAuth2AuthorizeUrl.

        Args:
            client_id: Client ID of the registered OAuth2 application.
            redirect_uri: Where to send the user afterwards. Must match a registered redirect URI.
            response_type: Always "code" for the authorization code flow.
            state: Opaque CSRF-protection value, returned unchanged in the redirect.
            scope: Optional scope to request.

        Returns:
            The authorization URL to redirect the user to.
        """
        return _authorize_url(
            self._endpoint.base_url,
            client_id=client_id,
            redirect_uri=redirect_uri,
            response_type=response_type,
            state=state,
            scope=scope,
        )

    async def refresh_token(self, refresh_token: str) -> AuthenticateResponse:
        """Refresh the session before it expires, via the OAuth2 refresh_token grant.

        Like authenticate(), and like the js-sdk, the new tokens are
        returned, not applied: call set_token() with the new access token
        and keep the new refresh_token for the next renewal.

        Example:
            tokens = await endpoint.auth.refresh_token(tokens.refresh_token)
            endpoint.set_token(tokens.access_token)

        Args:
            refresh_token: The refresh token from a previous AuthenticateResponse.

        Returns:
            A fresh token set for the session.

        Raises:
            AuthenticationError: The refresh token is invalid or expired.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        body = {"grant_type": "refresh_token", "refresh_token": refresh_token}
        response = await self._endpoint._request("POST", _TOKEN_PATH, json=body)
        return AuthenticateResponse.model_validate(response.json())

    async def change_password(self, *, old_password: str, new_password: str) -> ChangePasswordResponse:
        """Change the caller's password when the old one is known, via POST /v2/users/change-password.

        Requires a user session. Mirrors js-sdk changePassword.

        Args:
            old_password: The caller's current password.
            new_password: The new password. Must meet strength requirements.

        Returns:
            The status result; a wrong old password raises instead.

        Raises:
            AuthenticationError: The endpoint has no valid user session, or the old password is wrong.
            VerdocsAPIError: The API returned another non-2xx status (e.g. a too-weak new password).
            VerdocsConnectionError: The request never reached the API.
        """
        body = ChangePasswordRequest(old_password=old_password, new_password=new_password)
        response = await self._endpoint._request("POST", _CHANGE_PASSWORD_PATH, json=body.model_dump(mode="json"))
        return ChangePasswordResponse.model_validate(response.json())

    async def reset_password(
        self,
        *,
        email: str,
        code: str | None = None,
        new_password: str | None = None,
    ) -> ResetPasswordResponse:
        """Reset a password when the old one is not known, via POST /v2/users/reset-password.

        A two-step flow that needs no session. Call with just the email to
        have a reset code sent, then again with the emailed code and the new
        password to complete it. The response is deliberately identical
        whether or not the email matched an account, so it cannot be used to
        probe for addresses. Mirrors js-sdk resetPassword.

        Example:
            await endpoint.auth.reset_password(email="test@example.com")
            # ... user reads the code from their email ...
            await endpoint.auth.reset_password(email="test@example.com", code="12345", new_password="hunter2!")

        Args:
            email: Email address of the account.
            code: The emailed reset code; omit when initiating the flow.
            new_password: The new password; omit when initiating the flow.

        Returns:
            The status result, with an advisory message on some paths.

        Raises:
            VerdocsAPIError: The code was wrong or expired, or the request was rejected.
            VerdocsConnectionError: The request never reached the API.
        """
        body = _reset_password_body(email, code, new_password)
        response = await self._endpoint._request("POST", _RESET_PASSWORD_PATH, json=body)
        return ResetPasswordResponse.model_validate(response.json())

    async def resend_verification(self, access_token: str | None = None) -> None:
        """Resend the email verification message, via POST /v2/users/resend-verification.

        Intended for the post-signup state where the caller holds a partial
        session (signed up, email not yet verified). Pass the access token
        returned by profiles.create(), or attach it with set_token() first
        and pass nothing. Mirrors js-sdk resendVerification.

        The API answers with a constant status body that nothing consumes,
        so this returns None and relies on exceptions for failure.

        Args:
            access_token: Optional bearer token to use for just this call,
                instead of the endpoint's current session.

        Raises:
            AuthenticationError: Neither the endpoint nor access_token carries a valid session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        headers = {"Authorization": f"Bearer {access_token}"} if access_token else None
        # _request has no per-request header hook, so the Authorization
        # override goes through the raw client with the same error mapping.
        try:
            response = await self._endpoint._client.request("POST", _RESEND_VERIFICATION_PATH, json={}, headers=headers)
        except httpx.TransportError as exc:
            raise VerdocsConnectionError(f"POST {_RESEND_VERIFICATION_PATH} failed: {exc}") from exc
        if response.status_code >= 400:
            raise api_error_from_response(response)

    async def verify_email(self, *, email: str, token: str) -> AuthenticateResponse:
        """Verify the caller's email address, via POST /v2/users/verify.

        The deployed endpoint requires the signup session's bearer token:
        call set_token() with the access token returned by profiles.create()
        before calling this (the js-sdk doc comment describing
        unauthenticated verification is stale). Mirrors js-sdk verifyEmail.

        Example:
            tokens = await endpoint.profiles.create(CreateProfileRequest(...))
            endpoint.set_token(tokens.access_token)
            # ... user reads the verification code from their email ...
            verified = await endpoint.auth.verify_email(email="test@example.com", token="CODE")
            endpoint.set_token(verified.access_token)

        Args:
            email: Email address of the account being verified.
            token: The verification code from the email.

        Returns:
            A fresh token set for the now-verified session; apply it with set_token().

        Raises:
            AuthenticationError: The endpoint does not carry the signup session token.
            NotFoundError: The verification code is wrong or expired.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        body = VerifyEmailRequest(email=email, token=token)
        response = await self._endpoint._request("POST", _VERIFY_PATH, json=body.model_dump(mode="json"))
        return AuthenticateResponse.model_validate(response.json())

    async def get_social_providers(self) -> SocialProviders:
        """Get the identity providers enabled in the current environment, via GET /v2/oauth2/social/providers.

        Google and Microsoft are configured per-environment, and a provider
        that is not configured will 404 from its sign-in URL, so call this
        before rendering provider buttons and hide the ones that are off.
        Mirrors js-sdk getSocialProviders.

        Example:
            providers = await endpoint.auth.get_social_providers()
            if providers.google:
                show_google_button()

        Returns:
            Which of google and microsoft are enabled.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", _SOCIAL_PROVIDERS_PATH)
        return SocialProviders.model_validate(response.json())

    def get_social_login_url(
        self,
        provider: SocialLoginProvider,
        *,
        return_uri: str,
        code_challenge: str,
        state: str,
    ) -> str:
        """Build the URL that starts a Google or Microsoft sign-in.

        A pure URL builder, no request is made, so this is a plain method on
        the async endpoint too (nothing to await). Send the browser to it.
        The provider exchange happens server-side, and the user comes back
        to return_uri with login_code and state query parameters. Exchange
        the code for tokens with authenticate() using LoginCodeGrantRequest
        and the verifier that produced code_challenge. Mirrors js-sdk
        getSocialLoginUrl.

        Args:
            provider: "google" or "microsoft".
            return_uri: Where to send the user after the provider returns. Must belong to a registered origin.
            code_challenge: The PKCE challenge, the base64url SHA-256 of the verifier the app keeps.
            state: An opaque value returned unchanged to the app, used to prevent CSRF attacks.

        Returns:
            The sign-in URL to redirect the user to.
        """
        return _social_login_url(
            self._endpoint.base_url,
            provider,
            return_uri=return_uri,
            code_challenge=code_challenge,
            state=state,
        )
