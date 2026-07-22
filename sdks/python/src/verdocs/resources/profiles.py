"""Profile operations (js-sdk: Users/Profiles.ts)."""

from __future__ import annotations

import mimetypes
from os import PathLike
from pathlib import Path
from typing import IO, TYPE_CHECKING, Any

import httpx

from ..errors import VerdocsConnectionError, api_error_from_response
from ..models.core import Profile
from ..models.users import AuthenticateResponse, CreateProfileRequest, UpdateProfileRequest

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_PROFILES_PATH = "/v2/profiles"

# The js-sdk allows photo uploads two minutes instead of its default timeout;
# we mirror that for the multipart call.
_PHOTO_TIMEOUT = 120.0

# One multipart file part, in any form httpx files= accepts: raw bytes, a
# binary file-like object, or a (filename, content[, content_type]) tuple.
# str and PathLike values are treated as a filesystem path and read.
FileContent = bytes | IO[bytes]
FileInput = str | PathLike | FileContent | tuple[str | None, FileContent] | tuple[str | None, FileContent, str | None]


def _find_current(payload: list[dict]) -> Profile | None:
    profiles = [Profile.model_validate(entry) for entry in payload]
    return next((profile for profile in profiles if profile.current), None)


def _write_body(params: CreateProfileRequest | UpdateProfileRequest) -> dict[str, Any]:
    # The deployed profile schemas are strict and take optional strings, not
    # nulls, so unset fields stay off the wire and an explicit None does too.
    return params.model_dump(mode="json", exclude_unset=True, exclude_none=True)


def _delete_result(payload: Any) -> AuthenticateResponse | None:
    # Deleting the last profile answers with a logged-out status object
    # instead of tokens; None is our spelling for "no session left".
    if isinstance(payload, dict) and "access_token" in payload:
        return AuthenticateResponse.model_validate(payload)
    return None


def _picture_part(picture: FileInput) -> Any:
    if isinstance(picture, (str, PathLike)):
        path = Path(picture)
        # The server stores the declared part content type with the photo,
        # so we guess one from the file name rather than sending everything
        # as octet-stream.
        return (path.name, path.read_bytes(), mimetypes.guess_type(path.name)[0])
    return picture


