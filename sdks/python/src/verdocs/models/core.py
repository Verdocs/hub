"""Shared wire models for the Verdocs API (js-sdk: Models.ts).

The js-sdk code is the source of truth for wire shapes; field names match the
wire exactly, so there are no aliases and no mapping layer. Two deliberate
loosenings, both driven by live-wire findings:

- Extra fields are allowed and kept (see VerdocsModel), because live beta
  returns fields the js-sdk types do not document.
- Enum-like values are plain strings on response models so a new server value
  never breaks parsing; base.py names the known values, and request models
  use those Literal aliases.

Joined relations (profile, organization, and friends) are optional
everywhere: whether they appear depends on the query that produced the
payload. Nullable wire fields default to None so a payload that omits the
key parses the same as one that sends null.
"""

from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class VerdocsModel(BaseModel):
    """Base for all wire models.

    Extra fields are allowed and kept, so undocumented server fields survive
    parsing and round-trip through model_dump(). This matches the C# SDK's
    JsonExtensionData capture and deliberately overrides python.md rule 12's
    extra=ignore default (settled by the true-up handoff).
    """

    model_config = ConfigDict(extra="allow")


# js "number" can be integral or fractional. The union keeps the wire value
# as-is (612 stays an int, 612.5 stays a float) instead of coercing everything
# to float, so round-trips are faithful.
Number = int | float


class PageSize(VerdocsModel):
    """Width and height of one document page."""

    width: Number
    height: Number


# Notifications


class Channel(VerdocsModel):
    """A delivery channel for user notifications."""

    id: str
    channel_type: str
    event_name: str
    disabled_channels: list[DisabledChannel] | None = None


class DisabledChannel(VerdocsModel):
    """A notification channel a profile has muted."""

    channel_id: str
    profile_id: str
    profile: Profile | None = None
    channel: Channel | None = None


class Notification(VerdocsModel):
    """An in-app notification delivered to a profile."""

    id: str
    profile_id: str
    event_name: str
    data: Any = None
    read: bool
    deleted: bool
    message: str
    time: datetime
    profile: Profile | None = None


class NotificationTemplate(VerdocsModel):
    """Per-organization override for notification content."""

    id: str
    organization_id: str
    type: str  # Known values: NotificationType in base.py.
    event_name: str  # Known values: EventName in base.py.
    template_id: str | None = None
    html_template: str | None = None
    text_template: str | None = None
    template: Template | None = None
    # The js-sdk types this join required, unlike every other relation; joins
    # depend on the query, so we keep it optional like the rest.
    organization: Organization | None = None


# IAM


class ApiKey(VerdocsModel):
    """An API key attached to a profile within an organization."""

    client_id: str
    name: str
    organization_id: str
    profile_id: str
    global_admin: bool
    client_secret: str | None = None
    # js-sdk declares permission required, but the deployed API has no permission
    # column and never sends it (verified against the prisma schema during the
    # true-up); the create/update schemas speak global_admin instead.
    permission: str | None = None  # Known values: ApiKeyPermission in base.py.
    profile: Profile | None = None
    organization: Organization | None = None


class Group(VerdocsModel):
    """A named set of profiles sharing permissions within an organization."""

    id: str
    name: str
    organization_id: str
    permissions: list[str]
    organization: Organization | None = None
    profiles: list[GroupProfile] | None = None


class GroupProfile(VerdocsModel):
    """A profile's membership in a group."""

    group_id: str
    profile_id: str
    organization_id: str
    group: Group | None = None
    profile: Profile | None = None
    organization: Organization | None = None


class OAuth2App(VerdocsModel):
    """An OAuth2 application registered by an organization."""

    id: str
    profile_id: str
    organization_id: str
    name: str
    client_id: str
    client_secret: str | None = None
    redirect_uris: str
    origins: str
    friendly_name: str
    logo_uri: str
    public_key: str
    private_key: str
    created_at: datetime
    updated_at: datetime
    organization: Organization | None = None
    profile: Profile | None = None


class Entitlement(VerdocsModel):
    """A product feature enabled for an organization, with usage caps."""

    id: str
    organization_id: str
    feature: str  # Known values: EntitlementFeature in base.py.
    contract_id: str | None = None
    notes: str | None = None
    starts_at: datetime
    ends_at: datetime
    monthly_max: int
    yearly_max: int
    created_at: datetime
    organization: Organization | None = None


