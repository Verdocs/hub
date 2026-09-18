import type {IRevokeSessionsResponse, IUserLoginSession} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';
import type {TBasicResponse} from '../BaseTypes';

/**
 * Get the caller's active login sessions, newest first. The session the caller is using to make
 * the request is marked with `current: true`, and should not be offered for revocation in UI
 * (use logout instead).
 *
 * ```typescript
 * import {getSessions, VerdocsEndpoint} from '@verdocs/js-sdk';
 *
 * const sessions = await getSessions(VerdocsEndpoint.getDefault());
 * ```
 *
 * @group Sessions
 * @api GET /v2/users/sessions Get the caller's active login sessions
 * @apiSuccess array(items: IUserLoginSession) . The caller's active sessions, newest first
 *
 * @sdkOperation session.getSessions
 * @sdkGroup Session
 * @sdkPage Endpoints
 */
export const getSessions = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<IUserLoginSession[]>('/v2/users/sessions')
    .then((r) => r.data);

/**
 * Revoke one of the caller's login sessions. Tokens issued for that session stop working
 * immediately. The caller's current session may not be revoked this way.
 *
 * ```typescript
 * import {revokeSession, VerdocsEndpoint} from '@verdocs/js-sdk';
 *
 * await revokeSession(VerdocsEndpoint.getDefault(), 'SESSIONID');
 * ```
 *
 * @group Sessions
 * @api DELETE /v2/users/sessions/:session_id Revoke one of the caller's login sessions
 * @apiParam string session_id The ID of the session to revoke. May not be the caller's current session.
 * @apiSuccess string . Success
 *
 * @sdkOperation session.revokeSession
 * @sdkGroup Session
 * @sdkPage Endpoints
 */
export const revokeSession = (endpoint: VerdocsEndpoint, sessionId: string) =>
  endpoint.api //
    .delete<TBasicResponse>(`/v2/users/sessions/${sessionId}`)
    .then((r) => r.data);

/**
 * Revoke every login session for the caller except the one making the request. This is the
 * "sign out everywhere else" operation.
 *
 * ```typescript
 * import {revokeOtherSessions, VerdocsEndpoint} from '@verdocs/js-sdk';
 *
 * const {revoked} = await revokeOtherSessions(VerdocsEndpoint.getDefault());
 * ```
 *
 * @group Sessions
 * @api DELETE /v2/users/sessions Revoke all of the caller's sessions except the current one
 * @apiSuccess integer(format: int32) revoked The number of sessions revoked
 *
 * @sdkOperation session.revokeOtherSessions
 * @sdkGroup Session
 * @sdkPage Endpoints
 */
export const revokeOtherSessions = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .delete<IRevokeSessionsResponse>('/v2/users/sessions')
    .then((r) => r.data);
