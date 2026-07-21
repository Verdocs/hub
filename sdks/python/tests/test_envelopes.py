"""envelopes create/get: happy and error paths, sync and async."""

from __future__ import annotations

import pytest

from verdocs import (
    Envelope,
    EnvelopeCreateParams,
    EnvelopeCreateRecipient,
    NotFoundError,
    VerdocsAPIError,
)

ENVELOPES_URL = "/v2/envelopes"


def _create_params(**overrides) -> EnvelopeCreateParams:
    fields = {
        "template_id": "template-1234",
        "recipients": [
            EnvelopeCreateRecipient(
                role_name="Seller", first_name="Paige", last_name="Turner", email="paige.turner@nomail.com"
            )
        ],
    }
    fields.update(overrides)
    return EnvelopeCreateParams(**fields)


def test_create_sends_template_and_recipients(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{ENVELOPES_URL}").respond(200, json=payloads.envelope())

    envelope = endpoint.envelopes.create(_create_params(name="Bill of Sale"))

    assert isinstance(envelope, Envelope)
    assert envelope.id == "envelope-1234"
    assert envelope.recipients[0].email == "paige.turner@nomail.com"
    body = payloads.request_json(route)
    assert body["template_id"] == "template-1234"
    assert body["name"] == "Bill of Sale"
    assert body["recipients"] == [
        {"role_name": "Seller", "first_name": "Paige", "last_name": "Turner", "email": "paige.turner@nomail.com"}
    ]


def test_create_omits_unset_optional_fields(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{ENVELOPES_URL}").respond(200, json=payloads.envelope())

    endpoint.envelopes.create(_create_params())

    body = payloads.request_json(route)
    assert "description" not in body
    assert "expires_at" not in body


def test_create_server_rejection_raises_api_error(endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{ENVELOPES_URL}").respond(400, json={"error": "template_id is required"})

    with pytest.raises(VerdocsAPIError) as excinfo:
        endpoint.envelopes.create(_create_params())

    assert excinfo.value.status_code == 400


def test_get_returns_envelope(endpoint, payloads, respx_mock, base_url):
    respx_mock.get(f"{base_url}{ENVELOPES_URL}/envelope-1234").respond(200, json=payloads.envelope())

    envelope = endpoint.envelopes.get("envelope-1234")

    assert isinstance(envelope, Envelope)
    assert envelope.status == "pending"
    assert envelope.recipients[0].role_name == "Seller"


def test_get_missing_raises_not_found(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{ENVELOPES_URL}/nope").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError) as excinfo:
        endpoint.envelopes.get("nope")

    assert excinfo.value.status_code == 404


async def test_async_create_returns_envelope(async_endpoint, payloads, respx_mock, base_url):
    respx_mock.post(f"{base_url}{ENVELOPES_URL}").respond(200, json=payloads.envelope())

    envelope = await async_endpoint.envelopes.create(_create_params())

    assert envelope.id == "envelope-1234"


async def test_async_get_missing_raises_not_found(async_endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{ENVELOPES_URL}/nope").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        await async_endpoint.envelopes.get("nope")
