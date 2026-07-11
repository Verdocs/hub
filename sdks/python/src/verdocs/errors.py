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


_STATUS_ERRORS: dict[int, type[VerdocsAPIError]] = {
    401: AuthenticationError,
    404: NotFoundError,
    429: RateLimitError,
}


def api_error_from_response(response: httpx.Response) -> VerdocsAPIError:
    """Build the most specific VerdocsAPIError subclass for a non-2xx response.

    The message carries only the method, path, and status. Bodies can contain
    request echoes, so they ride on the error object instead of the message.
    """
    try:
        body: Any = response.json()
    except ValueError:
        body = response.text

    error_class = _STATUS_ERRORS.get(response.status_code, VerdocsAPIError)
    message = f"{response.request.method} {response.request.url.path} returned {response.status_code}"
    return error_class(message, response=response, body=body)
