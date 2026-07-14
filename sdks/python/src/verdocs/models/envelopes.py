"""Envelope request and response models (js-sdk: Envelopes module).

The wire models for envelopes themselves (Envelope, Recipient,
EnvelopeDocument, EnvelopeField, Signature, Initial) live in core.py with the
rest of the Models.ts shapes. This module holds the Envelopes module's own
request-parameter and response shapes: Envelopes/Types.ts, the interfaces
declared inline in Envelopes/Envelopes.ts, and the KBA step shapes from
Envelopes/KBA.ts, plus DEFAULT_DISCLOSURES.

Where the js-sdk types and the deployed API disagree on required vs optional,
the API wins and the field comment says so; the shapes themselves stay
faithful to the js-sdk.
"""

from __future__ import annotations

import os
from datetime import datetime
from typing import IO, Annotated, Any, Literal

from pydantic import Field

from .base import EnvelopeStatus, FieldType, RecipientAuthMethod, RecipientStatus, RecipientType
from .core import AccessKey, DropdownOption, Envelope, Initial, Number, Recipient, Signature, VerdocsModel

# What the upload methods accept for a file: a filesystem path (str or
# PathLike), raw bytes, a binary file-like object, or an httpx-style
# (filename, content) / (filename, content, content_type) tuple. Paths are
# read up front and the part is named after their basename; bare bytes and
# file-likes go up under httpx's default part filename.
FileContent = bytes | IO[bytes]
FileInput = (
    str | os.PathLike[str] | FileContent | tuple[str | None, FileContent] | tuple[str | None, FileContent, str | None]
)


class EnvelopeList(VerdocsModel):
    """One page of envelope results from GET /v2/envelopes."""

    # Total number of records matching the query, for pagination.
    count: int
    # Number of rows in this page.
    rows: int
    # The 0-based page number of this response.
    page: int
    envelopes: list[Envelope]


class EnvelopeListParams(VerdocsModel):
    """Query filters for listing envelopes (js-sdk: IListEnvelopesParams). Only the fields you set are sent."""

    # Match envelopes whose name contains this search term.
    q: str | None = None
    # Pre-defined views: inbox and action are envelopes awaiting the caller,
    # sent is envelopes the caller created, waiting is envelopes awaiting
    # anyone, completed is envelopes with all actions done.
    view: Literal["inbox", "sent", "action", "waiting", "completed"] | None = None
    # Match envelopes in any of these states.
    status: list[EnvelopeStatus] | None = None
    # Include envelopes shared with the whole organization.
    include_org: bool | None = None
    # Match envelopes created from this template.
    template_id: str | None = None
    created_before: datetime | None = None
    created_after: datetime | None = None
    sort_by: Literal["name", "created_at", "updated_at", "canceled_at", "status"] | None = None
    # Set True or False to override the sort direction. Date sorts default to descending, names ascending.
    ascending: bool | None = None
    # Number of rows to retrieve.
    rows: int | None = None
    # Page to retrieve (0-based).
    page: int | None = None


class TimeRange(VerdocsModel):
    """A start/end time window (js-sdk: ITimeRange). Exported for parity; nothing consumes it today."""

    start: datetime
    end: datetime


class EnvelopesSearchResult(VerdocsModel):
    """Legacy search-result page shape (js-sdk: IEnvelopesSearchResult). Superseded by EnvelopeList."""

    page: int
    total: int
    result: list[Envelope]


class DocumentSearchOptions(VerdocsModel):
    """Legacy document-search options (js-sdk: IDocumentSearchOptions). Retained for parity."""

    rows: int | None = None
    page: int | None = None
    sort_by: Literal["updated_at", "created_at"] | None = None
    ascending: bool | None = None
    is_owner: bool | None = None
    is_recipient: bool | None = None
    envelope_status: list[EnvelopeStatus] | None = None
    recipient_status: list[RecipientStatus] | None = None


