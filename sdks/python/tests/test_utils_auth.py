"""Sign-in helpers: the PKCE pair and the MFA challenge readers (js-sdk Users/Auth.ts helpers)."""

from __future__ import annotations

import base64
import hashlib
import re

import httpx
import pytest

from verdocs import MFAChallenge, MFARequiredError, NotFoundError, VerdocsAPIError
from verdocs.errors import api_error_from_response
from verdocs.utils import create_code_challenge, create_code_verifier, get_mfa_challenge, is_mfa_required
from verdocs.utils.auth import create_code_challenge as module_create_code_challenge

# The worked example from RFC 7636 appendix B.
RFC_VERIFIER = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
RFC_CHALLENGE = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"

BASE64URL = re.compile(r"^[A-Za-z0-9_-]+$")


def _mfa_error(body: object, status: int = 403) -> VerdocsAPIError:
    request = httpx.Request("POST", "https://api.test/v2/oauth2/token")
    response = httpx.Response(status, json=body, request=request)
    return api_error_from_response(response)


def test_create_code_verifier_is_43_base64url_chars():
    verifier = create_code_verifier()

    # 32 random bytes base64url-encode to 44 chars with one pad, 43 without.
    assert len(verifier) == 43
    assert BASE64URL.match(verifier)
    assert "=" not in verifier


def test_create_code_verifier_is_random():
    assert create_code_verifier() != create_code_verifier()


def test_create_code_challenge_matches_the_rfc_example():
    assert create_code_challenge(RFC_VERIFIER) == RFC_CHALLENGE


def test_create_code_challenge_is_base64url_sha256_without_padding():
    verifier = create_code_verifier()

    challenge = create_code_challenge(verifier)

    expected = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode("ascii")).digest()).decode().rstrip("=")
    assert challenge == expected
    assert len(challenge) == 43
    assert BASE64URL.match(challenge)


def test_helpers_are_importable_from_the_submodule():
    assert module_create_code_challenge is create_code_challenge


def test_is_mfa_required_recognizes_the_challenge():
    error = _mfa_error({"error": "mfa_required", "mfa_token": "mfa-token-1234"})

    assert isinstance(error, MFARequiredError)
    assert is_mfa_required(error) is True


def test_is_mfa_required_rejects_other_errors():
    assert is_mfa_required(_mfa_error({"error": "access denied"})) is False
    assert is_mfa_required(_mfa_error({"error": "not found"}, status=404)) is False
    assert is_mfa_required(ValueError("nope")) is False
    assert is_mfa_required(None) is False


def test_get_mfa_challenge_returns_the_parsed_body():
    error = _mfa_error(
        {"error": "mfa_required", "error_description": "Second factor required", "mfa_token": "mfa-token-1234"}
    )

    challenge = get_mfa_challenge(error)

    assert isinstance(challenge, MFAChallenge)
    assert challenge.error == "mfa_required"
    assert challenge.error_description == "Second factor required"
    assert challenge.mfa_token == "mfa-token-1234"


def test_get_mfa_challenge_returns_none_for_anything_else():
    assert get_mfa_challenge(_mfa_error({"error": "access denied"})) is None
    assert get_mfa_challenge(RuntimeError("boom")) is None
    assert get_mfa_challenge(None) is None


def test_mfa_challenge_status_mapping_keeps_other_codes_intact():
    # An mfa_required body only counts as a challenge on a 403; other
    # statuses keep their usual mapping.
    error = _mfa_error({"error": "mfa_required", "mfa_token": "mfa-token-1234"}, status=404)

    assert isinstance(error, NotFoundError)
    assert not isinstance(error, MFARequiredError)


@pytest.mark.parametrize(
    "body",
    [
        {"error": "mfa_required"},
        {"error": "mfa_required", "mfa_token": 1234},
        "mfa_required",
    ],
)
def test_malformed_mfa_bodies_are_plain_api_errors(body):
    error = _mfa_error(body)

    assert type(error) is VerdocsAPIError
