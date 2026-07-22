"""signatures.create and initials.create: multipart shapes and model parsing, sync and async."""

from __future__ import annotations

from typing import Any

import pytest

from verdocs import Initial, Signature, VerdocsAPIError
from verdocs.resources.initials import AsyncInitials, Initials
from verdocs.resources.signatures import AsyncSignatures, Signatures

SIGNATURES_URL = "/v2/profiles/signatures"
INITIALS_URL = "/v2/profiles/initials"

PNG_BYTES = b"\x89PNG fake image data"


def signature_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": "signature-1234",
        "profile_id": "profile-1234",
        "url": "users/profile-1234/signatures/signature-1234",
        "created_at": "2026-01-01T00:00:00.000Z",
        "updated_at": "2026-01-02T00:00:00.000Z",
        "deleted_at": None,
    }
    payload.update(overrides)
    return payload


def initial_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": "initial-1234",
        "profile_id": "profile-1234",
        "url": "users/profile-1234/initials/initial-1234",
        "created_at": "2026-01-01T00:00:00.000Z",
        "updated_at": "2026-01-02T00:00:00.000Z",
        "deleted_at": None,
    }
    payload.update(overrides)
    return payload


def test_create_signature_sends_multipart_part(endpoint, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{SIGNATURES_URL}").respond(200, json=signature_payload())

    signature = Signatures(endpoint).create(("signature.png", PNG_BYTES, "image/png"))

    assert isinstance(signature, Signature)
    assert signature.id == "signature-1234"
    request = route.calls.last.request
    assert request.headers["content-type"].startswith("multipart/form-data; boundary=")
    content = request.content
    assert b'name="signature"; filename="signature.png"' in content
    assert b"Content-Type: image/png" in content
    assert PNG_BYTES in content


def test_create_signature_from_path_uses_basename(endpoint, respx_mock, base_url, tmp_path):
    route = respx_mock.post(f"{base_url}{SIGNATURES_URL}").respond(200, json=signature_payload())
    image = tmp_path / "my-signature.png"
    image.write_bytes(PNG_BYTES)

    Signatures(endpoint).create(image)

    content = route.calls.last.request.content
    assert b'name="signature"; filename="my-signature.png"' in content
    # httpx guesses the part content type from the filename.
    assert b"Content-Type: image/png" in content
    assert PNG_BYTES in content


def test_create_signature_from_raw_bytes(endpoint, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{SIGNATURES_URL}").respond(200, json=signature_payload())

    Signatures(endpoint).create(PNG_BYTES)

    content = route.calls.last.request.content
    assert b'name="signature"' in content
    assert PNG_BYTES in content


def test_create_signature_rejection_raises_api_error(endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{SIGNATURES_URL}").respond(400, json={"error": "File is required"})

    with pytest.raises(VerdocsAPIError) as excinfo:
        Signatures(endpoint).create(PNG_BYTES)

    assert excinfo.value.status_code == 400


def test_create_initials_sends_multipart_part(endpoint, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{INITIALS_URL}").respond(200, json=initial_payload())

    initial = Initials(endpoint).create(("initials.png", PNG_BYTES, "image/png"))

    assert isinstance(initial, Initial)
    assert initial.id == "initial-1234"
    content = route.calls.last.request.content
    assert b'name="initial"; filename="initials.png"' in content
    assert b"Content-Type: image/png" in content
    assert PNG_BYTES in content


def test_create_initials_from_path_uses_basename(endpoint, respx_mock, base_url, tmp_path):
    route = respx_mock.post(f"{base_url}{INITIALS_URL}").respond(200, json=initial_payload())
    image = tmp_path / "my-initials.png"
    image.write_bytes(PNG_BYTES)

    Initials(endpoint).create(image)

    assert b'name="initial"; filename="my-initials.png"' in route.calls.last.request.content


async def test_async_create_signature(async_endpoint, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{SIGNATURES_URL}").respond(200, json=signature_payload())

    signature = await AsyncSignatures(async_endpoint).create(("signature.png", PNG_BYTES))

    assert isinstance(signature, Signature)
    assert b'name="signature"; filename="signature.png"' in route.calls.last.request.content


async def test_async_create_initials(async_endpoint, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{INITIALS_URL}").respond(200, json=initial_payload())

    initial = await AsyncInitials(async_endpoint).create(("initials.png", PNG_BYTES))

    assert isinstance(initial, Initial)
    assert b'name="initial"; filename="initials.png"' in route.calls.last.request.content
