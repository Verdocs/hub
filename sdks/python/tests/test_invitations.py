"""invitations resource: full lifecycle including accept/decline, sync and async.

Resources are constructed directly (Invitations(endpoint)) because endpoint
wiring for the Organizations namespaces belongs to the coordinator.
"""

from __future__ import annotations

from typing import Any

import pytest

from verdocs import AuthenticateResponse, NotFoundError, OrganizationInvitation, VerdocsAPIError
from verdocs.models.organizations import InvitationAcceptParams, InvitationCreateParams, InvitationUpdateParams
from verdocs.resources.invitations import AsyncInvitations, Invitations

INVITATIONS_URL = "/v2/organization-invitations"


def invitation_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "organization_id": "org-1234",
        "email": "invitee@example.com",
        "first_name": "In",
        "last_name": "Vitee",
        "status": "pending",
        "role": "member",
        "generated_at": "2026-01-01T00:00:00.000Z",
        "token": "invite-token-1234",
    }
    payload.update(overrides)
    return payload


def organization_summary_payload() -> dict[str, Any]:
    return {
        "id": "org-1234",
        "name": "Test Org",
        "deletion_protected": True,
        "created_at": "2026-01-01T00:00:00.000Z",
        "updated_at": "2026-01-02T00:00:00.000Z",
    }


