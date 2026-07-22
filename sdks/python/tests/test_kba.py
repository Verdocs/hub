"""kba stubs: routes, bodies, and step-union parsing, sync and async.

The /v2/kba routes do not exist on the deployed API (real KBA runs through
recipients.verify_signer); these tests exercise the code-faithful stubs
against mocked routes, plus the 404 behavior a live call sees today.
"""

from __future__ import annotations

import json
from typing import Any

import pytest

from verdocs import NotFoundError
from verdocs.models.envelopes import (
    KbaChallengeResponse,
    KbaIdentity,
    RecipientKbaStepChallenge,
    RecipientKbaStepFailed,
    RecipientKbaStepNone,
    RecipientKbaStepPin,
)
from verdocs.resources.kba import KBA, AsyncKBA

KBA_URL = "/v2/kba"


def kba_step_payload(kba_step: str, **overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "envelope_id": "envelope-1234",
        "role_name": "Recipient 1",
        "kba_step": kba_step,
    }
    payload.update(overrides)
    return payload


def request_json(route: Any) -> Any:
    return json.loads(route.calls.last.request.content)


def test_get_step_encodes_role_and_parses_none_step(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{KBA_URL}/envelope-1234/Recipient%201").respond(200, json=kba_step_payload("none"))

    step = KBA(endpoint).get_step("envelope-1234", "Recipient 1")

    assert isinstance(step, RecipientKbaStepNone)
    assert step.kba_step == "none"


def test_get_step_parses_challenge_questions(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{KBA_URL}/envelope-1234/Recipient%201").respond(
        200,
        json=kba_step_payload(
            "challenge",
            questions=[{"type": "multi", "message": "Which street have you lived on?", "options": ["Main", 42]}],
        ),
    )

    step = KBA(endpoint).get_step("envelope-1234", "Recipient 1")

    assert isinstance(step, RecipientKbaStepChallenge)
    assert step.questions[0].message == "Which street have you lived on?"
    assert step.questions[0].options == ["Main", 42]


def test_get_step_parses_failed_message(endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{KBA_URL}/envelope-1234/Recipient%201").respond(
        200, json=kba_step_payload("failed", message="Verification failed")
    )

    step = KBA(endpoint).get_step("envelope-1234", "Recipient 1")

    assert isinstance(step, RecipientKbaStepFailed)
    assert step.message == "Verification failed"


def test_get_step_dead_route_raises_not_found(endpoint, respx_mock, base_url):
    # What a live call sees today: nothing serves /v2/kba on the deployed API.
    respx_mock.get(f"{base_url}{KBA_URL}/envelope-1234/Recipient%201").respond(404, text="Not Found")

    with pytest.raises(NotFoundError):
        KBA(endpoint).get_step("envelope-1234", "Recipient 1")


def test_submit_pin_sends_identifiers_and_pin(endpoint, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{KBA_URL}/pin").respond(200, json=kba_step_payload("complete"))

    step = KBA(endpoint).submit_pin("envelope-1234", "Recipient 1", "12345")

    assert step.kba_step == "complete"
    assert request_json(route) == {"envelope_id": "envelope-1234", "role_name": "Recipient 1", "pin": "12345"}


def test_submit_identity_sends_camel_case_wire_names(endpoint, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{KBA_URL}/identity").respond(200, json=kba_step_payload("pin"))

    step = KBA(endpoint).submit_identity(
        "envelope-1234",
        "Recipient 1",
        KbaIdentity(firstName="Paige", lastName="Turner", address="123 Main St", ssnLast4="1234"),
    )

    assert isinstance(step, RecipientKbaStepPin)
    # This wire shape is camelCase, unlike the rest of the API.
    assert request_json(route) == {
        "envelope_id": "envelope-1234",
        "role_name": "Recipient 1",
        "identity": {"firstName": "Paige", "lastName": "Turner", "address": "123 Main St", "ssnLast4": "1234"},
    }


def test_submit_challenge_response_sends_answers_in_order(endpoint, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{KBA_URL}/response").respond(200, json=kba_step_payload("complete"))

    KBA(endpoint).submit_challenge_response(
        "envelope-1234",
        "Recipient 1",
        [KbaChallengeResponse(type="multi", answer="Main"), KbaChallengeResponse(type="multi", answer=2)],
    )

    assert request_json(route) == {
        "envelope_id": "envelope-1234",
        "role_name": "Recipient 1",
        "responses": [{"type": "multi", "answer": "Main"}, {"type": "multi", "answer": 2}],
    }


async def test_async_get_step_and_submit_pin(async_endpoint, respx_mock, base_url):
    respx_mock.get(f"{base_url}{KBA_URL}/envelope-1234/Recipient%201").respond(200, json=kba_step_payload("pin"))
    pin_route = respx_mock.post(f"{base_url}{KBA_URL}/pin").respond(200, json=kba_step_payload("complete"))
    kba = AsyncKBA(async_endpoint)

    step = await kba.get_step("envelope-1234", "Recipient 1")
    result = await kba.submit_pin("envelope-1234", "Recipient 1", "12345")

    assert isinstance(step, RecipientKbaStepPin)
    assert result.kba_step == "complete"
    assert request_json(pin_route)["pin"] == "12345"
