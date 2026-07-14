"""Organization invitation operations (js-sdk: Organizations/Invitations.ts).

Invitations are keyed by email within an organization and are one-time-use:
once accepted, declined, or deleted, the token stops working. get(), accept(),
and decline() authenticate with the invite token rather than a session, so
they work on an endpoint with no token set.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from ..models.core import OrganizationInvitation
from ..models.organizations import InvitationAcceptParams, InvitationCreateParams, InvitationUpdateParams
from ..models.users import AuthenticateResponse

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_INVITATIONS_PATH = "/v2/organization-invitations"


def _write_body(params: InvitationCreateParams | InvitationUpdateParams | InvitationAcceptParams) -> dict[str, Any]:
    return params.model_dump(mode="json", exclude_unset=True)


class Invitations:
    """Organization invitation calls for a sync endpoint."""

    def __init__(self, endpoint: VerdocsEndpoint) -> None:
        self._endpoint = endpoint

    def list(self) -> list[OrganizationInvitation]:
        """Get the pending invitations for the caller's organization via GET /v2/organization-invitations.

        The caller must be an admin or owner. Mirrors js-sdk getOrganizationInvitations.

        Returns:
            The organization's invitations, sorted by email.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("GET", _INVITATIONS_PATH)
        return [OrganizationInvitation.model_validate(entry) for entry in response.json()]

    def create(self, params: InvitationCreateParams) -> OrganizationInvitation:
        """Invite a new user to join the organization via POST /v2/organization-invitations.

        An invitation email goes out to the invitee. Only one invitation may
        exist per email, and the email may not already have a profile in the
        organization. Mirrors js-sdk createOrganizationInvitation.

        Example:
            invite = endpoint.invitations.create(
                InvitationCreateParams(email="a@b.com", first_name="A", last_name="B", role="member")
            )

        Args:
            params: Details for the invitation.

        Returns:
            The newly-created invitation.

        Raises:
            VerdocsAPIError: The API rejected the request (400 for duplicate
                invitations or existing profiles).
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("POST", _INVITATIONS_PATH, json=_write_body(params))
        return OrganizationInvitation.model_validate(response.json())

    def get(self, email: str, token: str) -> OrganizationInvitation:
        """Get an invitation's details via GET /v2/organization-invitations/{email}/{token}.

        Authenticated by the invite token, not a session; intended for the
        invitee, usually as the first step of accepting. A success means the
        token is still valid, and the response includes the organization's
        summary details for branding the accept screen. Mirrors js-sdk
        getOrganizationInvitation.

        Args:
            email: Email address the invitation was sent to.
            token: The invite token from the invitation email.

        Returns:
            The invitation, including its organization.

        Raises:
            NotFoundError: No invitation matches that email and token.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("GET", f"{_INVITATIONS_PATH}/{email}/{token}")
        return OrganizationInvitation.model_validate(response.json())

    def update(self, email: str, params: InvitationUpdateParams) -> OrganizationInvitation | None:
        """Update a pending invitation via PATCH /v2/organization-invitations/{email}.

        The email itself may not be changed; delete and re-create instead.
        Mirrors js-sdk updateOrganizationInvitation; note the deployed schema
        accepts role only (see InvitationUpdateParams).

        Known server defect: the deployed handler's existence check is
        inverted, so updating an invitation that exists draws a 400 ("An
        invitation already exists for this email") and updating one that does
        not exist "succeeds" with an empty body. The call is unusable until
        the API is fixed; we port it as specified.

        Args:
            email: Email address of the invitation to update.
            params: The fields to change.

        Returns:
            The updated invitation, or None when the wire answers with an
            empty body (see the defect note above).

        Raises:
            VerdocsAPIError: The API rejected the request.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("PATCH", f"{_INVITATIONS_PATH}/{email}", json=_write_body(params))
        payload = response.json() if response.content else None
        if payload is None:
            return None
        return OrganizationInvitation.model_validate(payload)

    def delete(self, email: str) -> None:
        """Delete a pending invitation via DELETE /v2/organization-invitations/{email}.

        No cancellation message is sent; the invitee sees an error if they
        try to join later. The handler also removes any profile rows matching
        that email in the organization. Mirrors js-sdk
        deleteOrganizationInvitation.

        The API answers with a status marker that nothing consumes, so this
        returns None and relies on exceptions for failure.

        Args:
            email: Email address of the invitation to delete.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        self._endpoint._request("DELETE", f"{_INVITATIONS_PATH}/{email}")

    def resend(self, email: str) -> None:
        """Send a reminder to a pending invitee via POST /v2/organization-invitations/resend.

        Declined invitations cannot be resent. Mirrors js-sdk
        resendOrganizationInvitation, which types the response as the
        invitation; the wire answers with a status marker only, so this
        returns None and relies on exceptions for failure.

        Args:
            email: Email address of the invitee to remind.

        Raises:
            NotFoundError: No invitation exists for that email.
            VerdocsAPIError: The API returned another non-2xx status (400 when
                the invitation was declined).
            VerdocsConnectionError: The request never reached the API.
        """
        self._endpoint._request("POST", f"{_INVITATIONS_PATH}/resend", json={"email": email})

    def accept(self, params: InvitationAcceptParams) -> AuthenticateResponse:
        """Accept an invitation via POST /v2/organization-invitations/accept.

        Authenticated by the invite token, not a session. Creates a user
        account for the invitee if needed, creates a profile with the invited
        role, makes it the invitee's current profile, and returns session
        tokens for it; call set_token() with the access token to continue.
        Mirrors js-sdk acceptOrganizationInvitation.

        Example:
            tokens = endpoint.invitations.accept(
                InvitationAcceptParams(
                    email="a@b.com", token="TOKEN", first_name="A", last_name="B", password="secret12"
                )
            )
            endpoint.set_token(tokens.access_token)

        Args:
            params: The invitee's details, invite token, and new password.

        Returns:
            Session tokens for the newly-created profile.

        Raises:
            NotFoundError: No invitation matches that email and token.
            VerdocsAPIError: The API returned another non-2xx status (400 when
                the invitation was declined).
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("POST", f"{_INVITATIONS_PATH}/accept", json=_write_body(params))
        return AuthenticateResponse.model_validate(response.json())

    def decline(self, email: str, token: str) -> None:
        """Decline an invitation via POST /v2/organization-invitations/decline.

        Authenticated by the invite token, not a session. Marks the
        invitation declined, which shows the organization's admins it was
        refused, blocks further invitations to the same email, and stops
        reminders. Mirrors js-sdk declineOrganizationInvitation.

        The API answers with a status marker that nothing consumes, so this
        returns None and relies on exceptions for failure.

        Args:
            email: Email address the invitation was sent to.
            token: The invite token from the invitation email.

        Raises:
            NotFoundError: No invitation matches that email and token.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        self._endpoint._request("POST", f"{_INVITATIONS_PATH}/decline", json={"email": email, "token": token})


