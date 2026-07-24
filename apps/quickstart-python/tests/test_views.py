"""login and create_policy: stub the Verdocs API with respx, never touch the live network."""

from __future__ import annotations

import base64
import json

import pytest
import respx
from django.test import Client, override_settings
from httpx import Response

BASE_URL = "https://api.verdocs.test"
CLIENT_ID = "client-1234"
CLIENT_SECRET = "client-secret-value"


def _auth_payload() -> dict:
    return {
        "access_token": "access-token-value",
        "id_token": "id-token-value",
        "refresh_token": "refresh-token-value",
        "expires_in": 3600,
        "access_token_exp": 9999999999,
        "refresh_token_exp": 9999999999,
    }


def _envelope_payload(**overrides) -> dict:
    payload = {
        "id": "envelope-1234",
        "status": "pending",
        "profile_id": "profile-1234",
        "template_id": None,
        "organization_id": "org-1234",
        "name": "Auto Policy",
        "max_reminder_days": 14,
        "visibility": "private",
        "signed": False,
        "recipients": [
            {
                "envelope_id": "envelope-1234",
                "role_name": "Policyholder",
                "status": "invited",
                "first_name": "Paige",
                "last_name": "Turner",
                "email": "paige.turner@nomail.com",
                "sequence": 1,
                "order": 1,
                "type": "signer",
                "delegator": False,
                "claimed": False,
                "agreed": False,
                "name_locked": False,
                "created_at": "2026-01-01T00:00:00.000Z",
                "updated_at": "2026-01-01T00:00:00.000Z",
            }
        ],
        "created_at": "2026-01-01T00:00:00.000Z",
        "updated_at": "2026-01-01T00:00:00.000Z",
    }
    payload.update(overrides)
    return payload


@pytest.fixture
def client() -> Client:
    return Client()


@override_settings(VERDOCS_BASE_URL=BASE_URL, VERDOCS_CLIENT_ID=CLIENT_ID, VERDOCS_CLIENT_SECRET=CLIENT_SECRET)
def test_login_authenticates_and_returns_tokens(client):
    with respx.mock(assert_all_called=True) as router:
        route = router.post(f"{BASE_URL}/v2/oauth2/token").mock(return_value=Response(200, json=_auth_payload()))

        response = client.post("/api/auth/login/")

    assert response.status_code == 200
    assert response.json()["access_token"] == "access-token-value"
    sent_body = json.loads(route.calls.last.request.content)
    assert sent_body == {
        "grant_type": "client_credentials",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    }


@override_settings(VERDOCS_BASE_URL=BASE_URL, VERDOCS_CLIENT_ID="", VERDOCS_CLIENT_SECRET="")
def test_login_without_configured_credentials_returns_500(client):
    response = client.post("/api/auth/login/")

    assert response.status_code == 500


@override_settings(VERDOCS_BASE_URL=BASE_URL, VERDOCS_CLIENT_ID=CLIENT_ID, VERDOCS_CLIENT_SECRET=CLIENT_SECRET)
def test_login_rejected_credentials_propagates_status(client):
    with respx.mock(assert_all_called=True) as router:
        router.post(f"{BASE_URL}/v2/oauth2/token").mock(
            return_value=Response(401, json={"error": "invalid credentials"})
        )

        response = client.post("/api/auth/login/")

    assert response.status_code == 401


@override_settings(VERDOCS_BASE_URL=BASE_URL)
def test_create_policy_requires_bearer_token(client):
    response = client.post(
        "/api/policies/",
        data=json.dumps({"policyholder": {"first_name": "Paige", "last_name": "Turner", "email": "p@nomail.com"}}),
        content_type="application/json",
    )

    assert response.status_code == 401


@override_settings(VERDOCS_BASE_URL=BASE_URL)
def test_create_policy_creates_envelope_from_i9_document(client):
    with respx.mock(assert_all_called=True) as router:
        route = router.post(f"{BASE_URL}/v2/envelopes").mock(return_value=Response(200, json=_envelope_payload()))

        response = client.post(
            "/api/policies/",
            data=json.dumps(
                {
                    "policy_name": "Auto Policy",
                    "policyholder": {"first_name": "Paige", "last_name": "Turner", "email": "paige.turner@nomail.com"},
                }
            ),
            content_type="application/json",
            HTTP_AUTHORIZATION="Bearer access-token-value",
        )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == "envelope-1234"
    assert body["recipients"][0]["email"] == "paige.turner@nomail.com"

    sent_body = json.loads(route.calls.last.request.content)
    assert "template_id" not in sent_body
    assert sent_body["recipients"][0]["role_name"] == "Policyholder"
    assert sent_body["recipients"][0]["type"] == "signer"
    assert len(sent_body["documents"]) == 1
    assert sent_body["documents"][0]["name"] == "i-9.pdf"
    assert sent_body["documents"][0]["mime"] == "application/pdf"
    assert base64.b64decode(sent_body["documents"][0]["data"])[:5] == b"%PDF-"


@override_settings(VERDOCS_BASE_URL=BASE_URL)
def test_create_policy_missing_policyholder_fields_returns_400(client):
    response = client.post(
        "/api/policies/",
        data=json.dumps({"policyholder": {"first_name": "Paige"}}),
        content_type="application/json",
        HTTP_AUTHORIZATION="Bearer access-token-value",
    )

    assert response.status_code == 400
