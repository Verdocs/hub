/** A version's lifecycle. Drafts can be edited or deleted; published versions never change. */
export type TClickwrapVersionStatus = 'draft' | 'published';

/** What the person did. */
export type TClickwrapOutcome = 'accepted' | 'declined';

/** Where an outcome was recorded: the embedded component, the Verdocs hosted page, or your own interface (headless). */
export type TClickwrapSurface = 'component' | 'hosted' | 'headless';

/** How the component shows the terms: in a modal, or inline in your page. */
export type TClickwrapMode = 'modal' | 'inline';

/** Who reported the browser details. For headless records, the IP address and user agent are your own report. */
export type TClickwrapReporter = 'verdocs' | 'customer';

/** Where a record's presentation came from: captured by the component, sent by you (headless), or none. */
export type TClickwrapPresentationSource = 'rendered' | 'customer' | 'none';

/** Every event in a record's trail. accepted and declined are recorded by Verdocs with the outcome. */
export type TClickwrapEventType = 'shown' | 'scrolled_to_end' | 'checked' | 'unchecked' | 'accepted' | 'declined';

/** The events a session can report while the person reads. checked and unchecked need the checkbox's version_id. */
export type TClickwrapSessionEventType = 'shown' | 'scrolled_to_end' | 'checked' | 'unchecked';

/** The files a record can be downloaded as. */
export type TClickwrapDownloadType = 'certificate' | 'replay' | 'evidence';

/** A clickwrap agreement: terms people accept with a checkbox, such as a Terms of Service. */
export interface IClickwrapAgreement {
  /** The agreement's ID. */
  id: string;
  /** The organization that owns the agreement. */
  organization_id: string;
  /** What developers pass to the API, such as "terms-of-service". It never changes. */
  key: string;
  /** What admins see, such as "Terms of Service". */
  name: string;
  /** The profile that created the agreement, if it still exists. */
  created_by: string | null;
  /** When the agreement was created. */
  created_at: string;
  /** When the agreement was last renamed. */
  updated_at: string;
}

/** A short reference to one version, as getClickwrapAgreements lists it. */
export interface IClickwrapVersionRef {
  /** The version's ID. */
  id: string;
  /** The version number: 1, 2, 3, unique within the agreement. */
  number: number;
  /** Whether the version is a draft or published. */
  status: TClickwrapVersionStatus;
  /** When the version was published, or null for a draft. */
  published_at: string | null;
}

/** An agreement with its current version and open draft, as getClickwrapAgreements returns it. */
export interface IClickwrapAgreementSummary extends IClickwrapAgreement {
  /** The latest published version, or null if nothing has been published. */
  current_version: IClickwrapVersionRef | null;
  /** The open draft, or null if there isn't one. An agreement has at most one. */
  draft_version: IClickwrapVersionRef | null;
}

/** One version of an agreement's text. */
export interface IClickwrapVersion {
  /** The version's ID. */
  id: string;
  /** The agreement this version belongs to. */
  agreement_id: string;
  /** The version number: 1, 2, 3, unique within the agreement. */
  number: number;
  /** Whether the version is a draft or published. */
  status: TClickwrapVersionStatus;
  /** The agreement text as sanitized HTML. */
  content: string;
  /** SHA-256 hex of content, set when the version is published. */
  content_hash: string | null;
  /** Whether everyone must accept this version again, chosen at publish. */
  requires_reacceptance: boolean;
  /** What changed, as written at publish. */
  change_summary: string | null;
  /** When the version was published, or null for a draft. */
  published_at: string | null;
  /** The profile that published the version. */
  published_by: string | null;
  /** When the version was created. */
  created_at: string;
  /** When the version was last edited. */
  updated_at: string;
}

/** An agreement with every version, newest first, as getClickwrapAgreement returns it. */
export interface IClickwrapAgreementDetail extends IClickwrapAgreement {
  /** Every version, newest first, with its full text. */
  versions: IClickwrapVersion[];
}

/** The fields for createClickwrapAgreement. */
export interface ICreateClickwrapAgreementRequest {
  /** Unique in the organization: lowercase letters and digits separated by single hyphens. It can never change. */
  key: string;
  /** What admins see, such as "Terms of Service". */
  name: string;
}

/** The fields for createClickwrapDraft. Send content, copy_current, or neither (an empty draft), not both. */
export interface ICreateClickwrapDraftRequest {
  /** The agreement text as HTML. Only headings, paragraphs, lists, links, bold, italic, underline, and line breaks are kept. */
  content?: string;
  /** Start from the current version's text instead. */
  copy_current?: boolean;
}

