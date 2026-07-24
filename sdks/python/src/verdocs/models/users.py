"""User and authentication request/response models (js-sdk: Users/Types.ts).

The User and Profile wire models live in core.py with the rest of the
Models.ts shapes; this module holds the Users module's own request and
response shapes.
"""

from __future__ import annotations

from typing import Literal

from .core import VerdocsModel
from .sessions import Permission, ProfileRole


class AuthenticateResponse(VerdocsModel):
    """Session tokens.

    Returned by authentication and by every call that rotates the session:
    profile switch, create, and delete, and email verification.
    """

    access_token: str
    id_token: str
    refresh_token: str
    expires_in: int
    access_token_exp: int
    refresh_token_exp: int


class PasswordGrantRequest(VerdocsModel):
    """OAuth2 password grant body for POST /v2/oauth2/token."""

    grant_type: Literal["password"] = "password"
    username: str
    password: str
    client_id: str | None = None
    scope: str | None = None


class ClientCredentialsRequest(VerdocsModel):
    """OAuth2 client_credentials grant body for POST /v2/oauth2/token.

    The intended grant for server-side integrations: create an API key
    (Settings > API Keys at https://app.verdocs.com) and trade its
    client_id/client_secret for a session token here. No end-user
    credentials are involved.
    """

    grant_type: Literal["client_credentials"] = "client_credentials"
    client_id: str
    client_secret: str
    scope: str | None = None


class RefreshTokenRequest(VerdocsModel):
    """OAuth2 refresh_token grant body for POST /v2/oauth2/token."""

    grant_type: Literal["refresh_token"] = "refresh_token"
    refresh_token: str
    client_id: str | None = None
    scope: str | None = None


class AuthorizationCodeRequest(VerdocsModel):
    """OAuth2 authorization_code grant body for POST /v2/oauth2/token."""

    grant_type: Literal["authorization_code"] = "authorization_code"
    code: str
    client_id: str
    client_secret: str
    redirect_uri: str


AuthenticationRequest = PasswordGrantRequest | ClientCredentialsRequest | RefreshTokenRequest | AuthorizationCodeRequest


class OAuth2AuthorizeParams(VerdocsModel):
    """Query params that build the OAuth2 authorize URL."""

    client_id: str
    redirect_uri: str
    response_type: Literal["code"] = "code"
    state: str | None = None
    scope: str | None = None


class CreateProfileRequest(VerdocsModel):
    """Fields for signing up: a new user, a new organization, and its first profile."""

    email: str
    password: str
    first_name: str
    last_name: str
    # Not required to be unique: many real businesses legitimately share a
    # name (Delta Faucet vs Delta Airlines).
    org_name: str
    # The js-sdk requires phone, but the deployed schema makes it optional
    # (and validates the number when present).
    phone: str | None = None
    timezone: str | None = None
    locale: str | None = None


class UpdateProfileRequest(VerdocsModel):
    """Fields for updating a profile. Everything is optional and only the fields you set are sent.

    The deployed endpoint parses two strict schemas depending on whose
    profile is updated: your own accepts first_name, last_name, phone,
    timezone, and locale; an admin updating another member may send
    first_name, last_name, phone, permissions, and roles. Unknown keys are a
    400 on either path, so do not mix the two groups in one call.
    """

    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    timezone: str | None = None
    locale: str | None = None
    # Only valid when an admin updates another member; a self-update
    # carrying these is a 400.
    permissions: list[Permission] | None = None
    roles: list[ProfileRole] | None = None


class ChangePasswordRequest(VerdocsModel):
    """Body for POST /v2/users/change-password."""

    old_password: str
    new_password: str


class ChangePasswordResponse(VerdocsModel):
    """Result of a password change.

    The js-sdk types message as required, but the deployed success response
    is a bare status; failures raise instead of reporting through message.
    """

    status: str  # Known values: RequestStatus in base.py.
    message: str | None = None


class ResetPasswordRequest(VerdocsModel):
    """Body for initiating a password reset.

    The js-sdk type covers only the initiation shape; completing the reset
    adds code and new_password (see auth.reset_password).
    """

    email: str


class ResetPasswordResponse(VerdocsModel):
    """Result of a password reset request.

    The deployed response is always status OK (with an advisory message on
    some paths) so address probes learn nothing from it.
    """

    status: str  # Known values: RequestStatus in base.py.
    message: str | None = None


class VerifyEmailRequest(VerdocsModel):
    """Body for POST /v2/users/verify."""

    email: str
    token: str
