"""Enum-like vocabulary for the Verdocs wire format (js-sdk: BaseTypes.ts).

Each alias is a Literal naming the values the API is known to use. Request
models type their fields with these aliases so mistakes are caught before
they reach the wire. Response models deliberately keep plain str for the same
fields and point here for the known values, so a new server value never
breaks an installed client (see core.py).
"""

from __future__ import annotations

from typing import Literal

RequestStatus = Literal["OK", "ERROR"]

# Who will own envelopes created from a template.
TemplateSender = Literal["envelope_creator", "template_owner"]

TemplateAction = Literal[
    "create_personal",
    "create_org",
    "create_public",
    "read",
    "write",
    "delete",
    "change_visibility_personal",
    "change_visibility_org",
    "change_visibility_public",
]

RecipientAction = Literal["submit", "decline", "prepare", "update"]

# 'complete', 'declined', and 'canceled' are permanent end states. 'complete'
# means all required data was submitted, not "fully signed" (envelope.signed
# covers that).
EnvelopeStatus = Literal["complete", "pending", "in progress", "declined", "canceled"]

RecipientStatus = Literal[
    "invited",
    "opened",
    "signed",
    "submitted",
    "canceled",
    "pending",
    "declined",
    "failed",
]

RecipientType = Literal["signer", "cc", "approver"]

# js-sdk names this TSortTemplateBy; the seed established TemplateSortBy and
# we keep that name so existing imports stay valid.
TemplateSortBy = Literal["created_at", "updated_at", "name", "last_used_at", "counter", "star_counter"]

AccessKeyType = Literal["email", "in_app", "in_person_link", "sms"]

ApiKeyPermission = Literal["personal", "global_read", "global_write"]

# Deprecated upstream: see envelope.created_at, .updated_at, and .canceled_at.
DeprecatedHistoryEvent = Literal["envelope:created", "envelope:completed"]

HistoryEvent = (
    Literal[
        "recipient:signed",
        "recipient:opened",
        "recipient:submitted",
        "recipient:prepared",
        "recipient:claimed",
        "recipient:agreed",
        "recipient:invited",
        "recipient:reminder",
        "recipient:delegated",
        "recipient:updated_info",
        "recipient:declined",
        "recipient:kba_verified",
        "recipient:kba_failed",
        "recipient:id_verified",
        "recipient:id_failed",
        "recipient:pin_verified",
        "recipient:pin_failed",
        "invitation:resent",
        "envelope:cc",
        "envelope:canceled",
        "envelope:expired",
        "owner:updated_recipient_info",
        "owner:get_in_person_link",
    ]
    | DeprecatedHistoryEvent
)

# The js-sdk unions the known channel names with plain string because
# modification events carry a free-text description, so the type collapses
# to str. Known values: in_app, mail, signer, sms, reminder, preparer,
# manual, in_person_link, guest, email, and the empty string.
EventDetail = str

EnvelopeDocumentType = Literal["attachment", "certificate"]

FieldType = Literal[
    "signature",
    "initial",
    "checkbox",
    "radio",
    "textbox",
    "timestamp",
    "date",
    "dropdown",
    "textarea",
    "attachment",
    "payment",
]

WebhookEvent = Literal[
    "envelope_created",
    "envelope_completed",
    "envelope_canceled",
    "envelope_updated",
    "envelope_expired",
    "template_created",
    "template_updated",
    "template_deleted",
    "template_used",
    "recipient_submitted",
    "recipient_updated",
    "recipient_delegated",
    "kba_event",
    "entitlement_used",
    "recipient_invited",
    "recipient_reminded",
    "recipient_opened",
    "recipient_auth_fail",
    "recipient_disclosure_accepted",
    "recipient_docs_downloaded",
    "recipient_invite_failed",
    "recipient_declined",
    "organization_deleted",
]

# Every webhook event the API can deliver, in the js-sdk's order. Useful for
# building a full Webhook.events map without spelling out each key.
WEBHOOK_EVENTS: tuple[WebhookEvent, ...] = (
    "envelope_created",
    "envelope_completed",
    "envelope_canceled",
    "envelope_updated",
    "envelope_expired",
    "template_created",
    "template_updated",
    "template_deleted",
    "template_used",
    "recipient_submitted",
    "recipient_updated",
    "recipient_delegated",
    "kba_event",
    "entitlement_used",
    "recipient_invited",
    "recipient_reminded",
    "recipient_opened",
    "recipient_auth_fail",
    "recipient_disclosure_accepted",
    "recipient_docs_downloaded",
    "recipient_invite_failed",
    "recipient_declined",
    "organization_deleted",
)

TemplateVisibility = Literal["private", "shared", "public"]

# js-sdk names this TEntitlement; renamed here because Entitlement is the
# wire model for the entitlement record itself and this names its feature.
EntitlementFeature = Literal[
    "envelope",
    "kba_auth",
    "passcode_auth",
    "sms_auth",
    "kba_id_auth",
    "id_auth",
    "custom_disclaimer",
]

# How a recipient proves who they are: a pre-shared passcode, a one-time code
# over SMS or email, knowledge-based questions (kba), or full ID verification.
RecipientAuthMethod = Literal["kba", "passcode", "sms", "email", "id"]

RecipientAuthStep = RecipientAuthMethod | None

UsageType = Literal[
    "envelope",
    "envelope_canceled",
    "envelope_completed",
    "envelope_expired",
    "sms_invite",
    "template",
    "auth_email",
    "auth_sms",
    "auth_kba",
    "auth_id",
    "auth_passcode",
]

# How webhook deliveries authenticate to the receiver.
WebhookAuthMethod = Literal["none", "hmac", "client_credentials"]

NotificationType = Literal["sms", "email", "app"]

EventName = Literal[
    "invitation:canceled",
    "transaction:completed",
    "envelope:failed",
    "envelope:expired",
    "envelope:declined",
    "envelope:cc",
    "recipient:reminder",
    "transaction:requested",
    "envelope:completed",
    "transaction:canceled",
    "user:invited",
    "recipient:invited",
    "envelope:canceled",
    "transaction:sent",
    "envelope:signed",
    "email:verify",
    "email:otp",
    "password:reset",
    "recipient:question",
    "delegate:requested",
    "delegate:send_confirmed",
]