class AsyncInvitations:
    """Organization invitation calls for an async endpoint."""

    def __init__(self, endpoint: AsyncVerdocsEndpoint) -> None:
        self._endpoint = endpoint

    async def list(self) -> list[OrganizationInvitation]:
        """Get the pending invitations for the caller's organization via GET /v2/organization-invitations.

        The caller must be an admin or owner. Mirrors js-sdk getOrganizationInvitations.

        Returns:
            The organization's invitations, sorted by email.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", _INVITATIONS_PATH)
        return [OrganizationInvitation.model_validate(entry) for entry in response.json()]

    async def create(self, params: InvitationCreateParams) -> OrganizationInvitation:
        """Invite a new user to join the organization via POST /v2/organization-invitations.

        An invitation email goes out to the invitee. Only one invitation may
        exist per email, and the email may not already have a profile in the
        organization. Mirrors js-sdk createOrganizationInvitation.

        Example:
            invite = await endpoint.invitations.create(
                InvitationCreateParams(email="a@b.com", first_name="A", last_name="B", role="member")
            )

        Args:
            params: Details for the invitation.

        Returns:
            The newly-created invitation.

        Raises:
            VerdocsAPIError: The API rejected the request (400 for duplicate
                invitations or existing profiles).
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", _INVITATIONS_PATH, json=_write_body(params))
        return OrganizationInvitation.model_validate(response.json())

    async def get(self, email: str, token: str) -> OrganizationInvitation:
        """Get an invitation's details via GET /v2/organization-invitations/{email}/{token}.

        Authenticated by the invite token, not a session; intended for the
        invitee, usually as the first step of accepting. A success means the
        token is still valid, and the response includes the organization's
        summary details for branding the accept screen. Mirrors js-sdk
        getOrganizationInvitation.

        Args:
            email: Email address the invitation was sent to.
            token: The invite token from the invitation email.

        Returns:
            The invitation, including its organization.

        Raises:
            NotFoundError: No invitation matches that email and token.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", f"{_INVITATIONS_PATH}/{email}/{token}")
        return OrganizationInvitation.model_validate(response.json())

    async def update(self, email: str, params: InvitationUpdateParams) -> OrganizationInvitation | None:
        """Update a pending invitation via PATCH /v2/organization-invitations/{email}.

        The email itself may not be changed; delete and re-create instead.
        Mirrors js-sdk updateOrganizationInvitation; note the deployed schema
        accepts role only (see InvitationUpdateParams).

        Known server defect: the deployed handler's existence check is
        inverted, so updating an invitation that exists draws a 400 ("An
        invitation already exists for this email") and updating one that does
        not exist "succeeds" with an empty body. The call is unusable until
        the API is fixed; we port it as specified.

        Args:
            email: Email address of the invitation to update.
            params: The fields to change.

        Returns:
            The updated invitation, or None when the wire answers with an
            empty body (see the defect note above).

        Raises:
            VerdocsAPIError: The API rejected the request.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("PATCH", f"{_INVITATIONS_PATH}/{email}", json=_write_body(params))
        payload = response.json() if response.content else None
        if payload is None:
            return None
        return OrganizationInvitation.model_validate(payload)

    async def delete(self, email: str) -> None:
        """Delete a pending invitation via DELETE /v2/organization-invitations/{email}.

        No cancellation message is sent; the invitee sees an error if they
        try to join later. The handler also removes any profile rows matching
        that email in the organization. Mirrors js-sdk
        deleteOrganizationInvitation.

        The API answers with a status marker that nothing consumes, so this
        returns None and relies on exceptions for failure.

        Args:
            email: Email address of the invitation to delete.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        await self._endpoint._request("DELETE", f"{_INVITATIONS_PATH}/{email}")

    async def resend(self, email: str) -> None:
        """Send a reminder to a pending invitee via POST /v2/organization-invitations/resend.

        Declined invitations cannot be resent. Mirrors js-sdk
        resendOrganizationInvitation, which types the response as the
        invitation; the wire answers with a status marker only, so this
        returns None and relies on exceptions for failure.

        Args:
            email: Email address of the invitee to remind.

        Raises:
            NotFoundError: No invitation exists for that email.
            VerdocsAPIError: The API returned another non-2xx status (400 when
                the invitation was declined).
            VerdocsConnectionError: The request never reached the API.
        """
        await self._endpoint._request("POST", f"{_INVITATIONS_PATH}/resend", json={"email": email})

    async def accept(self, params: InvitationAcceptParams) -> AuthenticateResponse:
        """Accept an invitation via POST /v2/organization-invitations/accept.

        Authenticated by the invite token, not a session. Creates a user
        account for the invitee if needed, creates a profile with the invited
        role, makes it the invitee's current profile, and returns session
        tokens for it; call set_token() with the access token to continue.
        Mirrors js-sdk acceptOrganizationInvitation.

        Example:
            tokens = await endpoint.invitations.accept(
                InvitationAcceptParams(
                    email="a@b.com", token="TOKEN", first_name="A", last_name="B", password="secret12"
                )
            )
            endpoint.set_token(tokens.access_token)

        Args:
            params: The invitee's details, invite token, and new password.

        Returns:
            Session tokens for the newly-created profile.

        Raises:
            NotFoundError: No invitation matches that email and token.
            VerdocsAPIError: The API returned another non-2xx status (400 when
                the invitation was declined).
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", f"{_INVITATIONS_PATH}/accept", json=_write_body(params))
        return AuthenticateResponse.model_validate(response.json())

    async def decline(self, email: str, token: str) -> None:
        """Decline an invitation via POST /v2/organization-invitations/decline.

        Authenticated by the invite token, not a session. Marks the
        invitation declined, which shows the organization's admins it was
        refused, blocks further invitations to the same email, and stops
        reminders. Mirrors js-sdk declineOrganizationInvitation.

        The API answers with a status marker that nothing consumes, so this
        returns None and relies on exceptions for failure.

        Args:
            email: Email address the invitation was sent to.
            token: The invite token from the invitation email.

        Raises:
            NotFoundError: No invitation matches that email and token.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        await self._endpoint._request("POST", f"{_INVITATIONS_PATH}/decline", json={"email": email, "token": token})
