"""template_documents create/get/download/links plus the dead stubs, sync and async.

Resources are constructed directly (TemplateDocuments(endpoint)) because the
endpoint properties are wired by the coordinator after this slice lands.
"""

from __future__ import annotations

import json
from typing import Any

import pytest

from verdocs import NotFoundError, Template, TemplateDocument, VerdocsAPIError
from verdocs.resources.template_documents import AsyncTemplateDocuments, TemplateDocuments

DOCUMENTS_URL = "/v2/template-documents"


def document_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": "doc-1234",
        "name": "nda.pdf",
        "template_id": "template-1234",
        "order": 0,
        "pages": 2,
        "mime": "application/pdf",
        "size": 12345,
        "page_sizes": [{"width": 612, "height": 792}],
        "created_at": "2026-01-01T00:00:00.000Z",
        "updated_at": "2026-01-02T00:00:00.000Z",
    }
    payload.update(overrides)
    return payload


@pytest.fixture
def documents(endpoint) -> TemplateDocuments:
    return TemplateDocuments(endpoint)


@pytest.fixture
def async_documents(async_endpoint) -> AsyncTemplateDocuments:
    return AsyncTemplateDocuments(async_endpoint)


def test_create_sends_single_file_part_and_template_id(documents, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{DOCUMENTS_URL}").respond(200, json=document_payload())

    document = documents.create("template-1234", ("nda.pdf", b"%PDF-1.4 fake", "application/pdf"))

    request = route.calls.last.request
    assert request.headers["content-type"].startswith("multipart/form-data")
    body = request.content
    # The handler wants exactly one file part named "file"; extra file parts
    # under other names make multer reject the request.
    assert body.count(b'name="file"') == 1
    assert b'filename="nda.pdf"' in body
    assert b'name="template_id"' in body
    assert b"template-1234" in body
    assert isinstance(document, TemplateDocument)
    assert document.id == "doc-1234"


def test_create_accepts_paths(documents, respx_mock, base_url, tmp_path):
    route = respx_mock.post(f"{base_url}{DOCUMENTS_URL}").respond(200, json=document_payload())
    pdf = tmp_path / "lease.pdf"
    pdf.write_bytes(b"%PDF-1.4 lease")

    documents.create("template-1234", pdf)

    body = route.calls.last.request.content
    assert b'name="file"; filename="lease.pdf"' in body
    assert b"Content-Type: application/pdf" in body


def test_create_rejection_raises_api_error(documents, respx_mock, base_url):
    respx_mock.post(f"{base_url}{DOCUMENTS_URL}").respond(400, json={"error": "File is required"})

    with pytest.raises(VerdocsAPIError) as excinfo:
        documents.create("template-1234", b"not a pdf")

    assert excinfo.value.status_code == 400


def test_get_parses_json_sent_as_text_html(documents, respx_mock, base_url):
    # The server stringifies the metadata itself, so the content type is
    # text/html while the body is JSON text; the SDK must parse it anyway.
    respx_mock.get(f"{base_url}{DOCUMENTS_URL}/doc-1234").respond(
        200, text=json.dumps(document_payload()), content_type="text/html"
    )

    document = documents.get("doc-1234")

    assert isinstance(document, TemplateDocument)
    assert document.mime == "application/pdf"


def test_get_missing_raises_not_found(documents, respx_mock, base_url):
    respx_mock.get(f"{base_url}{DOCUMENTS_URL}/nope").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        documents.get("nope")


def test_download_returns_bytes(documents, respx_mock, base_url):
    route = respx_mock.get(f"{base_url}{DOCUMENTS_URL}/doc-1234").respond(
        200, content=b"%PDF-1.4 raw bytes", content_type="application/pdf"
    )

    data = documents.download("doc-1234")

    assert data == b"%PDF-1.4 raw bytes"
    assert route.calls.last.request.url.params["type"] == "file"


def test_get_download_link_returns_bare_string(documents, respx_mock, base_url):
    # Link responses are a bare URL string with a text/html content type, not JSON.
    route = respx_mock.get(f"{base_url}{DOCUMENTS_URL}/doc-1234").respond(
        200, text="https://docs.cdn/signed?sig=abc", content_type="text/html"
    )

    link = documents.get_download_link("doc-1234")

    assert link == "https://docs.cdn/signed?sig=abc"
    assert route.calls.last.request.url.params["type"] == "download"


def test_get_preview_link_uses_envelope_documents_path(documents, respx_mock, base_url):
    # The js-sdk fetches the envelope-documents path for this template call;
    # the code is the wire truth, so the port mirrors the anomaly.
    route = respx_mock.get(f"{base_url}/v2/envelope-documents/doc-1234").respond(
        200, text="https://docs.cdn/preview?sig=abc", content_type="text/html"
    )

    link = documents.get_preview_link("doc-1234")

    assert link == "https://docs.cdn/preview?sig=abc"
    assert route.calls.last.request.url.params["type"] == "preview"


def test_get_file_targets_dead_route(documents, respx_mock, base_url):
    # No such route on the deployed API; the stub keeps the js-sdk shape.
    route = respx_mock.get(f"{base_url}/v2/templates/template-1234/documents/doc-1234").respond(
        200, content=b"%PDF-1.4 raw"
    )

    data = documents.get_file("template-1234", "doc-1234")

    assert data == b"%PDF-1.4 raw"
    assert route.calls.last.request.url.params["file"] == "true"


def test_get_thumbnail_targets_dead_route(documents, respx_mock, base_url):
    route = respx_mock.get(f"{base_url}/v2/templates/template-1234/documents/doc-1234").respond(
        200, content=b"PNG bytes"
    )

    data = documents.get_thumbnail("template-1234", "doc-1234")

    assert data == b"PNG bytes"
    assert route.calls.last.request.url.params["thumbnail"] == "true"


def test_get_page_display_uri_builds_path(documents, respx_mock, base_url):
    route = respx_mock.get(f"{base_url}{DOCUMENTS_URL}/page-image/doc-1234/original/2").respond(
        200, text="https://docs.cdn/page.png?sig=abc", content_type="text/html"
    )

    url = documents.get_page_display_uri("doc-1234", 2)

    assert url == "https://docs.cdn/page.png?sig=abc"
    assert route.called


def test_get_page_display_uri_accepts_thumb(documents, respx_mock, base_url):
    # The server takes the literal "thumb" where a page number would go; this
    # is the supported thumbnail path (get_thumbnail targets a dead route).
    route = respx_mock.get(f"{base_url}{DOCUMENTS_URL}/page-image/doc-1234/tagged/thumb").respond(
        200, text="https://docs.cdn/thumb.png?sig=abc"
    )

    url = documents.get_page_display_uri("doc-1234", "thumb", "tagged")

    assert url == "https://docs.cdn/thumb.png?sig=abc"
    assert route.called


def test_delete_returns_remaining_template(documents, payloads, respx_mock, base_url):
    respx_mock.delete(f"{base_url}{DOCUMENTS_URL}/doc-1234").respond(200, json=payloads.template())

    template = documents.delete("doc-1234")

    # The server answers with the remaining deep template, not a status string.
    assert isinstance(template, Template)
    assert template.id == "template-1234"


def test_delete_missing_raises_not_found(documents, respx_mock, base_url):
    respx_mock.delete(f"{base_url}{DOCUMENTS_URL}/nope").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        documents.delete("nope")


async def test_async_create_and_download_round_trip(async_documents, respx_mock, base_url):
    create_route = respx_mock.post(f"{base_url}{DOCUMENTS_URL}").respond(200, json=document_payload())
    download_route = respx_mock.get(f"{base_url}{DOCUMENTS_URL}/doc-1234").respond(200, content=b"%PDF-1.4 raw")

    document = await async_documents.create("template-1234", ("nda.pdf", b"%PDF-1.4 fake"))
    data = await async_documents.download(document.id)

    body = create_route.calls.last.request.content
    assert body.count(b'name="file"') == 1
    assert b'name="template_id"' in body
    assert data == b"%PDF-1.4 raw"
    assert download_route.calls.last.request.url.params["type"] == "file"


async def test_async_get_parses_json_sent_as_text_html(async_documents, respx_mock, base_url):
    respx_mock.get(f"{base_url}{DOCUMENTS_URL}/doc-1234").respond(
        200, text=json.dumps(document_payload()), content_type="text/html"
    )

    document = await async_documents.get("doc-1234")

    assert document.id == "doc-1234"


async def test_async_get_preview_link_uses_envelope_documents_path(async_documents, respx_mock, base_url):
    respx_mock.get(f"{base_url}/v2/envelope-documents/doc-1234").respond(200, text="https://docs.cdn/p?sig=1")

    link = await async_documents.get_preview_link("doc-1234")

    assert link == "https://docs.cdn/p?sig=1"


async def test_async_get_page_display_uri_accepts_thumb(async_documents, respx_mock, base_url):
    respx_mock.get(f"{base_url}{DOCUMENTS_URL}/page-image/doc-1234/original/thumb").respond(
        200, text="https://docs.cdn/t.png?sig=1"
    )

    url = await async_documents.get_page_display_uri("doc-1234", "thumb")

    assert url == "https://docs.cdn/t.png?sig=1"


async def test_async_delete_returns_template(async_documents, payloads, respx_mock, base_url):
    respx_mock.delete(f"{base_url}{DOCUMENTS_URL}/doc-1234").respond(200, json=payloads.template())

    template = await async_documents.delete("doc-1234")

    assert isinstance(template, Template)


async def test_async_get_file_targets_dead_route(async_documents, respx_mock, base_url):
    route = respx_mock.get(f"{base_url}/v2/templates/template-1234/documents/doc-1234").respond(
        200, content=b"%PDF-1.4 raw"
    )

    data = await async_documents.get_file("template-1234", "doc-1234")

    assert data == b"%PDF-1.4 raw"
    assert route.calls.last.request.url.params["file"] == "true"


async def test_async_get_thumbnail_targets_dead_route(async_documents, respx_mock, base_url):
    route = respx_mock.get(f"{base_url}/v2/templates/template-1234/documents/doc-1234").respond(
        200, content=b"PNG bytes"
    )

    data = await async_documents.get_thumbnail("template-1234", "doc-1234")

    assert data == b"PNG bytes"
    assert route.calls.last.request.url.params["thumbnail"] == "true"


async def test_async_get_download_link_returns_bare_string(async_documents, respx_mock, base_url):
    route = respx_mock.get(f"{base_url}{DOCUMENTS_URL}/doc-1234").respond(
        200, text="https://docs.cdn/signed?sig=abc", content_type="text/html"
    )

    link = await async_documents.get_download_link("doc-1234")

    assert link == "https://docs.cdn/signed?sig=abc"
    assert route.calls.last.request.url.params["type"] == "download"
