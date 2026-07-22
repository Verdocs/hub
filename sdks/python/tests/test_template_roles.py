"""template_roles create/update/delete: happy and error paths, sync and async.

Resources are constructed directly (TemplateRoles(endpoint)) because the
endpoint properties are wired by the coordinator after this slice lands.
"""

from __future__ import annotations

from typing import Any

import pytest

from verdocs import NotFoundError, Role, VerdocsAPIError
from verdocs.models.templates import RoleCreateParams, RoleUpdateParams
from verdocs.resources.template_roles import AsyncTemplateRoles, TemplateRoles

ROLES_URL = "/v2/roles"


def role_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "template_id": "template-1234",
        "name": "Tenant 1",
        "type": "signer",
        "full_name": None,
        "first_name": None,
        "last_name": None,
        "email": None,
        "phone": None,
        "message": None,
        "sequence": 1,
        "order": 1,
        "delegator": False,
        "name_locked": False,
    }
    payload.update(overrides)
    return payload


@pytest.fixture
def roles(endpoint) -> TemplateRoles:
    return TemplateRoles(endpoint)


@pytest.fixture
def async_roles(async_endpoint) -> AsyncTemplateRoles:
    return AsyncTemplateRoles(async_endpoint)


def test_create_posts_only_set_fields(roles, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{ROLES_URL}/template-1234").respond(200, json=role_payload())

    role = roles.create("template-1234", RoleCreateParams(name="Tenant 1", type="signer"))

    assert payloads.request_json(route) == {"name": "Tenant 1", "type": "signer"}
    assert isinstance(role, Role)
    assert role.name == "Tenant 1"


def test_create_missing_template_raises_not_found(roles, respx_mock, base_url):
    respx_mock.post(f"{base_url}{ROLES_URL}/nope").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        roles.create("nope", RoleCreateParams(name="Tenant 1"))


def test_create_duplicate_name_raises_api_error(roles, respx_mock, base_url):
    respx_mock.post(f"{base_url}{ROLES_URL}/template-1234").respond(400, json={"error": "duplicate"})

    with pytest.raises(VerdocsAPIError) as excinfo:
        roles.create("template-1234", RoleCreateParams(name="Tenant 1"))

    assert excinfo.value.status_code == 400


def test_update_quotes_role_name_in_path(roles, payloads, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{ROLES_URL}/template-1234/Tenant%201").respond(
        200, json=role_payload(sequence=2)
    )

    role = roles.update("template-1234", "Tenant 1", RoleUpdateParams(sequence=2))

    # Role names may contain spaces, so they must be quoted into the path.
    assert route.calls.last.request.url.raw_path.endswith(b"/Tenant%201")
    assert payloads.request_json(route) == {"sequence": 2}
    assert role.sequence == 2


def test_update_missing_raises_not_found(roles, respx_mock, base_url):
    respx_mock.patch(f"{base_url}{ROLES_URL}/template-1234/nope").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        roles.update("template-1234", "nope", RoleUpdateParams(sequence=2))


def test_delete_returns_none(roles, respx_mock, base_url):
    # The server answers {"status": "OK"}, which nothing consumes.
    route = respx_mock.delete(f"{base_url}{ROLES_URL}/template-1234/Tenant%201").respond(200, json={"status": "OK"})

    assert roles.delete("template-1234", "Tenant 1") is None
    assert route.calls.last.request.url.raw_path.endswith(b"/Tenant%201")


def test_delete_missing_raises_not_found(roles, respx_mock, base_url):
    respx_mock.delete(f"{base_url}{ROLES_URL}/template-1234/nope").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        roles.delete("template-1234", "nope")


async def test_async_create_update_delete_round_trip(async_roles, payloads, respx_mock, base_url):
    create_route = respx_mock.post(f"{base_url}{ROLES_URL}/template-1234").respond(200, json=role_payload())
    update_route = respx_mock.patch(f"{base_url}{ROLES_URL}/template-1234/Tenant%201").respond(
        200, json=role_payload(name="Tenant A")
    )
    delete_route = respx_mock.delete(f"{base_url}{ROLES_URL}/template-1234/Tenant%20A").respond(
        200, json={"status": "OK"}
    )

    created = await async_roles.create("template-1234", RoleCreateParams(name="Tenant 1"))
    updated = await async_roles.update("template-1234", created.name, RoleUpdateParams(name="Tenant A"))
    deleted = await async_roles.delete("template-1234", updated.name)

    assert payloads.request_json(create_route) == {"name": "Tenant 1"}
    assert payloads.request_json(update_route) == {"name": "Tenant A"}
    assert deleted is None
    assert delete_route.called


async def test_async_update_missing_raises_not_found(async_roles, respx_mock, base_url):
    respx_mock.patch(f"{base_url}{ROLES_URL}/template-1234/nope").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        await async_roles.update("template-1234", "nope", RoleUpdateParams(sequence=2))
