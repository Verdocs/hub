"""Organization group operations (js-sdk: Organizations/Groups.ts).

Groups bundle member profiles for role-based access control. Permissions are
additive: a profile holds the union of its direct permissions and every
group's. Any member may list groups; changing them takes an admin or owner.
The "everyone" group is server-managed and cannot be created, renamed, or
deleted.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from ..models.core import Group, GroupProfile
from ..models.organizations import GroupCreateParams, GroupUpdateParams

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_GROUPS_PATH = "/v2/organization-groups"


def _write_body(params: GroupCreateParams | GroupUpdateParams) -> dict[str, Any]:
    return params.model_dump(mode="json", exclude_unset=True)


def _parse_group_profile(response_json: Any) -> GroupProfile | None:
    if response_json is None:
        return None
    return GroupProfile.model_validate(response_json)


class Groups:
    """Organization group calls for a sync endpoint."""

    def __init__(self, endpoint: VerdocsEndpoint) -> None:
        self._endpoint = endpoint

    def list(self) -> list[Group]:
        """Get the groups in the caller's organization via GET /v2/organization-groups.

        Mirrors js-sdk getGroups. Member profiles are not included here; use
        get() for a group's members.

        Returns:
            The organization's groups.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("GET", _GROUPS_PATH)
        return [Group.model_validate(entry) for entry in response.json()]

    def get(self, group_id: str) -> Group:
        """Get a group with its member profiles via GET /v2/organization-groups/{group_id}.

        Mirrors js-sdk getGroup.

        Args:
            group_id: ID of the group to fetch.

        Returns:
            The group, including its membership entries.

        Raises:
            NotFoundError: No such group in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("GET", f"{_GROUPS_PATH}/{group_id}")
        return Group.model_validate(response.json())

    def create(self, params: GroupCreateParams) -> Group:
        """Create a group via POST /v2/organization-groups. Mirrors js-sdk createGroup.

        Example:
            group = endpoint.groups.create(GroupCreateParams(name="sales", permissions=["template:member:read"]))

        Args:
            params: Name and permissions for the new group. "everyone" is
                reserved, and the server lowercases the name.

        Returns:
            The new group.

        Raises:
            VerdocsAPIError: The API rejected the request.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("POST", _GROUPS_PATH, json=_write_body(params))
        return Group.model_validate(response.json())

    def update(self, group_id: str, params: GroupUpdateParams) -> Group:
        """Update a group via PATCH /v2/organization-groups/{group_id}. Mirrors js-sdk updateGroup.

        Args:
            group_id: ID of the group to update.
            params: New name and permissions; the server requires both, so
                pass the current value for anything you are not changing.

        Returns:
            The updated group.

        Raises:
            NotFoundError: No such group in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status (400 when
                renaming "everyone").
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("PATCH", f"{_GROUPS_PATH}/{group_id}", json=_write_body(params))
        return Group.model_validate(response.json())

    def delete(self, group_id: str) -> None:
        """Delete a group via DELETE /v2/organization-groups/{group_id}. Mirrors js-sdk deleteGroup.

        Membership entries are removed with it. The API answers with a status
        marker that nothing consumes, so this returns None and relies on
        exceptions for failure.

        Args:
            group_id: ID of the group to delete. The "everyone" group is refused.

        Raises:
            NotFoundError: No such group in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        self._endpoint._request("DELETE", f"{_GROUPS_PATH}/{group_id}")

    def add_member(self, group_id: str, profile_id: str) -> GroupProfile | None:
        """Add a profile to a group via POST /v2/organization-groups/{group_id}/members.

        The profile must belong to the same organization. Mirrors js-sdk
        addGroupMember.

        Known server defect: the deployed handler validates the request and
        rejects duplicates but never writes the membership row, and answers
        with an empty body, so this call is a no-op today. We port it as
        specified and return None until the API is fixed.

        Args:
            group_id: ID of the group.
            profile_id: ID of the profile to add.

        Returns:
            The membership entry, or None while the deployed handler returns
            an empty body.

        Raises:
            NotFoundError: The group or profile does not exist in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status (400 when
                the profile is already a member).
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request(
            "POST", f"{_GROUPS_PATH}/{group_id}/members", json={"profile_id": profile_id}
        )
        if not response.content:
            return None
        return _parse_group_profile(response.json())

    def delete_member(self, group_id: str, profile_id: str) -> None:
        """Remove a profile from a group via DELETE /v2/organization-groups/{group_id}/members/{profile_id}.

        Mirrors js-sdk deleteGroupMember. The API answers with a status
        marker that nothing consumes, so this returns None and relies on
        exceptions for failure.

        Args:
            group_id: ID of the group.
            profile_id: ID of the profile to remove.

        Raises:
            NotFoundError: The profile is not a member of the group.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        self._endpoint._request("DELETE", f"{_GROUPS_PATH}/{group_id}/members/{profile_id}")


