"""User operations (js-sdk: Users/Auth.ts getMyUser, Users/Notifications.ts)."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from ..models.core import User

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_ME_PATH = "/v2/users/me"
_NOTIFICATIONS_PATH = "/v2/notifications"


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

        @sdkOperation auth.getMyUser
        @sdkGroup Auth
        @sdkPage Endpoints
        """
        response = self._endpoint._request("GET", _ME_PATH)
        return User.model_validate(response.json())

    def notifications(self) -> list[dict[str, Any]]:
        """Get the caller's in-app notifications via GET /v2/notifications.

        The API returns at most 20 rows. Mirrors js-sdk getNotifications,
        which leaves the response untyped; the deployed rows carry store
        fields (type, recipient, delivered, ...) that do not match the
        documented Notification model, so they come back as plain dicts
        until the wire contract settles.

        Returns:
            The notification rows exactly as the API sent them.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation notification.getNotifications
        @sdkGroup Notification
        @sdkPage Endpoints
        """
        response = self._endpoint._request("GET", _NOTIFICATIONS_PATH)
        return response.json()


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

    async def notifications(self) -> list[dict[str, Any]]:
        """Get the caller's in-app notifications via GET /v2/notifications.

        The API returns at most 20 rows. Mirrors js-sdk getNotifications,
        which leaves the response untyped; the deployed rows carry store
        fields (type, recipient, delivered, ...) that do not match the
        documented Notification model, so they come back as plain dicts
        until the wire contract settles.

        Returns:
            The notification rows exactly as the API sent them.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", _NOTIFICATIONS_PATH)
        return response.json()
