"""Login session operations (js-sdk: Users/Sessions.ts).

Login sessions are the server-side records behind a user's tokens: one per
sign-in, tracking the device and approximate location it came from. These
calls let a user review where they are signed in and sign out elsewhere.
Every call requires a user session.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from ..models.users import RevokeSessionsResponse, UserLoginSession

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_SESSIONS_PATH = "/v2/users/sessions"


class Sessions:
    """Login session calls for a sync endpoint."""

    def __init__(self, endpoint: VerdocsEndpoint) -> None:
        self._endpoint = endpoint

    def list(self) -> list[UserLoginSession]:
        """Get the caller's active login sessions, newest first, via GET /v2/users/sessions.

        The session the caller is using to make the request is marked
        current, and should not be offered for revocation in a UI (use
        logout instead). Mirrors js-sdk getSessions.

        Example:
            for session in endpoint.sessions.list():
                print(session.id, session.browser, session.location, session.current)

        Returns:
            The caller's active sessions, newest first.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation session.getSessions
        @sdkGroup Session
        @sdkPage Endpoints
        """
        response = self._endpoint._request("GET", _SESSIONS_PATH)
        return [UserLoginSession.model_validate(entry) for entry in response.json()]

    def revoke(self, session_id: str) -> None:
        """Revoke one of the caller's login sessions via DELETE /v2/users/sessions/{session_id}.

        Tokens issued for that session stop working immediately. The
        caller's current session may not be revoked this way. The API
        answers with a status marker that nothing consumes, so this returns
        None and relies on exceptions for failure. Mirrors js-sdk
        revokeSession.

        Args:
            session_id: The ID of the session to revoke. May not be the caller's current session.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status, including
                an attempt to revoke the current session.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation session.revokeSession
        @sdkGroup Session
        @sdkPage Endpoints
        """
        self._endpoint._request("DELETE", f"{_SESSIONS_PATH}/{session_id}")

    def revoke_others(self) -> RevokeSessionsResponse:
        """Revoke every login session for the caller except the one making the request.

        This is the "sign out everywhere else" operation, via DELETE
        /v2/users/sessions. Mirrors js-sdk revokeOtherSessions.

        Example:
            result = endpoint.sessions.revoke_others()
            print(f"Signed out of {result.revoked} other devices")

        Returns:
            The number of sessions revoked.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation session.revokeOtherSessions
        @sdkGroup Session
        @sdkPage Endpoints
        """
        response = self._endpoint._request("DELETE", _SESSIONS_PATH)
        return RevokeSessionsResponse.model_validate(response.json())


class AsyncSessions:
    """Login session calls for an async endpoint."""

    def __init__(self, endpoint: AsyncVerdocsEndpoint) -> None:
        self._endpoint = endpoint

    async def list(self) -> list[UserLoginSession]:
        """Get the caller's active login sessions, newest first, via GET /v2/users/sessions.

        The session the caller is using to make the request is marked
        current, and should not be offered for revocation in a UI (use
        logout instead). Mirrors js-sdk getSessions.

        Example:
            for session in await endpoint.sessions.list():
                print(session.id, session.browser, session.location, session.current)

        Returns:
            The caller's active sessions, newest first.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", _SESSIONS_PATH)
        return [UserLoginSession.model_validate(entry) for entry in response.json()]

    async def revoke(self, session_id: str) -> None:
        """Revoke one of the caller's login sessions via DELETE /v2/users/sessions/{session_id}.

        Tokens issued for that session stop working immediately. The
        caller's current session may not be revoked this way. The API
        answers with a status marker that nothing consumes, so this returns
        None and relies on exceptions for failure. Mirrors js-sdk
        revokeSession.

        Args:
            session_id: The ID of the session to revoke. May not be the caller's current session.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status, including
                an attempt to revoke the current session.
            VerdocsConnectionError: The request never reached the API.
        """
        await self._endpoint._request("DELETE", f"{_SESSIONS_PATH}/{session_id}")

    async def revoke_others(self) -> RevokeSessionsResponse:
        """Revoke every login session for the caller except the one making the request.

        This is the "sign out everywhere else" operation, via DELETE
        /v2/users/sessions. Mirrors js-sdk revokeOtherSessions.

        Example:
            result = await endpoint.sessions.revoke_others()
            print(f"Signed out of {result.revoked} other devices")

        Returns:
            The number of sessions revoked.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("DELETE", _SESSIONS_PATH)
        return RevokeSessionsResponse.model_validate(response.json())