class EnvelopeCreateRecipientFromTemplate(VerdocsModel):
    """A recipient entry for envelopes created from a template (js-sdk: ICreateEnvelopeRecipientFromTemplate).

    Every role defined in the template must have a matching entry by
    role_name. The server rejects recipients with all of address, city,
    state, zip, and dob populated (at least one KBA field must stay blank),
    and rejects duplicate recipient emails within one envelope.
    """

    # Must match one of the roles defined in the template.
    role_name: str
    first_name: str
    last_name: str
    # The js-sdk types email optional, but the server schema requires the key
    # on every recipient: send an empty string for phone-only recipients.
    email: str
    # Phone number for SMS invites. Required (non-empty) when email is blank.
    phone: str | None = None
    # Whether the recipient may delegate their tasks to others.
    delegator: bool | None = None
    # A custom message for the email or SMS invitation.
    message: str | None = None
    # Verification methods the recipient must complete before signing.
    auth_methods: list[RecipientAuthMethod] | None = None
    # For passcode auth, the code to challenge the signer with (4+ characters).
    passcode: str | None = None
    # For SMS auth, the number that receives one-time codes. Not defaulted
    # from the notification phone; leaving it blank triggers an error.
    phone_auth: str | None = None
    # Pre-filled KBA identity details, if known.
    address: str | None = None
    city: str | None = None
    state: str | None = None
    zip: str | None = None
    dob: str | None = None
    ssn_last_4: str | None = None


class EnvelopeCreateRecipientDirect(VerdocsModel):
    """A recipient entry for envelopes created without a template (js-sdk: ICreateEnvelopeRecipientDirectly).

    Same server rules as the template flavor: the email key is always
    required (empty string for phone-only recipients), all KBA fields may not
    be populated at once, and duplicate emails are rejected.
    """

    # Most participants in standard flows are "signer" recipients.
    type: RecipientType
    role_name: str
    first_name: str
    last_name: str
    # The js-sdk types email optional, but the server schema requires the key
    # on every recipient: send an empty string for phone-only recipients.
    email: str
    # Phone number for SMS invites. Required (non-empty) when email is blank.
    phone: str | None = None
    # 1-based workflow level. Recipients sharing a sequence act in parallel;
    # the next level is invited once the current one completes.
    sequence: int | None = None
    # 1-based display order within a sequence level.
    order: int | None = None
    delegator: bool | None = None
    message: str | None = None
    auth_methods: list[RecipientAuthMethod] | None = None
    # For passcode auth, the code to challenge the signer with (4+ characters).
    passcode: str | None = None
    # For SMS auth, the number that receives one-time codes.
    phone_auth: str | None = None
    # Pre-filled KBA identity details, if known.
    address: str | None = None
    city: str | None = None
    state: str | None = None
    zip: str | None = None
    dob: str | None = None
    ssn_last_4: str | None = None


class EnvelopeCreateDocumentFromData(VerdocsModel):
    """An envelope document attached as base64 content (js-sdk: ICreateEnvelopeDocumentFromData)."""

    # Display order for the document.
    order: int | None = None
    # Override the detected MIME type.
    mime: str | None = None
    # Document name; used to generate the final filename.
    name: str | None = None
    # Base64 content, raw or as a data: URI. JSON bodies cap at 15 MB, so
    # payloads top out around 10-11 MB of raw file data.
    data: str


class EnvelopeCreateDocumentFromUri(VerdocsModel):
    """An envelope document fetched by the server from a URI (js-sdk: ICreateEnvelopeDocumentFromUri)."""

    order: int | None = None
    mime: str | None = None
    name: str | None = None
    # Verdocs downloads the document from this URI without sending auth
    # headers; short-lived pre-signed URLs are strongly recommended.
    uri: str


class EnvelopeCreateDocumentFromFile(VerdocsModel):
    """A direct file attachment entry (js-sdk: ICreateEnvelopeDocumentFromFile).

    Dead on the wire: envelope creation is JSON-only (the route registers an
    upload middleware the handler never reads), and the server rejects
    document entries without data or uri. Retained for js-sdk parity only;
    use the data or uri flavors instead.
    """

    order: int | None = None
    mime: str | None = None
    name: str | None = None
    file: Any = None


