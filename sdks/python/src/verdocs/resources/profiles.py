"""Profile operations (js-sdk: Users/Profiles.ts getCurrentProfile)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from ..models import Profile

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_PROFILES_PATH = "/v2/profiles"


def _find_current(payload: list[dict]) -> Profile | None:
    profiles = [Profile.model_validate(entry) for entry in payload]
    return next((profile for profile in profiles if profile.current), None)


class Profiles:
    """Profile calls for a sync endpoint."""

    def __init__(self, endpoint: VerdocsEndpoint) -> None:
        self._endpoint = endpoint

    def current(self) -> Profile | None:
        """Get the caller's current profile.

        GET /v2/profiles returns every profile the caller has (one per
        organization); this returns the entry marked current, which is the
        profile all other operations run as. Mirrors js-sdk getCurrentProfile.

        Returns:
            The current profile, or None if no profile is marked current.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("GET", _PROFILES_PATH)
        return _find_current(response.json())


class AsyncProfiles:
    """Profile calls for an async endpoint."""

    def __init__(self, endpoint: AsyncVerdocsEndpoint) -> None:
        self._endpoint = endpoint

    async def current(self) -> Profile | None:
        """Get the caller's current profile.

        GET /v2/profiles returns every profile the caller has (one per
        organization); this returns the entry marked current, which is the
        profile all other operations run as. Mirrors js-sdk getCurrentProfile.

        Returns:
            The current profile, or None if no profile is marked current.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", _PROFILES_PATH)
        return _find_current(response.json())
