import {Endpoint} from '../HTTP/Transport';
import {
  ICreateProfileRequest,
  IPermission,
  IProfile,
  IRole,
  ISwitchProfileResponse,
  IUpdateProfileRequest,
} from './Types';
import {IGroup} from '../Organizations/Types';

/**
 * Get the user's available profiles. The current profile will be marked with `current: true`.
 *
 * ```typescript
 * import {Profiles} from '@verdocs/js-sdk/Users';
 *
 * const profiles = await Profiles.getProfiles()
 * ```
 */
export const getProfiles = () => Endpoint.get<IProfile[]>('/profiles').then((r) => r.data);

/**
 * Get a list of system roles.
 *
 * ```typescript
 * import {Profiles} from '@verdocs/js-sdk/Users';
 *
 * const roles = await Profiles.getRoles();
 * ```
 */
export const getRoles = () => Endpoint.get<IRole[]>('/roles').then((r) => r.data);

/**
 * Get a list of system roles.
 *
 * ```typescript
 * import {Profiles} from '@verdocs/js-sdk/Users';
 *
 * const permissions = await Profiles.getPermissions();
 * ```
 */
export const getPermissions = () => Endpoint.get<IPermission[]>('/permissions').then((r) => r.data);

/**
 * Create a profile. If the caller does not have a "current" profile set, the new profile will be made current.
 *
 * ```typescript
 * import {Profiles} from '@verdocs/js-sdk/Users';
 *
 * const newProfile = await Profiles.createProfile({ first_name: 'FIRST', last_name: 'LAST', email: 'EMAIL' });
 * ```
 */
export const createProfile = (params: ICreateProfileRequest) =>
  Endpoint.post<IProfile>('/profiles', params).then((r) => r.data);

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
export const getProfile = (profileId: string) => Endpoint.get<IProfile>(`/profiles/${profileId}`).then((r) => r.data);

/**
 * Get a profile's permissions. The caller must have admin access to the given profile.
 *
 * ```typescript
 * import {Profiles} from '@verdocs/js-sdk/Users';
 *
 * const permissions = await Profiles.getProfilePermissions('PROFILEID');
 * ```
 */
export const getProfilePermissions = (profileId: string) =>
  Endpoint.get<IPermission[]>(`/profiles/${profileId}/permissions`).then((r) => r.data);

/**
 * Get a profile's groups.
 *
 * ```typescript
 * import {Profiles} from '@verdocs/js-sdk/Users';
 *
 * const groups = await Profiles.getProfileGroups('PROFILEID');
 * ```
 */
export const getProfileGroups = (profileId: string) =>
  Endpoint.get<IGroup[]>(`/profiles/${profileId}/groups`).then((r) => r.data);

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
export const switchProfile = (profileId: string) =>
  Endpoint.post<ISwitchProfileResponse>(`/profiles/${profileId}/switch`).then((r) => r.data);

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
export const updateProfile = (profileId: string, params: IUpdateProfileRequest) =>
  Endpoint.put<IProfile>(`/profiles/${profileId}`, params).then((r) => r.data);

/**
 * Delete a profile. If the requested profile is the caller's curent profile, the next available profile will be selected.
 *
 * ```typescript
 * import {Profiles} from '@verdocs/js-sdk/Users';
 *
 * await Profiles.deleteProfile('PROFILEID');
 * ```
 */
export const deleteProfile = (profileId: string) => Endpoint.delete(`/profiles/${profileId}`).then((r) => r.data);