/** The fields for publishClickwrapVersion. */
export interface IPublishClickwrapVersionRequest {
  /** Whether everyone must accept this version again. Required, so it's never chosen by default. */
  requires_reacceptance: boolean;
  /** What changed, kept with the version. */
  change_summary?: string;
}

/** How many people accepted one published version. */
export interface IClickwrapCoverageVersion {
  /** The version's ID. */
  id: string;
  /** The version number. */
  number: number;
  /** When the version was published. */
  published_at: string | null;
  /** Whether the version requires everyone to accept again. */
  requires_reacceptance: boolean;
  /** Distinct people who accepted this version. */
  people: number;
}

/** How many people have accepted an agreement, as getClickwrapCoverage returns it. */
export interface IClickwrapCoverage {
  /** The agreement's ID. */
  agreement_id: string;
  /** The newest published version that requires re-acceptance, or 0 when none does. */
  cutoff_number: number;
  /** Distinct people who accepted any version. */
  accepted_any: number;
  /** Distinct people who accepted a version at or after the cutoff. */
  current: number;
  /** One entry per published version, newest first. */
  versions: IClickwrapCoverageVersion[];
}

/** The version a person would be shown next. */
export interface IClickwrapPendingVersion {
  /** The version's ID. */
  id: string;
  /** The version number. */
  number: number;
  /** Whether the version requires everyone to accept again. */
  requires_reacceptance: boolean;
}

/** Whether one person is current on one agreement. */
export interface IClickwrapStatus {
  /** The agreement's key. */
  key: string;
  /** True when the person accepted a published version at or after the newest one that requires re-acceptance. */
  current: boolean;
  /** The version they would be shown, or null when they're current. */
  pending_version: IClickwrapPendingVersion | null;
}

/** The fields for createClickwrapSession. */
export interface ICreateClickwrapSessionRequest {
  /** The person's ID in your own system. */
  user_id: string;
  /** The agreement keys to check, in the order to show them. Up to 20. */
  agreements: string[];
  /** Flat string values to keep with the record, such as an email. Up to 50 keys. */
  metadata?: Record<string, string>;
  /** How the component shows the terms. Defaults to modal. */
  mode?: TClickwrapMode;
  /** Whether the person must scroll to the end before accepting. Defaults to false. */
  require_scroll?: boolean;
  /** The brand to theme the component and hosted page with. */
  brand_key?: string;
  /** Where the hosted page sends the person after they accept. https, or http on localhost. */
  return_url?: string;
  /** Where the hosted page sends the person if they decline or cancel. */
  cancel_url?: string;
}

/** createClickwrapSession's answer when the person is already current: there's nothing to show and no session. */
export interface IClickwrapSessionCurrent {
  /** Always true here. */
  current: true;
  /** The status of each requested agreement. */
  agreements: IClickwrapStatus[];
}

/** createClickwrapSession's answer when the person has something to accept. */
export interface IClickwrapSessionCreated {
  /** Always false here. */
  current: false;
  /** The session's ID. */
  id: string;
  /** The session token for the component or hosted page. It's returned only here, so hand it to the browser now. */
  token: string;
  /** When the token expires, an hour after it's created. */
  expires_at: string;
  /** The agreement keys that were requested. */
  agreements: string[];
  /** The Verdocs hosted page for this session, to redirect the person to instead of embedding the component. */
  hosted_url: string;
  /** The status of each requested agreement. */
  status: IClickwrapStatus[];
}

/** createClickwrapSession's answer. Check `current` to see which one you got. */
export type TCreateClickwrapSessionResponse = IClickwrapSessionCurrent | IClickwrapSessionCreated;

/** The new record, as every call that records an outcome returns it. */
export interface IClickwrapOutcomeResult {
  /** The new record's ID. */
  acceptance_id: string;
  /** What the person did. */
  outcome: TClickwrapOutcome;
  /** When the record was written, by our server's clock. */
  created_at: string;
}

/** One checkbox label as it was shown. */
export interface IClickwrapAgreementLabel {
  /** The version the checkbox was for. */
  version_id: string;
  /** The checkbox label, as rendered. */
  label: string;
}

/** Each checkbox label and the button label, as they were shown. */
export interface IClickwrapLabels {
  /** One label per agreement checkbox. */
  agreements: IClickwrapAgreementLabel[];
  /** The accept or decline button's label. */
  button: string;
}

/** The browser window the terms were shown in. */
export interface IClickwrapViewport {
  /** Width in CSS pixels. */
  width: number;
  /** Height in CSS pixels. */
  height: number;
  /** The device pixel ratio. */
  device_pixel_ratio: number;
}

