"""recipients agree/decline/submit, signing sessions, verify, delegate, and updates: sync and async."""

from __future__ import annotations

import json
from typing import Any

import pytest

from verdocs import InPersonAccessKey, NotFoundError, Recipient
from verdocs.models.envelopes import (
    InPersonLinkResponse,
    RecipientAgreeParams,
    RecipientDelegateParams,
    RecipientSubmitParams,
    RecipientUpdateParams,
    RecipientVerifyKBAParams,
    RecipientVerifyPasscodeParams,
    SignerTokenResponse,
)
from verdocs.resources.recipients import AsyncRecipients, Recipients

RECIPIENT_URL = "/v2/envelopes/envelope-1234/recipients/Recipient%201"
SIGN_URL = "/v2/sign"


def envelope_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": "envelope-1234",
        "status": "pending",
        "profile_id": "profile-1234",
        "organization_id": "org-1234",
        "name": "Test Envelope",
        "sender_name": "Test User",
        "sender_email": "test@example.com",
        "max_reminder_days": 14,
        "created_at": "2026-01-01T00:00:00.000Z",
        "updated_at": "2026-01-02T00:00:00.000Z",
        "visibility": "private",
        "signed": False,
    }
    payload.update(overrides)
    return payload


def recipient_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "envelope_id": "envelope-1234",
        "role_name": "Recipient 1",
        "status": "invited",
        "first_name": "Paige",
        "last_name": "Turner",
        "email": "paige.turner@example.com",
        "phone": None,
        "sequence": 1,
        "order": 1,
        "type": "signer",
        "delegator": False,
        "message": None,
        "claimed": False,
        "agreed": False,
        "name_locked": False,
        "created_at": "2026-01-01T00:00:00.000Z",
        "updated_at": "2026-01-02T00:00:00.000Z",
    }
    payload.update(overrides)
    return payload


def signer_token_payload(access_token: str, **overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "access_token": access_token,
        "envelope": envelope_payload(),
        "recipient": recipient_payload(),
        "signatures": [],
        "initials": [],
        "brand": None,
    }
    payload.update(overrides)
    return payload


def in_person_link_payload(access_token: str) -> dict[str, Any]:
    return {
        "link": "https://app.verdocs.test/sign/envelope-1234",
        "access_token": access_token,
        "access_key": {
            "id": "key-1234",
            "type": "in_person_link",
            "authentication": None,
            "role_name": "Recipient 1",
            "envelope_id": "envelope-1234",
            "key": "raw-access-key",
            "expiration_date": None,
            "created_at": "2026-01-01T00:00:00.000Z",
            "first_used": None,
            "last_used": None,
        },
        "envelope": envelope_payload(),
        "recipient": recipient_payload(),
    }


def request_json(route: Any) -> Any:
    return json.loads(route.calls.last.request.content)