class AsyncGroups:
    """Organization group calls for an async endpoint."""

    def __init__(self, endpoint: AsyncVerdocsEndpoint) -> None:
        self._endpoint = endpoint

    async def list(self) -> list[Group]:
        """Get the groups in the caller's organization via GET /v2/organization-groups.

        Mirrors js-sdk getGroups. Member profiles are not included here; use
        get() for a group's members.

        Returns:
            The organization's groups.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", _GROUPS_PATH)
        return [Group.model_validate(entry) for entry in response.json()]

    async def get(self, group_id: str) -> Group:
        """Get a group with its member profiles via GET /v2/organization-groups/{group_id}.

        Mirrors js-sdk getGroup.

        Args:
            group_id: ID of the group to fetch.

        Returns:
            The group, including its membership entries.

        Raises:
            NotFoundError: No such group in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", f"{_GROUPS_PATH}/{group_id}")
        return Group.model_validate(response.json())

    async def create(self, params: GroupCreateParams) -> Group:
        """Create a group via POST /v2/organization-groups. Mirrors js-sdk createGroup.

        Example:
            group = await endpoint.groups.create(GroupCreateParams(name="sales", permissions=[]))

        Args:
            params: Name and permissions for the new group. "everyone" is
                reserved, and the server lowercases the name.

        Returns:
            The new group.

        Raises:
            VerdocsAPIError: The API rejected the request.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", _GROUPS_PATH, json=_write_body(params))
        return Group.model_validate(response.json())

    async def update(self, group_id: str, params: GroupUpdateParams) -> Group:
        """Update a group via PATCH /v2/organization-groups/{group_id}. Mirrors js-sdk updateGroup.

        Args:
            group_id: ID of the group to update.
            params: New name and permissions; the server requires both, so
                pass the current value for anything you are not changing.

        Returns:
            The updated group.

        Raises:
            NotFoundError: No such group in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status (400 when
                renaming "everyone").
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("PATCH", f"{_GROUPS_PATH}/{group_id}", json=_write_body(params))
        return Group.model_validate(response.json())

    async def delete(self, group_id: str) -> None:
        """Delete a group via DELETE /v2/organization-groups/{group_id}. Mirrors js-sdk deleteGroup.

        Membership entries are removed with it. The API answers with a status
        marker that nothing consumes, so this returns None and relies on
        exceptions for failure.

        Args:
            group_id: ID of the group to delete. The "everyone" group is refused.

        Raises:
            NotFoundError: No such group in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        await self._endpoint._request("DELETE", f"{_GROUPS_PATH}/{group_id}")

    async def add_member(self, group_id: str, profile_id: str) -> GroupProfile | None:
        """Add a profile to a group via POST /v2/organization-groups/{group_id}/members.

        The profile must belong to the same organization. Mirrors js-sdk
        addGroupMember.

        Known server defect: the deployed handler validates the request and
        rejects duplicates but never writes the membership row, and answers
        with an empty body, so this call is a no-op today. We port it as
        specified and return None until the API is fixed.

        Args:
            group_id: ID of the group.
            profile_id: ID of the profile to add.

        Returns:
            The membership entry, or None while the deployed handler returns
            an empty body.

        Raises:
            NotFoundError: The group or profile does not exist in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status (400 when
                the profile is already a member).
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "POST", f"{_GROUPS_PATH}/{group_id}/members", json={"profile_id": profile_id}
        )
        if not response.content:
            return None
        return _parse_group_profile(response.json())

    async def delete_member(self, group_id: str, profile_id: str) -> None:
        """Remove a profile from a group via DELETE /v2/organization-groups/{group_id}/members/{profile_id}.

        Mirrors js-sdk deleteGroupMember. The API answers with a status
        marker that nothing consumes, so this returns None and relies on
        exceptions for failure.

        Args:
            group_id: ID of the group.
            profile_id: ID of the profile to remove.

        Raises:
            NotFoundError: The profile is not a member of the group.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        await self._endpoint._request("DELETE", f"{_GROUPS_PATH}/{group_id}/members/{profile_id}")
