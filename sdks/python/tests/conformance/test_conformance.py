"""Live conformance checks driven by packages/conformance/fixtures.json.

Each case calls the endpoint twice, once with raw httpx and once with the
SDK, then compares status, shape, and data with volatile fields normalized,
the same contract as the TS lane. The wire models keep unknown server fields
(extra="allow"), so the SDK dump carries every key the raw body sent and the
two sides are diffed whole: a key the SDK drops or invents is a failure.
Timestamps compare as instants rather than renderings; see conftest.
"""

from __future__ import annotations

import uuid
from typing import Any

import httpx
import pytest

from verdocs import (
    EnvelopeListParams,
    PasswordGrantRequest,
    TemplateCreateParams,
    TemplateListParams,
    TemplateUpdateParams,
    VerdocsEndpoint,
)
from verdocs.errors import NotFoundError

pytestmark = pytest.mark.conformance


def session_organization_id(endpoint: VerdocsEndpoint) -> str:
    organization_id = getattr(endpoint.session, "organization_id", None)
    assert organization_id, "the authenticated session carries no organization_id claim"
    return organization_id


def resolve_path(path: str, endpoint: VerdocsEndpoint) -> str:
    """Fill the fixture $SESSION.organization_id placeholder from the live session's claims."""
    if "$SESSION.organization_id" not in path:
        return path
    return path.replace("$SESSION.organization_id", session_organization_id(endpoint))


def substitute_env(value: Any, env) -> Any:
    """Fill in $VERDOCS_* placeholders from fixtures.json request bodies."""
    mapping = {"$VERDOCS_TEST_EMAIL": env.email, "$VERDOCS_TEST_PASSWORD": env.password}
    if isinstance(value, dict):
        return {key: substitute_env(entry, env) for key, entry in value.items()}
    if isinstance(value, str) and value.startswith("$"):
        if value not in mapping:
            pytest.fail(f"No substitution for fixture placeholder {value}")
        return mapping[value]
    return value


def call_raw(client: httpx.Client, case: dict[str, Any], env, token: str | None, path: str) -> tuple[int, Any]:
    headers = {"Authorization": f"Bearer {token}"} if case.get("auth") else None
    body = substitute_env(case.get("body"), env) if case.get("body") is not None else None
    response = client.request(case["method"], path, params=case.get("query"), json=body, headers=headers)
    try:
        parsed: Any = response.json()
    except ValueError:
        parsed = response.text
    return response.status_code, parsed


def call_sdk(endpoint: VerdocsEndpoint, case: dict[str, Any], env) -> Any:
    # sdk_name is the case's @sdkOperation id (docs/sdk-docs-generation.md),
    # e.g. "envelope.getEnvelopes" -- not a bare js-sdk function name. It's
    # the same cross-language merge key the SDK reference docs use, so this
    # dispatch table and the js-sdk function the case mirrors always agree
    # on which operation is under test.
    sdk_name = case["sdk"]
    if sdk_name == "auth.authenticate":
        # A fresh endpoint proves authenticate needs no existing session.
        with VerdocsEndpoint(base_url=env.api_base) as fresh:
            return fresh.auth.authenticate(PasswordGrantRequest(username=env.email, password=env.password))
    if sdk_name == "auth.getMyUser":
        return endpoint.users.me()
    if sdk_name == "profile.getCurrentProfile":
        return endpoint.profiles.current()
    if sdk_name == "profile.getProfiles":
        return endpoint.profiles.list()
    if sdk_name == "notification.getNotifications":
        return endpoint.users.notifications()
    if sdk_name == "template.getTemplates":
        return endpoint.templates.list(TemplateListParams(**case.get("query", {})))
    if sdk_name == "envelope.getEnvelopes":
        return endpoint.envelopes.list(EnvelopeListParams(**case.get("query", {})))
    if sdk_name == "organization.getOrganization":
        return endpoint.organizations.get(session_organization_id(endpoint))
    if sdk_name == "member.getOrganizationMembers":
        return endpoint.members.list()
    if sdk_name == "group.getGroups":
        return endpoint.groups.list()
    if sdk_name == "organization.getEntitlements":
        return endpoint.organizations.get_entitlements()
    if sdk_name == "apiKey.getApiKeys":
        return endpoint.api_keys.list()
    if sdk_name == "brand.getBrands":
        return endpoint.brands.list(session_organization_id(endpoint))
    if sdk_name == "contact.getOrganizationContacts":
        return endpoint.contacts.list()
    if sdk_name == "invitation.getOrganizationInvitations":
        return endpoint.invitations.list()
    if sdk_name == "notification.getNotificationTemplates":
        return endpoint.notification_templates.list()
    if sdk_name == "webhook.getWebhooks":
        return endpoint.webhooks.get()
    if sdk_name == "organization.getOrganizationChildren":
        return endpoint.organizations.get_children(session_organization_id(endpoint))
    if sdk_name == "organization.getOrganizationPipelineSettings":
        return endpoint.organizations.get_pipeline_settings(session_organization_id(endpoint))
    if sdk_name == "organization.getOrganizationUsage":
        return endpoint.organizations.get_usage(session_organization_id(endpoint))
    pytest.fail(f"Conformance case '{case['id']}' has no SDK mapping; add one when the SDK grows the operation.")


