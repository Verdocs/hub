"""members resource: list/create/update/delete plus lock/unlock, sync and async.

Resources are constructed directly (Members(endpoint)) because endpoint
wiring for the Organizations namespaces belongs to the coordinator.
"""

from __future__ import annotations

from typing import Any

import pytest

from verdocs import NotFoundError, Profile, VerdocsAPIError
from verdocs.models.organizations import MemberCreateParams, MemberCreateResponse, MemberUpdateParams
from verdocs.resources.members import AsyncMembers, Members

MEMBERS_URL = "/v2/organization-members"


def member_create_response_payload(profile: dict[str, Any], **overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "profile": profile,
        "user": {"email": profile["email"], "existed": False},
        "password": "generated-pass-123",
    }
    payload.update(overrides)
    return payload


def test_list_returns_profiles(endpoint, payloads, respx_mock, base_url):
    respx_mock.get(f"{base_url}{MEMBERS_URL}").respond(200, json=[payloads.profile()])

    members = Members(endpoint).list()

    assert len(members) == 1
    assert isinstance(members[0], Profile)
    assert members[0].email == "test@example.com"


def test_list_includes_user_join_for_admins(endpoint, payloads, respx_mock, base_url):
    respx_mock.get(f"{base_url}{MEMBERS_URL}").respond(
        200, json=[payloads.profile(user=payloads.user(locked=False, login_failures=0))]
    )

    members = Members(endpoint).list()

    assert members[0].user is not None
    assert members[0].user.locked is False


def test_create_sends_params_and_returns_wrapped_response(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{MEMBERS_URL}").respond(
        200, json=member_create_response_payload(payloads.profile(email="new@example.com"))
    )

    result = Members(endpoint).create(
        MemberCreateParams(email="new@example.com", first_name="New", last_name="Member", roles=["member"])
    )

    assert payloads.request_json(route) == {
        "email": "new@example.com",
        "first_name": "New",
        "last_name": "Member",
        "roles": ["member"],
    }
    assert isinstance(result, MemberCreateResponse)
    assert result.profile.email == "new@example.com"
    assert result.user.existed is False
    assert result.password == "generated-pass-123"


def test_create_existing_user_has_no_password(endpoint, payloads, respx_mock, base_url):
    response_json = {"profile": payloads.profile(), "user": {"email": "test@example.com", "existed": True}}
    respx_mock.post(f"{base_url}{MEMBERS_URL}").respond(200, json=response_json)

    result = Members(endpoint).create(MemberCreateParams(email="test@example.com", first_name="A", last_name="B"))

    assert result.user.existed is True
    assert result.password is None


def test_create_duplicate_member_raises_api_error(endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{MEMBERS_URL}").respond(
        400, json={"error": "User is already a member of this organization"}
    )

    with pytest.raises(VerdocsAPIError) as excinfo:
        Members(endpoint).create(MemberCreateParams(email="a@b.com", first_name="A", last_name="B"))

    assert excinfo.value.status_code == 400


def test_update_sends_roles_only(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{MEMBERS_URL}/profile-1234").respond(
        200, json=payloads.profile(roles=["admin"])
    )

    profile = Members(endpoint).update("profile-1234", MemberUpdateParams(roles=["admin"]))

    assert payloads.request_json(route) == {"roles": ["admin"]}
    assert profile.roles == ["admin"]


def test_update_missing_raises_not_found(endpoint, respx_mock, base_url):
    respx_mock.patch(f"{base_url}{MEMBERS_URL}/nope").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        Members(endpoint).update("nope", MemberUpdateParams(roles=["admin"]))


def test_delete_returns_none(endpoint, respx_mock, base_url):
    route = respx_mock.delete(f"{base_url}{MEMBERS_URL}/profile-1234").respond(200, json={"status": "OK"})

    assert Members(endpoint).delete("profile-1234") is None
    assert route.called


def test_lock_sends_action_and_reason(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.put(f"{base_url}{MEMBERS_URL}/profile-1234").respond(
        200, json=payloads.profile(user=payloads.user(locked=True, lock_reason="Departed employee"))
    )

    profile = Members(endpoint).lock("profile-1234", "Departed employee")

    assert payloads.request_json(route) == {"action": "lock", "reason": "Departed employee"}
    assert profile.user is not None
    assert profile.user.locked is True
    assert profile.user.lock_reason == "Departed employee"


def test_unlock_sends_action_only(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.put(f"{base_url}{MEMBERS_URL}/profile-1234").respond(
        200, json=payloads.profile(user=payloads.user(locked=False, login_failures=0))
    )

    profile = Members(endpoint).unlock("profile-1234")

    assert payloads.request_json(route) == {"action": "unlock"}
    assert profile.user is not None
    assert profile.user.locked is False


async def test_async_list_returns_profiles(async_endpoint, payloads, respx_mock, base_url):
    respx_mock.get(f"{base_url}{MEMBERS_URL}").respond(200, json=[payloads.profile()])

    members = await AsyncMembers(async_endpoint).list()

    assert members[0].id == "profile-1234"


async def test_async_create_update_delete_round_trip(async_endpoint, payloads, respx_mock, base_url):
    create_route = respx_mock.post(f"{base_url}{MEMBERS_URL}").respond(
        200, json=member_create_response_payload(payloads.profile())
    )
    update_route = respx_mock.patch(f"{base_url}{MEMBERS_URL}/profile-1234").respond(
        200, json=payloads.profile(roles=["admin"])
    )
    delete_route = respx_mock.delete(f"{base_url}{MEMBERS_URL}/profile-1234").respond(200, json={"status": "OK"})

    members = AsyncMembers(async_endpoint)
    created = await members.create(MemberCreateParams(email="a@b.com", first_name="A", last_name="B"))
    updated = await members.update("profile-1234", MemberUpdateParams(roles=["admin"]))
    deleted = await members.delete("profile-1234")

    assert payloads.request_json(create_route) == {"email": "a@b.com", "first_name": "A", "last_name": "B"}
    assert payloads.request_json(update_route) == {"roles": ["admin"]}
    assert isinstance(created, MemberCreateResponse)
    assert updated.roles == ["admin"]
    assert deleted is None
    assert delete_route.called


async def test_async_lock_and_unlock(async_endpoint, payloads, respx_mock, base_url):
    route = respx_mock.put(f"{base_url}{MEMBERS_URL}/profile-1234").respond(
        200, json=payloads.profile(user=payloads.user(locked=True, lock_reason="x"))
    )

    members = AsyncMembers(async_endpoint)
    locked = await members.lock("profile-1234", "x")
    lock_body = payloads.request_json(route)
    await members.unlock("profile-1234")
    unlock_body = payloads.request_json(route)

    assert lock_body == {"action": "lock", "reason": "x"}
    assert unlock_body == {"action": "unlock"}
    assert locked.user is not None
