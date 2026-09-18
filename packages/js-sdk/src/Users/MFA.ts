import type {IMFABackupCodes, IMFAEnrollment, IMFAStatus} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';
import type {TBasicResponse} from '../BaseTypes';

/**
 * Get the caller's multi-factor authentication status.
 *
 * ```typescript
 * import {getMFAStatus, VerdocsEndpoint} from '@verdocs/js-sdk';
 *
 * const {enabled, backup_codes_remaining} = await getMFAStatus(VerdocsEndpoint.getDefault());
 * ```
 *
 * @group MFA
 * @api GET /v2/users/mfa Get the caller's MFA status
 * @apiSuccess IMFAStatus . The caller's MFA status
 *
 * @sdkOperation mfa.getMFAStatus
 * @sdkGroup MFA
 * @sdkPage Endpoints
 */
export const getMFAStatus = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<IMFAStatus>('/v2/users/mfa')
    .then((r) => r.data);

/**
 * Begin MFA enrollment. This returns a pending secret that does not take effect until it is
 * confirmed with `verifyMFAEnrollment()`. Render `otpauth_url` as a QR code for authenticator
 * apps, and show `secret` for users who need to type it in by hand. Calling this again replaces
 * the pending secret, so a user who abandons the flow can safely restart it.
 *
 * ```typescript
 * import {enrollMFA, VerdocsEndpoint} from '@verdocs/js-sdk';
 *
 * const {secret, otpauth_url} = await enrollMFA(VerdocsEndpoint.getDefault());
 * ```
 *
 * @group MFA
 * @api POST /v2/users/mfa/enroll Begin MFA enrollment
 * @apiDescription Fails with a 400 error if MFA is already enabled for the caller.
 * @apiSuccess IMFAEnrollment . The pending enrollment
 *
 * @sdkOperation mfa.enrollMFA
 * @sdkGroup MFA
 * @sdkPage Endpoints
 */
export const enrollMFA = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .post<IMFAEnrollment>('/v2/users/mfa/enroll')
    .then((r) => r.data);

/**
 * Complete MFA enrollment by proving the user can generate codes from the pending secret. The
 * backup codes are returned once and never again, so they must be shown to the user before the
 * flow closes.
 *
 * ```typescript
 * import {verifyMFAEnrollment, VerdocsEndpoint} from '@verdocs/js-sdk';
 *
 * const {backup_codes} = await verifyMFAEnrollment(VerdocsEndpoint.getDefault(), '123456');
 * ```
 *
 * @group MFA
 * @api POST /v2/users/mfa/enroll/verify Complete MFA enrollment
 * @apiDescription Three incorrect codes discard the pending enrollment and the user must start over.
 * @apiBody string code The current six-digit code from the user's authenticator app
 * @apiSuccess IMFABackupCodes . One-time backup codes, returned only once
 *
 * @sdkOperation mfa.verifyMFAEnrollment
 * @sdkGroup MFA
 * @sdkPage Endpoints
 */
export const verifyMFAEnrollment = (endpoint: VerdocsEndpoint, code: string) =>
  endpoint.api //
    .post<IMFABackupCodes>('/v2/users/mfa/enroll/verify', {code})
    .then((r) => r.data);

/**
 * Replace the caller's backup codes with a new set. The previous codes stop working immediately,
 * and the new ones are returned only once.
 *
 * ```typescript
 * import {regenerateBackupCodes, VerdocsEndpoint} from '@verdocs/js-sdk';
 *
 * const {backup_codes} = await regenerateBackupCodes(VerdocsEndpoint.getDefault(), '123456');
 * ```
 *
 * @group MFA
 * @api POST /v2/users/mfa/backup-codes Regenerate the caller's backup codes
 * @apiBody string code The current six-digit code from the user's authenticator app
 * @apiSuccess IMFABackupCodes . The new one-time backup codes, returned only once
 *
 * @sdkOperation mfa.regenerateBackupCodes
 * @sdkGroup MFA
 * @sdkPage Endpoints
 */
export const regenerateBackupCodes = (endpoint: VerdocsEndpoint, code: string) =>
  endpoint.api //
    .post<IMFABackupCodes>('/v2/users/mfa/backup-codes', {code})
    .then((r) => r.data);

/**
 * Turn off MFA for the caller. A valid code is always required, so knowing the password alone is
 * not enough to remove the second factor. Either a TOTP code or an unused backup code is accepted.
 *
 * ```typescript
 * import {disableMFA, VerdocsEndpoint} from '@verdocs/js-sdk';
 *
 * await disableMFA(VerdocsEndpoint.getDefault(), '123456');
 * ```
 *
 * @group MFA
 * @api DELETE /v2/users/mfa Disable MFA for the caller
 * @apiBody string code A current six-digit code from the user's authenticator app, or an unused backup code
 * @apiSuccess string . Success
 *
 * @sdkOperation mfa.disableMFA
 * @sdkGroup MFA
 * @sdkPage Endpoints
 */
export const disableMFA = (endpoint: VerdocsEndpoint, code: string) =>
  endpoint.api //
    .delete<TBasicResponse>('/v2/users/mfa', {data: {code}})
    .then((r) => r.data);
