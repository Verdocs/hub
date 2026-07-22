"""groups resource: CRUD plus membership add/remove, sync and async.

Resources are constructed directly (Groups(endpoint)) because endpoint
wiring for the Organizations namespaces belongs to the coordinator.
"""

from __future__ import annotations

from typing import Any

import pytest

from verdocs import Group, GroupProfile, NotFoundError, VerdocsAPIError
from verdocs.models.organizations import GroupCreateParams, GroupUpdateParams
from verdocs.resources.groups import AsyncGroups, Groups

GROUPS_URL = "/v2/organization-groups"


def group_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": "group-1234",
        "name": "sales",
        "organization_id": "org-1234",
        "permissions": ["template:member:read"],
    }
    payload.update(overrides)
    return payload


def group_profile_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "group_id": "group-1234",
        "profile_id": "profile-1234",
        "organization_id": "org-1234",
    }
    payload.update(overrides)
    return payload


def test_list_returns_groups(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{GROUPS_URL}").respond(200, json=[group_payload()])

    groups = Groups(endpoint).list()

    assert len(groups) == 1
    assert isinstance(groups[0], Group)
    assert groups[0].name == "sales"


def test_get_returns_group_with_members(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{GROUPS_URL}/group-1234").respond(
        200, json=group_payload(profiles=[group_profile_payload()])
    )

    group = Groups(endpoint).get("group-1234")

    assert group.id == "group-1234"
    assert group.profiles is not None
    assert group.profiles[0].profile_id == "profile-1234"


def test_get_missing_raises_not_found(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{GROUPS_URL}/nope").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        Groups(endpoint).get("nope")


def test_create_sends_name_and_permissions(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{GROUPS_URL}").respond(200, json=group_payload(profiles=[]))

    group = Groups(endpoint).create(GroupCreateParams(name="sales", permissions=["template:member:read"]))

    assert payloads.request_json(route) == {"name": "sales", "permissions": ["template:member:read"]}
    assert group.name == "sales"


def test_create_reserved_name_raises_api_error(endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{GROUPS_URL}").respond(400, json={"error": '"everyone" is a reserved name'})

    with pytest.raises(VerdocsAPIError):
        Groups(endpoint).create(GroupCreateParams(name="everyone", permissions=[]))


def test_update_sends_both_required_fields(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{GROUPS_URL}/group-1234").respond(
        200, json=group_payload(name="renamed", permissions=[])
    )

    group = Groups(endpoint).update("group-1234", GroupUpdateParams(name="renamed", permissions=[]))

    assert payloads.request_json(route) == {"name": "renamed", "permissions": []}
    assert group.name == "renamed"


def test_delete_returns_none(endpoint, respx_mock, base_url):
    route = respx_mock.delete(f"{base_url}{GROUPS_URL}/group-1234").respond(200, json={"status": "OK"})

    assert Groups(endpoint).delete("group-1234") is None
    assert route.called


def test_add_member_sends_profile_id_and_returns_none_for_empty_body(endpoint, payloads, respx_mock, base_url):
    # The deployed handler answers with an empty body (and creates nothing;
    # see the resource docstring), so None is the current wire truth.
    route = respx_mock.post(f"{base_url}{GROUPS_URL}/group-1234/members").respond(200)

    result = Groups(endpoint).add_member("group-1234", "profile-1234")

    assert payloads.request_json(route) == {"profile_id": "profile-1234"}
    assert result is None


def test_add_member_parses_membership_when_server_returns_one(endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{GROUPS_URL}/group-1234/members").respond(200, json=group_profile_payload())

    result = Groups(endpoint).add_member("group-1234", "profile-1234")

    assert isinstance(result, GroupProfile)
    assert result.group_id == "group-1234"


def test_delete_member_returns_none(endpoint, respx_mock, base_url):
    route = respx_mock.delete(f"{base_url}{GROUPS_URL}/group-1234/members/profile-1234").respond(
        200, json={"status": "OK"}
    )

    assert Groups(endpoint).delete_member("group-1234", "profile-1234") is None
    assert route.called


def test_delete_member_missing_raises_not_found(endpoint, respx_mock, base_url):
    respx_mock.delete(f"{base_url}{GROUPS_URL}/group-1234/members/nope").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        Groups(endpoint).delete_member("group-1234", "nope")


async def test_async_list_and_get(async_endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{GROUPS_URL}").respond(200, json=[group_payload()])
    respx_mock.get(f"{base_url}{GROUPS_URL}/group-1234").respond(
        200, json=group_payload(profiles=[group_profile_payload()])
    )

    groups = AsyncGroups(async_endpoint)
    listing = await groups.list()
    group = await groups.get("group-1234")

    assert listing[0].name == "sales"
    assert group.profiles is not None


async def test_async_create_update_delete_round_trip(async_endpoint, payloads, respx_mock, base_url):
    create_route = respx_mock.post(f"{base_url}{GROUPS_URL}").respond(200, json=group_payload())
    update_route = respx_mock.patch(f"{base_url}{GROUPS_URL}/group-1234").respond(
        200, json=group_payload(name="renamed")
    )
    delete_route = respx_mock.delete(f"{base_url}{GROUPS_URL}/group-1234").respond(200, json={"status": "OK"})

    groups = AsyncGroups(async_endpoint)
    created = await groups.create(GroupCreateParams(name="sales", permissions=[]))
    updated = await groups.update("group-1234", GroupUpdateParams(name="renamed", permissions=[]))
    deleted = await groups.delete("group-1234")

    assert payloads.request_json(create_route) == {"name": "sales", "permissions": []}
    assert payloads.request_json(update_route) == {"name": "renamed", "permissions": []}
    assert created.id == "group-1234"
    assert updated.name == "renamed"
    assert deleted is None
    assert delete_route.called


async def test_async_membership_round_trip(async_endpoint, payloads, respx_mock, base_url):
    add_route = respx_mock.post(f"{base_url}{GROUPS_URL}/group-1234/members").respond(200)
    delete_route = respx_mock.delete(f"{base_url}{GROUPS_URL}/group-1234/members/profile-1234").respond(
        200, json={"status": "OK"}
    )

    groups = AsyncGroups(async_endpoint)
    added = await groups.add_member("group-1234", "profile-1234")
    removed = await groups.delete_member("group-1234", "profile-1234")

    assert payloads.request_json(add_route) == {"profile_id": "profile-1234"}
    assert added is None
    assert removed is None
    assert delete_route.called
