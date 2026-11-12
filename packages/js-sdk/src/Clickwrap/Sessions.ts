import {IClickwrapOutcomeResult, IClickwrapPublicSession, IClickwrapSessionOutcomeRequest, ISendClickwrapEventRequest} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';

// Session tokens aren't JWTs, so setToken can't hold them, and they shouldn't replace whatever session the endpoint
// already has. We send the token on each request instead.
const withSessionToken = (token: string) => ({headers: {Authorization: `Bearer ${token}`}});

/**
 * Get what an acceptance session shows: each agreement version's text, the display mode, and the brand. Called in the
 * person's browser with the session token from createClickwrapSession, so it needs no Verdocs login.
 *
 * ```typescript
 * import {getClickwrapSession} from '@verdocs/js-sdk';
 *
 * const session = await getClickwrapSession(VerdocsEndpoint.getDefault(), token);
 * ```
 *
 * @group Clickwrap
 * @api GET /v2/clickwraps/session Get an acceptance session
 * @apiDescription Authenticated by the session token from createClickwrapSession, sent as a Bearer token.
 * @apiSuccess IClickwrapPublicSession . The session's agreements, mode, and brand
 *
 * @sdkOperation clickwrap.getClickwrapSession
 * @sdkGroup Clickwrap
 * @sdkPage Endpoints
 */
export const getClickwrapSession = (endpoint: VerdocsEndpoint, token: string) =>
  endpoint.api //
    .get<IClickwrapPublicSession>('/v2/clickwraps/session', withSessionToken(token))
    .then((r) => r.data);

/**
 * Report what the person did while reading: the terms were shown, they scrolled to the end, or they checked or
 * unchecked a box. The events become the record's trail when the person accepts or declines.
 *
 * ```typescript
 * import {sendClickwrapEvent} from '@verdocs/js-sdk';
 *
 * await sendClickwrapEvent(VerdocsEndpoint.getDefault(), token, {event: 'checked', version_id: versionId, client_at: new Date().toISOString()});
 * ```
 *
 * @group Clickwrap
 * @api POST /v2/clickwraps/session/events Report a session event
 * @apiDescription Authenticated by the session token from createClickwrapSession, sent as a Bearer token.
 * @apiBody string(enum:'shown'|'scrolled_to_end'|'checked'|'unchecked') event What happened
 * @apiBody string version_id? The checkbox's version_id, for checked and unchecked only
 * @apiBody string(format:date-time) client_at? The browser's clock when it happened
 * @apiSuccess string . No content
 *
 * @sdkOperation clickwrap.sendClickwrapEvent
 * @sdkGroup Clickwrap
 * @sdkPage Endpoints
 */
export const sendClickwrapEvent = (endpoint: VerdocsEndpoint, token: string, params: ISendClickwrapEventRequest) =>
  endpoint.api //
    .post('/v2/clickwraps/session/events', params, withSessionToken(token))
    .then(() => undefined);

/**
 * Record that the person accepted every agreement in the session. The presentation is the rendered terms as one HTML
 * document; its text must contain each version's text and every label, or the call is refused.
 *
 * ```typescript
 * import {acceptClickwrap} from '@verdocs/js-sdk';
 *
 * const {acceptance_id} = await acceptClickwrap(VerdocsEndpoint.getDefault(), token, {
 *   surface: 'component',
 *   labels: {agreements: [{version_id: versionId, label: 'I agree to the Terms of Service'}], button: 'Continue'},
 *   presentation: html,
 * });
 * ```
 *
 * @group Clickwrap
 * @api POST /v2/clickwraps/session/accept Accept a session's agreements
 * @apiDescription Authenticated by the session token from createClickwrapSession, sent as a Bearer token.
 * @apiBody string(enum:'component'|'hosted') surface Where the person accepted
 * @apiBody IClickwrapLabels labels Each checkbox label and the button label, as rendered
 * @apiBody string presentation The rendered terms as one self-contained HTML document, up to 2 MB
 * @apiBody number scroll_depth? How far the person scrolled, from 0 to 1
 * @apiBody IClickwrapViewport viewport? The browser window the terms were shown in
 * @apiBody string locale? The person's locale, such as en-US
 * @apiBody string timezone? The person's IANA timezone, such as America/Denver
 * @apiSuccess IClickwrapOutcomeResult . The new record
 *
 * @sdkOperation clickwrap.acceptClickwrap
 * @sdkGroup Clickwrap
 * @sdkPage Endpoints
 */
export const acceptClickwrap = (endpoint: VerdocsEndpoint, token: string, params: IClickwrapSessionOutcomeRequest) =>
  endpoint.api //
    .post<IClickwrapOutcomeResult>('/v2/clickwraps/session/accept', params, withSessionToken(token))
    .then((r) => r.data);

/**
 * Record that the person declined the session's agreements. Takes the same fields as acceptClickwrap, and the record
 * is kept the same way.
 *
 * ```typescript
 * import {declineClickwrap} from '@verdocs/js-sdk';
 *
 * await declineClickwrap(VerdocsEndpoint.getDefault(), token, {surface: 'component', labels, presentation: html});
 * ```
 *
 * @group Clickwrap
 * @api POST /v2/clickwraps/session/decline Decline a session's agreements
 * @apiDescription Authenticated by the session token from createClickwrapSession, sent as a Bearer token.
 * @apiBody string(enum:'component'|'hosted') surface Where the person declined
 * @apiBody IClickwrapLabels labels Each checkbox label and the button label, as rendered
 * @apiBody string presentation The rendered terms as one self-contained HTML document, up to 2 MB
 * @apiBody number scroll_depth? How far the person scrolled, from 0 to 1
 * @apiBody IClickwrapViewport viewport? The browser window the terms were shown in
 * @apiBody string locale? The person's locale, such as en-US
 * @apiBody string timezone? The person's IANA timezone, such as America/Denver
 * @apiSuccess IClickwrapOutcomeResult . The new record
 *
 * @sdkOperation clickwrap.declineClickwrap
 * @sdkGroup Clickwrap
 * @sdkPage Endpoints
 */
export const declineClickwrap = (endpoint: VerdocsEndpoint, token: string, params: IClickwrapSessionOutcomeRequest) =>
  endpoint.api //
    .post<IClickwrapOutcomeResult>('/v2/clickwraps/session/decline', params, withSessionToken(token))
    .then((r) => r.data);
