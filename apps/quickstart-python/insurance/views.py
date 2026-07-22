"""A mock insurance company: an agent logs in, then issues a policy for the policyholder to sign.

The two routes exercise the two Verdocs SDK operations this quickstart exists to show: login()
calls auth.authenticate, create_policy() calls envelopes.create.
"""

from __future__ import annotations

import json

from django.conf import settings
from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from verdocs import (
    EnvelopeCreateParams,
    EnvelopeCreateRecipient,
    PasswordGrantRequest,
    VerdocsAPIError,
    VerdocsConnectionError,
    VerdocsEndpoint,
)


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
    """Authenticate an insurance agent against Verdocs and hand back the access token.

    Body: {"email": "...", "password": "..."}
    """
    body = _json_body(request)
    if not body or not body.get("email") or not body.get("password"):
        return JsonResponse({"error": "email and password are required"}, status=400)

    with VerdocsEndpoint(base_url=settings.VERDOCS_BASE_URL) as endpoint:
        try:
            tokens = endpoint.auth.authenticate(PasswordGrantRequest(username=body["email"], password=body["password"]))
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
    """Issue a policy for signature by creating an envelope from the configured policy template.

    Requires an Authorization: Bearer <access_token> header from a prior login() call.
    Body: {"policy_name": "...", "policyholder": {"first_name": "...", "last_name": "...", "email": "..."}}
    """
    token = _bearer_token(request)
    if not token:
        return JsonResponse({"error": "Authorization: Bearer <access_token> header is required"}, status=401)

    if not settings.VERDOCS_TEMPLATE_ID:
        return JsonResponse({"error": "VERDOCS_TEMPLATE_ID is not configured"}, status=500)

    body = _json_body(request)
    policyholder = (body or {}).get("policyholder") or {}
    required_fields = ("first_name", "last_name", "email")
    if not all(policyholder.get(field) for field in required_fields):
        return JsonResponse({"error": "policyholder.first_name, last_name, and email are required"}, status=400)

    with VerdocsEndpoint(base_url=settings.VERDOCS_BASE_URL) as endpoint:
        endpoint.set_token(token)
        params = EnvelopeCreateParams(
            template_id=settings.VERDOCS_TEMPLATE_ID,
            name=body.get("policy_name") or "New Policy",
            recipients=[
                EnvelopeCreateRecipient(
                    role_name=settings.VERDOCS_POLICY_ROLE_NAME,
                    first_name=policyholder["first_name"],
                    last_name=policyholder["last_name"],
                    email=policyholder["email"],
                )
            ],
        )
        try:
            envelope = endpoint.envelopes.create(params)
        except VerdocsAPIError as exc:
            return JsonResponse({"error": str(exc), "detail": exc.body}, status=exc.status_code)
        except VerdocsConnectionError as exc:
            return JsonResponse({"error": str(exc)}, status=502)

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
