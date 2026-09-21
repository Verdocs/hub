"""Organization request and response models (js-sdk: Organizations module).

The wire models for organizations themselves (Organization, Profile, Group,
Brand, Webhook, and friends) live in core.py with the rest of the Models.ts
shapes; this module holds the Organizations module's request-parameter and
response shapes: every Organizations/Types.ts export plus the parameter
objects the js-sdk declares inline.

Field lists follow the deployed API handler schemas (platform api
validations/), which win wherever the js-sdk types drifted. The notable
divergences are called out on each model.
"""

from __future__ import annotations

from typing import Any, Literal

from .base import EventName, NotificationType, WebhookAuthMethod
from .core import Entitlement, Organization, Profile, VerdocsModel, WebhookEvents
from .users import AuthenticateResponse

# Roles assignable when creating a member directly (CreateOrganizationMemberSchema).
# "contact" profiles are created through the contacts namespace instead.
MemberCreateRole = Literal["basic_user", "member", "admin", "owner"]

# Roles assignable when updating a member (UpdateOrganizationMemberSchema). The
# deployed schema omits "member", so a member demotion currently draws a 400;
# the js-sdk's TRole suggests that is a server oversight, but the wire rejects it today.
MemberUpdateRole = Literal["contact", "basic_user", "admin", "owner"]

# Roles assignable through an invitation (CreateOrganizationInvitationSchema).
InvitationRole = Literal["contact", "basic_user", "member", "admin", "owner"]

# The result shape of organizations.get_active_entitlements: feature name to
# the entitlement record currently granting it. Known keys: EntitlementFeature
# in base.py, kept open so a new server feature still fits.
ActiveEntitlements = dict[str, Entitlement]


class OrganizationCreateParams(VerdocsModel):
    """Fields for creating an organization (CreateOrganizationSchema; unknown keys are a 400).

    Only name, parent_id, timezone, and locale are consumed by the deployed
    handler; contact_email is taken from the caller's own email. The other
    fields are validated and then discarded, so set branding and similar
    values with organizations.update() after creation.
    """

    name: str
    # Creates the new organization as a child of this one. The caller must belong to the parent.
    parent_id: str | None = None
    address: str | None = None
    address2: str | None = None
    phone: str | None = None
    contact_email: str | None = None
    url: str | None = None
    full_logo_url: str | None = None
    thumbnail_url: str | None = None
    primary_color: str | None = None
    secondary_color: str | None = None
    disclaimer: str | None = None
    terms_use_url: str | None = None
    privacy_policy_url: str | None = None
    powered_by_url: str | None = None
    powered_by_label: str | None = None
    data: dict[str, Any] | None = None
    style_overrides: str | None = None
    deletion_protected: bool | None = None
    timezone: str | None = None
    locale: str | None = None


class OrganizationCreateResponse(AuthenticateResponse):
    """Session tokens plus the new profile and organization from a top-level create.

    Returned only when creating an organization without a parent_id; child
    creates return the Organization itself (with api_key populated) instead.
    """

    profile: Profile
    organization: Organization


class OrganizationUpdateParams(VerdocsModel):
    """Fields for updating an organization (UpdateOrganizationSchema; unknown keys are a 400).

    Unset fields stay off the wire and are left unchanged. An explicit None
    clears the value, but only for the fields the server accepts null on:
    disclaimer, terms_use_url, privacy_policy_url, powered_by_url,
    powered_by_label, style_overrides, and default_brand_id. Everything else
    must be sent as a value.

    The js-sdk types this as Partial<IOrganization>, but the deployed schema
    is strict: read-only columns like id or created_at draw a 400.
    """

    name: str | None = None
    address: str | None = None
    address2: str | None = None
    phone: str | None = None
    contact_email: str | None = None
    url: str | None = None
    full_logo_url: str | None = None
    thumbnail_url: str | None = None
    primary_color: str | None = None
    secondary_color: str | None = None
    disclaimer: str | None = None
    terms_use_url: str | None = None
    privacy_policy_url: str | None = None
    powered_by_url: str | None = None
    powered_by_label: str | None = None
    data: dict[str, Any] | None = None
    style_overrides: str | None = None
    default_brand_id: str | None = None
    deletion_protected: bool | None = None
    timezone: str | None = None
    locale: str | None = None