def test_agree_sends_disclosures_and_locale(endpoint, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{RECIPIENT_URL}/agree").respond(200, json=recipient_payload(agreed=True))

    recipient = Recipients(endpoint).agree(
        "envelope-1234",
        "Recipient 1",
        disclosures="<ul><li>Agree...</li></ul>",
        params=RecipientAgreeParams(timezone="America/New_York"),
    )

    assert isinstance(recipient, Recipient)
    assert recipient.agreed is True
    assert request_json(route) == {"disclosures": "<ul><li>Agree...</li></ul>", "timezone": "America/New_York"}


def test_agree_without_optionals_sends_empty_body(endpoint, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{RECIPIENT_URL}/agree").respond(200, json=recipient_payload(agreed=True))

    Recipients(endpoint).agree("envelope-1234", "Recipient 1")

    assert request_json(route) == {}


def test_decline_posts_without_body(endpoint, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{RECIPIENT_URL}/decline").respond(
        200, json=recipient_payload(status="declined")
    )

    recipient = Recipients(endpoint).decline("envelope-1234", "Recipient 1")

    assert recipient.status == "declined"
    assert route.calls.last.request.content == b""


def test_submit_sends_locale_details(endpoint, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{RECIPIENT_URL}/submit").respond(
        200, json=recipient_payload(status="submitted")
    )

    recipient = Recipients(endpoint).submit(
        "envelope-1234", "Recipient 1", RecipientSubmitParams(locale="en-US", timezone="America/New_York")
    )

    assert recipient.status == "submitted"
    assert request_json(route) == {"locale": "en-US", "timezone": "America/New_York"}


def test_start_signing_session_applies_signing_token(endpoint, respx_mock, base_url, token_factory):
    token = token_factory("signing")
    respx_mock.post(f"{base_url}{SIGN_URL}/unauth/envelope-1234/Recipient%201/key-abc").respond(
        200, json=signer_token_payload(token)
    )

    session = Recipients(endpoint).start_signing_session("envelope-1234", "Recipient 1", "key-abc")

    assert isinstance(session, SignerTokenResponse)
    assert session.recipient.role_name == "Recipient 1"
    # The signing token is applied to the endpoint, mirroring the js-sdk.
    assert endpoint.token == token
    assert endpoint.session_type == "signing"
    assert endpoint.session is not None


def test_get_in_person_link_parses_access_key(endpoint, respx_mock, base_url, token_factory):
    respx_mock.post(f"{base_url}{SIGN_URL}/in-person/envelope-1234/Recipient%201").respond(
        200, json=in_person_link_payload(token_factory("signing"))
    )

    result = Recipients(endpoint).get_in_person_link("envelope-1234", "Recipient 1")

    assert isinstance(result, InPersonLinkResponse)
    assert isinstance(result.access_key, InPersonAccessKey)
    assert result.access_key.key == "raw-access-key"
    # Unlike start_signing_session, the endpoint session is left alone.
    assert endpoint.token is None


def test_verify_signer_passcode_sends_auth_method_tag(endpoint, respx_mock, base_url, token_factory):
    route = respx_mock.post(f"{base_url}{SIGN_URL}/verify").respond(
        200, json=signer_token_payload(token_factory("signing"))
    )

    session = Recipients(endpoint).verify_signer(RecipientVerifyPasscodeParams(code="1234"))

    assert isinstance(session, SignerTokenResponse)
    # The defaulted discriminator must reach the wire.
    assert request_json(route) == {"auth_method": "passcode", "code": "1234"}


def test_verify_signer_kba_sends_identity_and_responses(endpoint, respx_mock, base_url, token_factory):
    route = respx_mock.post(f"{base_url}{SIGN_URL}/verify").respond(
        200, json=signer_token_payload(token_factory("signing"))
    )

    Recipients(endpoint).verify_signer(
        RecipientVerifyKBAParams(
            first_name="Paige",
            last_name="Turner",
            address="123 Main St",
            zip="12345",
            responses=[{"type": "question", "answer": 2}],
        )
    )

    assert request_json(route) == {
        "auth_method": "kba",
        "first_name": "Paige",
        "last_name": "Turner",
        "address": "123 Main St",
        "zip": "12345",
        "responses": [{"type": "question", "answer": 2}],
    }


def test_delegate_posts_new_recipient_details(endpoint, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{RECIPIENT_URL}/delegate").respond(
        200, json=recipient_payload(first_name="Will", last_name="Power", email="will.power@example.com")
    )

    recipient = Recipients(endpoint).delegate(
        "envelope-1234",
        "Recipient 1",
        RecipientDelegateParams(first_name="Will", last_name="Power", email="will.power@example.com"),
    )

    assert recipient.email == "will.power@example.com"
    assert request_json(route) == {"first_name": "Will", "last_name": "Power", "email": "will.power@example.com"}


def test_update_patches_only_set_fields(endpoint, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{RECIPIENT_URL}").respond(200, json=recipient_payload(email="new@example.com"))

    recipient = Recipients(endpoint).update(
        "envelope-1234", "Recipient 1", RecipientUpdateParams(email="new@example.com")
    )

    assert recipient.email == "new@example.com"
    assert request_json(route) == {"email": "new@example.com"}


def test_update_missing_raises_not_found(endpoint, respx_mock, base_url):
    respx_mock.patch(f"{base_url}/v2/envelopes/nope/recipients/Recipient%201").respond(404, json={"error": "not found"})

    with pytest.raises(NotFoundError):
        Recipients(endpoint).update("nope", "Recipient 1", RecipientUpdateParams(email="new@example.com"))


def test_remind_sends_action(endpoint, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{RECIPIENT_URL}").respond(200, json=recipient_payload())

    recipient = Recipients(endpoint).remind("envelope-1234", "Recipient 1")

    assert isinstance(recipient, Recipient)
    assert request_json(route) == {"action": "remind"}


def test_reset_sends_action(endpoint, respx_mock, base_url):
    route = respx_mock.patch(f"{base_url}{RECIPIENT_URL}").respond(200, json=recipient_payload())

    Recipients(endpoint).reset("envelope-1234", "Recipient 1")

    assert request_json(route) == {"action": "reset"}


def test_ask_question_posts_and_returns_none(endpoint, respx_mock, base_url):
    route = respx_mock.post(f"{base_url}{RECIPIENT_URL}/ask-question").respond(200, json={"status": "OK"})

    result = Recipients(endpoint).ask_question("envelope-1234", "Recipient 1", "When is this due?")

    # The server answers {status: OK} with no other data, so the SDK returns None.
    assert result is None
    assert request_json(route) == {"question": "When is this due?"}


async def test_async_agree_and_submit(async_endpoint, respx_mock, base_url):
    agree_route = respx_mock.post(f"{base_url}{RECIPIENT_URL}/agree").respond(200, json=recipient_payload(agreed=True))
    submit_route = respx_mock.post(f"{base_url}{RECIPIENT_URL}/submit").respond(
        200, json=recipient_payload(status="submitted")
    )
    recipients = AsyncRecipients(async_endpoint)

    agreed = await recipients.agree("envelope-1234", "Recipient 1", disclosures="text")
    submitted = await recipients.submit("envelope-1234", "Recipient 1")

    assert agreed.agreed is True
    assert submitted.status == "submitted"
    assert request_json(agree_route) == {"disclosures": "text"}
    assert submit_route.calls.last.request.content == b""


async def test_async_start_signing_session_applies_signing_token(async_endpoint, respx_mock, base_url, token_factory):
    token = token_factory("signing")
    respx_mock.post(f"{base_url}{SIGN_URL}/unauth/envelope-1234/Recipient%201/key-abc").respond(
        200, json=signer_token_payload(token)
    )

    session = await AsyncRecipients(async_endpoint).start_signing_session("envelope-1234", "Recipient 1", "key-abc")

    assert session.envelope.id == "envelope-1234"
    assert async_endpoint.token == token
    assert async_endpoint.session_type == "signing"


async def test_async_verify_and_remind(async_endpoint, respx_mock, base_url, token_factory):
    verify_route = respx_mock.post(f"{base_url}{SIGN_URL}/verify").respond(
        200, json=signer_token_payload(token_factory("signing"))
    )
    remind_route = respx_mock.patch(f"{base_url}{RECIPIENT_URL}").respond(200, json=recipient_payload())
    recipients = AsyncRecipients(async_endpoint)

    await recipients.verify_signer(RecipientVerifyPasscodeParams(code="9999"))
    await recipients.remind("envelope-1234", "Recipient 1")

    assert request_json(verify_route) == {"auth_method": "passcode", "code": "9999"}
    assert request_json(remind_route) == {"action": "remind"}
