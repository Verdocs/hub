"""JWT payload decoding.

We only read the claims to expose session metadata (expiry, IDs, session
type); the server is the authority on validity, so the signature is never
verified here. This mirrors the js-sdk's decodeAccessTokenBody.
"""

from __future__ import annotations

import base64
import json
from typing import Any


def decode_token_body(token: str) -> dict[str, Any] | None:
    """Decode the payload segment of a JWT, returning None for anything malformed."""
    parts = token.split(".")
    if len(parts) != 3:
        return None

    # JWTs strip base64 padding; urlsafe_b64decode wants it back.
    payload = parts[1]
    padded = payload + "=" * (-len(payload) % 4)
    try:
        claims = json.loads(base64.urlsafe_b64decode(padded.encode("ascii")))
    except ValueError:
        return None

    return claims if isinstance(claims, dict) else None