class Profiles:
    """Profile calls for a sync endpoint."""

    def __init__(self, endpoint: VerdocsEndpoint) -> None:
        self._endpoint = endpoint

    def list(self) -> list[Profile]:
        """Get the caller's profiles via GET /v2/profiles.

        A user has one profile per organization they are a member of, and
        exactly one is marked current. Mirrors js-sdk getProfiles.

        Returns:
            All of the caller's profiles.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("GET", _PROFILES_PATH)
        return [Profile.model_validate(entry) for entry in response.json()]

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

    def create(self, params: CreateProfileRequest) -> AuthenticateResponse:
        """Sign up: create a new user, organization, and profile via POST /v2/profiles.

        This is the self-service registration path, so the deployed endpoint
        requires an UNAUTHENTICATED caller (authenticated users get a 400
        pointing at POST /v2/organizations). The new profile becomes current
        and session tokens are returned, but the session is only partial
        until the emailed verification code is submitted: apply the returned
        access token with set_token(), then call auth.verify_email() on the
        same endpoint. Mirrors js-sdk createProfile.

        Example:
            tokens = endpoint.profiles.create(CreateProfileRequest(
                email="a@b.com", password="secret!A1", first_name="First",
                last_name="Last", org_name="NEW ORG",
            ))
            endpoint.set_token(tokens.access_token)
            verified = endpoint.auth.verify_email(email="a@b.com", token="EMAILED-CODE")

        Args:
            params: The signup fields; org_name does not need to be unique.

        Returns:
            Tokens for the new (partial, unverified) session; apply with set_token().

        Raises:
            VerdocsAPIError: The email already exists, the password is too
                weak, or the caller was already authenticated.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("POST", _PROFILES_PATH, json=_write_body(params))
        return AuthenticateResponse.model_validate(response.json())

    def switch(self, profile_id: str) -> AuthenticateResponse:
        """Switch the caller's current profile via POST /v2/profiles/{profile_id}/switch.

        The current profile drives permissions checking and the profile_id
        stamped on most operations, so switch before acting as another
        organization. Like the js-sdk, the new tokens are returned, not
        applied: call set_token() with the new access token to start
        operating as the switched profile (the old token keeps its previous
        profile context until it expires). Mirrors js-sdk switchProfile.

        Example:
            tokens = endpoint.profiles.switch("PROFILE-ID")
            endpoint.set_token(tokens.access_token)

        Args:
            profile_id: ID of the caller's profile to make current.

        Returns:
            Tokens carrying the switched profile; apply with set_token().

        Raises:
            NotFoundError: The caller has no profile with that ID.
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("POST", f"{_PROFILES_PATH}/{profile_id}/switch")
        return AuthenticateResponse.model_validate(response.json())

    def update(self, profile_id: str, params: UpdateProfileRequest) -> Profile:
        """Update a profile via PATCH /v2/profiles/{profile_id}.

        For your own profile this updates the basic fields (name, phone,
        timezone, locale); admins may also update other members of their
        organization, which is the only path that accepts permissions and
        roles (see UpdateProfileRequest for the split). Mirrors js-sdk
        updateProfile.

        Args:
            profile_id: ID of the profile to update.
            params: The fields to change; unset fields are left alone.

        Returns:
            The updated profile.

        Raises:
            NotFoundError: No profile has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("PATCH", f"{_PROFILES_PATH}/{profile_id}", json=_write_body(params))
        return Profile.model_validate(response.json())

    def update_photo(self, profile_id: str, picture: FileInput) -> Profile:
        """Update the caller's profile photo via a multipart PATCH /v2/profiles/{profile_id}.

        Only the caller's own profile accepts a photo. The file goes up as a
        `picture` part, and the declared content type is stored with it.
        Mirrors js-sdk updateProfilePhoto, minus its browser-only upload
        progress callback.

        Args:
            profile_id: ID of the caller's own profile.
            picture: The photo: a filesystem path (str or PathLike), raw
                bytes, a binary file-like object, or an httpx-style
                (filename, content[, content_type]) tuple.

        Returns:
            The updated profile; its picture field is a public CDN URL.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        path = f"{_PROFILES_PATH}/{profile_id}"
        # _request only speaks JSON, so the multipart upload goes through the
        # raw client with the same error mapping.
        try:
            response = self._endpoint._client.request(
                "PATCH", path, files={"picture": _picture_part(picture)}, timeout=_PHOTO_TIMEOUT
            )
        except httpx.TransportError as exc:
            raise VerdocsConnectionError(f"PATCH {path} failed: {exc}") from exc
        if response.status_code >= 400:
            raise api_error_from_response(response)
        return Profile.model_validate(response.json())

    def delete(self, profile_id: str) -> AuthenticateResponse | None:
        """Delete one of the caller's profiles via DELETE /v2/profiles/{profile_id}.

        Deleting your current profile switches you to the next available one
        and returns its tokens (apply them with set_token()); deleting your
        last remaining profile returns None, and you are logged out. Mirrors
        js-sdk deleteProfile.

        As deployed, the handler only sends a response when the deleted
        profile was the caller's current one: deleting a NON-current profile
        succeeds but never answers, so the call times out. Switch to a
        profile before deleting it.

        Args:
            profile_id: ID of the caller's profile to delete.

        Returns:
            Tokens for the next available profile, or None when the last
            profile was deleted and the session is gone.

        Raises:
            VerdocsAPIError: The profile does not belong to the caller.
            VerdocsConnectionError: The request never reached the API, or
                (deployed quirk above) the API never answered.
        """
        response = self._endpoint._request("DELETE", f"{_PROFILES_PATH}/{profile_id}")
        return _delete_result(response.json())


class AsyncProfiles:
    """Profile calls for an async endpoint."""

    def __init__(self, endpoint: AsyncVerdocsEndpoint) -> None:
        self._endpoint = endpoint

    async def list(self) -> list[Profile]:
        """Get the caller's profiles via GET /v2/profiles.

        A user has one profile per organization they are a member of, and
        exactly one is marked current. Mirrors js-sdk getProfiles.

        Returns:
            All of the caller's profiles.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", _PROFILES_PATH)
        return [Profile.model_validate(entry) for entry in response.json()]

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

    async def create(self, params: CreateProfileRequest) -> AuthenticateResponse:
        """Sign up: create a new user, organization, and profile via POST /v2/profiles.

        This is the self-service registration path, so the deployed endpoint
        requires an UNAUTHENTICATED caller (authenticated users get a 400
        pointing at POST /v2/organizations). The new profile becomes current
        and session tokens are returned, but the session is only partial
        until the emailed verification code is submitted: apply the returned
        access token with set_token(), then call auth.verify_email() on the
        same endpoint. Mirrors js-sdk createProfile.

        Example:
            tokens = await endpoint.profiles.create(CreateProfileRequest(
                email="a@b.com", password="secret!A1", first_name="First",
                last_name="Last", org_name="NEW ORG",
            ))
            endpoint.set_token(tokens.access_token)
            verified = await endpoint.auth.verify_email(email="a@b.com", token="EMAILED-CODE")

        Args:
            params: The signup fields; org_name does not need to be unique.

        Returns:
            Tokens for the new (partial, unverified) session; apply with set_token().

        Raises:
            VerdocsAPIError: The email already exists, the password is too
                weak, or the caller was already authenticated.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", _PROFILES_PATH, json=_write_body(params))
        return AuthenticateResponse.model_validate(response.json())

    async def switch(self, profile_id: str) -> AuthenticateResponse:
        """Switch the caller's current profile via POST /v2/profiles/{profile_id}/switch.

        The current profile drives permissions checking and the profile_id
        stamped on most operations, so switch before acting as another
        organization. Like the js-sdk, the new tokens are returned, not
        applied: call set_token() with the new access token to start
        operating as the switched profile (the old token keeps its previous
        profile context until it expires). Mirrors js-sdk switchProfile.

        Example:
            tokens = await endpoint.profiles.switch("PROFILE-ID")
            endpoint.set_token(tokens.access_token)

        Args:
            profile_id: ID of the caller's profile to make current.

        Returns:
            Tokens carrying the switched profile; apply with set_token().

        Raises:
            NotFoundError: The caller has no profile with that ID.
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", f"{_PROFILES_PATH}/{profile_id}/switch")
        return AuthenticateResponse.model_validate(response.json())

    async def update(self, profile_id: str, params: UpdateProfileRequest) -> Profile:
        """Update a profile via PATCH /v2/profiles/{profile_id}.

        For your own profile this updates the basic fields (name, phone,
        timezone, locale); admins may also update other members of their
        organization, which is the only path that accepts permissions and
        roles (see UpdateProfileRequest for the split). Mirrors js-sdk
        updateProfile.

        Args:
            profile_id: ID of the profile to update.
            params: The fields to change; unset fields are left alone.

        Returns:
            The updated profile.

        Raises:
            NotFoundError: No profile has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("PATCH", f"{_PROFILES_PATH}/{profile_id}", json=_write_body(params))
        return Profile.model_validate(response.json())

    async def update_photo(self, profile_id: str, picture: FileInput) -> Profile:
        """Update the caller's profile photo via a multipart PATCH /v2/profiles/{profile_id}.

        Only the caller's own profile accepts a photo. The file goes up as a
        `picture` part, and the declared content type is stored with it.
        Mirrors js-sdk updateProfilePhoto, minus its browser-only upload
        progress callback.

        Args:
            profile_id: ID of the caller's own profile.
            picture: The photo: a filesystem path (str or PathLike), raw
                bytes, a binary file-like object, or an httpx-style
                (filename, content[, content_type]) tuple.

        Returns:
            The updated profile; its picture field is a public CDN URL.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        path = f"{_PROFILES_PATH}/{profile_id}"
        # _request only speaks JSON, so the multipart upload goes through the
        # raw client with the same error mapping.
        try:
            response = await self._endpoint._client.request(
                "PATCH", path, files={"picture": _picture_part(picture)}, timeout=_PHOTO_TIMEOUT
            )
        except httpx.TransportError as exc:
            raise VerdocsConnectionError(f"PATCH {path} failed: {exc}") from exc
        if response.status_code >= 400:
            raise api_error_from_response(response)
        return Profile.model_validate(response.json())

    async def delete(self, profile_id: str) -> AuthenticateResponse | None:
        """Delete one of the caller's profiles via DELETE /v2/profiles/{profile_id}.

        Deleting your current profile switches you to the next available one
        and returns its tokens (apply them with set_token()); deleting your
        last remaining profile returns None, and you are logged out. Mirrors
        js-sdk deleteProfile.

        As deployed, the handler only sends a response when the deleted
        profile was the caller's current one: deleting a NON-current profile
        succeeds but never answers, so the call times out. Switch to a
        profile before deleting it.

        Args:
            profile_id: ID of the caller's profile to delete.

        Returns:
            Tokens for the next available profile, or None when the last
            profile was deleted and the session is gone.

        Raises:
            VerdocsAPIError: The profile does not belong to the caller.
            VerdocsConnectionError: The request never reached the API, or
                (deployed quirk above) the API never answered.
        """
        response = await self._endpoint._request("DELETE", f"{_PROFILES_PATH}/{profile_id}")
        return _delete_result(response.json())