class OrganizationApiKey(VerdocsModel):
    """The synthetic API key returned when a child organization is created.

    Saves the extra calls to mint a key for the new org. Deprecated upstream:
    API v3 will move this to the top level of the response.
    """

    client_id: str
    client_secret: str
    name: str


class PipelineSettings(VerdocsModel):
    """Org-level document-pipeline automation flags.

    The flags are opt-in and the wire sends a partial object, so every flag
    defaults to False here.
    """

    # Auto-detect AcroForm (fillable PDF) fields when a document has no text tags.
    process_acroforms: bool = False
    # Process {{...}} text tags in uploaded documents.
    process_tags: bool = False
    # Skip (vs. reject) document tags whose role name is empty or invalid.
    ignore_invalid_roles: bool = False
    # Skip (vs. reject) document tags that do not form a valid field.
    ignore_invalid_fields: bool = False


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
    # If true, the organization may not be deleted; set it false before calling DELETE.
    deletion_protected: bool
    created_at: datetime
    updated_at: datetime
    # Only present when a child organization was just created; see OrganizationApiKey.
    api_key: OrganizationApiKey | None = None
    api_keys: list[ApiKey] | None = None
    brands: list[Brand] | None = None
    children: list[Organization] | None = None
    parent: Organization | None = None
    groups: list[Group] | None = None
    oauth2_apps: list[OAuth2App] | None = None
    entitlements: list[Entitlement] | None = None
    organization_invitations: list[OrganizationInvitation] | None = None
    profiles: list[Profile] | None = None
    webhooks: list[Webhook] | None = None
    envelopes: list[Envelope] | None = None
    templates: list[Template] | None = None
    group_profiles: list[GroupProfile] | None = None
    pending_webhooks: list[PendingWebhook] | None = None


DomainStatus = Literal["pending", "active", "failed", "suspended"]

EmailDomainStatus = Literal["pending", "verified", "failed", "suspended"]


class Brand(VerdocsModel):
    """White-label branding for an organization: logos, colors, domains, and email identity."""

    id: str
    organization_id: str
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
    app_domain: str | None = None
    app_domain_status: str | None = None  # Known values: DomainStatus.
    app_domain_cf_id: str | None = None
    app_domain_dcv_token: str | None = None
    email_domain: str | None = None
    email_local_part: str | None = None
    email_display_name: str | None = None
    email_reply_to: str | None = None
    email_reply_to_verified: bool
    email_domain_status: str | None = None  # Known values: EmailDomainStatus.
    email_spf_verified: bool
    email_dkim_verified: bool
    email_dmarc_verified: bool
    email_dkim_tokens: list[str]
    locale: str | None = None
    timezone: str | None = None
    created_at: datetime
    updated_at: datetime
    organization: Organization | None = None


class OrganizationInvitation(VerdocsModel):
    """An invitation for a person to join an organization."""

    organization_id: str
    email: str
    first_name: str
    last_name: str
    # The js-sdk pins this to 'pending' (invitations disappear once actioned),
    # but a status is exactly where the wire grows, so it stays open.
    status: str
    role: str
    generated_at: datetime
    token: str | None = None
    organization: Organization | None = None


class PendingWebhook(VerdocsModel):
    """A queued webhook delivery and the outcome of its last attempt."""

    id: str
    webhook_id: str
    organization_id: str
    url: str
    body: Any = None
    created_at: datetime
    delivered_at: datetime | None = None
    last_attempt_at: datetime | None = None
    last_status: int | None = None
    last_result: str | None = None
    webhook: Webhook | None = None
    organization: Organization | None = None


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
    api_keys: list[ApiKey] | None = None
    group_profiles: list[GroupProfile] | None = None
    groups: list[Group] | None = None
    notifications: list[Notification] | None = None
    oauth2_apps: list[OAuth2App] | None = None
    signatures: list[Signature] | None = None
    initials: list[Initial] | None = None


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


# Keys are WebhookEvent values (base.py), kept open so a webhook configured
# with a newer event than this SDK knows about still parses.
WebhookEvents = dict[str, bool]


