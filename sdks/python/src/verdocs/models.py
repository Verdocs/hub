"""Wire models for the Verdocs API.

Every model here mirrors a type in the js-sdk (Models.ts, Users/Types.ts,
Templates/Templates.ts), which is the source of truth for wire shapes. Field
names match the wire exactly, so there are no aliases and no mapping layer.
Enum-like values are plain strings on response models so a new server value
never breaks parsing; request models use Literal types so mistakes are caught
before they reach the wire.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict

TemplateVisibility = Literal["private", "shared", "public"]
TemplateVisibilityFilter = Literal["private_shared", "private", "shared", "public"]
TemplateSender = Literal["envelope_creator", "template_owner"]
TemplateSortBy = Literal["created_at", "updated_at", "name", "last_used_at", "counter", "star_counter"]
EnvelopeVisibility = Literal["private", "shared"]
RecipientType = Literal["signer", "cc", "approver"]
RecipientAuthMethod = Literal["kba", "passcode", "sms", "email", "id"]


class VerdocsModel(BaseModel):
    """Base for all wire models. Extra fields are ignored so new server fields never break installed clients."""

    model_config = ConfigDict(extra="ignore")


class UserSession(VerdocsModel):
    """Decoded claims from a user access token.

    Everything is optional because the token is treated as data, not a
    contract: a claim the server stops sending should never break set_token().
    """

    jti: str | None = None
    aud: str | None = None
    iss: str | None = None
    sub: str | None = None
    iat: int | None = None
    exp: int | None = None
    session_type: str | None = None
    email: str | None = None
    profile_id: str | None = None
    organization_id: str | None = None
    global_admin: bool | None = None


class SigningSession(VerdocsModel):
    """Decoded claims from a signing access token, scoped to one envelope role."""

    aud: str | None = None
    iss: str | None = None
    sub: str | None = None
    iat: int | None = None
    exp: int | None = None
    session_type: str | None = None
    key_type: str | None = None
    email: str | None = None
    profile_id: str | None = None
    envelope_id: str | None = None
    role_name: str | None = None


class AuthenticateResponse(VerdocsModel):
    """Tokens returned by POST /v2/oauth2/token."""

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
    """OAuth2 client_credentials grant body for POST /v2/oauth2/token."""

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


class ChangePasswordRequest(VerdocsModel):
    """Body for POST /v2/users/change-password when the old password is known."""

    old_password: str
    new_password: str


class ChangePasswordResponse(VerdocsModel):
    """Result of a change-password call."""

    status: str
    message: str


class ResetPasswordRequest(VerdocsModel):
    """Body for POST /v2/users/reset-password.

    Omit code and new_password to start a reset. Include both to finish it.
    """

    email: str
    code: str | None = None
    new_password: str | None = None


class ResetPasswordResponse(VerdocsModel):
    """Result of a reset-password call."""

    success: bool


class VerifyEmailRequest(VerdocsModel):
    """Body for POST /v2/users/verify when email and token are known."""

    email: str
    token: str


class ResendVerificationResponse(VerdocsModel):
    """Result of POST /v2/users/resend-verification."""

    result: str


class User(VerdocsModel):
    """A Verdocs user account. A user is one person; profiles connect that person to organizations."""

    id: str
    email: str
    email_verified: bool
    # Declared in the js-sdk for type consistency but never returned by the backend.
    pass_hash: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    picture: str | None = None
    # These four identity-provider IDs are camelCase on the wire; we match the wire rather than alias.
    b2cId: str | None = None
    googleId: str | None = None
    appleId: str | None = None
    githubId: str | None = None
    # Lock details are only visible to admins or owners.
    locked: bool | None = None
    lock_reason: str | None = None
    login_failures: int | None = None
    locale: str | None = None
    timezone: str | None = None
    created_at: datetime
    updated_at: datetime


class Organization(VerdocsModel):
    """An organization: the container for profiles, templates, and envelopes."""

    id: str
    name: str
    address: str | None = None
    address2: str | None = None
    phone: str | None = None
    contact_email: str | None = None
    slug: str | None = None
    url: str | None = None
    full_logo_url: str | None = None
    thumbnail_url: str | None = None
    primary_color: str | None = None
    secondary_color: str | None = None
    parent_id: str | None = None
    style_overrides: str | None = None
    hipaa_complaint: bool | None = None
    disclaimer: str | None = None
    terms_use_url: str | None = None
    privacy_policy_url: str | None = None
    powered_by_label: str | None = None
    powered_by_url: str | None = None
    data: dict[str, Any] | None = None
    # Document-pipeline automation flags. The server sends a partial object, so this stays a plain dict.
    pipeline_settings: dict[str, Any] | None = None
    default_brand_id: str | None = None
    locale: str | None = None
    timezone: str | None = None
    deletion_protected: bool
    created_at: datetime
    updated_at: datetime


class Profile(VerdocsModel):
    """A person's membership in an organization. Operations run "as" the caller's current profile."""

    id: str
    user_id: str | None = None
    organization_id: str
    first_name: str
    last_name: str
    email: str
    phone: str | None = None
    picture: str | None = None
    # True when this is the caller's currently selected profile.
    current: bool
    permissions: list[str]
    roles: list[str]
    locale: str | None = None
    timezone: str | None = None
    created_at: datetime
    updated_at: datetime
    user: User | None = None
    organization: Organization | None = None


class DropdownOption(VerdocsModel):
    """One selectable option in a dropdown field."""

    id: str
    label: str


# js "number" can be integral or fractional. The union keeps the wire value
# as-is (612 stays an int, 612.5 stays a float) instead of coercing everything
# to float, so round-trips are faithful.
Number = int | float


class PageSize(VerdocsModel):
    """Width and height of one document page."""

    width: Number
    height: Number


class TemplateDocument(VerdocsModel):
    """A file attached to a template for display and signing."""

    id: str
    name: str
    template_id: str
    order: int
    pages: int
    mime: str
    size: int
    page_sizes: list[PageSize]
    created_at: datetime | None = None
    updated_at: datetime | None = None
    # Deprecated on the wire; kept so older responses still parse. Use pages instead.
    page_numbers: int | None = None


class Role(VerdocsModel):
    """A placeholder for a party in a signing flow. Roles become recipients when an envelope is created."""

    # Used only by the Web SDK during builder processes; not stored in the backend.
    id: str | None = None
    template_id: str
    name: str
    type: str
    full_name: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
    message: str | None = None
    sequence: int
    order: int
    delegator: bool | None = None
    name_locked: bool


class TemplateField(VerdocsModel):
    """A signing field placed on a template document."""

    name: str
    role_name: str
    template_id: str
    document_id: str
    type: str
    required: bool
    readonly: bool | None = None
    # Deprecated grab-bag settings object; prefer the top-level fields.
    settings: dict[str, Any] | None = None
    page: int
    validator: str | None = None
    label: str | None = None
    x: Number
    y: Number
    width: Number
    height: Number
    default: str | None = None
    placeholder: str | None = None
    multiline: bool
    group: str | None = None
    options: list[DropdownOption] | None = None
    value: str | None = None
    is_valid: bool | None = None


class Template(VerdocsModel):
    """A reusable definition for a signing flow: documents, fields, and recipients."""

    id: str
    profile_id: str
    organization_id: str
    sender: str
    name: str
    description: str | None = None
    counter: int
    star_counter: int
    initial_reminder: int | None = None
    followup_reminders: int | None = None
    max_reminder_days: int
    is_personal: bool
    is_public: bool
    visibility: str | None = None
    is_sendable: bool
    created_at: datetime
    updated_at: datetime
    last_used_at: datetime | None = None
    # The js-sdk types this required, but the live create endpoint omits it, so optional it is.
    search_key: str | None = None
    data: dict[str, Any] | None = None
    tags: list[str] | None = None
    profile: Profile | None = None
    organization: Organization | None = None
    roles: list[Role] | None = None
    documents: list[TemplateDocument] | None = None
    fields: list[TemplateField] | None = None
    # Deprecated on the wire; use documents instead.
    template_documents: list[TemplateDocument] | None = None


class TemplateList(VerdocsModel):
    """One page of template results from GET /v2/templates."""

    # Total number of records matching the query, for pagination.
    count: int
    # Number of rows in this page.
    rows: int
    # The 0-based page number of this response.
    page: int
    templates: list[Template]


class TemplateListParams(VerdocsModel):
    """Query filters for listing templates. Only the fields you set are sent."""

    # Match templates whose names, descriptions, etc contain this search term.
    q: str | None = None
    # Only templates with at least one star.
    is_starred: bool | None = None
    # Only templates created by the caller.
    is_creator: bool | None = None
    # Visibility of templates to include. The server default is private_shared (private + shared).
    visibility: TemplateVisibilityFilter | None = None
    sort_by: TemplateSortBy | None = None
    # Set True or False to override the sort direction. Date sorts default to descending, names ascending.
    ascending: bool | None = None
    # Number of rows to retrieve.
    rows: int | None = None
    # Page to retrieve (0-based).
    page: int | None = None


class TemplateCreateParams(VerdocsModel):
    """Fields for creating a template.

    Only name is required. This seed covers the JSON-safe subset of the
    js-sdk's create params; document uploads, roles, and fields come later.
    """

    name: str
    description: str | None = None
    visibility: TemplateVisibility | None = None
    # Who will own envelopes created from this template. Defaults server-side to envelope_creator.
    sender: TemplateSender | None = None
    # Delay in seconds before the first reminder (min 4 hours). An explicit None disables reminders.
    initial_reminder: int | None = None
    # Delay in seconds between follow-up reminders (min 12 hours). An explicit None disables them.
    followup_reminders: int | None = None
    # Maximum days after envelope creation for which reminders are sent.
    max_reminder_days: int | None = None


class TemplateUpdateParams(VerdocsModel):
    """Fields for updating a template. Everything is optional and only the fields you set are sent."""

    name: str | None = None
    description: str | None = None
    visibility: TemplateVisibility | None = None
    sender: TemplateSender | None = None
    initial_reminder: int | None = None
    followup_reminders: int | None = None
    max_reminder_days: int | None = None


class EnvelopeCreateRecipient(VerdocsModel):
    """One recipient to fill a role when creating an envelope from a template."""

    # Must match one of the template's role names.
    role_name: str
    first_name: str
    last_name: str
    # One of email or phone is required; phone additionally sends an SMS invite.
    email: str | None = None
    phone: str | None = None
    delegator: bool | None = None
    message: str | None = None
    auth_methods: list[RecipientAuthMethod] | None = None


class EnvelopeCreateParams(VerdocsModel):
    """Fields for creating an envelope from a template.

    Only template_id and recipients are required. This seed covers creating
    envelopes from an existing template; creating one directly from uploaded
    documents comes later.
    """

    template_id: str
    recipients: list[EnvelopeCreateRecipient]
    # Overrides the template's name/description when set.
    name: str | None = None
    description: str | None = None
    sender_name: str | None = None
    sender_email: str | None = None
    no_contact: bool | None = None
    expires_at: datetime | None = None
    visibility: EnvelopeVisibility | None = None
    initial_reminder: int | None = None
    followup_reminders: int | None = None
    max_reminder_days: int | None = None
    data: dict[str, Any] | None = None
    locale: str | None = None
    timezone: str | None = None


class Recipient(VerdocsModel):
    """A participant (signer, cc, or approver) in an envelope's signing workflow."""

    # Used only by the Web SDK during builder processes; not stored in the backend.
    id: str | None = None
    envelope_id: str
    role_name: str
    profile_id: str | None = None
    status: str
    first_name: str
    last_name: str
    email: str
    phone: str | None = None
    sequence: int
    order: int
    type: str
    delegator: bool
    delegated_to: str | None = None
    message: str | None = None
    claimed: bool
    agreed: bool
    name_locked: bool
    auth_methods: list[str] | None = None
    locale: str | None = None
    timezone: str | None = None
    # Only returned to the creator, for in-person signing hand-off.
    in_app_key: str | None = None
    created_at: datetime
    updated_at: datetime


