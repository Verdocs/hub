"""User and authentication request/response models (js-sdk: Users/Types.ts).

The User and Profile wire models live in core.py with the rest of the
Models.ts shapes; this module holds the Users module's own request and
response shapes: the OAuth2 grants, the MFA challenge and enrollment
records, login sessions, and the social sign-in provider list.
"""

from __future__ import annotations

from datetime import datetime
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


class MFAOtpGrantRequest(VerdocsModel):
    """Complete a sign-in that was answered with an MFA challenge, using a TOTP code.

    The mfa_token comes from the MFARequiredError raised by the first
    authenticate() call.
    """

    grant_type: Literal["urn:verdocs:params:oauth:grant-type:mfa-otp"] = "urn:verdocs:params:oauth:grant-type:mfa-otp"
    mfa_token: str
    # Typed as a string, but OTP codes are always six digits: [0-9]{6}.
    otp: str


class MFARecoveryCodeGrantRequest(VerdocsModel):
    """Complete a sign-in that was answered with an MFA challenge, using a backup code.

    Backup codes are one-time-use. A UI that accepts them should encourage
    the user to generate a fresh set (mfa.regenerate_backup_codes) so they
    are never fully depleted.
    """

    grant_type: Literal["urn:verdocs:params:oauth:grant-type:mfa-recovery-code"] = (
        "urn:verdocs:params:oauth:grant-type:mfa-recovery-code"
    )
    mfa_token: str
    # Backup codes are formatted [0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}.
    recovery_code: str


class LoginCodeGrantRequest(VerdocsModel):
    """Second half of a PKCE flow started from a social identity provider.

    login_code arrives on the return_uri passed to get_social_login_url();
    code_verifier is the value whose challenge started the flow.
    """

    grant_type: Literal["urn:verdocs:params:oauth:grant-type:login-code"] = (
        "urn:verdocs:params:oauth:grant-type:login-code"
    )
    login_code: str
    code_verifier: str


AuthenticationRequest = (
    PasswordGrantRequest
    | ClientCredentialsRequest
    | RefreshTokenRequest
    | AuthorizationCodeRequest
    | MFAOtpGrantRequest
    | MFARecoveryCodeGrantRequest
    | LoginCodeGrantRequest
)


class MFAChallenge(VerdocsModel):
    """Body of the 403 that answers a sign-in for a user with MFA enabled.

    Not a failure: the app finishes the sign-in with an MFA grant carrying
    mfa_token. The SDK raises MFARequiredError for this body; use
    get_mfa_challenge() to read it back as this model.
    """

    error: Literal["mfa_required"] = "mfa_required"
    error_description: str | None = None
    mfa_token: str


# An identity provider that may be used to sign in to Verdocs.
SocialLoginProvider = Literal["google", "microsoft"]


class SocialProviders(VerdocsModel):
    """The identity providers enabled in the current environment.

    Hide buttons for providers that are not enabled: their sign-in URLs
    return 404.
    """

    google: bool
    microsoft: bool


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


class UserLoginSession(VerdocsModel):
    """Server-side record of a login session.

    Not to be confused with UserSession, the client-side decode of a JWT.
    The session the caller used to make the request is marked current, and
    should not be offered for revocation in a UI (use logout instead).
    """

    id: str
    current: bool
    # Typically a SignInProvider value, but typed as a string to allow
    # patterns such as "oauth2:CLIENTID".
    source: str
    created_at: datetime
    last_seen_at: datetime
    # The full User-Agent is not stored (to prevent its reuse in replay
    # attacks), only the browser name, platform, and desktop/mobile.
    browser: str | None = None
    platform: str | None = None
    mobile: bool
    # Approximate location only, e.g. City/State/Country; no fine-grained
    # location data is tracked.
    location: str | None = None
    # Partially masked IP address the session was created from, e.g.
    # "73.***.***.14". Per the Verdocs Privacy Policy and EULA, full IP
    # addresses are tracked and stored internally: document signing sessions
    # do not carry the same expectation of privacy that other web operations
    # often do. They are masked in this record because these sessions may or
    # may not be signing documents, so a full IP is not needed here.
    ip_address: str | None = None


class RevokeSessionsResponse(VerdocsModel):
    """The result of revoking the caller's other sessions."""

    # The number of sessions revoked. The caller's current session is never included.
    revoked: int


# The type of second factor enrolled. Only time-based one-time passwords are supported today.
MFAType = Literal["totp"]


class MFAStatus(VerdocsModel):
    """The caller's multi-factor authentication status."""

    # True if the caller has completed MFA enrollment.
    enabled: bool
    # The type of second factor enrolled, or None if MFA is not enabled.
    type: str | None = None  # Known values: MFAType above.
    # When MFA was enabled, or None if it is not enabled.
    enrolled_at: datetime | None = None
    # The number of unused backup codes remaining.
    backup_codes_remaining: int


class MFAEnrollment(VerdocsModel):
    """A pending MFA enrollment. The secret is not active until confirmed with mfa.verify_enrollment()."""

    # The base32-encoded TOTP secret, for users who cannot scan a QR code.
    secret: str
    # The otpauth:// URI to render as a QR code for authenticator apps.
    otpauth_url: str
    # When the pending enrollment expires if it is not confirmed.
    expires_at: datetime


class MFABackupCodes(VerdocsModel):
    """A set of one-time backup codes. Returned only once, at the moment they are generated."""

    # Single-use backup codes, formatted "xxxx-xxxx". Each may be used once in place of a TOTP code.
    backup_codes: list[str]
