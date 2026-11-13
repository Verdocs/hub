import {
  IClickwrapAcceptance,
  IClickwrapAcceptancesResponse,
  IClickwrapDownloadLink,
  IClickwrapOutcomeResult,
  IClickwrapStatus,
  ICreateClickwrapSessionRequest,
  IListClickwrapAcceptancesParams,
  IRecordClickwrapOutcomeRequest,
  TClickwrapDownloadType,
  TCreateClickwrapSessionResponse,
} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';

/**
 * Check whether one person is current on each named agreement. Current means they accepted a published version at or
 * after the newest one that requires re-acceptance. When they aren't, pending_version is the version they'd be shown.
 * Declines never make anyone current.
 *
 * ```typescript
 * import {getClickwrapStatus} from '@verdocs/js-sdk';
 *
 * const status = await getClickwrapStatus(VerdocsEndpoint.getDefault(), 'user-123', ['terms-of-service', 'privacy-policy']);
 * const needsTerms = status.some((entry) => !entry.current);
 * ```
 *
 * @group Clickwrap
 * @api GET /v2/clickwraps/status Get a person's clickwrap status
 * @apiQuery string user_id The person's ID in your own system
 * @apiQuery string agreements Comma-separated agreement keys, up to 20
 * @apiSuccess array(items: IClickwrapStatus) . One entry per agreement
 *
 * @sdkOperation clickwrap.getClickwrapStatus
 * @sdkGroup Clickwrap
 * @sdkPage Endpoints
 */
export const getClickwrapStatus = (endpoint: VerdocsEndpoint, userId: string, agreements: string[]) =>
  endpoint.api //
    .get<IClickwrapStatus[]>('/v2/clickwraps/status', {params: {user_id: userId, agreements: agreements.join(',')}})
    .then((r) => r.data);

/**
 * Start an acceptance session for one person, from your server. If they're already current on every agreement, the
 * answer has current: true and no token, and there's nothing to show. Otherwise it carries a session token for the
 * component (or a hosted_url to redirect to) that expires in an hour.
 *
 * ```typescript
 * import {createClickwrapSession} from '@verdocs/js-sdk';
 *
 * const session = await createClickwrapSession(VerdocsEndpoint.getDefault(), {user_id: 'user-123', agreements: ['terms-of-service']});
 * if (!session.current) {
 *   // Hand session.token to the browser
 * }
 * ```
 *
 * @group Clickwrap
 * @api POST /v2/clickwraps/session Create an acceptance session
 * @apiBody string user_id The person's ID in your own system
 * @apiBody array(items:string) agreements The agreement keys to check, in the order to show them. Up to 20.
 * @apiBody object metadata? Flat string values to keep with the record, such as an email. Up to 50 keys.
 * @apiBody string(enum:'modal'|'inline') mode? How the component shows the terms. Defaults to modal.
 * @apiBody boolean require_scroll? Whether the person must scroll to the end before accepting. Defaults to false.
 * @apiBody string brand_key? The brand to theme the component and hosted page with
 * @apiBody string return_url? Where the hosted page sends the person after they accept
 * @apiBody string cancel_url? Where the hosted page sends the person if they decline or cancel
 * @apiSuccess TCreateClickwrapSessionResponse . The session, or current: true when there's nothing to accept
 *
 * @sdkOperation clickwrap.createClickwrapSession
 * @sdkGroup Clickwrap
 * @sdkPage Endpoints
 */
export const createClickwrapSession = (endpoint: VerdocsEndpoint, params: ICreateClickwrapSessionRequest) =>
  endpoint.api //
    .post<TCreateClickwrapSessionResponse>('/v2/clickwraps/session', params)
    .then((r) => r.data);

/**
 * Record an acceptance or decline that happened in your own interface (headless). The IP address and user agent are
 * kept as your report, and anything you send as presentation is stored as it is.
 *
 * ```typescript
 * import {recordClickwrapOutcome} from '@verdocs/js-sdk';
 *
 * const {acceptance_id} = await recordClickwrapOutcome(VerdocsEndpoint.getDefault(), {
 *   user_id: 'user-123',
 *   outcome: 'accepted',
 *   agreements: [{key: 'terms-of-service', version_id: versionId}],
 * });
 * ```
 *
 * @group Clickwrap
 * @api POST /v2/clickwraps/acceptances Record a headless outcome
 * @apiBody string user_id The person's ID in your own system
 * @apiBody string(enum:'accepted'|'declined') outcome What the person did
 * @apiBody array(items:IClickwrapOutcomeAgreement) agreements The agreement versions the person saw, each agreement once
 * @apiBody object metadata? Flat string values to keep with the record. Up to 50 keys.
 * @apiBody string ip_address? The person's IP address, as you saw it
 * @apiBody string user_agent? The person's user agent, as you saw it
 * @apiBody string locale? The person's locale, such as en-US
 * @apiBody string timezone? The person's IANA timezone, such as America/Denver
 * @apiBody IClickwrapLabels labels? Each checkbox label and the button label, as you showed them
 * @apiBody IClickwrapCustomerPresentation presentation? What was on screen, up to 2 MB
 * @apiSuccess IClickwrapOutcomeResult . The new record
 *
 * @sdkOperation clickwrap.recordClickwrapOutcome
 * @sdkGroup Clickwrap
 * @sdkPage Endpoints
 */
