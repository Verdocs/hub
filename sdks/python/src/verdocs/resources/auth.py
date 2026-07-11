"""Authentication operations (js-sdk: Users/Auth.ts)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from ..models import AuthenticateResponse

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_TOKEN_PATH = "/v2/oauth2/token"


def _password_grant_body(username: str, password: str, client_id: str | None, scope: str | None) -> dict[str, str]:
    body = {"grant_type": "password", "username": username, "password": password}
    if client_id is not None:
        body["client_id"] = client_id
    if scope is not None:
        body["scope"] = scope
    return body


class Auth:
    """Authentication calls for a sync endpoint."""

    def __init__(self, endpoint: VerdocsEndpoint) -> None:
        self._endpoint = endpoint

    def authenticate(
        self,
        *,
        username: str,
        password: str,
        client_id: str | None = None,
        scope: str | None = None,
    ) -> AuthenticateResponse:
        """Authenticate to Verdocs with a username and password (OAuth2 password grant).

        The tokens are returned, not applied: call set_token() with the access
        token to start using the session, the same flow as the js-sdk.

        Example:
            tokens = endpoint.auth.authenticate(username="test@example.com", password="secret")
            endpoint.set_token(tokens.access_token)

        Args:
            username: Email address of the user.
            password: Password for the user.
            client_id: Optional OAuth2 client ID.
            scope: Optional scope to limit the token to. Leave unset unless Verdocs support says otherwise.

        Returns:
            The token set for the new session.

        Raises:
            AuthenticationError: The credentials were rejected.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        body = _password_grant_body(username, password, client_id, scope)
        response = self._endpoint._request("POST", _TOKEN_PATH, json=body)
        return AuthenticateResponse.model_validate(response.json())


class AsyncAuth:
    """Authentication calls for an async endpoint."""

    def __init__(self, endpoint: AsyncVerdocsEndpoint) -> None:
        self._endpoint = endpoint

    async def authenticate(
        self,
        *,
        username: str,
        password: str,
        client_id: str | None = None,
        scope: str | None = None,
    ) -> AuthenticateResponse:
        """Authenticate to Verdocs with a username and password (OAuth2 password grant).

        The tokens are returned, not applied: call set_token() with the access
        token to start using the session, the same flow as the js-sdk.

        Example:
            tokens = await endpoint.auth.authenticate(username="test@example.com", password="secret")
            endpoint.set_token(tokens.access_token)

        Args:
            username: Email address of the user.
            password: Password for the user.
            client_id: Optional OAuth2 client ID.
            scope: Optional scope to limit the token to. Leave unset unless Verdocs support says otherwise.

        Returns:
            The token set for the new session.

        Raises:
            AuthenticationError: The credentials were rejected.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        body = _password_grant_body(username, password, client_id, scope)
        response = await self._endpoint._request("POST", _TOKEN_PATH, json=body)
        return AuthenticateResponse.model_validate(response.json())