EnvelopeCreateDocument = EnvelopeCreateDocumentFromData | EnvelopeCreateDocumentFromUri | EnvelopeCreateDocumentFromFile


class EnvelopeCreateFieldFromTemplate(VerdocsModel):
    """Overrides for a template-defined field when creating an envelope (js-sdk: ICreateEnvelopeFieldFromTemplate).

    Entries are matched to the template's prepared fields by name; anything
    set here overrides the template's setting.
    """

    # The machine name of the field, e.g. Buyer-textbox-1.
    name: str
    # The role the field belongs to, e.g. Recipient 2.
    role_name: str
    required: bool | None = None
    # Fields may not be both required and readonly.
    readonly: bool | None = None
    label: str | None = None
    # If a default is provided, the field is marked prepared.
    default: str | None = None
    placeholder: str | None = None
    multiline: bool | None = None
    # Radio buttons and check boxes store their selected value under this name.
    group: str | None = None
    options: list[DropdownOption] | None = None


class EnvelopeCreateFieldDirect(VerdocsModel):
    """A field definition for envelopes created without a template (js-sdk: ICreateEnvelopeFieldDirectly)."""

    # The array index of the entry in the documents list this field sits on,
    # not a document UUID.
    document_id: int
    # The machine name of the field, e.g. Buyer-textbox-1.
    name: str
    # The role the field belongs to, e.g. Recipient 2.
    role_name: str
    type: FieldType
    # 1-based page number. Self-placed fields the user must apply sit on page 0.
    page: int
    x: Number
    y: Number
    width: Number | None = None
    height: Number | None = None
    required: bool | None = None
    # Fields may not be both required and readonly.
    readonly: bool | None = None
    label: str | None = None
    default: str | None = None
    placeholder: str | None = None
    # For text boxes, allows more than one line of text.
    multiline: bool | None = None
    # Radio buttons and check boxes store their selected value under this name.
    group: str | None = None
    options: list[DropdownOption] | None = None


class EnvelopeCreateFromTemplateParams(VerdocsModel):
    """Fields for creating an envelope from a template (js-sdk: ICreateEnvelopeFromTemplateRequest)."""

    template_id: str
    # Override the envelope name (defaults to the template name).
    name: str | None = None
    description: str | None = None
    # Only the sender NAME can be overridden in notifications; the from
    # address stays notifications@verdocs.com to keep spam filters happy.
    sender_name: str | None = None
    # Shown where the Web UI and certificate reflect the sender; does not
    # change the address notifications are sent from.
    sender_email: str | None = None
    # If true, no email or SMS invites go out to recipients.
    no_contact: bool | None = None
    # Must be more than 24 hours in the future. The server validates this on
    # every create but only stores it for envelopes created WITHOUT a
    # template, so it currently has no effect on this path.
    expires_at: datetime | None = None
    # Leave unset unless Verdocs support says otherwise.
    environment: str | None = None
    # 'shared' makes the envelope visible to the whole organization.
    visibility: Literal["private", "shared"] | None = None
    # Delay in milliseconds before the first reminder, up to 30 days. 0 or an
    # explicit None disables reminders. (The js-sdk comments say seconds; the
    # server validates milliseconds.)
    initial_reminder: int | None = None
    # Delay in milliseconds between follow-up reminders, up to 30 days. 0 or
    # an explicit None disables them.
    followup_reminders: int | None = None
    # Maximum days after creation for which reminders are sent (1-90, server default 14).
    max_reminder_days: int | None = None
    # One entry per template role, matched by role_name.
    recipients: list[EnvelopeCreateRecipientFromTemplate]
    # Caller metadata attached to the envelope. Not shown to recipients, but
    # not private either; keep sensitive data out.
    data: Any = None
    # Overrides for the template's prepared fields, matched by name. The
    # js-sdk types this as a single object; the server validates an array.
    fields: list[EnvelopeCreateFieldFromTemplate] | None = None
    # Locale code, e.g. en-US.
    locale: str | None = None
    # Long-form timezone, e.g. America/New_York.
    timezone: str | None = None


