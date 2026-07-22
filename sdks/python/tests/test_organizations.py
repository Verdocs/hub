"""organizations resource: CRUD, pipeline settings, uploads, and entitlements, sync and async.

Resources are constructed directly (Organizations(endpoint)) because endpoint
wiring for the Organizations namespaces belongs to the coordinator.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import pytest

from verdocs import (
    AuthenticateResponse,
    Entitlement,
    NotFoundError,
    Organization,
    PipelineSettings,
    VerdocsAPIError,
    VerdocsError,
)
from verdocs.models.organizations import (
    OrganizationCreateParams,
    OrganizationCreateResponse,
    OrganizationUpdateParams,
    PipelineSettingsUpdateParams,
)
from verdocs.resources.organizations import AsyncOrganizations, Organizations

ORGANIZATIONS_URL = "/v2/organizations"


def organization_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": "org-1234",
        "name": "Test Org",
        "contact_email": "org@example.com",
        "parent_id": None,
        "full_logo_url": None,
        "thumbnail_url": None,
        "deletion_protected": True,
        "created_at": "2026-01-01T00:00:00.000Z",
        "updated_at": "2026-01-02T00:00:00.000Z",
    }
    payload.update(overrides)
    return payload


def entitlement_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": "ent-1",
        "organization_id": "org-1234",
        "feature": "kba_auth",
        "contract_id": None,
        "notes": None,
        "starts_at": "2026-01-01T00:00:00.000Z",
        "ends_at": "2026-12-31T00:00:00.000Z",
        "monthly_max": 100,
        "yearly_max": 1200,
        "created_at": "2026-01-01T00:00:00.000Z",
    }
    payload.update(overrides)
    return payload


def pipeline_settings_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "process_acroforms": False,
        "process_tags": True,
        "ignore_invalid_roles": False,
        "ignore_invalid_fields": False,
        "redaction_v2": False,
    }
    payload.update(overrides)
    return payload


def _iso(moment: datetime) -> str:
    return moment.strftime("%Y-%m-%dT%H:%M:%S.000Z")


def test_get_returns_organization(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{ORGANIZATIONS_URL}/org-1234").respond(200, json=organization_payload())

    organization = Organizations(endpoint).get("org-1234")

    assert isinstance(organization, Organization)
    assert organization.id == "org-1234"
    assert organization.deletion_protected is True


def test_get_missing_raises_not_found(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{ORGANIZATIONS_URL}/nope").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        Organizations(endpoint).get("nope")


def test_get_children_returns_list(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{ORGANIZATIONS_URL}/org-1234/children").respond(
        200, json=[organization_payload(id="org-child", parent_id="org-1234")]
    )

    children = Organizations(endpoint).get_children("org-1234")

    assert len(children) == 1
    assert isinstance(children[0], Organization)
    assert children[0].parent_id == "org-1234"


def test_get_usage_sends_only_set_query_params(endpoint, respx_mock, base_url):
    route = respx_mock.get(f"{base_url}{ORGANIZATIONS_URL}/org-1234/usage").respond(
        200, json={"org-1234": {"envelope": 5, "sms_invite": 2}}
    )

    usage = Organizations(endpoint).get_usage("org-1234", start_date="2026-01-01T00:00:00Z", usage_type="envelope")

    params = route.calls.last.request.url.params
    assert params["start_date"] == "2026-01-01T00:00:00Z"
    assert params["usage_type"] == "envelope"
    assert "end_date" not in params
    assert usage["org-1234"]["envelope"] == 5


def test_get_usage_without_params_sends_no_query(endpoint, respx_mock, base_url):
    route = respx_mock.get(f"{base_url}{ORGANIZATIONS_URL}/org-1234/usage").respond(200, json={})

    Organizations(endpoint).get_usage("org-1234")

    assert str(route.calls.last.request.url.query, "ascii") == ""


def test_create_top_level_returns_tokens_profile_and_organization(endpoint, payloads, respx_mock, base_url):
    response_json = {**payloads.auth(), "profile": payloads.profile(), "organization": organization_payload()}
    route = respx_mock.post(f"{base_url}{ORGANIZATIONS_URL}").respond(200, json=response_json)

    result = Organizations(endpoint).create(OrganizationCreateParams(name="NewOrg"))

    assert payloads.request_json(route) == {"name": "NewOrg"}
    assert isinstance(result, OrganizationCreateResponse)
    assert result.organization.id == "org-1234"
    assert result.profile.id == "profile-1234"
    assert result.access_token


def test_create_child_returns_organization_with_api_key(endpoint, payloads, respx_mock, base_url):
    response_json = organization_payload(
        id="org-5678",
        parent_id="org-1234",
        api_key={"client_id": "ck-1", "client_secret": "cs-1", "name": "Default"},
    )
    route = respx_mock.post(f"{base_url}{ORGANIZATIONS_URL}").respond(200, json=response_json)

    result = Organizations(endpoint).create(OrganizationCreateParams(name="Child", parent_id="org-1234"))

    assert payloads.request_json(route) == {"name": "Child", "parent_id": "org-1234"}
    assert isinstance(result, Organization)
    assert result.api_key is not None
    assert result.api_key.client_secret == "cs-1"


def test_update_sends_only_set_fields(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{ORGANIZATIONS_URL}/org-1234").respond(
        200, json=organization_payload(name="Renamed")
    )

    organization = Organizations(endpoint).update("org-1234", OrganizationUpdateParams(name="Renamed"))

    assert organization.name == "Renamed"
    assert payloads.request_json(route) == {"name": "Renamed"}


def test_update_sends_explicit_null_to_clear_nullable_field(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{ORGANIZATIONS_URL}/org-1234").respond(200, json=organization_payload())

    Organizations(endpoint).update("org-1234", OrganizationUpdateParams(disclaimer=None))

    # An explicit None must reach the wire; null is how nullish fields clear.
    assert payloads.request_json(route) == {"disclaimer": None}


def test_update_server_rejection_raises_api_error(endpoint, respx_mock, base_url):
    respx_mock.patch(f"{base_url}{ORGANIZATIONS_URL}/org-1234").respond(400, json={"error": "unknown key"})

    with pytest.raises(VerdocsAPIError) as excinfo:
        Organizations(endpoint).update("org-1234", OrganizationUpdateParams(name="x"))

    assert excinfo.value.status_code == 400


def test_get_pipeline_settings_returns_model(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{ORGANIZATIONS_URL}/org-1234/pipeline-settings").respond(
        200, json=pipeline_settings_payload()
    )

    settings = Organizations(endpoint).get_pipeline_settings("org-1234")

    assert isinstance(settings, PipelineSettings)
    assert settings.process_tags is True
    assert settings.process_acroforms is False


def test_update_pipeline_settings_sends_only_set_flags(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{ORGANIZATIONS_URL}/org-1234/pipeline-settings").respond(
        200, json=pipeline_settings_payload(process_acroforms=True)
    )

    settings = Organizations(endpoint).update_pipeline_settings(
        "org-1234", PipelineSettingsUpdateParams(process_acroforms=True)
    )

    assert payloads.request_json(route) == {"process_acroforms": True}
    assert settings.process_acroforms is True


def test_delete_returns_tokens_for_next_profile(endpoint, payloads, respx_mock, base_url):
    respx_mock.delete(f"{base_url}{ORGANIZATIONS_URL}/org-1234").respond(200, json=payloads.auth())

    result = Organizations(endpoint).delete("org-1234")

    assert isinstance(result, AuthenticateResponse)


def test_delete_last_organization_returns_none(endpoint, respx_mock, base_url):
    # A 204 with an empty body means the caller has no remaining profiles.
    route = respx_mock.delete(f"{base_url}{ORGANIZATIONS_URL}/org-1234").respond(204)

    assert Organizations(endpoint).delete("org-1234") is None
    assert route.called


def test_update_logo_sends_multipart_logo_part(endpoint, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{ORGANIZATIONS_URL}/org-1234").respond(
        200, json=organization_payload(full_logo_url="https://cdn.test/logo.png")
    )

    organization = Organizations(endpoint).update_logo("org-1234", ("logo.png", b"PNGDATA", "image/png"))

    request = route.calls.last.request
    body = request.read()
    assert request.headers["content-type"].startswith("multipart/form-data; boundary=")
    assert b'name="logo"' in body
    assert b'filename="logo.png"' in body
    assert b"Content-Type: image/png" in body
    assert b"PNGDATA" in body
    # The js-sdk extends the timeout to 120s for these uploads; we mirror it.
    assert request.extensions["timeout"]["read"] == 120.0
    assert organization.full_logo_url == "https://cdn.test/logo.png"


def test_update_logo_accepts_filesystem_path(endpoint, respx_mock, base_url, tmp_path):
    logo_file = tmp_path / "acme-logo.png"
    logo_file.write_bytes(b"PNGFROMDISK")
    route = respx_mock.patch(f"{base_url}{ORGANIZATIONS_URL}/org-1234").respond(200, json=organization_payload())

    Organizations(endpoint).update_logo("org-1234", logo_file)

    body = route.calls.last.request.read()
    assert b'name="logo"' in body
    assert b'filename="acme-logo.png"' in body
    assert b"PNGFROMDISK" in body


def test_update_thumbnail_sends_multipart_thumbnail_part(endpoint, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{ORGANIZATIONS_URL}/org-1234").respond(200, json=organization_payload())

    Organizations(endpoint).update_thumbnail("org-1234", ("thumb.png", b"THUMBDATA"))

    request = route.calls.last.request
    body = request.read()
    assert request.headers["content-type"].startswith("multipart/form-data; boundary=")
    assert b'name="thumbnail"' in body
    assert b'filename="thumb.png"' in body
    assert b"THUMBDATA" in body


def test_get_entitlements_returns_list(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{ORGANIZATIONS_URL}/entitlements").respond(200, json=[entitlement_payload()])

    entitlements = Organizations(endpoint).get_entitlements()

    assert len(entitlements) == 1
    assert isinstance(entitlements[0], Entitlement)
    assert entitlements[0].feature == "kba_auth"


def test_get_active_entitlements_collapses_to_current_features(endpoint, token_factory, respx_mock, base_url):
    endpoint.set_token(token_factory())
    now = datetime.now(timezone.utc)
    active = entitlement_payload(
        id="ent-active",
        feature="sms_auth",
        starts_at=_iso(now - timedelta(days=1)),
        ends_at=_iso(now + timedelta(days=1)),
    )
    duplicate = entitlement_payload(
        id="ent-dupe",
        feature="sms_auth",
        starts_at=_iso(now - timedelta(days=2)),
        ends_at=_iso(now + timedelta(days=2)),
    )
    expired = entitlement_payload(
        id="ent-old", feature="kba_auth", starts_at=_iso(now - timedelta(days=9)), ends_at=_iso(now - timedelta(days=2))
    )
    future = entitlement_payload(
        id="ent-new", feature="id_auth", starts_at=_iso(now + timedelta(days=2)), ends_at=_iso(now + timedelta(days=9))
    )
    respx_mock.get(f"{base_url}{ORGANIZATIONS_URL}/entitlements").respond(
        200, json=[active, duplicate, expired, future]
    )

    collapsed = Organizations(endpoint).get_active_entitlements()

    # Only the in-window feature survives, and the first record wins the key.
    assert set(collapsed) == {"sms_auth"}
    assert collapsed["sms_auth"].id == "ent-active"


def test_get_active_entitlements_without_session_raises(endpoint):
    with pytest.raises(VerdocsError, match="No active session"):
        Organizations(endpoint).get_active_entitlements()


async def test_async_get_and_children(async_endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{ORGANIZATIONS_URL}/org-1234").respond(200, json=organization_payload())
    respx_mock.get(f"{base_url}{ORGANIZATIONS_URL}/org-1234/children").respond(
        200, json=[organization_payload(id="org-child")]
    )

    organizations = AsyncOrganizations(async_endpoint)
    organization = await organizations.get("org-1234")
    children = await organizations.get_children("org-1234")

    assert organization.id == "org-1234"
    assert children[0].id == "org-child"


async def test_async_get_usage(async_endpoint, respx_mock, base_url):
    route = respx_mock.get(f"{base_url}{ORGANIZATIONS_URL}/org-1234/usage").respond(
        200, json={"org-1234": {"template": 3}}
    )

    usage = await AsyncOrganizations(async_endpoint).get_usage("org-1234", usage_type="template")

    assert route.calls.last.request.url.params["usage_type"] == "template"
    assert usage == {"org-1234": {"template": 3}}


async def test_async_create_update_delete_round_trip(async_endpoint, payloads, respx_mock, base_url):
    create_route = respx_mock.post(f"{base_url}{ORGANIZATIONS_URL}").respond(
        200, json={**payloads.auth(), "profile": payloads.profile(), "organization": organization_payload()}
    )
    update_route = respx_mock.patch(f"{base_url}{ORGANIZATIONS_URL}/org-1234").respond(
        200, json=organization_payload(name="Renamed")
    )
    delete_route = respx_mock.delete(f"{base_url}{ORGANIZATIONS_URL}/org-1234").respond(204)

    organizations = AsyncOrganizations(async_endpoint)
    created = await organizations.create(OrganizationCreateParams(name="NewOrg"))
    updated = await organizations.update("org-1234", OrganizationUpdateParams(name="Renamed"))
    deleted = await organizations.delete("org-1234")

    assert payloads.request_json(create_route) == {"name": "NewOrg"}
    assert payloads.request_json(update_route) == {"name": "Renamed"}
    assert isinstance(created, OrganizationCreateResponse)
    assert updated.name == "Renamed"
    assert deleted is None
    assert delete_route.called


async def test_async_pipeline_settings_round_trip(async_endpoint, payloads, respx_mock, base_url):
    respx_mock.get(f"{base_url}{ORGANIZATIONS_URL}/org-1234/pipeline-settings").respond(
        200, json=pipeline_settings_payload()
    )
    patch_route = respx_mock.patch(f"{base_url}{ORGANIZATIONS_URL}/org-1234/pipeline-settings").respond(
        200, json=pipeline_settings_payload(ignore_invalid_roles=True)
    )

    organizations = AsyncOrganizations(async_endpoint)
    settings = await organizations.get_pipeline_settings("org-1234")
    updated = await organizations.update_pipeline_settings(
        "org-1234", PipelineSettingsUpdateParams(ignore_invalid_roles=True)
    )

    assert settings.process_tags is True
    assert payloads.request_json(patch_route) == {"ignore_invalid_roles": True}
    assert updated.ignore_invalid_roles is True


async def test_async_update_logo_and_thumbnail_send_multipart(async_endpoint, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{ORGANIZATIONS_URL}/org-1234").respond(200, json=organization_payload())

    organizations = AsyncOrganizations(async_endpoint)
    await organizations.update_logo("org-1234", ("logo.png", b"PNGDATA"))
    logo_body = route.calls.last.request.read()
    await organizations.update_thumbnail("org-1234", ("thumb.png", b"THUMBDATA"))
    thumbnail_body = route.calls.last.request.read()

    assert b'name="logo"' in logo_body
    assert b'name="thumbnail"' in thumbnail_body


async def test_async_entitlements(async_endpoint, token_factory, respx_mock, base_url):
    now = datetime.now(timezone.utc)
    respx_mock.get(f"{base_url}{ORGANIZATIONS_URL}/entitlements").respond(
        200,
        json=[
            entitlement_payload(
                feature="sms_auth", starts_at=_iso(now - timedelta(days=1)), ends_at=_iso(now + timedelta(days=1))
            )
        ],
    )

    organizations = AsyncOrganizations(async_endpoint)
    entitlements = await organizations.get_entitlements()
    async_endpoint.set_token(token_factory())
    active = await organizations.get_active_entitlements()

    assert entitlements[0].feature == "sms_auth"
    assert "sms_auth" in active
