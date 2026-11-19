"""Clickwrap request and response models (js-sdk: Clickwrap module).

Clickwrap agreements are terms people accept with a checkbox. These are the
shapes of the agreements, versions, sessions, and records the api's
/v2/clickwraps routes send and accept. Field lists follow the deployed api
handlers.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from .core import VerdocsModel

# A version's lifecycle. Drafts can be edited or deleted; published versions never change.
ClickwrapVersionStatus = Literal["draft", "published"]

ClickwrapOutcome = Literal["accepted", "declined"]

# Where an outcome was recorded: the embedded component, the hosted page, or your own interface.
ClickwrapSurface = Literal["component", "hosted", "headless"]

ClickwrapMode = Literal["modal", "inline"]

# For headless records the IP address and user agent are the customer's report, not ours.
ClickwrapReporter = Literal["verdocs", "customer"]

ClickwrapPresentationSource = Literal["rendered", "customer", "none"]

# Every event in a record's trail. accepted and declined are written by Verdocs with the outcome.
ClickwrapEventType = Literal["shown", "scrolled_to_end", "checked", "unchecked", "accepted", "declined"]

# The events a session can report while the person reads.
ClickwrapSessionEventType = Literal["shown", "scrolled_to_end", "checked", "unchecked"]

ClickwrapDownloadType = Literal["certificate", "replay", "evidence"]


class ClickwrapAgreement(VerdocsModel):
    """A clickwrap agreement, such as a Terms of Service (js-sdk: IClickwrapAgreement)."""

    id: str
    organization_id: str
    # What developers pass to the API, such as "terms-of-service". It never changes.
    key: str
    name: str
    created_by: str | None = None
    created_at: datetime
    updated_at: datetime


class ClickwrapVersionRef(VerdocsModel):
    """A short reference to one version (js-sdk: IClickwrapVersionRef)."""

    id: str
    number: int
    status: ClickwrapVersionStatus
    published_at: datetime | None = None


class ClickwrapAgreementSummary(ClickwrapAgreement):
    """An agreement with its current version and open draft (js-sdk: IClickwrapAgreementSummary)."""

    current_version: ClickwrapVersionRef | None = None
    draft_version: ClickwrapVersionRef | None = None


class ClickwrapVersion(VerdocsModel):
    """One version of an agreement's text (js-sdk: IClickwrapVersion)."""

    id: str
    agreement_id: str
    number: int
    status: ClickwrapVersionStatus
    # Sanitized HTML.
    content: str
    # SHA-256 hex of content, set when the version is published.
    content_hash: str | None = None
    requires_reacceptance: bool
    change_summary: str | None = None
    published_at: datetime | None = None
    published_by: str | None = None
    created_at: datetime
    updated_at: datetime


class ClickwrapAgreementDetail(ClickwrapAgreement):
    """An agreement with every version, newest first (js-sdk: IClickwrapAgreementDetail)."""

    versions: list[ClickwrapVersion]


class ClickwrapAgreementCreateParams(VerdocsModel):
    """Fields for creating an agreement (js-sdk: ICreateClickwrapAgreementRequest)."""

    # Lowercase letters and digits separated by single hyphens. It can never change.
    key: str
    name: str


class ClickwrapDraftCreateParams(VerdocsModel):
    """Fields for starting a draft (js-sdk: ICreateClickwrapDraftRequest).

    Send content, copy_current, or neither for an empty draft, but not both.
    """

    content: str | None = None
    # Start from the current version's text instead of content.
    copy_current: bool | None = None


class ClickwrapPublishParams(VerdocsModel):
    """Fields for publishing a draft (js-sdk: IPublishClickwrapVersionRequest)."""

    # Required so re-acceptance is never chosen by default.
    requires_reacceptance: bool
    change_summary: str | None = None


class ClickwrapCoverageVersion(VerdocsModel):
    """How many people accepted one published version (js-sdk: IClickwrapCoverageVersion)."""

    id: str
    number: int
    published_at: datetime | None = None
    requires_reacceptance: bool
    # Distinct people, not clicks.
    people: int


class ClickwrapCoverage(VerdocsModel):
    """How many people have accepted an agreement (js-sdk: IClickwrapCoverage)."""

    agreement_id: str
    # The newest published version that requires re-acceptance, or 0 when none does.
    cutoff_number: int
    accepted_any: int
    current: int
    versions: list[ClickwrapCoverageVersion]


