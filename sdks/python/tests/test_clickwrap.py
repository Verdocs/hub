"""clickwrap resource: agreements, drafts, status, sessions, records, and session-token calls, sync and async."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx
import pytest

from verdocs import (
    AuthenticationError,
    ClickwrapAcceptance,
    ClickwrapAcceptanceListParams,
    ClickwrapAgreementCreateParams,
    ClickwrapAgreementLabel,
    ClickwrapDraftCreateParams,
    ClickwrapEventParams,
    ClickwrapLabels,
    ClickwrapOutcomeAgreement,
    ClickwrapOutcomeRecordParams,
    ClickwrapPublishParams,
    ClickwrapSessionCreated,
    ClickwrapSessionCreateParams,
    ClickwrapSessionCurrent,
    ClickwrapSessionOutcomeParams,
)

PATH = "/v2/clickwraps"
TOKEN = "vd_cw_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG"
NOW = "2026-11-12T15:00:00.000Z"


def agreement_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": "a-1",
        "organization_id": "org-1234",
        "key": "terms-of-service",
        "name": "Terms of Service",
        "created_by": "profile-1234",
        "created_at": NOW,
        "updated_at": NOW,
    }
    payload.update(overrides)
    return payload


def version_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": "v-1",
        "agreement_id": "a-1",
        "number": 1,
        "status": "draft",
        "content": "<p>Be nice.</p>",
        "content_hash": None,
        "requires_reacceptance": False,
        "change_summary": None,
        "published_at": None,
        "published_by": None,
        "created_at": NOW,
        "updated_at": NOW,
    }
    payload.update(overrides)
    return payload


def acceptance_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": "r-1",
        "organization_id": "org-1234",
        "session_id": None,
        "user_id": "user-1",
        "metadata": {"email": "pat@example.com"},
        "outcome": "accepted",
        "surface": "headless",
        "mode": None,
        "require_scroll": None,
        "ip_address": "203.0.113.7",
        "user_agent": None,
        "locale": None,
        "timezone": None,
        "viewport": None,
        "labels": None,
        "scroll_depth": None,
        "scrolled_to_end": None,
        "time_on_terms_ms": None,
        "presentation_hash": None,
        "presentation_source": "none",
        "has_presentation": False,
        "reported_by": "customer",
        "sequence": 3,
        "prev_hash": "a" * 64,
        "record_hash": "b" * 64,
        "created_at": NOW,
        "items": [
            {
                "content_hash": "c" * 64,
                "agreement_version": {
                    "id": "v-1",
                    "number": 1,
                    "published_at": NOW,
                    "agreement": {"key": "terms-of-service", "name": "Terms of Service"},
                },
            }
        ],
        "events": [{"event": "accepted", "agreement_id": None, "client_at": None, "created_at": NOW}],
    }
    payload.update(overrides)
    return payload


OUTCOME_RESULT = {"acceptance_id": "r-1", "outcome": "accepted", "created_at": NOW}

SESSION_OUTCOME = ClickwrapSessionOutcomeParams(
    surface="component",
    labels=ClickwrapLabels(agreements=[ClickwrapAgreementLabel(version_id="v-1", label="I agree")], button="Continue"),
    presentation="<p>Be nice.</p>",
)


def test_list_agreements_unwraps_the_response(endpoint, respx_mock, base_url):
    summary = agreement_payload(
        current_version={"id": "v-1", "number": 1, "status": "published", "published_at": NOW}, draft_version=None
    )
    respx_mock.get(f"{base_url}{PATH}/agreements").respond(200, json={"agreements": [summary]})

    agreements = endpoint.clickwrap.list_agreements()

    assert [agreement.key for agreement in agreements] == ["terms-of-service"]
    assert agreements[0].current_version is not None
    assert agreements[0].current_version.number == 1
    assert agreements[0].draft_version is None


def test_get_create_and_rename_agreement(endpoint, payloads, respx_mock, base_url):
    respx_mock.get(f"{base_url}{PATH}/agreements/a-1").respond(
        200, json={"agreement": agreement_payload(versions=[version_payload()])}
    )
    created = respx_mock.post(f"{base_url}{PATH}/agreements").respond(201, json={"agreement": agreement_payload()})
    renamed = respx_mock.patch(f"{base_url}{PATH}/agreements/a-1").respond(
        200, json={"agreement": agreement_payload(name="Terms of Use")}
    )

    detail = endpoint.clickwrap.get_agreement("a-1")
    endpoint.clickwrap.create_agreement(ClickwrapAgreementCreateParams(key="terms-of-service", name="Terms of Service"))
    agreement = endpoint.clickwrap.rename_agreement("a-1", "Terms of Use")

    assert detail.versions[0].content == "<p>Be nice.</p>"
    assert payloads.request_json(created) == {"key": "terms-of-service", "name": "Terms of Service"}
    assert payloads.request_json(renamed) == {"name": "Terms of Use"}
    assert agreement.name == "Terms of Use"


def test_draft_lifecycle(endpoint, payloads, respx_mock, base_url):
    created = respx_mock.post(f"{base_url}{PATH}/agreements/a-1/versions").respond(
        201, json={"version": version_payload()}
    )
    updated = respx_mock.patch(f"{base_url}{PATH}/versions/v-1").respond(200, json={"version": version_payload()})
    published = respx_mock.post(f"{base_url}{PATH}/versions/v-1/publish").respond(
        200, json={"version": version_payload(status="published", content_hash="c" * 64, published_at=NOW)}
    )
    deleted = respx_mock.delete(f"{base_url}{PATH}/versions/v-2").respond(204)

    endpoint.clickwrap.create_draft("a-1", ClickwrapDraftCreateParams(copy_current=True))
    endpoint.clickwrap.update_draft("v-1", "<p>Be nice.</p>")
    version = endpoint.clickwrap.publish_version("v-1", ClickwrapPublishParams(requires_reacceptance=True))
    assert endpoint.clickwrap.delete_draft("v-2") is None

    assert payloads.request_json(created) == {"copy_current": True}
    assert payloads.request_json(updated) == {"content": "<p>Be nice.</p>"}
    # change_summary was never set, so it stays off the wire
    assert payloads.request_json(published) == {"requires_reacceptance": True}
    assert version.status == "published"
    assert deleted.called


def test_create_draft_without_params_sends_an_empty_body(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{PATH}/agreements/a-1/versions").respond(
        201, json={"version": version_payload()}
    )

    endpoint.clickwrap.create_draft("a-1")

    assert payloads.request_json(route) == {}


def test_get_coverage(endpoint, respx_mock, base_url):
    coverage = {
        "agreement_id": "a-1",
        "cutoff_number": 2,
        "accepted_any": 10,
        "current": 7,
        "versions": [{"id": "v-2", "number": 2, "published_at": NOW, "requires_reacceptance": True, "people": 7}],
    }
    respx_mock.get(f"{base_url}{PATH}/agreements/a-1/coverage").respond(200, json=coverage)

    result = endpoint.clickwrap.get_coverage("a-1")

    assert (result.accepted_any, result.current, result.versions[0].people) == (10, 7, 7)


def test_get_status_joins_keys_into_one_query_value(endpoint, respx_mock, base_url):
    route = respx_mock.get(f"{base_url}{PATH}/status").respond(
        200,
        json=[
            {"key": "terms-of-service", "current": True, "pending_version": None},
            {
                "key": "privacy",
                "current": False,
                "pending_version": {"id": "v-9", "number": 2, "requires_reacceptance": True},
            },
        ],
    )

    status = endpoint.clickwrap.get_status("user-1", ["terms-of-service", "privacy"])

    assert dict(route.calls.last.request.url.params) == {"user_id": "user-1", "agreements": "terms-of-service,privacy"}
    assert status[1].pending_version is not None
    assert status[1].pending_version.number == 2


def test_create_session_returns_the_right_shape(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{PATH}/session")
    route.side_effect = [
        httpx.Response(
            200, json={"current": True, "agreements": [{"key": "tos", "current": True, "pending_version": None}]}
        ),
        httpx.Response(
            201,
            json={
                "current": False,
                "id": "s-1",
                "token": TOKEN,
                "expires_at": NOW,
                "agreements": ["tos"],
                "hosted_url": f"https://app.verdocs.com/accept#{TOKEN}",
                "status": [{"key": "tos", "current": False, "pending_version": None}],
            },
        ),
    ]
    params = ClickwrapSessionCreateParams(user_id="user-1", agreements=["tos"], mode="inline")

    current = endpoint.clickwrap.create_session(params)
    created = endpoint.clickwrap.create_session(params)

    assert isinstance(current, ClickwrapSessionCurrent)
    assert isinstance(created, ClickwrapSessionCreated)
    assert created.token == TOKEN
    assert payloads.request_json(route) == {"user_id": "user-1", "agreements": ["tos"], "mode": "inline"}


def test_record_outcome_sends_only_what_was_set(endpoint, payloads, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{PATH}/acceptances").respond(201, json=OUTCOME_RESULT)

    result = endpoint.clickwrap.record_outcome(
        ClickwrapOutcomeRecordParams(
            user_id="user-1",
            outcome="accepted",
            agreements=[ClickwrapOutcomeAgreement(key="tos", version_id="v-1")],
            ip_address="203.0.113.7",
        )
    )

    assert payloads.request_json(route) == {
        "user_id": "user-1",
        "outcome": "accepted",
        "agreements": [{"key": "tos", "version_id": "v-1"}],
        "ip_address": "203.0.113.7",
    }
    assert result.acceptance_id == "r-1"


def test_list_and_get_acceptances(endpoint, respx_mock, base_url):
    summary = {
        "id": "r-1",
        "outcome": "accepted",
        "user_id": "user-1",
        "metadata": None,
        "surface": "headless",
        "reported_by": "customer",
        "created_at": NOW,
        "agreements": [{"key": "tos", "version_id": "v-1", "number": 1}],
    }
    listed = respx_mock.get(f"{base_url}{PATH}/acceptances").respond(
        200, json={"count": 1, "rows": 10, "page": 0, "acceptances": [summary]}
    )
    respx_mock.get(f"{base_url}{PATH}/acceptances/r-1").respond(200, json=acceptance_payload())

    page = endpoint.clickwrap.list_acceptances(
        ClickwrapAcceptanceListParams(metadata_key="email", metadata_value="pat@example.com", rows=10)
    )
    record = endpoint.clickwrap.get_acceptance("r-1")

    assert dict(listed.calls.last.request.url.params) == {
        "metadata_key": "email",
        "metadata_value": "pat@example.com",
        "rows": "10",
    }
    assert page.acceptances[0].agreements[0].number == 1
    assert isinstance(record, ClickwrapAcceptance)
    assert record.items[0].agreement_version.agreement.key == "terms-of-service"
    assert record.events[0].event == "accepted"


def test_get_download_link(endpoint, respx_mock, base_url):
    route = respx_mock.get(f"{base_url}{PATH}/acceptances/r-1/download").respond(
        200, json={"type": "evidence", "url": "https://s3.test/evidence.zip", "expires_in": 900}
    )

    link = endpoint.clickwrap.get_download_link("r-1", "evidence")

    assert dict(route.calls.last.request.url.params) == {"type": "evidence"}
    assert link.expires_in == 900


def test_session_calls_send_the_session_token(endpoint, payloads, respx_mock, base_url):
    session = respx_mock.get(f"{base_url}{PATH}/session").respond(
        200,
        json={
            "id": "s-1",
            "expires_at": NOW,
            "mode": "modal",
            "require_scroll": False,
            "agreements": [{"key": "tos", "name": "Terms", "version_id": "v-1", "number": 1, "content": "<p>x</p>"}],
            "brand": None,
        },
    )
    events = respx_mock.post(f"{base_url}{PATH}/session/events").respond(204)
    accepted = respx_mock.post(f"{base_url}{PATH}/session/accept").respond(201, json=OUTCOME_RESULT)
    declined = respx_mock.post(f"{base_url}{PATH}/session/decline").respond(
        201, json={**OUTCOME_RESULT, "outcome": "declined"}
    )
    client_at = datetime(2026, 11, 12, 15, 0, tzinfo=timezone.utc)

    shown = endpoint.clickwrap.get_session(TOKEN)
    endpoint.clickwrap.send_event(TOKEN, ClickwrapEventParams(event="checked", version_id="v-1", client_at=client_at))
    endpoint.clickwrap.accept(TOKEN, SESSION_OUTCOME)
    result = endpoint.clickwrap.decline(TOKEN, SESSION_OUTCOME)

    for route in (session, events, accepted, declined):
        assert route.calls.last.request.headers["Authorization"] == f"Bearer {TOKEN}"
    assert shown.agreements[0].version_id == "v-1"
    assert payloads.request_json(events) == {
        "event": "checked",
        "version_id": "v-1",
        "client_at": "2026-11-12T15:00:00Z",
    }
    assert payloads.request_json(accepted)["surface"] == "component"
    assert result.outcome == "declined"


def test_session_token_does_not_replace_the_endpoint_session(endpoint, token_factory, respx_mock, base_url):
    user_token = token_factory()
    endpoint.set_token(user_token)
    respx_mock.get(f"{base_url}{PATH}/session").respond(
        200, json={"id": "s-1", "expires_at": NOW, "mode": "modal", "require_scroll": False, "agreements": []}
    )
    agreements = respx_mock.get(f"{base_url}{PATH}/agreements").respond(200, json={"agreements": []})

    endpoint.clickwrap.get_session(TOKEN)
    endpoint.clickwrap.list_agreements()

    assert endpoint.token == user_token
    assert agreements.calls.last.request.headers["Authorization"] == f"Bearer {user_token}"


def test_rejected_session_token_raises_authentication_error(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{PATH}/session").respond(401, json={"error": "invalid session"})

    with pytest.raises(AuthenticationError):
        endpoint.clickwrap.get_session(TOKEN)


async def test_async_status_and_session_calls(async_endpoint, payloads, respx_mock, base_url):
    status = respx_mock.get(f"{base_url}{PATH}/status").respond(
        200, json=[{"key": "tos", "current": True, "pending_version": None}]
    )
    accepted = respx_mock.post(f"{base_url}{PATH}/session/accept").respond(201, json=OUTCOME_RESULT)

    entries = await async_endpoint.clickwrap.get_status("user-1", ["tos"])
    result = await async_endpoint.clickwrap.accept(TOKEN, SESSION_OUTCOME)

    assert dict(status.calls.last.request.url.params) == {"user_id": "user-1", "agreements": "tos"}
    assert entries[0].current is True
    assert accepted.calls.last.request.headers["Authorization"] == f"Bearer {TOKEN}"
    assert result.acceptance_id == "r-1"


async def test_async_agreements_and_records(async_endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{PATH}/agreements").respond(200, json={"agreements": [agreement_payload()]})
    respx_mock.post(f"{base_url}{PATH}/session").respond(200, json={"current": True, "agreements": []})
    respx_mock.get(f"{base_url}{PATH}/acceptances/r-1").respond(200, json=acceptance_payload())
    respx_mock.delete(f"{base_url}{PATH}/versions/v-2").respond(204)

    agreements = await async_endpoint.clickwrap.list_agreements()
    session = await async_endpoint.clickwrap.create_session(
        ClickwrapSessionCreateParams(user_id="user-1", agreements=["tos"])
    )
    record = await async_endpoint.clickwrap.get_acceptance("r-1")
    await async_endpoint.clickwrap.delete_draft("v-2")

    assert agreements[0].key == "terms-of-service"
    assert isinstance(session, ClickwrapSessionCurrent)
    assert record.sequence == 3
