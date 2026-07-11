"""Verdocs e-signing SDK.

The endpoint classes are the entry point: create one per session context,
attach a token with set_token(), and call the resource namespaces hanging off
it (endpoint.templates, endpoint.users, ...). VerdocsEndpoint is synchronous;
AsyncVerdocsEndpoint is its method-for-method async twin.
"""

from ._endpoint import DEFAULT_BASE_URL, DEFAULT_TIMEOUT, AsyncVerdocsEndpoint, SessionType, VerdocsEndpoint
from .errors import (
    AuthenticationError,
    NotFoundError,
    RateLimitError,
    VerdocsAPIError,
    VerdocsConnectionError,
    VerdocsError,
)
from .models import (
    AuthenticateResponse,
    DropdownOption,
    Organization,
    PageSize,
    Profile,
    Role,
    SigningSession,
    Template,
    TemplateCreateParams,
    TemplateDocument,
    TemplateField,
    TemplateList,
    TemplateListParams,
    TemplateUpdateParams,
    User,
    UserSession,
    VerdocsModel,
)

__version__ = "1.0.0"

__all__ = [
    "DEFAULT_BASE_URL",
    "DEFAULT_TIMEOUT",
    "AsyncVerdocsEndpoint",
    "AuthenticateResponse",
    "AuthenticationError",
    "DropdownOption",
    "NotFoundError",
    "Organization",
    "PageSize",
    "Profile",
    "RateLimitError",
    "Role",
    "SessionType",
    "SigningSession",
    "Template",
    "TemplateCreateParams",
    "TemplateDocument",
    "TemplateField",
    "TemplateList",
    "TemplateListParams",
    "TemplateUpdateParams",
    "User",
    "UserSession",
    "VerdocsAPIError",
    "VerdocsConnectionError",
    "VerdocsEndpoint",
    "VerdocsError",
    "VerdocsModel",
    "__version__",
]
