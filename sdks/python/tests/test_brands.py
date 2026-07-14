"""brands resource: CRUD, logo/thumbnail uploads, and email-domain ops, sync and async.

Resources are constructed directly (Brands(endpoint)) because endpoint
wiring for the Organizations namespaces belongs to the coordinator.
"""

from __future__ import annotations

from typing import Any

import pytest

from verdocs import Brand, NotFoundError
from verdocs.models.organizations import BrandCreateParams, BrandEmailDomainAddParams, BrandUpdateParams
from verdocs.resources.brands import AsyncBrands, Brands

BRANDS_URL = "/v2/organizations/org-1234/brands"


def brand_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": "brand-1234",
        "organization_id": "org-1234",
        "key": "acme",
        "name": "Acme",
        "full_logo_url": None,
        "thumbnail_url": None,
        "email_domain": None,
        "email_local_part": None,
        "email_domain_status": None,
        "email_reply_to_verified": False,
        "email_spf_verified": False,
        "email_dkim_verified": False,
        "email_dmarc_verified": False,
        "email_dkim_tokens": [],
        "created_at": "2026-01-01T00:00:00.000Z",
        "updated_at": "2026-01-02T00:00:00.000Z",
    }
    payload.update(overrides)
    return payload


def test_list_returns_brands(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{BRANDS_URL}").respond(200, json=[brand_payload()])

    brands = Brands(endpoint).list("org-1234")

    assert len(brands) == 1
    assert isinstance(brands[0], Brand)
    assert brands[0].key == "acme"


def test_create_sends_only_set_fields(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{BRANDS_URL}").respond(200, json=brand_payload())

    brand = Brands(endpoint).create("org-1234", BrandCreateParams(key="acme", name="Acme"))

    assert payloads.request_json(route) == {"key": "acme", "name": "Acme"}
    assert brand.id == "brand-1234"


def test_get_returns_brand(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{BRANDS_URL}/brand-1234").respond(200, json=brand_payload())

    brand = Brands(endpoint).get("org-1234", "brand-1234")

    assert brand.key == "acme"


def test_get_missing_raises_not_found(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{BRANDS_URL}/nope").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        Brands(endpoint).get("org-1234", "nope")


def test_update_sends_explicit_null_to_clear_field(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{BRANDS_URL}/brand-1234").respond(
        200, json=brand_payload(name="Renamed", disclaimer=None)
    )

    brand = Brands(endpoint).update("org-1234", "brand-1234", BrandUpdateParams(name="Renamed", disclaimer=None))

    # An explicit None must reach the wire; null is how nullish fields clear.
    assert payloads.request_json(route) == {"name": "Renamed", "disclaimer": None}
    assert brand.name == "Renamed"


def test_update_logo_sends_multipart_logo_part(endpoint, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{BRANDS_URL}/brand-1234").respond(
        200, json=brand_payload(full_logo_url="https://cdn.test/brand-logo.png")
    )

    brand = Brands(endpoint).update_logo("org-1234", "brand-1234", ("logo.png", b"PNGDATA", "image/png"))

    request = route.calls.last.request
    body = request.read()
    assert request.headers["content-type"].startswith("multipart/form-data; boundary=")
    assert b'name="logo"' in body
    assert b'filename="logo.png"' in body
    assert b"Content-Type: image/png" in body
    assert b"PNGDATA" in body
    assert brand.full_logo_url == "https://cdn.test/brand-logo.png"


def test_update_logo_accepts_filesystem_path(endpoint, respx_mock, base_url, tmp_path):
    logo_file = tmp_path / "brand-logo.png"
    logo_file.write_bytes(b"PNGFROMDISK")
    route = respx_mock.patch(f"{base_url}{BRANDS_URL}/brand-1234").respond(200, json=brand_payload())

    Brands(endpoint).update_logo("org-1234", "brand-1234", logo_file)

    body = route.calls.last.request.read()
    assert b'name="logo"' in body
    assert b'filename="brand-logo.png"' in body
    assert b"PNGFROMDISK" in body


def test_update_thumbnail_sends_multipart_thumbnail_part(endpoint, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{BRANDS_URL}/brand-1234").respond(200, json=brand_payload())

    Brands(endpoint).update_thumbnail("org-1234", "brand-1234", ("thumb.png", b"THUMBDATA"))

    request = route.calls.last.request
    body = request.read()
    assert request.headers["content-type"].startswith("multipart/form-data; boundary=")
    assert b'name="thumbnail"' in body
    assert b'filename="thumb.png"' in body
    assert b"THUMBDATA" in body


def test_delete_returns_none(endpoint, respx_mock, base_url):
    route = respx_mock.delete(f"{base_url}{BRANDS_URL}/brand-1234").respond(200, json={"status": "OK"})

    assert Brands(endpoint).delete("org-1234", "brand-1234") is None
    assert route.called


def test_add_email_domain_sends_params(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{BRANDS_URL}/brand-1234/email-domain").respond(
        200, json=brand_payload(email_domain="notify.acme.com", email_local_part="docs", email_domain_status="pending")
    )

    brand = Brands(endpoint).add_email_domain(
        "org-1234", "brand-1234", BrandEmailDomainAddParams(subdomain="notify.acme.com", local_part="docs")
    )

    assert payloads.request_json(route) == {"subdomain": "notify.acme.com", "local_part": "docs"}
    assert brand.email_domain == "notify.acme.com"
    assert brand.email_domain_status == "pending"


def test_remove_email_domain_returns_brand(endpoint, respx_mock, base_url):
    route = respx_mock.delete(f"{base_url}{BRANDS_URL}/brand-1234/email-domain").respond(
        200, json=brand_payload(email_domain=None)
    )

    brand = Brands(endpoint).remove_email_domain("org-1234", "brand-1234")

    assert route.called
    assert brand.email_domain is None


def test_verify_email_domain_returns_status_flags(endpoint, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{BRANDS_URL}/brand-1234/email-domain/verify").respond(
        200,
        json=brand_payload(
            email_domain="notify.acme.com",
            email_domain_status="verified",
            email_spf_verified=True,
            email_dkim_verified=True,
            email_dmarc_verified=True,
        ),
    )

    brand = Brands(endpoint).verify_email_domain("org-1234", "brand-1234")

    assert route.called
    assert brand.email_domain_status == "verified"
    assert brand.email_spf_verified is True


async def test_async_list_create_get(async_endpoint, payloads, respx_mock, base_url):
    respx_mock.get(f"{base_url}{BRANDS_URL}").respond(200, json=[brand_payload()])
    create_route = respx_mock.post(f"{base_url}{BRANDS_URL}").respond(200, json=brand_payload())
    respx_mock.get(f"{base_url}{BRANDS_URL}/brand-1234").respond(200, json=brand_payload())

    brands = AsyncBrands(async_endpoint)
    listing = await brands.list("org-1234")
    created = await brands.create("org-1234", BrandCreateParams(key="acme"))
    fetched = await brands.get("org-1234", "brand-1234")

    assert listing[0].id == "brand-1234"
    assert payloads.request_json(create_route) == {"key": "acme"}
    assert created.key == "acme"
    assert fetched.key == "acme"


async def test_async_update_and_delete(async_endpoint, payloads, respx_mock, base_url):
    update_route = respx_mock.patch(f"{base_url}{BRANDS_URL}/brand-1234").respond(
        200, json=brand_payload(name="Renamed")
    )
    delete_route = respx_mock.delete(f"{base_url}{BRANDS_URL}/brand-1234").respond(200, json={"status": "OK"})

    brands = AsyncBrands(async_endpoint)
    updated = await brands.update("org-1234", "brand-1234", BrandUpdateParams(name="Renamed"))
    deleted = await brands.delete("org-1234", "brand-1234")

    assert payloads.request_json(update_route) == {"name": "Renamed"}
    assert updated.name == "Renamed"
    assert deleted is None
    assert delete_route.called


async def test_async_update_logo_and_thumbnail_send_multipart(async_endpoint, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{BRANDS_URL}/brand-1234").respond(200, json=brand_payload())

    brands = AsyncBrands(async_endpoint)
    await brands.update_logo("org-1234", "brand-1234", ("logo.png", b"PNGDATA"))
    logo_body = route.calls.last.request.read()
    await brands.update_thumbnail("org-1234", "brand-1234", ("thumb.png", b"THUMBDATA"))
    thumbnail_body = route.calls.last.request.read()

    assert b'name="logo"' in logo_body
    assert b'name="thumbnail"' in thumbnail_body


async def test_async_email_domain_round_trip(async_endpoint, payloads, respx_mock, base_url):
    add_route = respx_mock.post(f"{base_url}{BRANDS_URL}/brand-1234/email-domain").respond(
        200, json=brand_payload(email_domain="notify.acme.com")
    )
    verify_route = respx_mock.post(f"{base_url}{BRANDS_URL}/brand-1234/email-domain/verify").respond(
        200, json=brand_payload(email_domain="notify.acme.com", email_domain_status="verified")
    )
    remove_route = respx_mock.delete(f"{base_url}{BRANDS_URL}/brand-1234/email-domain").respond(
        200, json=brand_payload()
    )

    brands = AsyncBrands(async_endpoint)
    added = await brands.add_email_domain(
        "org-1234", "brand-1234", BrandEmailDomainAddParams(subdomain="notify.acme.com", local_part="docs")
    )
    verified = await brands.verify_email_domain("org-1234", "brand-1234")
    removed = await brands.remove_email_domain("org-1234", "brand-1234")

    assert payloads.request_json(add_route)["subdomain"] == "notify.acme.com"
    assert added.email_domain == "notify.acme.com"
    assert verified.email_domain_status == "verified"
    assert removed.email_domain is None
    assert verify_route.called
    assert remove_route.called