class EnvelopeCreateDirectParams(VerdocsModel):
    """Fields for creating an envelope without a template (js-sdk: ICreateEnvelopeDirectlyRequest)."""

    name: str
    description: str | None = None
    # Only the sender NAME can be overridden in notifications; the from
    # address stays notifications@verdocs.com to keep spam filters happy.
    sender_name: str | None = None
    # Shown where the Web UI and certificate reflect the sender; does not
    # change the address notifications are sent from.
    sender_email: str | None = None
    # If true, no email or SMS invites go out to recipients.
    no_contact: bool | None = None
    # Must be more than 24 hours in the future.
    expires_at: datetime | None = None
    # Leave unset unless Verdocs support says otherwise.
    environment: str | None = None
    # 'shared' makes the envelope visible to the whole organization.
    visibility: Literal["private", "shared"] | None = None
    # Delay in milliseconds before the first reminder, up to 30 days. 0 or an
    # explicit None disables reminders. The js-sdk types the reminder fields
    # required on this path; the server treats them as optional.
    initial_reminder: int | None = None
    # Delay in milliseconds between follow-up reminders, up to 30 days.
    followup_reminders: int | None = None
    # Maximum days after creation for which reminders are sent (1-90, server default 14).
    max_reminder_days: int | None = None
    # Caller metadata attached to the envelope. Not shown to recipients, but
    # not private either; keep sensitive data out.
    data: Any = None
    recipients: list[EnvelopeCreateRecipientDirect]
    # Documents to attach. Only the data and uri flavors work on the wire;
    # see EnvelopeCreateDocumentFromFile.
    documents: list[EnvelopeCreateDocument]
    # Fields to place on the documents. The js-sdk types this required; the
    # server treats it as optional.
    fields: list[EnvelopeCreateFieldDirect] | None = None
    # Locale code, e.g. en-US.
    locale: str | None = None
    # Long-form timezone, e.g. America/New_York.
    timezone: str | None = None


# js-sdk: TCreateEnvelopeRequest.
EnvelopeCreateParams = EnvelopeCreateFromTemplateParams | EnvelopeCreateDirectParams


class EnvelopeUpdateParams(VerdocsModel):
    """Fields for updating an envelope (js-sdk: updateEnvelope's params). Only the fields you set are sent."""

    name: str | None = None
    sender_name: str | None = None
    sender_email: str | None = None
    # Reminder delays in milliseconds; an explicit None disables them.
    initial_reminder: int | None = None
    followup_reminders: int | None = None
    # Must be more than 24 hours in the future.
    expires_at: datetime | None = None
    visibility: Literal["private", "shared"] | None = None
    # If true, no email or SMS invites go out to recipients.
    no_contact: bool | None = None
    # Caller metadata attached to the envelope.
    data: dict[str, Any] | None = None


class RecipientAgreeParams(VerdocsModel):
    """Locale details recorded when a recipient agrees to disclosures (js-sdk: IRecipientDisclosureAgreeBody)."""

    locale: str | None = None
    timezone: str | None = None


class RecipientSubmitParams(VerdocsModel):
    """Locale details recorded when a recipient submits an envelope (js-sdk: IRecipientSubmitBody)."""

    locale: str | None = None
    timezone: str | None = None


class RecipientDelegateParams(VerdocsModel):
    """Details of the person a recipient delegates their signing tasks to."""

    first_name: str
    last_name: str
    email: str
    phone: str | None = None
    # Optional message for the new recipient's invitation.
    message: str | None = None


