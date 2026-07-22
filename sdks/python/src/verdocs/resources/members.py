"""Organization member operations (js-sdk: Organizations/Members.ts).

A member is a profile with organization access. All calls here operate on
the caller's current organization; the admin-only calls (everything except
list) require an admin or owner role.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from ..models.core import Profile
from ..models.organizations import MemberCreateParams, MemberCreateResponse, MemberUpdateParams

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_MEMBERS_PATH = "/v2/organization-members"


def _write_body(params: MemberCreateParams | MemberUpdateParams) -> dict[str, Any]:
    return params.model_dump(mode="json", exclude_unset=True)


class Members:
    """Organization member calls for a sync endpoint."""

    def __init__(self, endpoint: VerdocsEndpoint) -> None:
        self._endpoint = endpoint

    def list(self) -> list[Profile]:
        """Get the members of the caller's organization via GET /v2/organization-members.

        Contacts and guest profiles are excluded. When the caller is an admin
        or owner, each profile carries its joined user record (for lock-state
        management); other callers get plain profiles. Mirrors js-sdk
        getOrganizationMembers.

        Returns:
            The organization's members, sorted by last then first name.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation member.getOrganizationMembers
        @sdkGroup Member
        @sdkPage Endpoints
        """
        response = self._endpoint._request("GET", _MEMBERS_PATH)
        return [Profile.model_validate(entry) for entry in response.json()]

    def create(self, params: MemberCreateParams) -> MemberCreateResponse:
        """Create a member directly, bypassing the invite flow, via POST /v2/organization-members.

        If no user account exists for the email, one is created; omit
        password to have the server generate one and return it. Mirrors
        js-sdk createOrganizationMember, which types the response as a bare
        profile; the wire wraps it (see MemberCreateResponse).

        Example:
            result = endpoint.members.create(
                MemberCreateParams(email="a@b.com", first_name="A", last_name="B", roles=["member"])
            )
            initial_password = result.password

        Args:
            params: Details for the new member.

        Returns:
            The new profile, a user summary, and the generated password when
            the server created the account.

        Raises:
            VerdocsAPIError: The API rejected the request (400 when the user
                is already a member).
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation member.createOrganizationMember
        @sdkGroup Member
        @sdkPage Endpoints
        """
        response = self._endpoint._request("POST", _MEMBERS_PATH, json=_write_body(params))
        return MemberCreateResponse.model_validate(response.json())

    def update(self, profile_id: str, params: MemberUpdateParams) -> Profile:
        """Update a member's roles via PATCH /v2/organization-members/{profile_id}.

        Callers may not update themselves, and only an owner may grant the
        owner role. Mirrors js-sdk updateOrganizationMember; note the
        deployed schema accepts roles only (see MemberUpdateParams).

        Args:
            profile_id: The profile to update.
            params: The fields to change.

        Returns:
            The updated profile.

        Raises:
            NotFoundError: No such member in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation member.updateOrganizationMember
        @sdkGroup Member
        @sdkPage Endpoints
        """
        response = self._endpoint._request("PATCH", f"{_MEMBERS_PATH}/{profile_id}", json=_write_body(params))
        return Profile.model_validate(response.json())

    def delete(self, profile_id: str) -> None:
        """Remove a member via DELETE /v2/organization-members/{profile_id}.

        The member's envelopes, templates, and recipient records are
        reassigned to the caller; their signatures, API keys, and similar
        personal records are deleted. Callers may not delete themselves.
        Mirrors js-sdk deleteOrganizationMember.

        The API answers with a status marker that nothing consumes, so this
        returns None and relies on exceptions for failure.

        Args:
            profile_id: The profile to remove.

        Raises:
            NotFoundError: No such member in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation member.deleteOrganizationMember
        @sdkGroup Member
        @sdkPage Endpoints
        """
        self._endpoint._request("DELETE", f"{_MEMBERS_PATH}/{profile_id}")

    def lock(self, profile_id: str, reason: str) -> Profile:
        """Lock a member's user account via PUT /v2/organization-members/{profile_id}.

        A locked member cannot sign in until unlocked or until they complete
        a password reset. Callers may not lock themselves, the target must
        have a linked user account, and only an owner may lock another owner.
        Mirrors js-sdk lockOrganizationMember.

        Args:
            profile_id: The profile to lock.
            reason: Why the account is being locked (1-255 chars); stored on
                the user record and shown to admins.

        Returns:
            The member's profile with the joined user record.

        Raises:
            NotFoundError: No such member in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation member.lockOrganizationMember
        @sdkGroup Member
        @sdkPage Endpoints
        """
        response = self._endpoint._request(
            "PUT", f"{_MEMBERS_PATH}/{profile_id}", json={"action": "lock", "reason": reason}
        )
        return Profile.model_validate(response.json())

    def unlock(self, profile_id: str) -> Profile:
        """Unlock a member's user account via PUT /v2/organization-members/{profile_id}.

        Clears the locked flag, the lock reason, and the failed-login
        counter. Callers may not unlock themselves and the target must have a
        linked user account. Mirrors js-sdk unlockOrganizationMember.

        Args:
            profile_id: The profile to unlock.

        Returns:
            The member's profile with the joined user record.

        Raises:
            NotFoundError: No such member in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation member.unlockOrganizationMember
        @sdkGroup Member
        @sdkPage Endpoints
        """
        response = self._endpoint._request("PUT", f"{_MEMBERS_PATH}/{profile_id}", json={"action": "unlock"})
        return Profile.model_validate(response.json())


class AsyncMembers:
    """Organization member calls for an async endpoint."""

    def __init__(self, endpoint: AsyncVerdocsEndpoint) -> None:
        self._endpoint = endpoint

    async def list(self) -> list[Profile]:
        """Get the members of the caller's organization via GET /v2/organization-members.

        Contacts and guest profiles are excluded. When the caller is an admin
        or owner, each profile carries its joined user record (for lock-state
        management); other callers get plain profiles. Mirrors js-sdk
        getOrganizationMembers.

        Returns:
            The organization's members, sorted by last then first name.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", _MEMBERS_PATH)
        return [Profile.model_validate(entry) for entry in response.json()]

    async def create(self, params: MemberCreateParams) -> MemberCreateResponse:
        """Create a member directly, bypassing the invite flow, via POST /v2/organization-members.

        If no user account exists for the email, one is created; omit
        password to have the server generate one and return it. Mirrors
        js-sdk createOrganizationMember, which types the response as a bare
        profile; the wire wraps it (see MemberCreateResponse).

        Example:
            result = await endpoint.members.create(
                MemberCreateParams(email="a@b.com", first_name="A", last_name="B", roles=["member"])
            )
            initial_password = result.password

        Args:
            params: Details for the new member.

        Returns:
            The new profile, a user summary, and the generated password when
            the server created the account.

        Raises:
            VerdocsAPIError: The API rejected the request (400 when the user
                is already a member).
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", _MEMBERS_PATH, json=_write_body(params))
        return MemberCreateResponse.model_validate(response.json())

    async def update(self, profile_id: str, params: MemberUpdateParams) -> Profile:
        """Update a member's roles via PATCH /v2/organization-members/{profile_id}.

        Callers may not update themselves, and only an owner may grant the
        owner role. Mirrors js-sdk updateOrganizationMember; note the
        deployed schema accepts roles only (see MemberUpdateParams).

        Args:
            profile_id: The profile to update.
            params: The fields to change.

        Returns:
            The updated profile.

        Raises:
            NotFoundError: No such member in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("PATCH", f"{_MEMBERS_PATH}/{profile_id}", json=_write_body(params))
        return Profile.model_validate(response.json())

    async def delete(self, profile_id: str) -> None:
        """Remove a member via DELETE /v2/organization-members/{profile_id}.

        The member's envelopes, templates, and recipient records are
        reassigned to the caller; their signatures, API keys, and similar
        personal records are deleted. Callers may not delete themselves.
        Mirrors js-sdk deleteOrganizationMember.

        The API answers with a status marker that nothing consumes, so this
        returns None and relies on exceptions for failure.

        Args:
            profile_id: The profile to remove.

        Raises:
            NotFoundError: No such member in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        await self._endpoint._request("DELETE", f"{_MEMBERS_PATH}/{profile_id}")

    async def lock(self, profile_id: str, reason: str) -> Profile:
        """Lock a member's user account via PUT /v2/organization-members/{profile_id}.

        A locked member cannot sign in until unlocked or until they complete
        a password reset. Callers may not lock themselves, the target must
        have a linked user account, and only an owner may lock another owner.
        Mirrors js-sdk lockOrganizationMember.

        Args:
            profile_id: The profile to lock.
            reason: Why the account is being locked (1-255 chars); stored on
                the user record and shown to admins.

        Returns:
            The member's profile with the joined user record.

        Raises:
            NotFoundError: No such member in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "PUT", f"{_MEMBERS_PATH}/{profile_id}", json={"action": "lock", "reason": reason}
        )
        return Profile.model_validate(response.json())

    async def unlock(self, profile_id: str) -> Profile:
        """Unlock a member's user account via PUT /v2/organization-members/{profile_id}.

        Clears the locked flag, the lock reason, and the failed-login
        counter. Callers may not unlock themselves and the target must have a
        linked user account. Mirrors js-sdk unlockOrganizationMember.

        Args:
            profile_id: The profile to unlock.

        Returns:
            The member's profile with the joined user record.

        Raises:
            NotFoundError: No such member in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("PUT", f"{_MEMBERS_PATH}/{profile_id}", json={"action": "unlock"})
        return Profile.model_validate(response.json())