class Webhook(VerdocsModel):
    """An outbound webhook subscription for an organization."""

    id: str
    organization_id: str
    url: str
    secret_key: str | None = None
    client_id: str | None = None
    client_secret: str | None = None
    scope: str | None = None
    token_endpoint: str | None = None
    auth_method: str  # Known values: WebhookAuthMethod in base.py.
    active: bool
    events: WebhookEvents
    status: str | None = None
    last_success: datetime | None = None
    last_failure: datetime | None = None
    organization: Organization | None = None
    pending_webhooks: list[PendingWebhook] | None = None


# Forms


class InPersonAccessKey(VerdocsModel):
    """An access key minted for an in-person signing link."""

    id: str
    type: Literal["in_person_link"]
    authentication: str | None = None
    role_name: str
    envelope_id: str
    key: str
    expiration_date: datetime | None = None
    created_at: datetime
    first_used: datetime | None = None
    last_used: datetime | None = None
    envelope: Envelope | None = None


class InAppAccessKey(VerdocsModel):
    """An access key for signing inside the creator's own app."""

    id: str
    type: Literal["in_app"]
    authentication: str | None = None
    recipient_name: str
    envelope_id: str
    key: str
    expiration_date: datetime | None = None
    created_at: datetime
    first_used: datetime | None = None
    last_used: datetime | None = None
    envelope: Envelope | None = None


class EmailAccessKey(VerdocsModel):
    """An access key delivered to a recipient by email."""

    id: str
    type: Literal["email"]
    authentication: str | None = None
    recipient_name: str
    envelope_id: str
    key: str
    expiration_date: datetime | None = None
    created_at: datetime
    first_used: datetime | None = None
    last_used: datetime | None = None
    envelope: Envelope | None = None


class SMSAccessKey(VerdocsModel):
    """An access key delivered to a recipient by SMS."""

    id: str
    type: Literal["sms"]
    authentication: str | None = None
    recipient_name: str
    envelope_id: str
    key: str
    expiration_date: datetime | None = None
    created_at: datetime
    first_used: datetime | None = None
    last_used: datetime | None = None
    envelope: Envelope | None = None


# The four key shapes differ only by their type tag (and the in-person key
# carrying role_name instead of recipient_name), so pydantic picks the branch
# by tag. A brand-new key type on the wire fails validation here; loosen only
# with a live payload in hand.
AccessKey = Annotated[
    InPersonAccessKey | InAppAccessKey | EmailAccessKey | SMSAccessKey,
    Field(discriminator="type"),
]


class Envelope(VerdocsModel):
    """A workflow wrapper that shepherds documents through a signing process."""

    id: str
    # Current workflow state. Known values: EnvelopeStatus in base.py.
    status: str
    profile_id: str
    template_id: str | None = None
    organization_id: str
    name: str
    # Sender identity overrides shown in places like the certificate. js-sdk
    # types these required, but the create handler writes null when no override
    # is given and the columns are nullable; live rows carry nulls.
    sender_name: str | None = None
    sender_email: str | None = None
    # If true, no email or SMS invites go out to recipients.
    no_contact: bool | None = None
    # Reminder delays in milliseconds (js-sdk doc comments say seconds; the
    # handler stores and compares ms); 0 or null disables them.
    initial_reminder: int | None = None
    followup_reminders: int | None = None
    # Maximum days after creation for which reminders are sent.
    max_reminder_days: int
    next_reminder: datetime | None = None
    created_at: datetime
    updated_at: datetime
    # The js-sdk types this required, but it is null until an envelope is
    # actually canceled.
    canceled_at: datetime | None = None
    expires_at: datetime | None = None
    # 'shared' makes the envelope visible to the rest of the organization.
    # Known values: private, shared; kept open like the other vocab fields.
    visibility: str
    # True once everything is submitted, stamped, and the certificate signed.
    signed: bool
    # Arbitrary caller data, e.g. source-system record IDs.
    data: dict[str, Any] | None = None
    profile: Profile | None = None
    template: Template | None = None
    organization: Organization | None = None
    access_keys: list[AccessKey] | None = None
    fields: list[EnvelopeField] | None = None
    history_entries: list[EnvelopeHistory] | None = None
    # The js-sdk requires recipients here, but its own update-result type
    # omits them, so envelope payloads without recipients are real. None keeps
    # "not included" distinct from "no recipients".
    recipients: list[Recipient] | None = None
    documents: list[EnvelopeDocument] | None = None


