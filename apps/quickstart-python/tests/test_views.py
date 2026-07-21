"""login and create_policy: stub the Verdocs API with respx, never touch the live network."""

from __future__ import annotations

import json

import pytest
import respx
from django.test import Client, override_settings
from httpx import Response

BASE_URL = "https://api.verdocs.test"
TEMPLATE_ID = "template-1234"


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
        "template_id": TEMPLATE_ID,
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


@override_settings(VERDOCS_BASE_URL=BASE_URL, VERDOCS_TEMPLATE_ID=TEMPLATE_ID)
def test_login_authenticates_and_returns_tokens(client):
    with respx.mock(assert_all_called=True) as router:
        router.post(f"{BASE_URL}/v2/oauth2/token").mock(return_value=Response(200, json=_auth_payload()))

        response = client.post(
            "/api/auth/login/",
            data=json.dumps({"email": "agent@example.com", "password": "secret"}),
            content_type="application/json",
        )

    assert response.status_code == 200
    assert response.json()["access_token"] == "access-token-value"


@override_settings(VERDOCS_BASE_URL=BASE_URL, VERDOCS_TEMPLATE_ID=TEMPLATE_ID)
def test_login_missing_credentials_returns_400(client):
    response = client.post("/api/auth/login/", data=json.dumps({}), content_type="application/json")

    assert response.status_code == 400


@override_settings(VERDOCS_BASE_URL=BASE_URL, VERDOCS_TEMPLATE_ID=TEMPLATE_ID)
def test_login_rejected_credentials_propagates_status(client):
    with respx.mock(assert_all_called=True) as router:
        router.post(f"{BASE_URL}/v2/oauth2/token").mock(
            return_value=Response(401, json={"error": "invalid credentials"})
        )

        response = client.post(
            "/api/auth/login/",
            data=json.dumps({"email": "agent@example.com", "password": "wrong"}),
            content_type="application/json",
        )

    assert response.status_code == 401


@override_settings(VERDOCS_BASE_URL=BASE_URL, VERDOCS_TEMPLATE_ID=TEMPLATE_ID)
def test_create_policy_requires_bearer_token(client):
    response = client.post(
        "/api/policies/",
        data=json.dumps({"policyholder": {"first_name": "Paige", "last_name": "Turner", "email": "p@nomail.com"}}),
        content_type="application/json",
    )

    assert response.status_code == 401


@override_settings(VERDOCS_BASE_URL=BASE_URL, VERDOCS_TEMPLATE_ID=TEMPLATE_ID)
def test_create_policy_creates_envelope_from_template(client):
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
    assert sent_body["template_id"] == TEMPLATE_ID
    assert sent_body["recipients"][0]["role_name"] == "Policyholder"


@override_settings(VERDOCS_BASE_URL=BASE_URL, VERDOCS_TEMPLATE_ID=TEMPLATE_ID)
def test_create_policy_missing_policyholder_fields_returns_400(client):
    response = client.post(
        "/api/policies/",
        data=json.dumps({"policyholder": {"first_name": "Paige"}}),
        content_type="application/json",
        HTTP_AUTHORIZATION="Bearer access-token-value",
    )

    assert response.status_code == 400


@override_settings(VERDOCS_BASE_URL=BASE_URL, VERDOCS_TEMPLATE_ID="")
def test_create_policy_without_template_id_returns_500(client):
    response = client.post(
        "/api/policies/",
        data=json.dumps(
            {"policyholder": {"first_name": "Paige", "last_name": "Turner", "email": "paige.turner@nomail.com"}}
        ),
        content_type="application/json",
        HTTP_AUTHORIZATION="Bearer access-token-value",
    )

    assert response.status_code == 500
