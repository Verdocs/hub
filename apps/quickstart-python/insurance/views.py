"""A mock insurance company: the integration authenticates as itself, then issues a policy for the
policyholder to sign.

The two routes exercise the two Verdocs SDK operations this quickstart exists to show: login()
calls auth.authenticate, create_policy() calls envelopes.create.
"""

from __future__ import annotations

import base64
import json
from pathlib import Path

from django.conf import settings
from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from verdocs import (
    ClientCredentialsRequest,
    EnvelopeCreateDirectParams,
    EnvelopeCreateDocumentFromData,
    EnvelopeCreateRecipientDirect,
    VerdocsAPIError,
    VerdocsConnectionError,
    VerdocsEndpoint,
)

# The policy document: no template involved, so the PDF is attached directly on every envelope.
_I9_DOCUMENT_PATH = Path(__file__).resolve().parent.parent / "assets" / "i-9.pdf"
_I9_DOCUMENT_BASE64 = base64.b64encode(_I9_DOCUMENT_PATH.read_bytes()).decode("ascii")


def _json_body(request: HttpRequest) -> dict | None:
    try:
        return json.loads(request.body or b"{}")
    except json.JSONDecodeError:
        return None


def _bearer_token(request: HttpRequest) -> str | None:
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    return header.removeprefix("Bearer ")


@csrf_exempt
@require_POST
def login(request: HttpRequest) -> JsonResponse:
    """Authenticate this integration against Verdocs via the client_credentials grant.

    Uses the client ID and secret from an API key (Settings > API Keys at
    https://app.verdocs.com, with global admin access enabled), configured as
    VERDOCS_CLIENT_ID and VERDOCS_CLIENT_SECRET. No request body is needed:
    the credentials identify the integration itself, not an individual user.
    """
    if not settings.VERDOCS_CLIENT_ID or not settings.VERDOCS_CLIENT_SECRET:
        return JsonResponse({"error": "VERDOCS_CLIENT_ID and VERDOCS_CLIENT_SECRET are not configured"}, status=500)

    with VerdocsEndpoint(base_url=settings.VERDOCS_BASE_URL) as endpoint:
        try:
            tokens = endpoint.auth.authenticate(
                ClientCredentialsRequest(
                    client_id=settings.VERDOCS_CLIENT_ID,
                    client_secret=settings.VERDOCS_CLIENT_SECRET,
                )
            )
        except VerdocsAPIError as exc:
            return JsonResponse({"error": str(exc), "detail": exc.body}, status=exc.status_code)
        except VerdocsConnectionError as exc:
            return JsonResponse({"error": str(exc)}, status=502)

    return JsonResponse(
        {
            "access_token": tokens.access_token,
            "refresh_token": tokens.refresh_token,
            "expires_in": tokens.expires_in,
        }
    )


@csrf_exempt
@require_POST
def create_policy(request: HttpRequest) -> JsonResponse:
    """Issue a policy for signature by creating an envelope directly from the bundled I-9 PDF.

    No template is involved: assets/i-9.pdf is attached to the envelope as base64 data on every
    call. Requires an Authorization: Bearer <access_token> header from a prior login() call.
    Body: {"policy_name": "...", "policyholder": {"first_name": "...", "last_name": "...", "email": "..."}}
    """
    token = _bearer_token(request)
    if not token:
        return JsonResponse({"error": "Authorization: Bearer <access_token> header is required"}, status=401)

    body = _json_body(request)
    policyholder = (body or {}).get("policyholder") or {}
    required_fields = ("first_name", "last_name", "email")
    if not all(policyholder.get(field) for field in required_fields):
        return JsonResponse({"error": "policyholder.first_name, last_name, and email are required"}, status=400)

    with VerdocsEndpoint(base_url=settings.VERDOCS_BASE_URL) as endpoint:
        endpoint.set_token(token)
        params = EnvelopeCreateDirectParams(
            name=body.get("policy_name") or "New Policy",
            recipients=[
                EnvelopeCreateRecipientDirect(
                    type="signer",
                    role_name=settings.VERDOCS_POLICY_ROLE_NAME,
                    first_name=policyholder["first_name"],
                    last_name=policyholder["last_name"],
                    email=policyholder["email"],
                )
            ],
            documents=[
                EnvelopeCreateDocumentFromData(
                    name="i-9.pdf",
                    mime="application/pdf",
                    data=_I9_DOCUMENT_BASE64,
                )
            ],
        )
        try:
            envelope = endpoint.envelopes.create(params)
        except VerdocsAPIError as exc:
            return JsonResponse({"error": str(exc), "detail": exc.body}, status=exc.status_code)
        except VerdocsConnectionError as exc:
            return JsonResponse({"error": str(exc)}, status=502)

    print(f"Envelope created w/out Template (envelope_id = {envelope.id}, envelope_name = {envelope.name})")

    return JsonResponse(
        {
            "id": envelope.id,
            "status": envelope.status,
            "name": envelope.name,
            "recipients": [
                {"role_name": r.role_name, "email": r.email, "status": r.status} for r in envelope.recipients
            ],
        }
    )