class EnvelopeDocument(VerdocsModel):
    """An individual document inside an envelope package."""

    id: str
    envelope_id: str
    # Null for envelopes created without templates.
    template_document_id: str | None = None
    order: int
    type: str  # Known values: EnvelopeDocumentType in base.py.
    name: str
    pages: int
    mime: str
    size: int
    # Documents are signed first, then the certificate, then the envelope.
    signed: bool
    # The wire contract is unsettled: the js-sdk types an array of
    # {width, height}, but live beta returns an object keyed by page index
    # (weekend finding 4). Raw until it settles; PageSize describes an entry.
    page_sizes: Any = None
    created_at: datetime
    updated_at: datetime


class DropdownOption(VerdocsModel):
    """One selectable option in a dropdown field."""

    id: str
    label: str


class EnvelopeField(VerdocsModel):
    """A signing field placed on an envelope document."""

    envelope_id: str
    document_id: str
    # The machine name of the field, e.g. Buyer-textbox-1.
    name: str
    # The role the field belongs to, e.g. Recipient 2.
    role_name: str
    type: str  # Known values: FieldType in base.py.
    required: bool | None = None
    # Fields may not be both required and readonly.
    readonly: bool | None = None
    # Deprecated grab-bag settings object; prefer the top-level fields.
    settings: dict[str, Any] | None = None
    validator: str | None = None
    label: str | None = None
    # Not sent by the server; the UI uses it to mark prepared fields.
    prepared: bool | None = None
    # 1-based page number. Self-placed fields the user must apply sit on page 0.
    page: int
    x: Number
    y: Number
    width: Number
    height: Number
    default: str | None = None
    placeholder: str | None = None
    # For text boxes, allows more than one line of text.
    multiline: bool
    # Radio buttons and check boxes store their selected value under this name.
    group: str | None = None
    options: list[DropdownOption] | None = None
    value: str | None = None
    is_valid: bool


class EnvelopeFieldOptions(VerdocsModel):
    """One option inside a checkbox or radio group on an envelope field."""

    id: str
    # Self-placed fields have an X and Y of 0.
    x: Number
    y: Number
    # For checkboxes, whether it is currently checked.
    checked: bool | None = None
    # For radio buttons, whether it is currently selected.
    selected: bool | None = None
    # The visible label, e.g. 'Not Applicable'.
    value: str


class EnvelopeFieldSettings(VerdocsModel):
    """Deprecated per-field settings grab bag; prefer the top-level field columns.

    Extra keys are kept, so anything the server still stores in here survives.
    """

    type: str | None = None
    x: Number | None = None
    y: Number | None = None
    width: Number | None = None
    height: Number | None = None
    value: Number | str | None = None
    # The current value, if the field has been filled in.
    result: Any = None
    # Text field settings. upperCase is camelCase on the wire; we match the wire.
    leading: Number | None = None
    alignment: int | None = None
    upperCase: bool | None = None
    # Dropdowns, checkboxes, radio groups.
    options: list[EnvelopeFieldOptions] | None = None
    # Signatures and initials; result will be "signed".
    base64: str | None = None
    hash: str | None = None
    ip_address: str | None = None
    browser: str | None = None
    platform: str | None = None
    mobile: bool | None = None
    signature_id: str | None = None
    signed_at: datetime | None = None
    # Checkbox settings. canvasHeight/canvasWidth are camelCase on the wire.
    minimum_checked: int | None = None
    maximum_checked: int | None = None
    canvasHeight: Number | None = None
    canvasWidth: Number | None = None


class EnvelopeHistory(VerdocsModel):
    """One entry in an envelope's audit trail."""

    id: str
    envelope_id: str
    # Null for envelope-level events (canceled, expired); js-sdk types it required.
    role_name: str | None = None
    event: str  # Known values: HistoryEvent in base.py.
    # Channel names for most events; free text for modification events.
    event_detail: str
    created_at: datetime
    envelope: Envelope | None = None


class Initial(VerdocsModel):
    """A saved initials image belonging to a profile."""

    id: str | None = None
    profile_id: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
    deleted_at: datetime | None = None
    profile: Profile | None = None


class KbaPINRequired(VerdocsModel):
    """Marker response indicating a PIN must be entered to proceed."""

    type: Literal["pin"]