class RecipientUpdateParams(VerdocsModel):
    """Fields for updating a recipient (js-sdk: IUpdateRecipientParams). Only the fields you set are sent.

    The auth-related fields (passcode and the KBA prefills) may only be
    changed while the recipient has not yet completed that auth method.
    """

    # Trigger a reminder invite, or fully reset the recipient's status.
    action: Literal["remind", "reset"] | None = None
    first_name: str | None = None
    last_name: str | None = None
    # If changed, a new invite is sent.
    email: str | None = None
    # If changed, a new invite is sent.
    phone: str | None = None
    # A custom message for the email or SMS invitation.
    message: str | None = None
    passcode: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    zip: str | None = None
    dob: str | None = None
    ssn_last_4: str | None = None
    # If true, the recipient may not change their legal name. The js-sdk
    # types this as a string (a typo; the create schema validates a boolean),
    # and the server's update schema currently strips it entirely.
    name_locked: bool | None = None


class RecipientUpdateStatus(VerdocsModel):
    """Legacy recipient-status update shape (js-sdk: IUpdateRecipientStatus). Nothing calls with it today."""

    first_name: str | None = None
    last_name: str | None = None
    agreed: bool | None = None
    action: Literal["prepare", "update"] | None = None


class EnvelopeReminderCreateParams(VerdocsModel):
    """Legacy reminder-setup shape (js-sdk: ICreateEnvelopeReminderRequest). Nothing calls with it today."""

    setup_time: Number
    interval_time: Number


class SignerTokenResponse(VerdocsModel):
    """A started or updated signing session (js-sdk: ISignerTokenResponse)."""

    # Access token for signing operations; attach it to an endpoint with
    # set_token(token, "signing").
    access_token: str
    envelope: Envelope
    recipient: Recipient
    # Stored signature blocks for the recipient; most flows use the first.
    signatures: list[Signature] | None = None
    # Stored initials blocks for the recipient; most flows use the first.
    initials: list[Initial] | None = None
    # The org's default brand, if set. Carries style_overrides CSS and other
    # branding fields; loosely typed because the server sends a partial row.
    brand: dict[str, Any] | None = None


class InPersonLinkResponse(VerdocsModel):
    """An in-person signing link plus a ready-to-use session (js-sdk: IInPersonLinkResponse)."""

    # A Verdocs Web URL hosting the signing experience.
    link: str
    # Access token for immediate signing use, recorded as "in-person" authentication.
    access_token: str
    # The access key behind the link. As sensitive as a bearer token; protect
    # it from theft and unauthorized sharing.
    access_key: AccessKey
    envelope: Envelope
    recipient: Recipient


class RecipientVerifyPasscodeParams(VerdocsModel):
    """Complete a passcode verification step (js-sdk: IAuthenticateRecipientViaPasscodeRequest)."""

    auth_method: Literal["passcode"] = "passcode"
    # The passcode the envelope creator set for this recipient.
    code: str


class RecipientVerifyEmailParams(VerdocsModel):
    """Complete an email one-time-code verification step (js-sdk: IAuthenticateRecipientViaEmailRequest)."""

    auth_method: Literal["email"] = "email"
    # The one-time code that was emailed to the recipient.
    code: str
    # Set True to send a fresh code instead of checking one.
    resend: bool | None = None


class RecipientVerifySMSParams(VerdocsModel):
    """Complete an SMS one-time-code verification step (js-sdk: IAuthenticateRecipientViaSMSRequest)."""

    auth_method: Literal["sms"] = "sms"
    # The one-time code that was texted to the recipient.
    code: str
    # Set True to send a fresh code instead of checking one.
    resend: bool | None = None


class KBAResponse(VerdocsModel):
    """One answer to a KBA challenge question (js-sdk: IKBAResponse)."""

    type: str
    answer: str | Number


class RecipientVerifyKBAParams(VerdocsModel):
    """Complete a knowledge-based-authentication step (js-sdk: IAuthenticateRecipientViaKBARequest).

    The first call typically carries the identity details; if the identity
    service needs more, the recipient answers the challenge questions from
    recipient.kba_questions and this is called again with responses set.
    """

    auth_method: Literal["kba"] = "kba"
    first_name: str | None = None
    last_name: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    zip: str | None = None
    ssn_last_4: str | None = None
    dob: str | None = None
    # Answers to challenge questions, in the order they were presented.
    responses: list[KBAResponse] | None = None


