"""templates list/get/create/update/delete: happy and error paths, sync and async."""

from __future__ import annotations

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
)

TEMPLATES_URL = "/v2/templates"


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


def test_create_server_rejection_raises_api_error(endpoint, respx_mock, base_url):
    respx_mock.post(f"{base_url}{TEMPLATES_URL}").respond(400, json={"error": "name is required"})

    with pytest.raises(VerdocsAPIError) as excinfo:
        endpoint.templates.create(TemplateCreateParams(name=""))

    assert excinfo.value.status_code == 400
    assert not isinstance(excinfo.value, NotFoundError)


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