def test_list_returns_invitations(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{INVITATIONS_URL}").respond(200, json=[invitation_payload()])

    invitations = Invitations(endpoint).list()

    assert len(invitations) == 1
    assert isinstance(invitations[0], OrganizationInvitation)
    assert invitations[0].status == "pending"


def test_create_sends_params(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{INVITATIONS_URL}").respond(200, json=invitation_payload())

    invitation = Invitations(endpoint).create(
        InvitationCreateParams(email="invitee@example.com", first_name="In", last_name="Vitee", role="member")
    )

    assert payloads.request_json(route) == {
        "email": "invitee@example.com",
        "first_name": "In",
        "last_name": "Vitee",
        "role": "member",
    }
    assert invitation.email == "invitee@example.com"


def test_create_duplicate_raises_api_error(endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{INVITATIONS_URL}").respond(
        400, json={"error": "An invitation already exists for this email"}
    )

    with pytest.raises(VerdocsAPIError):
        Invitations(endpoint).create(
            InvitationCreateParams(email="invitee@example.com", first_name="A", last_name="B", role="member")
        )


def test_get_uses_email_and_token_path(endpoint, respx_mock, base_url):
    route = respx_mock.get(f"{base_url}{INVITATIONS_URL}/invitee@example.com/invite-token-1234").respond(
        200, json=invitation_payload(organization=organization_summary_payload())
    )

    invitation = Invitations(endpoint).get("invitee@example.com", "invite-token-1234")

    assert route.called
    assert invitation.organization is not None
    assert invitation.organization.name == "Test Org"


def test_get_invalid_token_raises_not_found(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{INVITATIONS_URL}/invitee@example.com/bad-token").respond(
        404, json={"error": "not found"}
    )

    with pytest.raises(NotFoundError):
        Invitations(endpoint).get("invitee@example.com", "bad-token")


def test_update_sends_role_only_and_returns_none_for_empty_body(endpoint, payloads, respx_mock, base_url):
    # The deployed handler's inverted existence check makes the "success"
    # path answer with an empty body; see the resource docstring.
    route = respx_mock.patch(f"{base_url}{INVITATIONS_URL}/invitee@example.com").respond(200)

    result = Invitations(endpoint).update("invitee@example.com", InvitationUpdateParams(role="admin"))

    assert payloads.request_json(route) == {"role": "admin"}
    assert result is None


def test_update_parses_invitation_when_server_returns_one(endpoint, respx_mock, base_url):
    respx_mock.patch(f"{base_url}{INVITATIONS_URL}/invitee@example.com").respond(
        200, json=invitation_payload(role="admin")
    )

    result = Invitations(endpoint).update("invitee@example.com", InvitationUpdateParams(role="admin"))

    assert isinstance(result, OrganizationInvitation)
    assert result.role == "admin"


def test_delete_returns_none(endpoint, respx_mock, base_url):
    route = respx_mock.delete(f"{base_url}{INVITATIONS_URL}/invitee@example.com").respond(200, json={"status": "OK"})

    assert Invitations(endpoint).delete("invitee@example.com") is None
    assert route.called


def test_resend_posts_email_and_returns_none(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{INVITATIONS_URL}/resend").respond(200, json={"status": "OK"})

    assert Invitations(endpoint).resend("invitee@example.com") is None
    assert payloads.request_json(route) == {"email": "invitee@example.com"}


def test_resend_declined_raises_api_error(endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{INVITATIONS_URL}/resend").respond(400, json={"error": "Invitation was declined"})

    with pytest.raises(VerdocsAPIError):
        Invitations(endpoint).resend("invitee@example.com")


def test_accept_sends_params_and_returns_tokens(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{INVITATIONS_URL}/accept").respond(200, json=payloads.auth())

    tokens = Invitations(endpoint).accept(
        InvitationAcceptParams(
            email="invitee@example.com",
            token="invite-token-1234",
            first_name="In",
            last_name="Vitee",
            password="secret12",
        )
    )

    assert payloads.request_json(route) == {
        "email": "invitee@example.com",
        "token": "invite-token-1234",
        "first_name": "In",
        "last_name": "Vitee",
        "password": "secret12",
    }
    assert isinstance(tokens, AuthenticateResponse)
    assert tokens.access_token


def test_decline_posts_email_and_token(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{INVITATIONS_URL}/decline").respond(200, json={"status": "OK"})

    assert Invitations(endpoint).decline("invitee@example.com", "invite-token-1234") is None
    assert payloads.request_json(route) == {"email": "invitee@example.com", "token": "invite-token-1234"}


async def test_async_list_create_and_get(async_endpoint, payloads, respx_mock, base_url):
    respx_mock.get(f"{base_url}{INVITATIONS_URL}").respond(200, json=[invitation_payload()])
    create_route = respx_mock.post(f"{base_url}{INVITATIONS_URL}").respond(200, json=invitation_payload())
    respx_mock.get(f"{base_url}{INVITATIONS_URL}/invitee@example.com/invite-token-1234").respond(
        200, json=invitation_payload()
    )

    invitations = AsyncInvitations(async_endpoint)
    listing = await invitations.list()
    created = await invitations.create(
        InvitationCreateParams(email="invitee@example.com", first_name="In", last_name="Vitee", role="member")
    )
    fetched = await invitations.get("invitee@example.com", "invite-token-1234")

    assert listing[0].email == "invitee@example.com"
    assert payloads.request_json(create_route)["role"] == "member"
    assert created.token == "invite-token-1234"
    assert fetched.email == "invitee@example.com"


async def test_async_update_delete_resend(async_endpoint, payloads, respx_mock, base_url):
    update_route = respx_mock.patch(f"{base_url}{INVITATIONS_URL}/invitee@example.com").respond(200)
    delete_route = respx_mock.delete(f"{base_url}{INVITATIONS_URL}/invitee@example.com").respond(
        200, json={"status": "OK"}
    )
    resend_route = respx_mock.post(f"{base_url}{INVITATIONS_URL}/resend").respond(200, json={"status": "OK"})

    invitations = AsyncInvitations(async_endpoint)
    updated = await invitations.update("invitee@example.com", InvitationUpdateParams(role="admin"))
    deleted = await invitations.delete("invitee@example.com")
    resent = await invitations.resend("invitee@example.com")

    assert payloads.request_json(update_route) == {"role": "admin"}
    assert updated is None
    assert deleted is None
    assert resent is None
    assert delete_route.called
    assert payloads.request_json(resend_route) == {"email": "invitee@example.com"}


async def test_async_accept_and_decline(async_endpoint, payloads, respx_mock, base_url):
    respx_mock.post(f"{base_url}{INVITATIONS_URL}/accept").respond(200, json=payloads.auth())
    decline_route = respx_mock.post(f"{base_url}{INVITATIONS_URL}/decline").respond(200, json={"status": "OK"})

    invitations = AsyncInvitations(async_endpoint)
    tokens = await invitations.accept(
        InvitationAcceptParams(
            email="invitee@example.com", token="t", first_name="A", last_name="B", password="secret12"
        )
    )
    declined = await invitations.decline("invitee@example.com", "t")

    assert isinstance(tokens, AuthenticateResponse)
    assert declined is None
    assert payloads.request_json(decline_route) == {"email": "invitee@example.com", "token": "t"}