class ClickwrapPendingVersion(VerdocsModel):
    """The version a person would be shown next (js-sdk: IClickwrapPendingVersion)."""

    id: str
    number: int
    requires_reacceptance: bool


class ClickwrapStatus(VerdocsModel):
    """Whether one person is current on one agreement (js-sdk: IClickwrapStatus)."""

    key: str
    current: bool
    # None when the person is current.
    pending_version: ClickwrapPendingVersion | None = None


class ClickwrapSessionCreateParams(VerdocsModel):
    """Fields for starting an acceptance session (js-sdk: ICreateClickwrapSessionRequest)."""

    user_id: str
    # Agreement keys in the order to show them. Up to 20.
    agreements: list[str]
    # Flat string values kept with the record. Up to 50 keys.
    metadata: dict[str, str] | None = None
    mode: ClickwrapMode | None = None
    require_scroll: bool | None = None
    brand_key: str | None = None
    # https, or http on localhost.
    return_url: str | None = None
    cancel_url: str | None = None


class ClickwrapSessionCurrent(VerdocsModel):
    """create_session's answer when the person is already current (js-sdk: IClickwrapSessionCurrent).

    There's nothing to show and no session.
    """

    current: Literal[True]
    agreements: list[ClickwrapStatus]


class ClickwrapSessionCreated(VerdocsModel):
    """create_session's answer when the person has something to accept (js-sdk: IClickwrapSessionCreated)."""

    current: Literal[False]
    id: str
    # Returned only here, so hand it to the browser now.
    token: str
    expires_at: datetime
    # The agreement keys that were requested.
    agreements: list[str]
    hosted_url: str
    status: list[ClickwrapStatus]


class ClickwrapOutcomeResult(VerdocsModel):
    """The new record, as every call that records an outcome returns it (js-sdk: IClickwrapOutcomeResult)."""

    acceptance_id: str
    outcome: ClickwrapOutcome
    created_at: datetime


class ClickwrapAgreementLabel(VerdocsModel):
    """One checkbox label as it was shown (js-sdk: IClickwrapAgreementLabel)."""

    version_id: str
    label: str


class ClickwrapLabels(VerdocsModel):
    """Each checkbox label and the button label, as shown (js-sdk: IClickwrapLabels)."""

    agreements: list[ClickwrapAgreementLabel]
    button: str


class ClickwrapViewport(VerdocsModel):
    """The browser window the terms were shown in (js-sdk: IClickwrapViewport)."""

    width: int
    height: int
    device_pixel_ratio: float


class ClickwrapCustomerPresentation(VerdocsModel):
    """What was on screen, sent with a headless outcome (js-sdk: IClickwrapCustomerPresentation)."""

    type: Literal["html", "png", "jpeg"]
    # The HTML itself, or the image as base64. Up to 2 MB.
    content: str


class ClickwrapOutcomeAgreement(VerdocsModel):
    """One agreement version in a headless outcome (js-sdk: IClickwrapOutcomeAgreement)."""

    key: str
    version_id: str


class ClickwrapOutcomeRecordParams(VerdocsModel):
    """Fields for recording a headless outcome (js-sdk: IRecordClickwrapOutcomeRequest)."""

    user_id: str
    outcome: ClickwrapOutcome
    # Each agreement once. Up to 20.
    agreements: list[ClickwrapOutcomeAgreement]
    metadata: dict[str, str] | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    locale: str | None = None
    timezone: str | None = None
    labels: ClickwrapLabels | None = None
    presentation: ClickwrapCustomerPresentation | None = None


class ClickwrapAcceptanceListParams(VerdocsModel):
    """Filters for finding records (js-sdk: IListClickwrapAcceptancesParams).

    Search by user_id, or by metadata_key and metadata_value together.
    """

    user_id: str | None = None
    metadata_key: str | None = None
    metadata_value: str | None = None
    rows: int | None = None
    page: int | None = None


class ClickwrapAcceptanceSummaryAgreement(VerdocsModel):
    """One agreement version in a record summary (js-sdk: IClickwrapAcceptanceSummaryAgreement)."""

    key: str
    version_id: str
    number: int


class ClickwrapAcceptanceSummary(VerdocsModel):
    """A short form of one record, as searches and webhooks return it (js-sdk: IClickwrapAcceptanceSummary)."""

    id: str
    outcome: ClickwrapOutcome
    user_id: str
    metadata: dict[str, str] | None = None
    surface: ClickwrapSurface
    reported_by: ClickwrapReporter
    created_at: datetime
    agreements: list[ClickwrapAcceptanceSummaryAgreement]


