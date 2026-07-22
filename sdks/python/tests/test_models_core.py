"""Round-trip behavior of the shared wire models ported from js-sdk Models.ts.

Payload builders live in this module rather than conftest because only these
tests use them; each builder carries the full set of required fields so tests
only spell out what they care about.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from verdocs.models import (
    Brand,
    EmailAccessKey,
    Entitlement,
    Envelope,
    EnvelopeDocument,
    EnvelopeHistory,
    EnvelopeUpdateResult,
    InPersonAccessKey,
    Organization,
    Recipient,
    TemplateDocument,
    Webhook,
)

CREATED = "2026-01-01T00:00:00.000Z"
UPDATED = "2026-01-02T00:00:00.000Z"


def recipient_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "envelope_id": "envelope-1234",
        "role_name": "Recipient 1",
        "profile_id": None,
        "status": "invited",
        "first_name": "Sally",
        "last_name": "Signer",
        "email": "sally@example.com",
        "phone": None,
        "sequence": 1,
        "order": 1,
        "type": "signer",
        "delegator": False,
        "delegated_to": None,
        "message": None,
        "claimed": False,
        "agreed": False,
        "name_locked": False,
        "created_at": CREATED,
        "updated_at": UPDATED,
    }
    payload.update(overrides)
    return payload


def envelope_document_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": "document-1234",
        "envelope_id": "envelope-1234",
        "template_document_id": None,
        "order": 1,
        "type": "attachment",
        "name": "contract.pdf",
        "pages": 2,
        "mime": "application/pdf",
        "size": 12345,
        "signed": False,
        # The object-keyed shape live beta actually sends (weekend finding 4),
        # not the array the js-sdk types claim.
        "page_sizes": {"0": {"width": 612, "height": 792}, "1": {"width": 612, "height": 792}},
        "created_at": CREATED,
        "updated_at": UPDATED,
    }
    payload.update(overrides)
    return payload


def envelope_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": "envelope-1234",
        "status": "pending",
        "profile_id": "profile-1234",
        "template_id": "template-1234",
        "organization_id": "org-1234",
        "name": "Test Envelope",
        "sender_name": "Test User",
        "sender_email": "test@example.com",
        "initial_reminder": None,
        "followup_reminders": None,
        "max_reminder_days": 14,
        "next_reminder": None,
        "created_at": CREATED,
        "updated_at": UPDATED,
        "canceled_at": None,
        "visibility": "private",
        "signed": False,
        "data": None,
        "recipients": [recipient_payload()],
    }
    payload.update(overrides)
    return payload


def organization_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": "org-1234",
        "name": "Test Org",
        "parent_id": None,
        "deletion_protected": True,
        "created_at": CREATED,
        "updated_at": UPDATED,
    }
    payload.update(overrides)
    return payload


def brand_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": "brand-1234",
        "organization_id": "org-1234",
        "key": "default",
        "name": "Test Brand",
        "app_domain": "sign.example.com",
        "app_domain_status": "active",
        "email_domain": "example.com",
        "email_domain_status": "verified",
        "email_reply_to_verified": False,
        "email_spf_verified": True,
        "email_dkim_verified": True,
        "email_dmarc_verified": False,
        "email_dkim_tokens": ["token-1", "token-2"],
        "created_at": CREATED,
        "updated_at": UPDATED,
    }
    payload.update(overrides)
    return payload


def test_envelope_round_trip_with_relations():
    payload = envelope_payload(
        documents=[envelope_document_payload()],
        history_entries=[
            {
                "id": "history-1",
                "envelope_id": "envelope-1234",
                "role_name": "Recipient 1",
                "event": "recipient:invited",
                "event_detail": "mail",
                "created_at": CREATED,
            }
        ],
        access_keys=[
            {
                "id": "key-1",
                "type": "in_person_link",
                "role_name": "Recipient 1",
                "envelope_id": "envelope-1234",
                "key": "abc123",
                "expiration_date": None,
                "created_at": CREATED,
                "first_used": None,
                "last_used": None,
            },
            {
                "id": "key-2",
                "type": "email",
                "recipient_name": "Sally Signer",
                "envelope_id": "envelope-1234",
                "key": "def456",
                "expiration_date": None,
                "created_at": CREATED,
                "first_used": None,
                "last_used": None,
            },
        ],
        # A stand-in for the undocumented fields live beta sends.
        entra_tid="tenant-1234",
    )

    envelope = Envelope.model_validate(payload)

    assert envelope.status == "pending"
    assert envelope.created_at == datetime(2026, 1, 1, tzinfo=timezone.utc)
    assert envelope.canceled_at is None
    assert envelope.recipients is not None
    assert envelope.recipients[0].email == "sally@example.com"
    assert envelope.history_entries is not None
    assert envelope.history_entries[0].event == "recipient:invited"
    assert isinstance(envelope.history_entries[0], EnvelopeHistory)
    assert envelope.entra_tid == "tenant-1234"

    dumped = envelope.model_dump(mode="json")

    assert dumped["created_at"].startswith("2026-01-01T00:00:00")
    assert dumped["entra_tid"] == "tenant-1234"
    assert dumped["recipients"][0]["first_name"] == "Sally"


def test_access_keys_discriminate_on_type():
    envelope = Envelope.model_validate(
        envelope_payload(
            access_keys=[
                {
                    "id": "key-1",
                    "type": "in_person_link",
                    "role_name": "Recipient 1",
                    "envelope_id": "envelope-1234",
                    "key": "abc123",
                    "expiration_date": None,
                    "created_at": CREATED,
                    "first_used": None,
                    "last_used": None,
                },
                {
                    "id": "key-2",
                    "type": "email",
                    "recipient_name": "Sally Signer",
                    "envelope_id": "envelope-1234",
                    "key": "def456",
                    "expiration_date": None,
                    "created_at": CREATED,
                    "first_used": None,
                    "last_used": None,
                },
            ]
        )
    )

    assert envelope.access_keys is not None
    assert isinstance(envelope.access_keys[0], InPersonAccessKey)
    assert envelope.access_keys[0].role_name == "Recipient 1"
    assert isinstance(envelope.access_keys[1], EmailAccessKey)
    assert envelope.access_keys[1].recipient_name == "Sally Signer"


def test_envelope_update_result_parses_trimmed_payload():
    # The update endpoint returns an envelope without joined relations, which
    # is exactly why recipients is optional on the model.
    payload = envelope_payload()
    del payload["recipients"]

    result = EnvelopeUpdateResult.model_validate(payload)

    assert result.recipients is None
    assert result.name == "Test Envelope"


def test_page_sizes_accepts_both_wire_shapes():
    # Object keyed by page index (live beta) on envelope documents.
    document = EnvelopeDocument.model_validate(envelope_document_payload())
    assert document.page_sizes["1"] == {"width": 612, "height": 792}

    # The array shape the js-sdk types claim, on template documents.
    template_document = TemplateDocument.model_validate(
        {
            "id": "tdoc-1234",
            "name": "contract.pdf",
            "template_id": "template-1234",
            "order": 1,
            "pages": 1,
            "mime": "application/pdf",
            "size": 12345,
            "page_sizes": [{"width": 612.5, "height": 792}],
            "created_at": CREATED,
            "updated_at": UPDATED,
        }
    )
    assert template_document.page_sizes == [{"width": 612.5, "height": 792}]

    # Both shapes dump back out exactly as they arrived.
    assert document.model_dump(mode="json")["page_sizes"]["0"] == {"width": 612, "height": 792}
    assert template_document.model_dump(mode="json")["page_sizes"] == [{"width": 612.5, "height": 792}]


def test_recipient_kba_and_auth_fields():
    recipient = Recipient.model_validate(
        recipient_payload(
            auth_step="kba",
            auth_methods=["kba", "passcode"],
            auth_method_states={"kba": "questions", "passcode": None},
            passcode="123456",
            kba_questions=[
                {
                    "type": "multiple_choice",
                    "answer": ["10 Main St", "20 Oak Ave"],
                    "prompt": "Which address have you lived at?",
                }
            ],
        )
    )

    assert recipient.auth_methods == ["kba", "passcode"]
    assert recipient.auth_method_states == {"kba": "questions", "passcode": None}
    assert recipient.kba_questions is not None
    assert recipient.kba_questions[0].answer == ["10 Main St", "20 Oak Ave"]

    dumped = recipient.model_dump(mode="json")

    assert dumped["kba_questions"][0]["prompt"] == "Which address have you lived at?"


def test_webhook_events_keep_unknown_event_keys():
    webhook = Webhook.model_validate(
        {
            "id": "webhook-1234",
            "organization_id": "org-1234",
            "url": "https://hooks.example.com/verdocs",
            "auth_method": "hmac",
            "active": True,
            # An event name this SDK does not know about yet must not break parsing.
            "events": {"envelope_created": True, "totally_new_event": False},
            "status": "ok",
            "last_success": CREATED,
            "last_failure": None,
        }
    )

    assert webhook.events["envelope_created"] is True
    assert webhook.events["totally_new_event"] is False
    assert webhook.model_dump(mode="json")["events"]["totally_new_event"] is False


def test_organization_child_api_key_and_relations():
    organization = Organization.model_validate(
        organization_payload(
            api_key={"client_id": "client-1", "client_secret": "secret-1", "name": "Default"},
            entitlements=[
                {
                    "id": "ent-1",
                    "organization_id": "org-1234",
                    "feature": "envelope",
                    "starts_at": CREATED,
                    "ends_at": "2027-01-01T00:00:00.000Z",
                    "monthly_max": 100,
                    "yearly_max": 1200,
                    "created_at": CREATED,
                }
            ],
            brands=[brand_payload()],
            children=[organization_payload(id="org-5678", name="Child Org", parent_id="org-1234")],
            # A stand-in for the undocumented fields live beta sends.
            hubspot_company_id="hs-1",
        )
    )

    assert organization.api_key is not None
    assert organization.api_key.client_secret == "secret-1"
    assert organization.entitlements is not None
    assert isinstance(organization.entitlements[0], Entitlement)
    assert organization.entitlements[0].feature == "envelope"
    assert organization.brands is not None
    assert isinstance(organization.brands[0], Brand)
    assert organization.brands[0].email_dkim_tokens == ["token-1", "token-2"]
    assert organization.children is not None
    assert organization.children[0].parent_id == "org-1234"
    assert organization.hubspot_company_id == "hs-1"

    dumped = organization.model_dump(mode="json")

    assert dumped["api_key"]["name"] == "Default"
    assert dumped["hubspot_company_id"] == "hs-1"
