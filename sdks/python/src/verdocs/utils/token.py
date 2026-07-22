"""JWT body decoding (js-sdk: Utils/Token.ts).

The js-sdk also ships AtoB, a Node/browser-safe atob() replacement; Python's
base64 stdlib already covers that, so it has no port here. The stdlib is in
fact more capable: AtoB only speaks the standard alphabet, so the js-sdk
throws on base64url payload segments (the actual JWT encoding) whenever they
contain "-" or "_", while these helpers decode them.
"""

from __future__ import annotations

import base64
import json
from typing import Any

from .._token import decode_token_body


def decode_jwt_body(token: str | None) -> Any:
    """Decode the payload segment of a JWT without verifying the signature.

    Lets callers read claims (expiry, IDs, session type) without a JWT
    dependency. Only real JWTs work; opaque tokens raise, mirroring the
    js-sdk's throw. Use decode_access_token_body() for the non-raising form.

    Args:
        token: The JWT; None is treated as empty.

    Returns:
        The parsed payload, whatever JSON it holds.

    Raises:
        ValueError: The token has no decodable JSON payload segment.

    @sdkOperation token.decodeJWTBody
    @sdkGroup Token
    @sdkPage Helpers
    """
    parts = (token or "").split(".")
    payload = parts[1] if len(parts) > 1 else ""
    padded = payload + "=" * (-len(payload) % 4)
    return json.loads(base64.urlsafe_b64decode(padded.encode("ascii")))


def decode_access_token_body(token: str | None) -> dict[str, Any] | None:
    """Decode a Verdocs access token's claims, returning None for anything malformed.

    User and signing sessions have different claim sets; tell them apart by
    context or by the claims only one carries (envelope_id appears only on
    signing tokens). set_token() runs this same decode and validates the
    result into UserSession/SigningSession models; this helper hands back the
    raw claims for callers inspecting a token directly.

    Args:
        token: The access token; None is treated as empty.

    Returns:
        The claims dict, or None. Slightly stricter than the js-sdk: the
        token must have three segments and an object payload, where js
        accepts any segment count and any JSON type.

    @sdkOperation token.decodeAccessTokenBody
    @sdkGroup Token
    @sdkPage Helpers
    """
    return decode_token_body(token or "")
