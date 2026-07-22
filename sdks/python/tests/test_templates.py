"""templates list/get/create/update/delete plus the true-up additions
(multipart create, duplicate, sharepoint, star): happy and error paths, sync and async."""

from __future__ import annotations

import httpx
import pytest

from verdocs import (
    NotFoundError,
    RateLimitError,
    Template,
    TemplateCreateParams,
    TemplateList,
    TemplateListParams,
    TemplateUpdateParams,
    VerdocsAPIError,
    VerdocsConnectionError,
)
from verdocs.models.templates import (
    DocumentFromData,
    DocumentFromUri,
    RoleCreateParams,
    TemplateCreateFromSharepointParams,
)

TEMPLATES_URL = "/v2/templates"

DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def test_list_returns_page(endpoint, payloads, respx_mock, base_url):
    respx_mock.get(f"{base_url}{TEMPLATES_URL}").respond(200, json=payloads.template_list())

    page = endpoint.templates.list()

    assert isinstance(page, TemplateList)
    assert page.count == 1
    assert page.templates[0].name == "Test Template"


def test_list_sends_only_set_params(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.get(f"{base_url}{TEMPLATES_URL}").respond(200, json=payloads.template_list())

    endpoint.templates.list(TemplateListParams(visibility="private_shared", rows=10, page=0))

    params = route.calls.last.request.url.params
    assert params["visibility"] == "private_shared"
    assert params["rows"] == "10"
    assert params["page"] == "0"
    assert "q" not in params
    assert "is_starred" not in params


def test_list_without_params_sends_no_query(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.get(f"{base_url}{TEMPLATES_URL}").respond(200, json=payloads.template_list())

    endpoint.templates.list()

    assert str(route.calls.last.request.url.query, "ascii") == ""


def test_list_rate_limited_raises(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{TEMPLATES_URL}").respond(429, json={"error": "slow down"})

    with pytest.raises(RateLimitError):
        endpoint.templates.list()


def test_get_returns_template(endpoint, payloads, respx_mock, base_url):
    respx_mock.get(f"{base_url}{TEMPLATES_URL}/template-1234").respond(200, json=payloads.template())

    template = endpoint.templates.get("template-1234")

    assert isinstance(template, Template)
    assert template.id == "template-1234"
    assert template.sender == "envelope_creator"


def test_get_missing_raises_not_found(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{TEMPLATES_URL}/nope").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError) as excinfo:
        endpoint.templates.get("nope")

    assert excinfo.value.status_code == 404


def test_create_sends_only_set_fields(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{TEMPLATES_URL}").respond(200, json=payloads.template(name="NDA"))

    template = endpoint.templates.create(TemplateCreateParams(name="NDA"))

    assert template.name == "NDA"
    assert payloads.request_json(route) == {"name": "NDA"}


def test_create_sends_explicit_null_to_disable_reminders(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{TEMPLATES_URL}").respond(200, json=payloads.template())

    endpoint.templates.create(TemplateCreateParams(name="NDA", initial_reminder=None))

    # An explicit None must reach the wire; null is how reminders get disabled.
    assert payloads.request_json(route) == {"name": "NDA", "initial_reminder": None}


def test_create_json_sends_inline_documents_and_roles(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{TEMPLATES_URL}").respond(200, json=payloads.template())

    endpoint.templates.create(
        TemplateCreateParams(
            name="Lease",
            documents=[
                DocumentFromUri(uri="https://cdn.example/lease.pdf?token=abc", name="lease.pdf"),
                DocumentFromData(data="JVBERi0xLjQ=", name="rider.pdf"),
            ],
            roles=[RoleCreateParams(name="Tenant 1", type="signer", sequence=1)],
        )
    )

    body = payloads.request_json(route)
    assert body["documents"] == [
        {"uri": "https://cdn.example/lease.pdf?token=abc", "name": "lease.pdf"},
        {"data": "JVBERi0xLjQ=", "name": "rider.pdf"},
    ]
    assert body["roles"] == [{"name": "Tenant 1", "type": "signer", "sequence": 1}]


def test_create_server_rejection_raises_api_error(endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{TEMPLATES_URL}").respond(400, json={"error": "name is required"})

    with pytest.raises(VerdocsAPIError) as excinfo:
        endpoint.templates.create(TemplateCreateParams(name=""))

    assert excinfo.value.status_code == 400
    assert not isinstance(excinfo.value, NotFoundError)


def test_create_multipart_sends_file_parts_and_string_fields(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{TEMPLATES_URL}").respond(200, json=payloads.template(name="NDA"))

    template = endpoint.templates.create(
        TemplateCreateParams(name="NDA", visibility="shared"),
        files=[("nda.pdf", b"%PDF-1.4 fake", "application/pdf")],
    )

    request = route.calls.last.request
    assert request.headers["content-type"].startswith("multipart/form-data")
    body = request.content
    assert b'name="documents"; filename="nda.pdf"' in body
    assert b"Content-Type: application/pdf" in body
    assert b'name="name"' in body
    assert b'name="visibility"' in body
    assert b"shared" in body
    assert template.name == "NDA"


def test_create_multipart_repeats_documents_part_per_file(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{TEMPLATES_URL}").respond(200, json=payloads.template())

    endpoint.templates.create(
        TemplateCreateParams(name="NDA"),
        files=[("a.pdf", b"%PDF-1.4 a"), ("b.pdf", b"%PDF-1.4 b")],
    )

    # Every file rides under the one repeatable part name the handler reads.
    assert route.calls.last.request.content.count(b'name="documents"') == 2


def test_create_multipart_reads_paths_and_pins_mimes(endpoint, payloads, respx_mock, base_url, tmp_path):
    route = respx_mock.post(f"{base_url}{TEMPLATES_URL}").respond(200, json=payloads.template())
    pdf = tmp_path / "lease.pdf"
    pdf.write_bytes(b"%PDF-1.4 lease")
    docx = tmp_path / "rider.docx"
    docx.write_bytes(b"PK docx bytes")

    endpoint.templates.create(TemplateCreateParams(name="Lease"), files=[pdf, str(docx)])

    body = route.calls.last.request.content
    assert b'filename="lease.pdf"' in body
    assert b"%PDF-1.4 lease" in body
    assert b'filename="rider.docx"' in body
    # The server judges uploads by declared part content type, so the DOCX
    # mime must be pinned even where the platform mimetypes table lacks it.
    assert f"Content-Type: {DOCX_MIME}".encode() in body


def test_create_multipart_bare_bytes_are_assumed_pdf(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{TEMPLATES_URL}").respond(200, json=payloads.template())

    endpoint.templates.create(TemplateCreateParams(name="NDA"), files=[b"%PDF-1.4 raw"])

    body = route.calls.last.request.content
    assert b'name="documents"; filename="document.pdf"' in body
    assert b"Content-Type: application/pdf" in body


def test_create_multipart_rejects_fields_that_cannot_ride(endpoint):
    with pytest.raises(ValueError) as excinfo:
        endpoint.templates.create(
            TemplateCreateParams(name="NDA", initial_reminder=86400000),
            files=[b"%PDF-1.4 raw"],
        )

    assert "initial_reminder" in str(excinfo.value)


def test_create_multipart_rejects_inline_roles(endpoint):
    with pytest.raises(ValueError) as excinfo:
        endpoint.templates.create(
            TemplateCreateParams(name="NDA", roles=[RoleCreateParams(name="Tenant 1")]),
            files=[b"%PDF-1.4 raw"],
        )

    assert "roles" in str(excinfo.value)


def test_create_multipart_server_rejection_raises_api_error(endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{TEMPLATES_URL}").respond(400, json={"error": "unsupported type"})

    with pytest.raises(VerdocsAPIError) as excinfo:
        endpoint.templates.create(TemplateCreateParams(name="NDA"), files=[b"%PDF-1.4 raw"])

    assert excinfo.value.status_code == 400


def test_create_multipart_transport_failure_raises_connection_error(endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{TEMPLATES_URL}").mock(side_effect=httpx.ConnectError("boom"))

    with pytest.raises(VerdocsConnectionError):
        endpoint.templates.create(TemplateCreateParams(name="NDA"), files=[b"%PDF-1.4 raw"])


def test_duplicate_puts_action_and_name(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.put(f"{base_url}{TEMPLATES_URL}/template-1234").respond(
        200, json=payloads.template(id="template-5678", name="NDA Copy")
    )

    template = endpoint.templates.duplicate("template-1234", "NDA Copy")

    assert payloads.request_json(route) == {"action": "duplicate", "name": "NDA Copy"}
    assert template.id == "template-5678"


def test_duplicate_missing_raises_not_found(endpoint, respx_mock, base_url):
    respx_mock.put(f"{base_url}{TEMPLATES_URL}/nope").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        endpoint.templates.duplicate("nope", "Copy")


def test_create_from_sharepoint_posts_camelcase_wire_keys(endpoint, payloads, respx_mock, base_url):
    # Dead on the deployed API (no handler); the stub must still emit the js-sdk wire shape.
    route = respx_mock.post(f"{base_url}{TEMPLATES_URL}/from-sharepoint").respond(200, json=payloads.template())

    template = endpoint.templates.create_from_sharepoint(
        TemplateCreateFromSharepointParams(name="NDA", siteId="site-1", itemId="item-1", oboToken="obo-token")
    )

    assert payloads.request_json(route) == {
        "name": "NDA",
        "siteId": "site-1",
        "itemId": "item-1",
        "oboToken": "obo-token",
    }
    assert isinstance(template, Template)


def test_toggle_star_posts_js_sdk_path(endpoint, payloads, respx_mock, base_url):
    # Broken on the deployed API (no such route); the stub keeps the js-sdk shape.
    route = respx_mock.post(f"{base_url}{TEMPLATES_URL}/template-1234/stars/toggle").respond(
        200, json=payloads.template(star_counter=1)
    )

    template = endpoint.templates.toggle_star("template-1234")

    assert route.called
    assert template.star_counter == 1


def test_update_patches_only_set_fields(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{TEMPLATES_URL}/template-1234").respond(
        200, json=payloads.template(description="updated")
    )

    template = endpoint.templates.update("template-1234", TemplateUpdateParams(description="updated"))

    assert template.description == "updated"
    assert payloads.request_json(route) == {"description": "updated"}


def test_update_missing_raises_not_found(endpoint, respx_mock, base_url):
    respx_mock.patch(f"{base_url}{TEMPLATES_URL}/nope").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        endpoint.templates.update("nope", TemplateUpdateParams(name="x"))


def test_delete_returns_none(endpoint, respx_mock, base_url):
    route = respx_mock.delete(f"{base_url}{TEMPLATES_URL}/template-1234").respond(200, text="Success")

    assert endpoint.templates.delete("template-1234") is None
    assert route.called


def test_delete_missing_raises_not_found(endpoint, respx_mock, base_url):
    respx_mock.delete(f"{base_url}{TEMPLATES_URL}/nope").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        endpoint.templates.delete("nope")


def test_error_body_falls_back_to_text_for_non_json(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{TEMPLATES_URL}").respond(502, text="Bad Gateway")

    with pytest.raises(VerdocsAPIError) as excinfo:
        endpoint.templates.list()

    assert excinfo.value.status_code == 502
    assert excinfo.value.body == "Bad Gateway"


async def test_async_list_returns_page(async_endpoint, payloads, respx_mock, base_url):
    respx_mock.get(f"{base_url}{TEMPLATES_URL}").respond(200, json=payloads.template_list())

    page = await async_endpoint.templates.list(TemplateListParams(rows=10))

    assert isinstance(page, TemplateList)
    assert page.templates[0].id == "template-1234"


async def test_async_get_missing_raises_not_found(async_endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{TEMPLATES_URL}/nope").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        await async_endpoint.templates.get("nope")


async def test_async_create_update_delete_round_trip(async_endpoint, payloads, respx_mock, base_url):
    create_route = respx_mock.post(f"{base_url}{TEMPLATES_URL}").respond(200, json=payloads.template(name="NDA"))
    update_route = respx_mock.patch(f"{base_url}{TEMPLATES_URL}/template-1234").respond(
        200, json=payloads.template(name="NDA v2")
    )
    delete_route = respx_mock.delete(f"{base_url}{TEMPLATES_URL}/template-1234").respond(200, text="Success")

    created = await async_endpoint.templates.create(TemplateCreateParams(name="NDA"))
    updated = await async_endpoint.templates.update(created.id, TemplateUpdateParams(name="NDA v2"))
    deleted = await async_endpoint.templates.delete(created.id)

    assert payloads.request_json(create_route) == {"name": "NDA"}
    assert payloads.request_json(update_route) == {"name": "NDA v2"}
    assert updated.name == "NDA v2"
    assert deleted is None
    assert delete_route.called


async def test_async_create_multipart_sends_file_parts(async_endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{TEMPLATES_URL}").respond(200, json=payloads.template(name="NDA"))

    template = await async_endpoint.templates.create(
        TemplateCreateParams(name="NDA"), files=[("nda.pdf", b"%PDF-1.4 fake", "application/pdf")]
    )

    request = route.calls.last.request
    assert request.headers["content-type"].startswith("multipart/form-data")
    assert b'name="documents"; filename="nda.pdf"' in request.content
    assert template.name == "NDA"


async def test_async_create_multipart_rejects_inline_roles(async_endpoint):
    with pytest.raises(ValueError):
        await async_endpoint.templates.create(
            TemplateCreateParams(name="NDA", roles=[RoleCreateParams(name="Tenant 1")]),
            files=[b"%PDF-1.4 raw"],
        )


async def test_async_duplicate_and_toggle_star(async_endpoint, payloads, respx_mock, base_url):
    dup_route = respx_mock.put(f"{base_url}{TEMPLATES_URL}/template-1234").respond(200, json=payloads.template())
    star_route = respx_mock.post(f"{base_url}{TEMPLATES_URL}/template-1234/stars/toggle").respond(
        200, json=payloads.template()
    )

    await async_endpoint.templates.duplicate("template-1234", "Copy")
    await async_endpoint.templates.toggle_star("template-1234")

    assert payloads.request_json(dup_route) == {"action": "duplicate", "name": "Copy"}
    assert star_route.called


async def test_async_create_from_sharepoint(async_endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{TEMPLATES_URL}/from-sharepoint").respond(200, json=payloads.template())

    await async_endpoint.templates.create_from_sharepoint(
        TemplateCreateFromSharepointParams(name="NDA", siteId="s", itemId="i", oboToken="t")
    )

    assert payloads.request_json(route)["siteId"] == "s"
