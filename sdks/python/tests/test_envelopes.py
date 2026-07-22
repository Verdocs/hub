"""envelopes CRUD, document fetches/links, field updates, ZIP, and sorts: sync and async."""

from __future__ import annotations

import json
from typing import Any

import pytest
from pydantic import ValidationError

from verdocs import Envelope, EnvelopeDocument, EnvelopeField, NotFoundError, Recipient, VerdocsAPIError
from verdocs.models.envelopes import (
    EnvelopeCreateDirectParams,
    EnvelopeCreateDocumentFromData,
    EnvelopeCreateFromTemplateParams,
    EnvelopeCreateRecipientDirect,
    EnvelopeCreateRecipientFromTemplate,
    EnvelopeList,
    EnvelopeListParams,
    EnvelopeUpdateParams,
)
from verdocs.resources.envelopes import AsyncEnvelopes, Envelopes, sort_documents, sort_fields, sort_recipients

ENVELOPES_URL = "/v2/envelopes"
DOCUMENTS_URL = "/v2/envelope-documents"


def envelope_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": "envelope-1234",
        "status": "pending",
        "profile_id": "profile-1234",
        "template_id": None,
        "organization_id": "org-1234",
        "name": "Test Envelope",
        "sender_name": "Test User",
        "sender_email": "test@example.com",
        "no_contact": False,
        "initial_reminder": None,
        "followup_reminders": None,
        "max_reminder_days": 14,
        "created_at": "2026-01-01T00:00:00.000Z",
        "updated_at": "2026-01-02T00:00:00.000Z",
        "canceled_at": None,
        "expires_at": None,
        "visibility": "private",
        "signed": False,
        "data": None,
    }
    payload.update(overrides)
    return payload


def envelope_list_payload(*envelopes: dict[str, Any]) -> dict[str, Any]:
    entries = list(envelopes) or [envelope_payload()]
    return {"count": len(entries), "rows": len(entries), "page": 0, "envelopes": entries}


def envelope_document_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": "document-1234",
        "envelope_id": "envelope-1234",
        "template_document_id": None,
        "order": 0,
        "type": "attachment",
        "name": "NDA.pdf",
        "pages": 2,
        "mime": "application/pdf",
        "size": 12345,
        "signed": False,
        "page_sizes": None,
        "created_at": "2026-01-01T00:00:00.000Z",
        "updated_at": "2026-01-02T00:00:00.000Z",
    }
    payload.update(overrides)
    return payload


def envelope_field_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "envelope_id": "envelope-1234",
        "document_id": "document-1234",
        "name": "Buyer-attachment-1",
        "role_name": "Recipient 1",
        "type": "attachment",
        "required": True,
        "readonly": False,
        "page": 1,
        "x": 100,
        "y": 200,
        "width": 80,
        "height": 20,
        "multiline": False,
        "value": None,
        "is_valid": True,
    }
    payload.update(overrides)
    return payload


def request_json(route: Any) -> Any:
    return json.loads(route.calls.last.request.content)


def direct_create_params(**overrides: Any) -> EnvelopeCreateDirectParams:
    fields: dict[str, Any] = {
        "name": "Bill of Sale",
        "recipients": [
            EnvelopeCreateRecipientDirect(
                type="signer",
                role_name="Seller",
                first_name="Paige",
                last_name="Turner",
                email="paige.turner@example.com",
                sequence=1,
            )
        ],
        "documents": [EnvelopeCreateDocumentFromData(name="bill.pdf", data="JVBERi0xLjQ=")],
    }
    fields.update(overrides)
    return EnvelopeCreateDirectParams(**fields)


