"""User operations (js-sdk: Users/Auth.ts getMyUser)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from ..models import User

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_ME_PATH = "/v2/users/me"


class Users:
    """User calls for a sync endpoint."""

    def __init__(self, endpoint: VerdocsEndpoint) -> None:
        self._endpoint = endpoint

    def me(self) -> User:
        """Get the caller's user record via GET /v2/users/me.

        Returns:
            The authenticated user's account record.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("GET", _ME_PATH)
        return User.model_validate(response.json())


class AsyncUsers:
    """User calls for an async endpoint."""

    def __init__(self, endpoint: AsyncVerdocsEndpoint) -> None:
        self._endpoint = endpoint

    async def me(self) -> User:
        """Get the caller's user record via GET /v2/users/me.

        Returns:
            The authenticated user's account record.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", _ME_PATH)
        return User.model_validate(response.json())