def test_case_matches_raw_http(case, conformance_env, sdk_endpoint, raw_client, normalize, sdk_dump):
    path = resolve_path(case["path"], sdk_endpoint)
    raw_status, raw_body = call_raw(raw_client, case, conformance_env, sdk_endpoint.token, path)
    assert raw_status == 200

    result = call_sdk(sdk_endpoint, case, conformance_env)
    assert result is not None

    reference: Any = raw_body
    if case["id"] == "profiles-current":
        # The raw response is an array; the SDK returns the entry with
        # current=true, so that entry is the comparison target (per the
        # fixture note).
        reference = next((entry for entry in raw_body if entry.get("current")), None)
        assert reference is not None, "no profile in the raw response is marked current"

    assert normalize(sdk_dump(result)) == normalize(reference)


# The three checks below share test_case_matches_raw_http's shape (list, pick the first entry,
# fetch its detail both ways) but none is a fixtures.json case: each depends on an id only a
# prior list call can produce. A test account with none of a given resource skips rather than
# fails, the same convention the TS lane's group/brand/notification template detail checks use.


def test_group_detail_matches_raw_http(sdk_endpoint, raw_client, normalize, sdk_dump):
    groups = sdk_endpoint.groups.list()
    if not groups:
        pytest.skip("No groups on the test account; group detail check skipped.")

    group = groups[0]
    response = raw_client.get(
        f"/v2/organization-groups/{group.id}", headers={"Authorization": f"Bearer {sdk_endpoint.token}"}
    )
    assert response.status_code == 200

    fetched = sdk_endpoint.groups.get(group.id)
    assert normalize(sdk_dump(fetched)) == normalize(response.json())


def test_brand_detail_matches_raw_http(sdk_endpoint, raw_client, normalize, sdk_dump):
    organization_id = session_organization_id(sdk_endpoint)
    brands = sdk_endpoint.brands.list(organization_id)
    if not brands:
        pytest.skip("No brands on the test account; brand detail check skipped.")

    brand = brands[0]
    response = raw_client.get(
        f"/v2/organizations/{organization_id}/brands/{brand.id}",
        headers={"Authorization": f"Bearer {sdk_endpoint.token}"},
    )
    assert response.status_code == 200

    fetched = sdk_endpoint.brands.get(organization_id, brand.id)
    assert normalize(sdk_dump(fetched)) == normalize(response.json())


def test_notification_template_detail_matches_raw_http(sdk_endpoint, raw_client, normalize, sdk_dump):
    templates = sdk_endpoint.notification_templates.list()
    if not templates:
        pytest.skip("No notification templates on the test account; detail check skipped.")

    template = templates[0]
    response = raw_client.get(
        f"/v2/notifications/templates/{template.id}", headers={"Authorization": f"Bearer {sdk_endpoint.token}"}
    )
    assert response.status_code == 200

    fetched = sdk_endpoint.notification_templates.get(template.id)
    assert normalize(sdk_dump(fetched)) == normalize(response.json())


def test_template_lifecycle_round_trip(sdk_endpoint):
    """Create, read, update, and delete one template on beta.

    Not a fixtures.json case (those are read-only); this is the
    create-then-delete smoke the beta etiquette allows so the write
    operations get live coverage too. One template, always cleaned up.
    """
    name = f"python-sdk-conformance-{uuid.uuid4().hex[:8]}"

    created = sdk_endpoint.templates.create(TemplateCreateParams(name=name))
    try:
        assert created.name == name

        fetched = sdk_endpoint.templates.get(created.id)
        assert fetched.id == created.id
        assert fetched.name == name

        updated = sdk_endpoint.templates.update(
            created.id, TemplateUpdateParams(description="python sdk conformance check")
        )
        assert updated.description == "python sdk conformance check"
    finally:
        sdk_endpoint.templates.delete(created.id)

    with pytest.raises(NotFoundError):
        sdk_endpoint.templates.get(created.id)