class ClickwrapAcceptanceList(VerdocsModel):
    """One page of records, newest first (js-sdk: IClickwrapAcceptancesResponse)."""

    count: int
    rows: int
    page: int
    acceptances: list[ClickwrapAcceptanceSummary]


class ClickwrapAcceptanceItemAgreement(VerdocsModel):
    """The agreement a record item points to (js-sdk: IClickwrapAcceptanceItemAgreement)."""

    key: str
    name: str


class ClickwrapAcceptanceItemVersion(VerdocsModel):
    """The version a record item points to (js-sdk: IClickwrapAcceptanceItemVersion)."""

    id: str
    number: int
    published_at: datetime | None = None
    agreement: ClickwrapAcceptanceItemAgreement


class ClickwrapAcceptanceItem(VerdocsModel):
    """One agreement version in a full record (js-sdk: IClickwrapAcceptanceItem)."""

    content_hash: str
    agreement_version: ClickwrapAcceptanceItemVersion


class ClickwrapAcceptanceEvent(VerdocsModel):
    """One event in a record's trail (js-sdk: IClickwrapAcceptanceEvent)."""

    event: ClickwrapEventType
    # Only set for checkbox events.
    agreement_id: str | None = None
    # The browser's clock, if it reported one.
    client_at: datetime | None = None
    created_at: datetime


class ClickwrapAcceptance(VerdocsModel):
    """One recorded acceptance or decline (js-sdk: IClickwrapAcceptance). Records never change."""

    id: str
    organization_id: str
    # None for headless records.
    session_id: str | None = None
    user_id: str
    metadata: dict[str, str] | None = None
    outcome: ClickwrapOutcome
    surface: ClickwrapSurface
    mode: ClickwrapMode | None = None
    require_scroll: bool | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    locale: str | None = None
    timezone: str | None = None
    viewport: ClickwrapViewport | None = None
    labels: ClickwrapLabels | None = None
    # From 0 to 1.
    scroll_depth: float | None = None
    scrolled_to_end: bool | None = None
    time_on_terms_ms: int | None = None
    presentation_hash: str | None = None
    presentation_source: ClickwrapPresentationSource
    # True when a replay can be downloaded.
    has_presentation: bool
    reported_by: ClickwrapReporter
    sequence: int
    # None for the first record in the organization's chain.
    prev_hash: str | None = None
    record_hash: str
    created_at: datetime
    items: list[ClickwrapAcceptanceItem]
    events: list[ClickwrapAcceptanceEvent]


class ClickwrapDownloadLink(VerdocsModel):
    """A short-lived download link (js-sdk: IClickwrapDownloadLink)."""

    type: ClickwrapDownloadType
    # Always downloads as an attachment.
    url: str
    # Seconds.
    expires_in: int


class ClickwrapSessionAgreement(VerdocsModel):
    """One agreement version a session shows (js-sdk: IClickwrapSessionAgreement)."""

    key: str
    name: str
    version_id: str
    number: int
    content: str


class ClickwrapSessionBrand(VerdocsModel):
    """The brand a session is themed with (js-sdk: IClickwrapSessionBrand)."""

    name: str
    full_logo_url: str | None = None
    thumbnail_url: str | None = None
    primary_color: str | None = None
    secondary_color: str | None = None


class ClickwrapPublicSession(VerdocsModel):
    """What the component needs to show a session (js-sdk: IClickwrapPublicSession)."""

    id: str
    expires_at: datetime
    mode: ClickwrapMode
    require_scroll: bool
    agreements: list[ClickwrapSessionAgreement]
    brand: ClickwrapSessionBrand | None = None


class ClickwrapEventParams(VerdocsModel):
    """Fields for reporting a session event (js-sdk: ISendClickwrapEventRequest)."""

    event: ClickwrapSessionEventType
    # For checked and unchecked only.
    version_id: str | None = None
    # The browser's clock when it happened, kept for reference. Use a timezone-aware
    # datetime: the API requires an offset.
    client_at: datetime | None = None


class ClickwrapSessionOutcomeParams(VerdocsModel):
    """Fields for accepting or declining a session (js-sdk: IClickwrapSessionOutcomeRequest)."""

    surface: Literal["component", "hosted"]
    labels: ClickwrapLabels
    # The rendered terms as one self-contained HTML document, up to 2 MB.
    presentation: str
    scroll_depth: float | None = None
    viewport: ClickwrapViewport | None = None
    locale: str | None = None
    timezone: str | None = None
