"""Organization contact operations (js-sdk: Organizations/Contacts.ts).

Contacts are profiles with the "contact" role and no organization access;
they exist to populate quick-search dropdowns when sending envelopes. Any
member may list them; changing them takes an admin or owner.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from ..models.core import Profile
from ..models.organizations import ContactCreateParams, ContactUpdateParams

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_CONTACTS_PATH = "/v2/organization-contacts"


def _write_body(params: ContactCreateParams | ContactUpdateParams) -> dict[str, Any]:
    return params.model_dump(mode="json", exclude_unset=True)


class Contacts:
    """Organization contact calls for a sync endpoint."""

    def __init__(self, endpoint: VerdocsEndpoint) -> None:
        self._endpoint = endpoint

    def list(self) -> list[Profile]:
        """Get the contacts in the caller's organization via GET /v2/organization-contacts.

        Mirrors js-sdk getOrganizationContacts.

        Returns:
            The organization's contacts, sorted by last then first name.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("GET", _CONTACTS_PATH)
        return [Profile.model_validate(entry) for entry in response.json()]

    def create(self, params: ContactCreateParams) -> Profile:
        """Create a contact via POST /v2/organization-contacts. Mirrors js-sdk createOrganizationContact.

        Example:
            contact = endpoint.contacts.create(
                ContactCreateParams(first_name="First", last_name="Last", email="a@b.com")
            )

        Args:
            params: Details for the new contact.

        Returns:
            The new contact's profile (roles will be ["contact"]).

        Raises:
            VerdocsAPIError: The API rejected the request.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("POST", _CONTACTS_PATH, json=_write_body(params))
        return Profile.model_validate(response.json())

    def update(self, profile_id: str, params: ContactUpdateParams) -> Profile:
        """Update a contact via PATCH /v2/organization-contacts/{profile_id}.

        Mirrors js-sdk updateOrganizationContact. The server requires the
        full name and email on every update, so pass current values for
        anything you are not changing.

        Args:
            profile_id: The contact profile to update.
            params: The contact's details.

        Returns:
            The updated profile.

        Raises:
            NotFoundError: No such contact in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("PATCH", f"{_CONTACTS_PATH}/{profile_id}", json=_write_body(params))
        return Profile.model_validate(response.json())

    def delete(self, profile_id: str) -> None:
        """Remove a contact via DELETE /v2/organization-contacts/{profile_id}.

        Any envelope or recipient records tied to the contact are reassigned
        to the caller. Mirrors js-sdk deleteOrganizationContact.

        The API answers with a status marker that nothing consumes, so this
        returns None and relies on exceptions for failure.

        Args:
            profile_id: The contact profile to remove.

        Raises:
            NotFoundError: No such contact in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        self._endpoint._request("DELETE", f"{_CONTACTS_PATH}/{profile_id}")


class AsyncContacts:
    """Organization contact calls for an async endpoint."""

    def __init__(self, endpoint: AsyncVerdocsEndpoint) -> None:
        self._endpoint = endpoint

    async def list(self) -> list[Profile]:
        """Get the contacts in the caller's organization via GET /v2/organization-contacts.

        Mirrors js-sdk getOrganizationContacts.

        Returns:
            The organization's contacts, sorted by last then first name.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", _CONTACTS_PATH)
        return [Profile.model_validate(entry) for entry in response.json()]

    async def create(self, params: ContactCreateParams) -> Profile:
        """Create a contact via POST /v2/organization-contacts. Mirrors js-sdk createOrganizationContact.

        Example:
            contact = await endpoint.contacts.create(
                ContactCreateParams(first_name="First", last_name="Last", email="a@b.com")
            )

        Args:
            params: Details for the new contact.

        Returns:
            The new contact's profile (roles will be ["contact"]).

        Raises:
            VerdocsAPIError: The API rejected the request.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", _CONTACTS_PATH, json=_write_body(params))
        return Profile.model_validate(response.json())

    async def update(self, profile_id: str, params: ContactUpdateParams) -> Profile:
        """Update a contact via PATCH /v2/organization-contacts/{profile_id}.

        Mirrors js-sdk updateOrganizationContact. The server requires the
        full name and email on every update, so pass current values for
        anything you are not changing.

        Args:
            profile_id: The contact profile to update.
            params: The contact's details.

        Returns:
            The updated profile.

        Raises:
            NotFoundError: No such contact in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("PATCH", f"{_CONTACTS_PATH}/{profile_id}", json=_write_body(params))
        return Profile.model_validate(response.json())

    async def delete(self, profile_id: str) -> None:
        """Remove a contact via DELETE /v2/organization-contacts/{profile_id}.

        Any envelope or recipient records tied to the contact are reassigned
        to the caller. Mirrors js-sdk deleteOrganizationContact.

        The API answers with a status marker that nothing consumes, so this
        returns None and relies on exceptions for failure.

        Args:
            profile_id: The contact profile to remove.

        Raises:
            NotFoundError: No such contact in the caller's organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        await self._endpoint._request("DELETE", f"{_CONTACTS_PATH}/{profile_id}")
