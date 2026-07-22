"""notification_templates resource: list/get/create/update/delete, sync and async.

Resources are constructed directly (NotificationTemplates(endpoint)) because
endpoint wiring for the Organizations namespaces belongs to the coordinator.
"""

from __future__ import annotations

from typing import Any

import pytest

from verdocs import NotFoundError, NotificationTemplate, VerdocsAPIError
from verdocs.models.organizations import NotificationTemplateCreateParams, NotificationTemplateUpdateParams
from verdocs.resources.notification_templates import AsyncNotificationTemplates, NotificationTemplates

NOTIFICATION_TEMPLATES_URL = "/v2/notifications/templates"


def notification_template_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": "nt-1234",
        "organization_id": "org-1234",
        "type": "email",
        "event_name": "recipient:invited",
        "template_id": None,
        "html_template": "<p>{{recipient_first_name}}, you have a document to sign.</p>",
        "text_template": None,
    }
    payload.update(overrides)
    return payload


def test_list_returns_templates_without_bodies(endpoint, respx_mock, base_url):
    # The list endpoint omits the template bodies entirely.
    entry = notification_template_payload()
    del entry["html_template"]
    del entry["text_template"]
    respx_mock.get(f"{base_url}{NOTIFICATION_TEMPLATES_URL}").respond(200, json=[entry])

    templates = NotificationTemplates(endpoint).list()

    assert len(templates) == 1
    assert isinstance(templates[0], NotificationTemplate)
    assert templates[0].event_name == "recipient:invited"
    assert templates[0].html_template is None


def test_get_returns_template_with_content(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{NOTIFICATION_TEMPLATES_URL}/nt-1234").respond(200, json=notification_template_payload())

    template = NotificationTemplates(endpoint).get("nt-1234")

    assert template.id == "nt-1234"
    assert template.html_template is not None


def test_get_missing_raises_not_found(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{NOTIFICATION_TEMPLATES_URL}/nope").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        NotificationTemplates(endpoint).get("nope")


def test_create_sends_only_set_fields(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{NOTIFICATION_TEMPLATES_URL}").respond(
        200, json=notification_template_payload()
    )

    template = NotificationTemplates(endpoint).create(
        NotificationTemplateCreateParams(
            type="email",
            event_name="recipient:invited",
            html_template="<p>{{recipient_first_name}}, you have a document to sign.</p>",
        )
    )

    assert payloads.request_json(route) == {
        "type": "email",
        "event_name": "recipient:invited",
        "html_template": "<p>{{recipient_first_name}}, you have a document to sign.</p>",
    }
    assert template.type == "email"


def test_create_keeps_advisory_extras(endpoint, respx_mock, base_url):
    # The create/update responses may carry warnings and html_quality_score;
    # extra=allow keeps them reachable on the model.
    respx_mock.post(f"{base_url}{NOTIFICATION_TEMPLATES_URL}").respond(
        200,
        json={
            **notification_template_payload(),
            "warnings": ["html_template is missing recommended variables: sender_name"],
            "html_quality_score": 80,
        },
    )

    template = NotificationTemplates(endpoint).create(
        NotificationTemplateCreateParams(type="email", event_name="recipient:invited", html_template="<p>x</p>")
    )

    assert template.model_extra is not None
    assert template.model_extra["html_quality_score"] == 80
    assert len(template.model_extra["warnings"]) == 1


def test_create_missing_variables_raises_api_error(endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{NOTIFICATION_TEMPLATES_URL}").respond(
        400, json={"error": "html_template is missing required variables"}
    )

    with pytest.raises(VerdocsAPIError) as excinfo:
        NotificationTemplates(endpoint).create(
            NotificationTemplateCreateParams(type="email", event_name="recipient:invited", html_template="<p>x</p>")
        )

    assert excinfo.value.status_code == 400


def test_update_sends_only_set_fields(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{NOTIFICATION_TEMPLATES_URL}/nt-1234").respond(
        200, json=notification_template_payload(text_template="Plain text.")
    )

    template = NotificationTemplates(endpoint).update(
        "nt-1234", NotificationTemplateUpdateParams(text_template="Plain text.")
    )

    assert payloads.request_json(route) == {"text_template": "Plain text."}
    assert template.text_template == "Plain text."


def test_delete_returns_none(endpoint, respx_mock, base_url):
    route = respx_mock.delete(f"{base_url}{NOTIFICATION_TEMPLATES_URL}/nt-1234").respond(200, json={"status": "OK"})

    assert NotificationTemplates(endpoint).delete("nt-1234") is None
    assert route.called


async def test_async_list_and_get(async_endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{NOTIFICATION_TEMPLATES_URL}").respond(200, json=[notification_template_payload()])
    respx_mock.get(f"{base_url}{NOTIFICATION_TEMPLATES_URL}/nt-1234").respond(200, json=notification_template_payload())

    notification_templates = AsyncNotificationTemplates(async_endpoint)
    listing = await notification_templates.list()
    template = await notification_templates.get("nt-1234")

    assert listing[0].id == "nt-1234"
    assert template.event_name == "recipient:invited"


async def test_async_create_update_delete_round_trip(async_endpoint, payloads, respx_mock, base_url):
    create_route = respx_mock.post(f"{base_url}{NOTIFICATION_TEMPLATES_URL}").respond(
        200, json=notification_template_payload()
    )
    update_route = respx_mock.patch(f"{base_url}{NOTIFICATION_TEMPLATES_URL}/nt-1234").respond(
        200, json=notification_template_payload(html_template="<p>Updated.</p>")
    )
    delete_route = respx_mock.delete(f"{base_url}{NOTIFICATION_TEMPLATES_URL}/nt-1234").respond(
        200, json={"status": "OK"}
    )

    notification_templates = AsyncNotificationTemplates(async_endpoint)
    created = await notification_templates.create(
        NotificationTemplateCreateParams(type="email", event_name="recipient:invited", html_template="<p>x</p>")
    )
    updated = await notification_templates.update(
        "nt-1234", NotificationTemplateUpdateParams(html_template="<p>Updated.</p>")
    )
    deleted = await notification_templates.delete("nt-1234")

    assert payloads.request_json(create_route)["type"] == "email"
    assert payloads.request_json(update_route) == {"html_template": "<p>Updated.</p>"}
    assert created.id == "nt-1234"
    assert updated.html_template == "<p>Updated.</p>"
    assert deleted is None
    assert delete_route.called
