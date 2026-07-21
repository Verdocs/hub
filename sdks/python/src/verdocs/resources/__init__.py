"""Resource namespaces that hang off the endpoint classes."""

from .auth import AsyncAuth, Auth
from .envelopes import AsyncEnvelopes, Envelopes
from .profiles import AsyncProfiles, Profiles
from .templates import AsyncTemplates, Templates
from .users import AsyncUsers, Users

__all__ = [
    "AsyncAuth",
    "AsyncEnvelopes",
    "AsyncProfiles",
    "AsyncTemplates",
    "AsyncUsers",
    "Auth",
    "Envelopes",
    "Profiles",
    "Templates",
    "Users",
]