class PipelineSettingsUpdateParams(VerdocsModel):
    """Document-pipeline flags to change; omitted flags are left unchanged.

    Mirrors the server's PipelineSettingsSchema, which accepts one flag the
    js-sdk type does not know yet (redaction_v2).
    """

    # Auto-detect AcroForm (fillable PDF) fields when a document has no text tags.
    process_acroforms: bool | None = None
    # Process {{...}} text tags in uploaded documents.
    process_tags: bool | None = None
    # Skip (vs. reject) document tags whose role name is empty or invalid.
    ignore_invalid_roles: bool | None = None
    # Skip (vs. reject) document tags that do not form a valid field.
    ignore_invalid_fields: bool | None = None
    # Server-side flag not yet in the js-sdk type; accepted by the deployed schema.
    redaction_v2: bool | None = None


class MemberCreateParams(VerdocsModel):
    """Fields for creating a member directly, bypassing the invite flow."""

    email: str
    first_name: str
    last_name: str
    # Initial password (8-128 chars). Omit to have the server generate one and
    # return it in the response.
    password: str | None = None
    # Roles for the new member. The server defaults to ["member"].
    roles: list[MemberCreateRole] | None = None


class MemberCreateUser(VerdocsModel):
    """Summary of the user record behind a directly-created member."""

    email: str
    # True when the email already had a Verdocs user account; no password is
    # generated in that case.
    existed: bool


class MemberCreateResponse(VerdocsModel):
    """The result of creating a member directly.

    The js-sdk types this call as returning a bare profile, but the wire
    wraps it: the profile, a user summary, and the generated password when
    the server created the account.
    """

    profile: Profile
    user: MemberCreateUser
    # Only present when the server generated a password for a brand-new user.
    password: str | None = None


class MemberUpdateParams(VerdocsModel):
    """Fields for updating a member (UpdateOrganizationMemberSchema; unknown keys are a 400).

    The deployed schema accepts roles only. The js-sdk also offers first_name
    and last_name, but the strict server schema rejects them; update names
    through the profile endpoints instead.
    """

    roles: list[MemberUpdateRole] | None = None


class GroupCreateParams(VerdocsModel):
    """Fields for creating a group. "everyone" is reserved and rejected."""

    # Group name; the server lowercases it.
    name: str
    # Permission strings granted to every group member; see ALL_PERMISSIONS in models.lists.
    permissions: list[str]


class GroupUpdateParams(VerdocsModel):
    """Fields for updating a group; both fields are required by the server."""

    name: str
    permissions: list[str]


class InvitationCreateParams(VerdocsModel):
    """Fields for inviting a new user to join the organization (js-sdk: ICreateInvitationRequest)."""

    email: str
    # The invitee may override the names after accepting.
    first_name: str
    last_name: str
    # Role assigned once the invitee accepts.
    role: InvitationRole


class InvitationUpdateParams(VerdocsModel):
    """Fields for updating a pending invitation (UpdateOrganizationInvitationSchema).

    The deployed schema accepts role only. The js-sdk also offers first_name
    and last_name, but the strict server schema rejects them.
    """

    role: InvitationRole


class InvitationAcceptParams(VerdocsModel):
    """Fields for accepting an invitation (js-sdk: IAcceptOrganizationInvitationRequest)."""

    email: str
    # The invite token from the invitation email.
    token: str
    first_name: str
    last_name: str
    # Password for the new user account.
    password: str


class ContactCreateParams(VerdocsModel):
    """Fields for creating a contact (CreateOrganizationContactSchema; unknown keys are a 400)."""

    first_name: str
    last_name: str
    email: str
    phone: str | None = None


class ContactUpdateParams(VerdocsModel):
    """Fields for updating a contact; the server requires the full name and email each time."""

    first_name: str
    last_name: str
    email: str
    phone: str | None = None


class ApiKeyCreateParams(VerdocsModel):
    """Fields for creating an API key (js-sdk: ICreateApiKeyRequest)."""

    # Display name used to identify the key in the Verdocs web app.
    name: str
    # The profile calls made with this key will act as.
    profile_id: str
    # If true, the key has full access to the organization, overriding the
    # permissions of its assigned profile. The server defaults to False.
    global_admin: bool | None = None