export const recordClickwrapOutcome = (endpoint: VerdocsEndpoint, params: IRecordClickwrapOutcomeRequest) =>
  endpoint.api //
    .post<IClickwrapOutcomeResult>('/v2/clickwraps/acceptances', params)
    .then((r) => r.data);

/**
 * Find recorded acceptances and declines, newest first. Search by user_id, or by one metadata key and value.
 *
 * ```typescript
 * import {getClickwrapAcceptances} from '@verdocs/js-sdk';
 *
 * const {count, acceptances} = await getClickwrapAcceptances(VerdocsEndpoint.getDefault(), {metadata_key: 'email', metadata_value: 'pat@example.com'});
 * ```
 *
 * @group Clickwrap
 * @api GET /v2/clickwraps/acceptances List clickwrap records
 * @apiQuery string user_id? The person's ID in your own system. Use this or metadata_key, not both.
 * @apiQuery string metadata_key? A metadata field you attached, such as email
 * @apiQuery string metadata_value? The exact value to match. Required with metadata_key.
 * @apiQuery integer(default: 25) rows? Page size, up to 100
 * @apiQuery integer(default: 0) page? Page to retrieve (0-based)
 * @apiSuccess integer(format: int32) count The total number of matching records
 * @apiSuccess integer(format: int32) rows The page size used
 * @apiSuccess integer(format: int32) page The page returned
 * @apiSuccess array(items: IClickwrapAcceptanceSummary) acceptances The records on this page
 *
 * @sdkOperation clickwrap.getClickwrapAcceptances
 * @sdkGroup Clickwrap
 * @sdkPage Endpoints
 */
export const getClickwrapAcceptances = (endpoint: VerdocsEndpoint, params: IListClickwrapAcceptancesParams) =>
  endpoint.api //
    .get<IClickwrapAcceptancesResponse>('/v2/clickwraps/acceptances', {params})
    .then((r) => r.data);

/**
 * Get one recorded acceptance or decline: who, which agreement versions, where and how it happened, the labels the
 * person saw, and the event trail. Records never change.
 *
 * ```typescript
 * import {getClickwrapAcceptance} from '@verdocs/js-sdk';
 *
 * const record = await getClickwrapAcceptance(VerdocsEndpoint.getDefault(), acceptanceId);
 * ```
 *
 * @group Clickwrap
 * @api GET /v2/clickwraps/acceptances/:acceptance_id Get a clickwrap record
 * @apiParam string(format:uuid) acceptance_id The record to get
 * @apiSuccess IClickwrapAcceptance . The record with its items and events
 *
 * @sdkOperation clickwrap.getClickwrapAcceptance
 * @sdkGroup Clickwrap
 * @sdkPage Endpoints
 */
export const getClickwrapAcceptance = (endpoint: VerdocsEndpoint, acceptanceId: string) =>
  endpoint.api //
    .get<IClickwrapAcceptance>(`/v2/clickwraps/acceptances/${acceptanceId}`)
    .then((r) => r.data);

/**
 * Get a 15-minute download link for one of a record's files: the signed certificate, the replay (a picture of what
 * was on screen, only when has_presentation is true), or the evidence package (a ZIP with everything needed to check
 * the record). The first request for a file can take several seconds while it's made.
 *
 * ```typescript
 * import {getClickwrapDownloadLink} from '@verdocs/js-sdk';
 *
 * const {url} = await getClickwrapDownloadLink(VerdocsEndpoint.getDefault(), acceptanceId, 'evidence');
 * ```
 *
 * @group Clickwrap
 * @api GET /v2/clickwraps/acceptances/:acceptance_id/download Get a clickwrap download link
 * @apiParam string(format:uuid) acceptance_id The record to download from
 * @apiQuery string(enum:'certificate'|'replay'|'evidence') type Which file to link to
 * @apiSuccess IClickwrapDownloadLink . The link and how long it works
 *
 * @sdkOperation clickwrap.getClickwrapDownloadLink
 * @sdkGroup Clickwrap
 * @sdkPage Endpoints
 */
export const getClickwrapDownloadLink = (endpoint: VerdocsEndpoint, acceptanceId: string, type: TClickwrapDownloadType) =>
  endpoint.api //
    .get<IClickwrapDownloadLink>(`/v2/clickwraps/acceptances/${acceptanceId}/download`, {params: {type}})
    .then((r) => r.data);
