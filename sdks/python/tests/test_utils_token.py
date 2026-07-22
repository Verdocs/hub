"""JWT body decoding (verdocs.utils.token)."""

from __future__ import annotations

import base64
import json

import pytest

from verdocs.utils import decode_access_token_body, decode_jwt_body


def test_decode_jwt_body_reads_claims(token_factory):
    claims = decode_jwt_body(token_factory("user"))
    assert claims["sub"] == "user-1234"
    assert claims["session_type"] == "user"


def test_decode_jwt_body_raises_on_malformed_input():
    # The js-sdk throws here too (JSON.parse on a garbage decode).
    with pytest.raises(ValueError):
        decode_jwt_body("garbage")
    with pytest.raises(ValueError):
        decode_jwt_body("")
    with pytest.raises(ValueError):
        decode_jwt_body(None)
    with pytest.raises(ValueError):
        decode_jwt_body("still.not-json!.x")


def test_decode_jwt_body_handles_base64url_payloads():
    # JWT segments are base64url. ASCII-only JSON never produces "-" or "_",
    # but non-ASCII claims do; the js-sdk's AtoB only speaks the standard
    # alphabet and throws on this token, while we decode it (flagged in the
    # parity drop).
    claims = {"name": "\u00be"}
    payload = base64.urlsafe_b64encode(json.dumps(claims, ensure_ascii=False).encode("utf-8")).decode()
    payload = payload.rstrip("=")
    assert "-" in payload or "_" in payload

    assert decode_jwt_body(f"header.{payload}.signature") == claims


def test_decode_access_token_body_reads_claims(token_factory):
    claims = decode_access_token_body(token_factory("signing"))
    assert claims is not None
    assert claims["envelope_id"] == "envelope-1234"
    assert claims["session_type"] == "signing"


@pytest.mark.parametrize(
    "bad_token",
    [
        None,
        "",
        "garbage",
        "one.two",  # stricter than js: exactly three segments required
        "a.!!!.c",
        "a." + base64.urlsafe_b64encode(b"[1, 2]").decode() + ".c",  # payload must be an object
    ],
)
def test_decode_access_token_body_returns_none_on_malformed_input(bad_token):
    assert decode_access_token_body(bad_token) is None