def test_create_direct_sends_only_set_fields(endpoint, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{ENVELOPES_URL}").respond(200, json=envelope_payload(name="Bill of Sale"))

    envelope = Envelopes(endpoint).create(direct_create_params())

    assert isinstance(envelope, Envelope)
    assert envelope.name == "Bill of Sale"
    assert route.calls.last.request.headers["content-type"] == "application/json"
    assert request_json(route) == {
        "name": "Bill of Sale",
        "recipients": [
            {
                "type": "signer",
                "role_name": "Seller",
                "first_name": "Paige",
                "last_name": "Turner",
                "email": "paige.turner@example.com",
                "sequence": 1,
            }
        ],
        "documents": [{"name": "bill.pdf", "data": "JVBERi0xLjQ="}],
    }


def test_create_from_template_sends_email_key_for_phone_only_recipient(endpoint, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{ENVELOPES_URL}").respond(200, json=envelope_payload())

    Envelopes(endpoint).create(
        EnvelopeCreateFromTemplateParams(
            template_id="template-1234",
            recipients=[
                EnvelopeCreateRecipientFromTemplate(
                    role_name="Recipient 1",
                    first_name="Paige",
                    last_name="Turner",
                    email="",
                    phone="+15551230000",
                )
            ],
        )
    )

    body = request_json(route)
    assert body["template_id"] == "template-1234"
    # The server requires the email key on every recipient, even phone-only ones.
    assert body["recipients"][0]["email"] == ""
    assert body["recipients"][0]["phone"] == "+15551230000"


def test_create_recipient_requires_email_key():
    with pytest.raises(ValidationError):
        EnvelopeCreateRecipientFromTemplate(role_name="Recipient 1", first_name="Paige", last_name="Turner")


def test_create_sends_explicit_null_to_disable_reminders(endpoint, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{ENVELOPES_URL}").respond(200, json=envelope_payload())

    Envelopes(endpoint).create(direct_create_params(initial_reminder=None))

    # An explicit None must reach the wire; null is how reminders get disabled.
    assert request_json(route)["initial_reminder"] is None


def test_create_server_rejection_raises_api_error(endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{ENVELOPES_URL}").respond(400, json={"error": "Duplicate recipients"})

    with pytest.raises(VerdocsAPIError) as excinfo:
        Envelopes(endpoint).create(direct_create_params())

    assert excinfo.value.status_code == 400


def test_get_returns_envelope(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{ENVELOPES_URL}/envelope-1234").respond(200, json=envelope_payload())

    envelope = Envelopes(endpoint).get("envelope-1234")

    assert isinstance(envelope, Envelope)
    assert envelope.id == "envelope-1234"


def test_get_missing_raises_not_found(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{ENVELOPES_URL}/nope").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        Envelopes(endpoint).get("nope")


def test_list_returns_page(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{ENVELOPES_URL}").respond(200, json=envelope_list_payload())

    page = Envelopes(endpoint).list()

    assert isinstance(page, EnvelopeList)
    assert page.count == 1
    assert page.envelopes[0].id == "envelope-1234"


def test_list_sends_bracketed_status_arrays(endpoint, respx_mock, base_url):
    route = respx_mock.get(f"{base_url}{ENVELOPES_URL}").respond(200, json=envelope_list_payload())

    Envelopes(endpoint).list(EnvelopeListParams(view="inbox", status=["pending", "in progress"], rows=10))

    params = route.calls.last.request.url.params
    assert params["view"] == "inbox"
    # axios sends arrays as status[]=a&status[]=b and the server's query
    # parser expects that shape; a bare status= would parse as a string.
    assert params.get_list("status[]") == ["pending", "in progress"]
    assert "status" not in params
    assert params["rows"] == "10"


def test_list_without_params_sends_no_query(endpoint, respx_mock, base_url):
    route = respx_mock.get(f"{base_url}{ENVELOPES_URL}").respond(200, json=envelope_list_payload())

    Envelopes(endpoint).list()

    assert str(route.calls.last.request.url.query, "ascii") == ""


def test_update_patches_only_set_fields(endpoint, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{ENVELOPES_URL}/envelope-1234").respond(
        200, json=envelope_payload(name="Renamed")
    )

    envelope = Envelopes(endpoint).update("envelope-1234", EnvelopeUpdateParams(name="Renamed"))

    assert envelope.name == "Renamed"
    assert request_json(route) == {"name": "Renamed"}


def test_cancel_sends_action(endpoint, respx_mock, base_url):
    route = respx_mock.put(f"{base_url}{ENVELOPES_URL}/envelope-1234").respond(
        200, json=envelope_payload(status="canceled")
    )

    envelope = Envelopes(endpoint).cancel("envelope-1234")

    assert envelope.status == "canceled"
    assert request_json(route) == {"action": "cancel"}


def test_get_document_parses_json_sent_as_text_html(endpoint, respx_mock, base_url):
    # The server sends JSON.stringify output with a text/html Content-Type on
    # this route; the SDK must parse the body as JSON anyway.
    respx_mock.get(f"{base_url}{DOCUMENTS_URL}/document-1234").respond(
        200,
        content=json.dumps(envelope_document_payload()).encode(),
        headers={"Content-Type": "text/html; charset=utf-8"},
    )

    document = Envelopes(endpoint).get_document("document-1234")

    assert isinstance(document, EnvelopeDocument)
    assert document.mime == "application/pdf"
    assert document.pages == 2


def test_download_document_returns_bytes(endpoint, respx_mock, base_url):
    route = respx_mock.get(f"{base_url}{DOCUMENTS_URL}/document-1234", params={"type": "file"}).respond(
        200, content=b"%PDF-1.4 fake", headers={"Content-Type": "application/pdf"}
    )

    content = Envelopes(endpoint).download_document("document-1234")

    assert content == b"%PDF-1.4 fake"
    assert route.called


def test_get_file_is_the_same_download(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{DOCUMENTS_URL}/document-1234", params={"type": "file"}).respond(
        200, content=b"%PDF-1.4 fake"
    )

    assert Envelopes(endpoint).get_file("document-1234") == b"%PDF-1.4 fake"


def test_get_document_download_link_returns_url_string(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{DOCUMENTS_URL}/document-1234", params={"type": "download"}).respond(
        200, text="https://docs.cdn.test/document-1234?signature=abc"
    )

    link = Envelopes(endpoint).get_document_download_link("document-1234")

    assert link == "https://docs.cdn.test/document-1234?signature=abc"


def test_get_combined_document_download_link_sends_combined_flag(endpoint, respx_mock, base_url):
    route = respx_mock.get(
        f"{base_url}{DOCUMENTS_URL}/certificate-1234", params={"type": "download", "combined": "true"}
    ).respond(200, text="https://docs.cdn.test/combined-1234?signature=abc")

    link = Envelopes(endpoint).get_combined_document_download_link("certificate-1234")

    assert link == "https://docs.cdn.test/combined-1234?signature=abc"
    assert route.called


def test_get_document_preview_link_returns_url_string(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{DOCUMENTS_URL}/document-1234", params={"type": "preview"}).respond(
        200, text="https://docs.cdn.test/preview-1234"
    )

    assert Envelopes(endpoint).get_document_preview_link("document-1234") == "https://docs.cdn.test/preview-1234"


def test_update_field_encodes_names_and_sends_value(endpoint, respx_mock, base_url):
    route = respx_mock.put(
        f"{base_url}{ENVELOPES_URL}/envelope-1234/recipients/Recipient%201/fields/Buyer-textbox-1"
    ).respond(200, json=envelope_field_payload(type="textbox", value="hello"))

    field = Envelopes(endpoint).update_field("envelope-1234", "Recipient 1", "Buyer-textbox-1", "hello")

    assert isinstance(field, EnvelopeField)
    assert field.value == "hello"
    assert request_json(route) == {"value": "hello", "prepared": False}


def test_update_field_sends_prepared_flag(endpoint, respx_mock, base_url):
    route = respx_mock.put(
        f"{base_url}{ENVELOPES_URL}/envelope-1234/recipients/Recipient%201/fields/Buyer-textbox-1"
    ).respond(200, json=envelope_field_payload(type="textbox"))

    Envelopes(endpoint).update_field("envelope-1234", "Recipient 1", "Buyer-textbox-1", "hello", prepared=True)

    assert request_json(route) == {"value": "hello", "prepared": True}


def test_upload_field_attachment_sends_multipart_parts(endpoint, respx_mock, base_url):
    route = respx_mock.put(
        f"{base_url}{ENVELOPES_URL}/envelope-1234/recipients/Recipient%201/fields/Buyer-attachment-1"
    ).respond(200, json=envelope_field_payload())

    field = Envelopes(endpoint).upload_field_attachment(
        "envelope-1234", "Recipient 1", "Buyer-attachment-1", ("receipt.pdf", b"%PDF-1.4 fake", "application/pdf")
    )

    assert isinstance(field, EnvelopeField)
    request = route.calls.last.request
    assert request.headers["content-type"].startswith("multipart/form-data; boundary=")
    content = request.content
    assert b'name="document"; filename="receipt.pdf"' in content
    assert b"Content-Type: application/pdf" in content
    # The body schema requires the value key even on multipart requests.
    assert b'name="value"' in content
    assert b"%PDF-1.4 fake" in content


def test_upload_field_attachment_from_path_uses_basename(endpoint, respx_mock, base_url, tmp_path):
    route = respx_mock.put(
        f"{base_url}{ENVELOPES_URL}/envelope-1234/recipients/Recipient%201/fields/Buyer-attachment-1"
    ).respond(200, json=envelope_field_payload())
    pdf = tmp_path / "agreement.pdf"
    pdf.write_bytes(b"%PDF-1.4 from disk")

    Envelopes(endpoint).upload_field_attachment("envelope-1234", "Recipient 1", "Buyer-attachment-1", pdf)

    content = route.calls.last.request.content
    assert b'name="document"; filename="agreement.pdf"' in content
    # httpx guesses the part content type from the filename.
    assert b"Content-Type: application/pdf" in content
    assert b"%PDF-1.4 from disk" in content


def test_delete_field_attachment_sends_lone_value_part(endpoint, respx_mock, base_url):
    route = respx_mock.put(
        f"{base_url}{ENVELOPES_URL}/envelope-1234/recipients/Recipient%201/fields/Buyer-attachment-1"
    ).respond(200, json=envelope_field_payload())

    field = Envelopes(endpoint).delete_field_attachment("envelope-1234", "Recipient 1", "Buyer-attachment-1")

    assert isinstance(field, EnvelopeField)
    request = route.calls.last.request
    # Removal is the same PUT as an upload, minus the file part; the js-sdk's
    # fully empty form body fails the server schema, so value="" must ride along.
    assert request.headers["content-type"].startswith("multipart/form-data; boundary=")
    content = request.content
    assert b'name="value"' in content
    assert b'name="document"' not in content
    assert b"filename=" not in content


def test_get_document_page_display_uri_defaults_to_original(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{DOCUMENTS_URL}/page-image/document-1234/original/2").respond(
        200, text="https://docs.cdn.test/pages/2.png"
    )

    uri = Envelopes(endpoint).get_document_page_display_uri("document-1234", 2)

    assert uri == "https://docs.cdn.test/pages/2.png"


def test_get_document_page_display_uri_supports_certificate_variant(endpoint, respx_mock, base_url):
    route = respx_mock.get(f"{base_url}{DOCUMENTS_URL}/page-image/document-1234/certificate/0").respond(
        200, text="https://docs.cdn.test/cert/0.png"
    )

    Envelopes(endpoint).get_document_page_display_uri("document-1234", 0, "certificate")

    assert route.called


def test_get_zip_joins_ids_and_returns_bytes(endpoint, respx_mock, base_url):
    route = respx_mock.get(f"{base_url}{ENVELOPES_URL}/zip/envelope-1,envelope-2").respond(
        200, content=b"PK\x03\x04zipbytes", headers={"Content-Type": "application/octet-stream"}
    )

    content = Envelopes(endpoint).get_zip(["envelope-1", "envelope-2"])

    assert content == b"PK\x03\x04zipbytes"
    assert route.called


def make_field(name: str, page: int, x: float, y: float, height: float = 10) -> EnvelopeField:
    return EnvelopeField.model_validate(envelope_field_payload(name=name, page=page, x=x, y=y, height=height))


def test_sort_fields_orders_by_page_band_then_x():
    # Y origins are bottom-left, so within a page the highest tops come
    # first; tops within the same 5-unit band order left to right.
    top_left = make_field("top-left", page=1, x=10, y=700)
    top_right = make_field("top-right", page=1, x=50, y=702)
    bottom = make_field("bottom", page=1, x=5, y=100)
    page_two = make_field("page-two", page=2, x=0, y=700)
    fields = [page_two, bottom, top_right, top_left]

    result = sort_fields(fields)

    assert result is fields
    assert [field.name for field in fields] == ["top-left", "top-right", "bottom", "page-two"]


def test_sort_documents_orders_by_order_then_created_at():
    first = EnvelopeDocument.model_validate(
        envelope_document_payload(id="a", order=0, created_at="2026-01-01T00:00:00.000Z")
    )
    second = EnvelopeDocument.model_validate(
        envelope_document_payload(id="b", order=0, created_at="2026-01-03T00:00:00.000Z")
    )
    third = EnvelopeDocument.model_validate(
        envelope_document_payload(id="c", order=1, created_at="2026-01-02T00:00:00.000Z")
    )
    documents = [third, second, first]

    result = sort_documents(documents)

    assert result is documents
    assert [document.id for document in documents] == ["a", "b", "c"]


def test_sort_recipients_orders_by_sequence_then_order():
    def recipient(role_name: str, sequence: int, order: int) -> Recipient:
        return Recipient.model_validate(
            {
                "envelope_id": "envelope-1234",
                "role_name": role_name,
                "status": "invited",
                "first_name": "Test",
                "last_name": "Signer",
                "email": "signer@example.com",
                "sequence": sequence,
                "order": order,
                "type": "signer",
                "delegator": False,
                "claimed": False,
                "agreed": False,
                "name_locked": False,
                "created_at": "2026-01-01T00:00:00.000Z",
                "updated_at": "2026-01-02T00:00:00.000Z",
            }
        )

    recipients = [recipient("c", 2, 1), recipient("b", 1, 2), recipient("a", 1, 1)]

    result = sort_recipients(recipients)

    assert result is recipients
    assert [entry.role_name for entry in recipients] == ["a", "b", "c"]
    assert sort_recipients(None) is None


async def test_async_list_and_get(async_endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{ENVELOPES_URL}").respond(200, json=envelope_list_payload())
    respx_mock.get(f"{base_url}{ENVELOPES_URL}/envelope-1234").respond(200, json=envelope_payload())
    envelopes = AsyncEnvelopes(async_endpoint)

    page = await envelopes.list(EnvelopeListParams(rows=10))
    envelope = await envelopes.get("envelope-1234")

    assert page.envelopes[0].id == "envelope-1234"
    assert envelope.id == "envelope-1234"


async def test_async_create_update_cancel_round_trip(async_endpoint, respx_mock, base_url):
    create_route = respx_mock.post(f"{base_url}{ENVELOPES_URL}").respond(200, json=envelope_payload())
    update_route = respx_mock.patch(f"{base_url}{ENVELOPES_URL}/envelope-1234").respond(200, json=envelope_payload())
    cancel_route = respx_mock.put(f"{base_url}{ENVELOPES_URL}/envelope-1234").respond(
        200, json=envelope_payload(status="canceled")
    )
    envelopes = AsyncEnvelopes(async_endpoint)

    created = await envelopes.create(direct_create_params())
    await envelopes.update(created.id, EnvelopeUpdateParams(name="Renamed"))
    canceled = await envelopes.cancel(created.id)

    assert request_json(create_route)["name"] == "Bill of Sale"
    assert request_json(update_route) == {"name": "Renamed"}
    assert request_json(cancel_route) == {"action": "cancel"}
    assert canceled.status == "canceled"


async def test_async_document_fetches(async_endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{DOCUMENTS_URL}/document-1234", params={"type": "file"}).respond(
        200, content=b"%PDF-1.4 fake"
    )
    respx_mock.get(f"{base_url}{DOCUMENTS_URL}/document-1234", params={"type": "download"}).respond(
        200, text="https://docs.cdn.test/document-1234"
    )
    respx_mock.get(f"{base_url}{DOCUMENTS_URL}/document-1234").respond(
        200,
        content=json.dumps(envelope_document_payload()).encode(),
        headers={"Content-Type": "text/html; charset=utf-8"},
    )
    envelopes = AsyncEnvelopes(async_endpoint)

    assert await envelopes.download_document("document-1234") == b"%PDF-1.4 fake"
    assert await envelopes.get_document_download_link("document-1234") == "https://docs.cdn.test/document-1234"
    assert (await envelopes.get_document("document-1234")).id == "document-1234"


async def test_async_upload_and_delete_field_attachment(async_endpoint, respx_mock, base_url):
    route = respx_mock.put(
        f"{base_url}{ENVELOPES_URL}/envelope-1234/recipients/Recipient%201/fields/Buyer-attachment-1"
    ).respond(200, json=envelope_field_payload())
    envelopes = AsyncEnvelopes(async_endpoint)

    await envelopes.upload_field_attachment(
        "envelope-1234", "Recipient 1", "Buyer-attachment-1", ("receipt.pdf", b"%PDF-1.4 fake")
    )
    upload_content = route.calls.last.request.content
    await envelopes.delete_field_attachment("envelope-1234", "Recipient 1", "Buyer-attachment-1")
    delete_content = route.calls.last.request.content

    assert b'name="document"; filename="receipt.pdf"' in upload_content
    assert b'name="value"' in upload_content
    assert b'name="document"' not in delete_content
    assert b'name="value"' in delete_content
