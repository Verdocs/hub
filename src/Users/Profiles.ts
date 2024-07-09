import type {ICreateAccountRequest, ICreateProfileRequest, ISwitchProfileResponse, IUpdateProfileRequest} from './Types';
import type {IOrganization, IProfile} from '../Models';
import {VerdocsEndpoint} from '../VerdocsEndpoint';

/**
 * Get the user's available profiles. The current profile will be marked with `current: true`.
 *
 * ```typescript
 * import {Profiles} from '@verdocs/js-sdk/Users';
 *
 * const profiles = await Profiles.getProfiles()
 * ```
 */
export const getProfiles = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<IProfile[]>('/v2/profiles')
    .then((r) => r.data);

/**
 * Get the user's available profiles. The current profile will be marked with `current: true`.
 *
 * ```typescript
 * import {Profiles} from '@verdocs/js-sdk/Users';
 *
 * const profiles = await Profiles.getCurrentProfile()
 * ```
 */
export const getCurrentProfile = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<IProfile[]>('/v2/profiles')
    .then((r) => (r.data || []).find((profile) => profile.current));

/**
 * Create a profile. If the caller does not have a "current" profile set, the new profile will be made current.
 *
 * ```typescript
 * import {Profiles} from '@verdocs/js-sdk/Users';
 *
 * const newProfile = await Profiles.createProfile({ first_name: 'FIRST', last_name: 'LAST', email: 'EMAIL' });
 * ```
 */
export const createProfile = (endpoint: VerdocsEndpoint, params: ICreateProfileRequest) =>
  endpoint.api //
    .post<IProfile>('/v2/profiles', params)
    .then((r) => r.data);

/**
 * Get a profile. The caller must have admin access to the given profile.
 * TODO: Add a "public" profile endpoint for public pages
 *
 * ```typescript
 * import {Profiles} from '@verdocs/js-sdk/Users';
 *
 * const profile = await Profiles.getProfile('PROFILEID');
 * ```
 */
export const getProfile = (endpoint: VerdocsEndpoint, profileId: string) =>
  endpoint.api //
    .get<IProfile>(`/v2/profiles/${profileId}`)
    .then((r) => r.data);

/**
 * Switch the caller's "current" profile. The current profile is used for permissions checking and profile_id field settings
 * for most operations in Verdocs. It is important to select the appropropriate profile before calling other API functions.
 *
 * ```typescript
 * import {Profiles} from '@verdocs/js-sdk/Users';
 *
 * const newProfile = await Profiles.switchProfile('PROFILEID');
 * ```
 */
export const switchProfile = (endpoint: VerdocsEndpoint, profileId: string) =>
  endpoint.api //
    .post<ISwitchProfileResponse>(`/v2/profiles/${profileId}/switch`)
    .then((r) => r.data);

/**
 * Update a profile. For future expansion, the profile ID to update is required, but currently this must also be the
 * "current" profile for the caller.
 *
 * ```typescript
 * import {Profiles} from '@verdocs/js-sdk/Users';
 *
 * const newProfile = await Profiles.updateProfile('PROFILEID');
 * ```
 */
export const updateProfile = (endpoint: VerdocsEndpoint, profileId: string, params: IUpdateProfileRequest) =>
  endpoint.api //
    .patch<IProfile>(`/v2/profiles/${profileId}`, params)
    .then((r) => r.data);

/**
 * Delete a profile. If the requested profile is the caller's curent profile, the next available profile will be selected.
 *
 * ```typescript
 * import {Profiles} from '@verdocs/js-sdk/Users';
 *
 * await Profiles.deleteProfile('PROFILEID');
 * ```
 */
export const deleteProfile = (endpoint: VerdocsEndpoint, profileId: string) =>
  endpoint.api //
    .delete(`/v2/profiles/${profileId}`)
    .then((r) => r.data);

/**
 * Create a user account and parent organization. This endpoint is for creating a new organization. Users joining an
 * existing organization should be invited, and follow their invitation links/instructions to create their accounts.
 *
 * ```typescript
 * import {Profiles} from '@verdocs/js-sdk/Users';
 *
 * const newAccount = await Profiles.createBusinessAccount({
 *   orgName: 'ORG', email: 'a@b.com', password: '12345678', firstName: 'FIRST', lastName: 'LAST'
 * });
 * ```
 */
export const createAccount = (endpoint: VerdocsEndpoint, params: ICreateAccountRequest) =>
  endpoint.api //
    .post<{profile: IProfile; organization: IOrganization}>('/user/business', params)
    .then((r) => r.data);

export interface ISignupSurvey {
  industry?: string;
  size?: string;
  source?: string;
  referral?: string;
  coupon?: string;
  reason?: string;
  hearabout?: string;
}

export const recordSignupSurvey = (endpoint: VerdocsEndpoint, params: ISignupSurvey) =>
  endpoint.api //
    .post<{status: 'OK'}>('/user/signup', params)
    .then((r) => r.data);
