"""template_fields create/update/delete: happy and error paths, sync and async.

Resources are constructed directly (TemplateFields(endpoint)) because the
endpoint properties are wired by the coordinator after this slice lands.
"""

from __future__ import annotations

from typing import Any

import pytest

from verdocs import DropdownOption, NotFoundError, TemplateField, VerdocsAPIError
from verdocs.models.templates import FieldCreateParams, FieldUpdateParams
from verdocs.resources.template_fields import AsyncTemplateFields, TemplateFields

FIELDS_URL = "/v2/fields"


def field_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "name": "tenant-signature-1",
        "role_name": "Tenant 1",
        "template_id": "template-1234",
        "document_id": "doc-1234",
        "type": "signature",
        "required": True,
        "readonly": False,
        "settings": None,
        "page": 0,
        "validator": None,
        "label": None,
        "x": 100,
        "y": 200,
        "width": 82,
        "height": 41,
        "default": None,
        "placeholder": None,
        "multiline": False,
        "group": None,
        "options": None,
        "value": None,
        "is_valid": True,
    }
    payload.update(overrides)
    return payload


@pytest.fixture
def fields(endpoint) -> TemplateFields:
    return TemplateFields(endpoint)


@pytest.fixture
def async_fields(async_endpoint) -> AsyncTemplateFields:
    return AsyncTemplateFields(async_endpoint)


def test_create_posts_only_set_fields(fields, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{FIELDS_URL}/template-1234").respond(200, json=field_payload())

    field = fields.create(
        "template-1234",
        FieldCreateParams(
            document_id="doc-1234",
            name="tenant-signature-1",
            role_name="Tenant 1",
            type="signature",
            page=0,
            x=100,
            y=200,
        ),
    )

    assert payloads.request_json(route) == {
        "document_id": "doc-1234",
        "name": "tenant-signature-1",
        "role_name": "Tenant 1",
        "type": "signature",
        "page": 0,
        "x": 100,
        "y": 200,
    }
    assert isinstance(field, TemplateField)
    assert field.type == "signature"


def test_create_serializes_dropdown_options(fields, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{FIELDS_URL}/template-1234").respond(
        200, json=field_payload(type="dropdown", name="pet-type")
    )

    fields.create(
        "template-1234",
        FieldCreateParams(
            document_id="doc-1234",
            name="pet-type",
            role_name="Tenant 1",
            type="dropdown",
            page=0,
            x=10,
            y=20,
            options=[DropdownOption(id="cat", label="Cat"), DropdownOption(id="dog", label="Dog")],
        ),
    )

    body = payloads.request_json(route)
    assert body["options"] == [{"id": "cat", "label": "Cat"}, {"id": "dog", "label": "Dog"}]


def test_create_invalid_document_raises_api_error(fields, respx_mock, base_url):
    respx_mock.post(f"{base_url}{FIELDS_URL}/template-1234").respond(400, json={"error": "Invalid document"})

    with pytest.raises(VerdocsAPIError) as excinfo:
        fields.create(
            "template-1234",
            FieldCreateParams(
                document_id="doc-nope", name="f1", role_name="Tenant 1", type="textbox", page=0, x=0, y=0
            ),
        )

    assert excinfo.value.status_code == 400


def test_create_missing_template_raises_not_found(fields, respx_mock, base_url):
    respx_mock.post(f"{base_url}{FIELDS_URL}/nope").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        fields.create(
            "nope",
            FieldCreateParams(
                document_id="doc-1234", name="f1", role_name="Tenant 1", type="textbox", page=0, x=0, y=0
            ),
        )


def test_update_quotes_field_name_in_path(fields, payloads, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{FIELDS_URL}/template-1234/tenant%20sig").respond(
        200, json=field_payload(name="tenant sig", x=150)
    )

    field = fields.update("template-1234", "tenant sig", FieldUpdateParams(x=150))

    # Field names may contain URL-hostile characters, so they must be quoted into the path.
    assert route.calls.last.request.url.raw_path.endswith(b"/tenant%20sig")
    assert payloads.request_json(route) == {"x": 150}
    assert field.x == 150


def test_update_missing_raises_not_found(fields, respx_mock, base_url):
    respx_mock.patch(f"{base_url}{FIELDS_URL}/template-1234/nope").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        fields.update("template-1234", "nope", FieldUpdateParams(x=1))


def test_delete_returns_none(fields, respx_mock, base_url):
    # The server answers {"status": "OK"}, which nothing consumes.
    route = respx_mock.delete(f"{base_url}{FIELDS_URL}/template-1234/tenant-signature-1").respond(
        200, json={"status": "OK"}
    )

    assert fields.delete("template-1234", "tenant-signature-1") is None
    assert route.called


def test_delete_missing_raises_not_found(fields, respx_mock, base_url):
    respx_mock.delete(f"{base_url}{FIELDS_URL}/template-1234/nope").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        fields.delete("template-1234", "nope")


async def test_async_create_update_delete_round_trip(async_fields, payloads, respx_mock, base_url):
    create_route = respx_mock.post(f"{base_url}{FIELDS_URL}/template-1234").respond(200, json=field_payload())
    update_route = respx_mock.patch(f"{base_url}{FIELDS_URL}/template-1234/tenant-signature-1").respond(
        200, json=field_payload(x=150)
    )
    delete_route = respx_mock.delete(f"{base_url}{FIELDS_URL}/template-1234/tenant-signature-1").respond(
        200, json={"status": "OK"}
    )

    created = await async_fields.create(
        "template-1234",
        FieldCreateParams(
            document_id="doc-1234",
            name="tenant-signature-1",
            role_name="Tenant 1",
            type="signature",
            page=0,
            x=100,
            y=200,
        ),
    )
    updated = await async_fields.update("template-1234", created.name, FieldUpdateParams(x=150))
    deleted = await async_fields.delete("template-1234", updated.name)

    assert payloads.request_json(create_route)["name"] == "tenant-signature-1"
    assert payloads.request_json(update_route) == {"x": 150}
    assert updated.x == 150
    assert deleted is None
    assert delete_route.called


async def test_async_update_missing_raises_not_found(async_fields, respx_mock, base_url):
    respx_mock.patch(f"{base_url}{FIELDS_URL}/template-1234/nope").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        await async_fields.update("template-1234", "nope", FieldUpdateParams(x=1))