# js-sdk: TAuthenticateRecipientRequest.
RecipientVerifyParams = (
    RecipientVerifyPasscodeParams | RecipientVerifyEmailParams | RecipientVerifySMSParams | RecipientVerifyKBAParams
)


# The KBA step shapes below mirror Envelopes/KBA.ts. The /v2/kba routes they
# describe do not exist on the deployed API (see resources/kba.py); the
# models are kept for js-sdk parity.


class RecipientKbaStepNone(VerdocsModel):
    """KBA is not required at this time (js-sdk: IRecipientKbaStepNone)."""

    envelope_id: str
    role_name: str
    kba_step: Literal["none"]


class RecipientKbaStepComplete(VerdocsModel):
    """KBA has been completed; no further action is required (js-sdk: IRecipientKbaStepComplete)."""

    envelope_id: str
    role_name: str
    kba_step: Literal["complete"]


class RecipientKbaStepPin(VerdocsModel):
    """A PIN code is required; submit it via kba.submit_pin (js-sdk: IRecipientKbaStepPin)."""

    envelope_id: str
    role_name: str
    kba_step: Literal["pin"]


class RecipientKbaStepIdentity(VerdocsModel):
    """Full identity details are required; submit them via kba.submit_identity (js-sdk: IRecipientKbaStepIdentity)."""

    envelope_id: str
    role_name: str
    kba_step: Literal["identity"]


class KbaChallengeQuestion(VerdocsModel):
    """One challenge question presented during KBA."""

    type: str
    message: str
    options: list[str | Number]


class RecipientKbaStepChallenge(VerdocsModel):
    """Challenge questions must be answered via kba.submit_challenge_response (js-sdk: IRecipientKbaStepChallenge)."""

    envelope_id: str
    role_name: str
    kba_step: Literal["challenge"]
    questions: list[KbaChallengeQuestion]


class RecipientKbaStepFailed(VerdocsModel):
    """Identity verification failed; show the message and stop (js-sdk: IRecipientKbaStepFailed)."""

    envelope_id: str
    role_name: str
    kba_step: Literal["failed"]
    message: str


# js-sdk: TRecipientKbaStep. The branches differ only by their kba_step tag,
# so pydantic picks the branch by tag.
RecipientKbaStep = Annotated[
    RecipientKbaStepNone
    | RecipientKbaStepComplete
    | RecipientKbaStepPin
    | RecipientKbaStepIdentity
    | RecipientKbaStepChallenge
    | RecipientKbaStepFailed,
    Field(discriminator="kba_step"),
]


class KbaIdentity(VerdocsModel):
    """Identity details for a KBA challenge (js-sdk: IKbaIdentity).

    Field names are camelCase because that is what this wire shape uses,
    unlike the rest of the API; we match the wire rather than alias.
    """

    firstName: str
    lastName: str
    address: str
    city: str | None = None
    state: str | None = None
    zip: str | None = None
    ssnLast4: str | None = None
    email: str | None = None


class KbaChallengeResponse(VerdocsModel):
    """One answer to a KBA challenge question (js-sdk: IKbaChallengeResponse)."""

    type: str
    answer: str | Number


# The stock e-signature disclosure text used when the organization supplies
# no override. Copied verbatim from the js-sdk, HTML and all.
DEFAULT_DISCLOSURES = """
<ul>
  <li>
    Agree to use electronic records and signatures, and confirm you have read the
    <a href="https://verdocs.com/en/electronic-record-signature-disclosure/" target="_blank">
      Electronic Record and Signatures Disclosure</a>.</li>
  <li>
    Agree to Verdocs'
    <a href="https://verdocs.com/en/eula" target="_blank">
      End User License Agreement</a>
    and confirm you have read Verdocs'
    <a href="https://verdocs.com/en/privacy-policy/" target="_blank">
      Privacy Policy</a>.
  </li>
</ul>"""