/** What was on screen, sent with a headless outcome. Up to 2 MB. */
export interface IClickwrapCustomerPresentation {
  /** html for a self-contained HTML document, png or jpeg for a screenshot. */
  type: 'html' | 'png' | 'jpeg';
  /** The HTML itself, or the image as base64. */
  content: string;
}

/** One agreement version in a headless outcome. */
export interface IClickwrapOutcomeAgreement {
  /** The agreement's key. */
  key: string;
  /** The version the person saw. It must be published. */
  version_id: string;
}

/** The fields for recordClickwrapOutcome, which records an outcome from your own interface. */
export interface IRecordClickwrapOutcomeRequest {
  /** The person's ID in your own system. */
  user_id: string;
  /** What the person did. */
  outcome: TClickwrapOutcome;
  /** The agreement versions the person saw, each agreement once. Up to 20. */
  agreements: IClickwrapOutcomeAgreement[];
  /** Flat string values to keep with the record, such as an email. Up to 50 keys. */
  metadata?: Record<string, string>;
  /** The person's IP address, as you saw it. */
  ip_address?: string;
  /** The person's user agent, as you saw it. */
  user_agent?: string;
  /** The person's locale, such as en-US. */
  locale?: string;
  /** The person's IANA timezone, such as America/Denver. */
  timezone?: string;
  /** Each checkbox label and the button label, as you showed them. */
  labels?: IClickwrapLabels;
  /** What was on screen. */
  presentation?: IClickwrapCustomerPresentation;
}

/** Filters for getClickwrapAcceptances. Search by user_id, or by metadata_key and metadata_value. */
export interface IListClickwrapAcceptancesParams {
  /** The person's ID in your own system. */
  user_id?: string;
  /** A metadata field you attached, such as "email". */
  metadata_key?: string;
  /** The exact value to match. Required with metadata_key. */
  metadata_value?: string;
  /** Page size, up to 100. Defaults to 25. */
  rows?: number;
  /** Page to retrieve (0-based). Defaults to 0. */
  page?: number;
}

/** One agreement version in a record summary. */
export interface IClickwrapAcceptanceSummaryAgreement {
  /** The agreement's key. */
  key: string;
  /** The version's ID. */
  version_id: string;
  /** The version number. */
  number: number;
}

/** A short form of one record, as getClickwrapAcceptances and webhooks return it. */
export interface IClickwrapAcceptanceSummary {
  /** The record's ID. */
  id: string;
  /** What the person did. */
  outcome: TClickwrapOutcome;
  /** The person's ID in your own system. */
  user_id: string;
  /** The metadata kept with the record. */
  metadata: Record<string, string> | null;
  /** Where the outcome was recorded. */
  surface: TClickwrapSurface;
  /** Who reported the browser details. */
  reported_by: TClickwrapReporter;
  /** When the record was written, by our server's clock. */
  created_at: string;
  /** The agreement versions in the record. */
  agreements: IClickwrapAcceptanceSummaryAgreement[];
}

/** One page of records, newest first. */
export interface IClickwrapAcceptancesResponse {
  /** The total number of matching records. */
  count: number;
  /** The page size used. */
  rows: number;
  /** The page returned. */
  page: number;
  /** The records on this page. */
  acceptances: IClickwrapAcceptanceSummary[];
}

/** The agreement a record item points to. */
export interface IClickwrapAcceptanceItemAgreement {
  /** The agreement's key. */
  key: string;
  /** The agreement's name. */
  name: string;
}

/** The version a record item points to. */
export interface IClickwrapAcceptanceItemVersion {
  /** The version's ID. */
  id: string;
  /** The version number. */
  number: number;
  /** When the version was published. */
  published_at: string | null;
  /** The agreement the version belongs to. */
  agreement: IClickwrapAcceptanceItemAgreement;
}

/** One agreement version in a full record. */
export interface IClickwrapAcceptanceItem {
  /** SHA-256 hex of the version's text, as recorded. */
  content_hash: string;
  /** The version. */
  agreement_version: IClickwrapAcceptanceItemVersion;
}

/** One event in a record's trail, oldest first. */
export interface IClickwrapAcceptanceEvent {
  /** What happened. */
  event: TClickwrapEventType;
  /** The agreement a checkbox event was for, or null for other events. */
  agreement_id: string | null;
  /** The browser's clock when it happened, if the browser reported it. */
  client_at: string | null;
  /** When it reached our server. */
  created_at: string;
}

