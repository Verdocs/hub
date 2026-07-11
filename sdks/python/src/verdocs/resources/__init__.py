"""Resource namespaces that hang off the endpoint classes."""

from .auth import AsyncAuth, Auth
from .profiles import AsyncProfiles, Profiles
from .templates import AsyncTemplates, Templates
from .users import AsyncUsers, Users

__all__ = [
    "AsyncAuth",
    "AsyncProfiles",
    "AsyncTemplates",
    "AsyncUsers",
    "Auth",
    "Profiles",
    "Templates",
    "Users",
]