class EnvelopeDocument(VerdocsModel):
    """A file attached to an envelope."""

    id: str
    envelope_id: str
    # Null for documents attached without a template.
    template_document_id: str | None = None
    order: int
    type: str
    name: str
    pages: int
    mime: str
    size: int
    signed: bool
    page_sizes: list[PageSize]
    created_at: datetime
    updated_at: datetime


class EnvelopeField(VerdocsModel):
    """A signing field placed on an envelope document."""

    envelope_id: str
    document_id: str
    name: str
    role_name: str
    type: str
    required: bool | None = None
    readonly: bool | None = None
    label: str | None = None
    page: int
    x: Number
    y: Number
    width: Number
    height: Number
    default: str | None = None
    placeholder: str | None = None
    multiline: bool
    group: str | None = None
    options: list[DropdownOption] | None = None
    value: str | None = None
    is_valid: bool | None = None


class Envelope(VerdocsModel):
    """A workflow wrapper that shepherds one or more documents through recipients in a signing process."""

    id: str
    # 'complete', 'declined', and 'canceled' are immutable end states. 'complete' means the
    # workflow steps are done, not that every signature is finished; see the signed field for that.
    status: str
    profile_id: str
    template_id: str | None = None
    organization_id: str
    name: str
    sender_name: str | None = None
    sender_email: str | None = None
    no_contact: bool | None = None
    initial_reminder: int | None = None
    followup_reminders: int | None = None
    max_reminder_days: int
    next_reminder: datetime | None = None
    canceled_at: datetime | None = None
    expires_at: datetime | None = None
    visibility: str
    signed: bool
    data: dict[str, Any] | None = None
    recipients: list[Recipient]
    documents: list[EnvelopeDocument] | None = None
    fields: list[EnvelopeField] | None = None
    created_at: datetime
    updated_at: datetime