/** One recorded acceptance or decline, as getClickwrapAcceptance returns it. Records never change. */
export interface IClickwrapAcceptance {
  /** The record's ID. */
  id: string;
  /** The organization that owns the record. */
  organization_id: string;
  /** The session it was recorded in, or null for headless records. */
  session_id: string | null;
  /** The person's ID in your own system. */
  user_id: string;
  /** The metadata kept with the record. */
  metadata: Record<string, string> | null;
  /** What the person did. */
  outcome: TClickwrapOutcome;
  /** Where the outcome was recorded. */
  surface: TClickwrapSurface;
  /** How the component showed the terms, or null for headless records. */
  mode: TClickwrapMode | null;
  /** Whether the person had to scroll to the end, or null for headless records. */
  require_scroll: boolean | null;
  /** The person's IP address. */
  ip_address: string | null;
  /** The person's user agent. */
  user_agent: string | null;
  /** The person's locale. */
  locale: string | null;
  /** The person's IANA timezone. */
  timezone: string | null;
  /** The browser window the terms were shown in. */
  viewport: IClickwrapViewport | null;
  /** Each checkbox label and the button label, as shown. */
  labels: IClickwrapLabels | null;
  /** How far the person scrolled, from 0 to 1. */
  scroll_depth: number | null;
  /** Whether the person scrolled to the end. */
  scrolled_to_end: boolean | null;
  /** How long the terms were on screen, in milliseconds. */
  time_on_terms_ms: number | null;
  /** SHA-256 hex of the stored presentation, or null when there isn't one. */
  presentation_hash: string | null;
  /** Where the presentation came from. */
  presentation_source: TClickwrapPresentationSource;
  /** Whether a presentation is stored, so a replay can be downloaded. */
  has_presentation: boolean;
  /** Who reported the browser details. */
  reported_by: TClickwrapReporter;
  /** The record's place in the organization's hash chain. */
  sequence: number;
  /** The previous record's hash, or null for the first record in the chain. */
  prev_hash: string | null;
  /** This record's hash. */
  record_hash: string;
  /** When the record was written, by our server's clock. */
  created_at: string;
  /** The agreement versions in the record. */
  items: IClickwrapAcceptanceItem[];
  /** What happened while the person read, oldest first. Empty for headless records. */
  events: IClickwrapAcceptanceEvent[];
}

/** A short-lived download link. */
export interface IClickwrapDownloadLink {
  /** Which file the link is for. */
  type: TClickwrapDownloadType;
  /** The link. It always downloads as an attachment. */
  url: string;
  /** How long the link works, in seconds. */
  expires_in: number;
}

/** One agreement version a session shows. */
export interface IClickwrapSessionAgreement {
  /** The agreement's key. */
  key: string;
  /** The agreement's name. */
  name: string;
  /** The version's ID, sent back with checkbox events and labels. */
  version_id: string;
  /** The version number. */
  number: number;
  /** The agreement text as sanitized HTML. */
  content: string;
}

/** The brand a session is themed with. */
export interface IClickwrapSessionBrand {
  /** The brand's name. */
  name: string;
  /** The full logo's URL. */
  full_logo_url: string | null;
  /** The small logo's URL. */
  thumbnail_url: string | null;
  /** The primary color, as CSS. */
  primary_color: string | null;
  /** The secondary color, as CSS. */
  secondary_color: string | null;
}

/** What the component needs to show a session, as getClickwrapSession returns it. */
export interface IClickwrapPublicSession {
  /** The session's ID. */
  id: string;
  /** When the session token expires. */
  expires_at: string;
  /** How to show the terms. */
  mode: TClickwrapMode;
  /** Whether the person must scroll to the end before accepting. */
  require_scroll: boolean;
  /** The agreement versions to show, in order. */
  agreements: IClickwrapSessionAgreement[];
  /** The brand to theme with, or null for Verdocs defaults. */
  brand: IClickwrapSessionBrand | null;
}

/** The fields for sendClickwrapEvent. */
export interface ISendClickwrapEventRequest {
  /** What happened. */
  event: TClickwrapSessionEventType;
  /** The checkbox's version_id, for checked and unchecked only. */
  version_id?: string;
  /** The browser's clock when it happened, as an ISO 8601 timestamp with offset. Kept for reference. */
  client_at?: string;
}

/** The fields for acceptClickwrap and declineClickwrap. */
export interface IClickwrapSessionOutcomeRequest {
  /** component for the embedded component, hosted for the Verdocs hosted page. */
  surface: 'component' | 'hosted';
  /** Each checkbox label and the button label, as rendered. */
  labels: IClickwrapLabels;
  /** The rendered terms as one self-contained HTML document, up to 2 MB. Its text must contain each version's text. */
  presentation: string;
  /** How far the person scrolled, from 0 to 1. */
  scroll_depth?: number;
  /** The browser window the terms were shown in. */
  viewport?: IClickwrapViewport;
  /** The person's locale, such as en-US. */
  locale?: string;
  /** The person's IANA timezone, such as America/Denver. */
  timezone?: string;
}