class ApiKeyUpdateParams(VerdocsModel):
    """Fields for updating an API key (js-sdk: IUpdateApiKeyRequest). Only the fields you set are sent."""

    name: str | None = None
    # New profile that calls made with the key will act as.
    profile_id: str | None = None
    # If true, the key has full access to the organization, overriding the
    # permissions of its assigned profile.
    global_admin: bool | None = None


class BrandCreateParams(VerdocsModel):
    """Fields for creating a brand (js-sdk: ICreateBrandRequest)."""

    # Unique key for the brand: lowercase alphanumeric plus hyphens, 1-63 chars.
    key: str
    name: str | None = None
    full_logo_url: str | None = None
    thumbnail_url: str | None = None
    favicon_url: str | None = None
    page_title: str | None = None
    primary_color: str | None = None
    secondary_color: str | None = None
    powered_by_label: str | None = None
    powered_by_url: str | None = None
    style_overrides: str | None = None
    disclaimer: str | None = None
    terms_use_url: str | None = None
    privacy_policy_url: str | None = None
    support_contact: str | None = None
    pdf_signature_reason: str | None = None
    pdf_signature_location: str | None = None
    # The server rejects an explicit null for timezone and locale; send a string or leave unset.
    timezone: str | None = None
    locale: str | None = None


class BrandUpdateParams(VerdocsModel):
    """Fields for updating a brand (js-sdk: IUpdateBrandRequest).

    Unset fields stay off the wire. An explicit None clears the value for
    every field except timezone and locale, which the server requires as
    strings when present.
    """

    name: str | None = None
    full_logo_url: str | None = None
    thumbnail_url: str | None = None
    favicon_url: str | None = None
    page_title: str | None = None
    primary_color: str | None = None
    secondary_color: str | None = None
    powered_by_label: str | None = None
    powered_by_url: str | None = None
    style_overrides: str | None = None
    disclaimer: str | None = None
    terms_use_url: str | None = None
    privacy_policy_url: str | None = None
    support_contact: str | None = None
    pdf_signature_reason: str | None = None
    pdf_signature_location: str | None = None
    timezone: str | None = None
    locale: str | None = None


class BrandEmailDomainAddParams(VerdocsModel):
    """Fields for adding a custom email domain to a brand (js-sdk: IAddBrandEmailDomainRequest)."""

    # The sending domain, e.g. "notify.acme.com". Lowercase, 3-253 chars.
    subdomain: str
    # The local part of the from address, e.g. "notifications".
    local_part: str
    # Friendly from-name shown in email clients.
    display_name: str | None = None
    # Reply-to address; must be a valid email.
    reply_to: str | None = None


class WebhookSetParams(VerdocsModel):
    """Fields for updating the organization's webhook configuration (js-sdk: ISetWebhookRequest).

    Webhooks cannot be deleted; disable them by setting active to False or
    url to an empty string.
    """

    # Destination for webhook events. Must be an HTTPS URL, or "" to disable.
    url: str
    active: bool
    # Known values: WebhookAuthMethod in base.py. Required by the js-sdk type
    # but optional on the wire.
    auth_method: WebhookAuthMethod | None = None
    # client_id/client_secret/token_endpoint are required by the server logic
    # (not the schema) when auth_method is "client_credentials".
    client_id: str | None = None
    client_secret: str | None = None
    scope: str | None = None
    token_endpoint: str | None = None
    # Map of WebhookEvent name to enabled flag; unknown event names are stripped server-side.
    events: WebhookEvents


class NotificationTemplateCreateParams(VerdocsModel):
    """Fields for creating a notification template (js-sdk: ICreateNotificationTemplateRequest).

    At least one of html_template or text_template is required. Only one
    template may exist per combination of type, event_name, and template_id.
    """

    type: NotificationType
    event_name: EventName
    # Optional reference to an associated template.
    template_id: str | None = None
    html_template: str | None = None
    text_template: str | None = None


class NotificationTemplateUpdateParams(VerdocsModel):
    """Fields for updating a notification template; at least one body is required."""

    html_template: str | None = None
    text_template: str | None = None