class KBAQuestion(VerdocsModel):
    """A knowledge-based-authentication challenge question."""

    type: str
    answer: list[str]
    prompt: str


class Recipient(VerdocsModel):
    """A party acting on an envelope: signer, CC, or approver."""

    # Used only by the Web SDK during builder processes; not stored in the backend.
    id: str | None = None
    envelope_id: str
    role_name: str
    profile_id: str | None = None
    status: str  # Known values: RecipientStatus in base.py.
    first_name: str
    last_name: str
    # Deprecated on the wire; use first_name/last_name instead.
    full_name: str | None = None
    email: str
    # Phone number for SMS invites.
    phone: str | None = None
    # Address, city, state, zip, SSN last-4, and date of birth are only used
    # in KBA workflows.
    address: str | None = None
    city: str | None = None
    state: str | None = None
    zip: str | None = None
    ssn_last_4: str | None = None
    # The disclosure text the recipient accepted, and when.
    disclosures: str | None = None
    disclosures_accepted_at: datetime | None = None
    # Date of birth; the wire format is not ISO 8601 datetime, so it stays str.
    dob: str | None = None
    # Recipients sharing a sequence number act in parallel; the next sequence
    # is invited once everyone at the current one has signed.
    sequence: int
    # Display order within a single sequence level.
    order: int
    type: str  # Known values: RecipientType in base.py.
    delegator: bool
    delegated_to: str | None = None
    message: str | None = None
    claimed: bool
    agreed: bool
    # If true, the recipient may not change their legal name.
    name_locked: bool
    key_used_to_conclude: str | None = None
    environment: str | None = None
    created_at: datetime
    updated_at: datetime
    last_attempt_at: datetime | None = None
    locale: str | None = None
    timezone: str | None = None
    # Only returned to the envelope creator; sessions started with this key
    # authenticate at the "In App" level only.
    in_app_key: str | None = None
    # The next verification step to perform. Known values: RecipientAuthStep in base.py.
    auth_step: str | None = None
    # Verification types required for this recipient. Known values: RecipientAuthMethod in base.py.
    auth_methods: list[str] | None = None
    # State per auth method: complete, failed, challenge, questions,
    # differentiator, or null. Keys and values stay open like the other vocab.
    auth_method_states: dict[str, str | None] | None = None
    # The passcode to enter when auth_methods includes "passcode". Only
    # visible to the envelope creator.
    passcode: str | None = None
    # Challenge/differentiator questions when a KBA step requires them.
    kba_questions: list[KBAQuestion] | None = None
    envelope: Envelope | None = None
    profile: Profile | None = None


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


class Signature(VerdocsModel):
    """A saved signature image belonging to a profile."""

    id: str
    profile_id: str
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None
    profile: Profile | None = None


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


class TemplateDocument(VerdocsModel):
    """A file attached to a template for display and signing."""

    id: str
    name: str
    template_id: str
    order: int
    pages: int
    mime: str
    size: int
    # The wire contract is unsettled: the js-sdk types an array of
    # {width, height}, but live beta returns an object keyed by page index
    # (weekend finding 4). Raw until it settles; PageSize describes an entry.
    page_sizes: Any = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    # Deprecated on the wire; kept so older responses still parse. Use pages instead.
    page_numbers: int | None = None
    template: Template | None = None


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


class TextFieldSetting(VerdocsModel):
    """Legacy text-field settings shape kept for older stored templates."""

    x: Number
    y: Number
    width: Number
    height: Number
    result: str
    leading: Number
    alignment: int
    upperCase: bool


class TemplateFieldSetting(VerdocsModel):
    """Deprecated per-field settings grab bag for template fields.

    The js-sdk shape carries an open index signature; extra keys are kept.
    """

    x: Number | None = None
    y: Number | None = None
    result: str | None = None
    width: Number | None = None
    height: Number | None = None
    # Text field settings.
    leading: Number | None = None
    alignment: int | None = None
    upperCase: bool | None = None
    # Dropdowns, checkboxes, radio groups.
    options: list[Any] | None = None


# The js-sdk trims joined relations off its envelope-update result. Those are
# all optional fields here, so the full model parses the trimmed payload.
EnvelopeUpdateResult = Envelope

# Usage counters: the js-sdk leaves the outer key untyped; the inner keys are
# UsageType values (base.py).
OrganizationUsage = dict[str, dict[str, int]]
