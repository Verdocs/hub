"""Sign-in helpers (js-sdk: the helper functions in Users/Auth.ts).

Two pairs of pure functions with no network access: the PKCE verifier and
challenge that start a social sign-in, and the MFA challenge readers for
callers that prefer inspecting an exception over catching MFARequiredError
directly.
"""

from __future__ import annotations

import base64
import hashlib
import secrets
from typing import TypeGuard

from ..errors import MFARequiredError
from ..models.users import MFAChallenge


def _base64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def create_code_verifier() -> str:
    """Create a PKCE code verifier: 43 characters of URL-safe randomness, per RFC 7636.

    Keep it where it will survive the round trip to the identity provider
    (a server-side session, for instance), pass its challenge to
    get_social_login_url(), and send it back with LoginCodeGrantRequest.

    Example:
        from verdocs import create_code_challenge, create_code_verifier

        verifier = create_code_verifier()
        challenge = create_code_challenge(verifier)

    Returns:
        A fresh 43-character base64url string built from 32 random bytes.

    @sdkOperation auth.createCodeVerifier
    @sdkGroup Auth
    @sdkPage Helpers
    """
    return _base64url(secrets.token_bytes(32))


def create_code_challenge(verifier: str) -> str:
    """Create the PKCE code challenge for a verifier: the base64url-encoded SHA-256 of it.

    Example:
        from verdocs import create_code_challenge, create_code_verifier

        verifier = create_code_verifier()
        challenge = create_code_challenge(verifier)

    Args:
        verifier: The value returned by create_code_verifier().

    Returns:
        The S256 challenge to pass to get_social_login_url(), without padding.

    @sdkOperation auth.createCodeChallenge
    @sdkGroup Auth
    @sdkPage Helpers
    """
    return _base64url(hashlib.sha256(verifier.encode("ascii")).digest())


def is_mfa_required(error: object) -> TypeGuard[MFARequiredError]:
    """Check whether an exception is the mfa_required challenge.

    A sign-in for a user with MFA enabled raises MFARequiredError, a 403
    carrying {"error": "mfa_required", "mfa_token"}, and the app finishes
    the sign-in with an MFA grant. Catching MFARequiredError directly is the
    usual Python spelling; this helper exists for code that already holds
    a caught exception. Use get_mfa_challenge() to read the body instead.

    Example:
        from verdocs import MFAOtpGrantRequest, PasswordGrantRequest, VerdocsError, is_mfa_required

        try:
            tokens = endpoint.auth.authenticate(PasswordGrantRequest(username=email, password=password))
        except VerdocsError as error:
            if is_mfa_required(error):
                # Collect a code from the user, then:
                tokens = endpoint.auth.authenticate(MFAOtpGrantRequest(mfa_token=error.mfa_token, otp=otp))

    Args:
        error: Any object, usually a caught exception.

    Returns:
        True if error is an MFARequiredError, narrowing its type for checkers.

    @sdkOperation auth.isMFARequired
    @sdkGroup Auth
    @sdkPage Helpers
    """
    return isinstance(error, MFARequiredError)


def get_mfa_challenge(error: object) -> MFAChallenge | None:
    """Companion to is_mfa_required() that returns the challenge body, or None for anything else.

    Handy in except blocks that just need the mfa_token.

    Example:
        from verdocs import get_mfa_challenge

        challenge = get_mfa_challenge(error)
        if challenge:
            # Switch the form to its "enter your code" mode, carrying challenge.mfa_token.
            ...

    Args:
        error: Any object, usually a caught exception.

    Returns:
        The parsed 403 body when error is an MFARequiredError, otherwise None.

    @sdkOperation auth.getMFAChallenge
    @sdkGroup Auth
    @sdkPage Helpers
    """
    if not isinstance(error, MFARequiredError):
        return None
    return MFAChallenge.model_validate(error.body)
