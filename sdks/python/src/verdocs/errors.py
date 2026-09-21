"""Error hierarchy for the Verdocs SDK.

Everything the SDK raises derives from VerdocsError, so callers get one
except clause that catches every SDK failure while API errors and transport
failures stay distinguishable.
"""

from __future__ import annotations

from typing import Any

import httpx


class VerdocsError(Exception):
    """Base class for every error this SDK raises."""


class VerdocsConnectionError(VerdocsError):
    """The request never produced a response: DNS, connect, or timeout failures."""


class VerdocsAPIError(VerdocsError):
    """The API answered with a non-2xx status.

    Attributes:
        status_code: HTTP status code of the response.
        response: The full httpx response, for callers that need headers or the raw body.
        body: The parsed JSON body, or the raw text when the body is not JSON.
    """

    def __init__(self, message: str, *, response: httpx.Response, body: Any) -> None:
        super().__init__(message)
        self.status_code = response.status_code
        self.response = response
        self.body = body


class AuthenticationError(VerdocsAPIError):
    """401: the token is missing, expired, or not valid for this call."""


class NotFoundError(VerdocsAPIError):
    """404: the resource does not exist or the caller cannot see it."""


class RateLimitError(VerdocsAPIError):
    """429: the caller is being throttled."""


class MFARequiredError(VerdocsAPIError):
    """403 mfa_required: the sign-in needs a second factor before tokens are issued.

    Not a failure in the usual sense. A sign-in for a user with MFA enabled
    is answered with a 403 carrying {"error": "mfa_required", "mfa_token"},
    and the app finishes the sign-in by calling authenticate() again with an
    MFAOtpGrantRequest or MFARecoveryCodeGrantRequest carrying mfa_token.

    Attributes:
        mfa_token: The challenge token to send back with the MFA grant.
        error_description: Optional human-readable detail from the server.
    """

    def __init__(self, message: str, *, response: httpx.Response, body: dict[str, Any]) -> None:
        super().__init__(message, response=response, body=body)
        self.mfa_token: str = body["mfa_token"]
        self.error_description: str | None = body.get("error_description")


_STATUS_ERRORS: dict[int, type[VerdocsAPIError]] = {
    401: AuthenticationError,
    404: NotFoundError,
    429: RateLimitError,
}


def _is_mfa_challenge(status_code: int, body: Any) -> bool:
    return (
        status_code == 403
        and isinstance(body, dict)
        and body.get("error") == "mfa_required"
        and isinstance(body.get("mfa_token"), str)
    )


def api_error_from_response(response: httpx.Response) -> VerdocsAPIError:
    """Build the most specific VerdocsAPIError subclass for a non-2xx response.

    The message carries only the method, path, and status. Bodies can contain
    request echoes, so they ride on the error object instead of the message.
    """
    try:
        body: Any = response.json()
    except ValueError:
        body = response.text

    message = f"{response.request.method} {response.request.url.path} returned {response.status_code}"
    if _is_mfa_challenge(response.status_code, body):
        return MFARequiredError(message, response=response, body=body)

    error_class = _STATUS_ERRORS.get(response.status_code, VerdocsAPIError)
    return error_class(message, response=response, body=body)
