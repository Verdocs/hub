"""Authentication operations (js-sdk: Users/Auth.ts)."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any
from urllib.parse import urlencode

from ..models import (
    AuthenticateResponse,
    AuthenticationRequest,
    ChangePasswordRequest,
    ChangePasswordResponse,
    OAuth2AuthorizeParams,
    RefreshTokenRequest,
    ResendVerificationResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    User,
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
_ME_PATH = "/v2/users/me"


def _auth_body(params: AuthenticationRequest) -> dict[str, Any]:
    # exclude_none so optional client_id/scope stay off the wire when unset.
    return params.model_dump(mode="json", exclude_none=True)


def _write_body(params: ChangePasswordRequest | ResetPasswordRequest | VerifyEmailRequest) -> dict[str, Any]:
    return params.model_dump(mode="json", exclude_none=True)


def _authorize_url(base_url: str, params: OAuth2AuthorizeParams) -> str:
    query = {"client_id": params.client_id, "redirect_uri": params.redirect_uri, "response_type": params.response_type}
    if params.state is not None:
        query["state"] = params.state
    if params.scope is not None:
        query["scope"] = params.scope
    return f"{base_url.rstrip('/')}{_AUTHORIZE_PATH}?{urlencode(query)}"


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

        Args:
            params: OAuth2 token request (password, client_credentials,
                refresh_token, or authorization_code).

        Returns:
            The token set for the new session.

        Raises:
            AuthenticationError: The credentials were rejected.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation auth.authenticate
        @sdkGroup Auth
        @sdkPage Endpoints
        """
        response = self._endpoint._request("POST", _TOKEN_PATH, json=_auth_body(params))
        return AuthenticateResponse.model_validate(response.json())

    def get_oauth2_authorize_url(self, params: OAuth2AuthorizeParams) -> str:
        """Build the URL that starts an OAuth2 authorization code flow.

        Redirect the user's browser to this URL. After they authenticate and
        authorize, they land on redirect_uri with a code query parameter that
        authenticate() can exchange with grant_type authorization_code.

        Example:
            url = endpoint.auth.get_oauth2_authorize_url(
                OAuth2AuthorizeParams(
                    client_id="your-client-id",
                    redirect_uri="https://your-app.com/callback",
                    state="random-csrf-token",
                )
            )

        Args:
            params: client_id, redirect_uri, and optional state/scope.

        Returns:
            The absolute authorize URL.

        @sdkOperation auth.getOAuth2AuthorizeUrl
        @sdkGroup Auth
        @sdkPage Endpoints
        """
        return _authorize_url(self._endpoint.base_url, params)

    def refresh_token(self, refresh_token: str) -> AuthenticateResponse:
        """Refresh the caller's session and tokens before they expire.

        Example:
            tokens = endpoint.auth.refresh_token(tokens.refresh_token)
            endpoint.set_token(tokens.access_token)

        Args:
            refresh_token: The refresh token from a prior authenticate call.

        Returns:
            A fresh token set.

        Raises:
            AuthenticationError: The refresh token was rejected.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation auth.refreshToken
        @sdkGroup Auth
        @sdkPage Endpoints
        """
        return self.authenticate(RefreshTokenRequest(refresh_token=refresh_token))

    def change_password(self, params: ChangePasswordRequest) -> ChangePasswordResponse:
        """Update the caller's password when the old password is known.

        Example:
            result = endpoint.auth.change_password(
                ChangePasswordRequest(old_password="old", new_password="new")
            )

        Args:
            params: Current and new passwords.

        Returns:
            Status and message from the server.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation auth.changePassword
        @sdkGroup Auth
        @sdkPage Endpoints
        """
        response = self._endpoint._request("POST", _CHANGE_PASSWORD_PATH, json=_write_body(params))
        return ChangePasswordResponse.model_validate(response.json())

    def reset_password(self, params: ResetPasswordRequest) -> ResetPasswordResponse:
        """Request or complete a password reset when the old password is unknown.

        Omit code and new_password to start the reset (email with a code).
        Include both to finish it.

        Example:
            endpoint.auth.reset_password(ResetPasswordRequest(email="you@example.com"))
            endpoint.auth.reset_password(
                ResetPasswordRequest(email="you@example.com", code="123456", new_password="new")
            )

        Args:
            params: Email, and optionally the emailed code plus new password.

        Returns:
            Whether the call succeeded.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation auth.resetPassword
        @sdkGroup Auth
        @sdkPage Endpoints
        """
        response = self._endpoint._request("POST", _RESET_PASSWORD_PATH, json=_write_body(params))
        return ResetPasswordResponse.model_validate(response.json())

    def resend_verification(self, access_token: str | None = None) -> ResendVerificationResponse:
        """Resend email verification for a partially authenticated user.

        Use when the caller has a session but is not yet verified. Pass
        access_token to identify the user when the endpoint is not already
        authenticated with that token.

        Example:
            endpoint.auth.resend_verification()

        Args:
            access_token: Optional bearer token used only for this request.

        Returns:
            Confirmation that the resend was queued.

        Raises:
            AuthenticationError: No usable session or token.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation auth.resendVerification
        @sdkGroup Auth
        @sdkPage Endpoints
        """
        headers = {"Authorization": f"Bearer {access_token}"} if access_token else None
        response = self._endpoint._request("POST", _RESEND_VERIFICATION_PATH, json={}, headers=headers)
        return ResendVerificationResponse.model_validate(response.json())

    def verify_email(self, params: VerifyEmailRequest) -> AuthenticateResponse:
        """Verify email when the user is unauthenticated but email and token are known.

        Used when a verification token is valid but has expired, or the user
        is completing verification outside an active session.

        Example:
            tokens = endpoint.auth.verify_email(
                VerifyEmailRequest(email="you@example.com", token="verify-token")
            )

        Args:
            params: Email address and verification token.

        Returns:
            Updated authentication tokens.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation auth.verifyEmail
        @sdkGroup Auth
        @sdkPage Endpoints
        """
        response = self._endpoint._request("POST", _VERIFY_PATH, json=_write_body(params))
        return AuthenticateResponse.model_validate(response.json())

    def get_my_user(self) -> User:
        """Get the caller's current user record.

        Example:
            user = endpoint.auth.get_my_user()

        Returns:
            The authenticated user's account record.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation auth.getMyUser
        @sdkGroup Auth
        @sdkPage Endpoints
        """
        response = self._endpoint._request("GET", _ME_PATH)
        return User.model_validate(response.json())


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

        Args:
            params: OAuth2 token request (password, client_credentials,
                refresh_token, or authorization_code).

        Returns:
            The token set for the new session.

        Raises:
            AuthenticationError: The credentials were rejected.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", _TOKEN_PATH, json=_auth_body(params))
        return AuthenticateResponse.model_validate(response.json())

    def get_oauth2_authorize_url(self, params: OAuth2AuthorizeParams) -> str:
        """Build the URL that starts an OAuth2 authorization code flow.

        Redirect the user's browser to this URL. After they authenticate and
        authorize, they land on redirect_uri with a code query parameter that
        authenticate() can exchange with grant_type authorization_code.

        Example:
            url = endpoint.auth.get_oauth2_authorize_url(
                OAuth2AuthorizeParams(
                    client_id="your-client-id",
                    redirect_uri="https://your-app.com/callback",
                    state="random-csrf-token",
                )
            )

        Args:
            params: client_id, redirect_uri, and optional state/scope.

        Returns:
            The absolute authorize URL.
        """
        return _authorize_url(self._endpoint.base_url, params)

    async def refresh_token(self, refresh_token: str) -> AuthenticateResponse:
        """Refresh the caller's session and tokens before they expire.

        Example:
            tokens = await endpoint.auth.refresh_token(tokens.refresh_token)
            endpoint.set_token(tokens.access_token)

        Args:
            refresh_token: The refresh token from a prior authenticate call.

        Returns:
            A fresh token set.

        Raises:
            AuthenticationError: The refresh token was rejected.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        return await self.authenticate(RefreshTokenRequest(refresh_token=refresh_token))

    async def change_password(self, params: ChangePasswordRequest) -> ChangePasswordResponse:
        """Update the caller's password when the old password is known.

        Example:
            result = await endpoint.auth.change_password(
                ChangePasswordRequest(old_password="old", new_password="new")
            )

        Args:
            params: Current and new passwords.

        Returns:
            Status and message from the server.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", _CHANGE_PASSWORD_PATH, json=_write_body(params))
        return ChangePasswordResponse.model_validate(response.json())

    async def reset_password(self, params: ResetPasswordRequest) -> ResetPasswordResponse:
        """Request or complete a password reset when the old password is unknown.

        Omit code and new_password to start the reset (email with a code).
        Include both to finish it.

        Example:
            await endpoint.auth.reset_password(ResetPasswordRequest(email="you@example.com"))
            await endpoint.auth.reset_password(
                ResetPasswordRequest(email="you@example.com", code="123456", new_password="new")
            )

        Args:
            params: Email, and optionally the emailed code plus new password.

        Returns:
            Whether the call succeeded.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", _RESET_PASSWORD_PATH, json=_write_body(params))
        return ResetPasswordResponse.model_validate(response.json())

    async def resend_verification(self, access_token: str | None = None) -> ResendVerificationResponse:
        """Resend email verification for a partially authenticated user.

        Use when the caller has a session but is not yet verified. Pass
        access_token to identify the user when the endpoint is not already
        authenticated with that token.

        Example:
            await endpoint.auth.resend_verification()

        Args:
            access_token: Optional bearer token used only for this request.

        Returns:
            Confirmation that the resend was queued.

        Raises:
            AuthenticationError: No usable session or token.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        headers = {"Authorization": f"Bearer {access_token}"} if access_token else None
        response = await self._endpoint._request("POST", _RESEND_VERIFICATION_PATH, json={}, headers=headers)
        return ResendVerificationResponse.model_validate(response.json())

    async def verify_email(self, params: VerifyEmailRequest) -> AuthenticateResponse:
        """Verify email when the user is unauthenticated but email and token are known.

        Used when a verification token is valid but has expired, or the user
        is completing verification outside an active session.

        Example:
            tokens = await endpoint.auth.verify_email(
                VerifyEmailRequest(email="you@example.com", token="verify-token")
            )

        Args:
            params: Email address and verification token.

        Returns:
            Updated authentication tokens.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", _VERIFY_PATH, json=_write_body(params))
        return AuthenticateResponse.model_validate(response.json())

    async def get_my_user(self) -> User:
        """Get the caller's current user record.

        Example:
            user = await endpoint.auth.get_my_user()

        Returns:
            The authenticated user's account record.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", _ME_PATH)
        return User.model_validate(response.json())
