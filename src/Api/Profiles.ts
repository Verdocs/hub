import {Endpoint} from './Endpoint';

export type TPermission =
  | 'org:view'
  | 'member:view'
  | 'org:update'
  | 'member:add'
  | 'member:remove'
  | 'admin:add'
  | 'admin:remove'
  | 'org:delete'
  | 'org:transfer'
  | 'owner:add'
  | 'owner:remove'
  | 'template:creator:create:personal'
  | 'template:creator:visibility'
  | 'template:creator:create:org'
  | 'template:member:read'
  | 'template:member:write'
  | 'template:member:visibility'
  | 'template:creator:delete'
  | 'template:member:delete'
  | 'template:creator:create:public'
  | 'rform:access'
  | 'rcommon:access'
  | 'org:list'
  | 'org:create';

export type TPlan = 'env:essential' | 'org:standard';

export type TRole = 'owner' | 'basic_user' | 'member';

export interface IGroup {
  id: string;
  name: string;
  organization_id: string;
  parent_id: string | null;
}

export interface IOrganization {
  /** The unique ID of the organization */
  id: string;
  /** The organization's name. */
  name: string;
  address: string | null;
  phone: string | null;
  /** If the organization is a business, its name. Note that a business name can be different from an organization name. */
  business_name: string | null;
  /** If true, the organization is a business */
  is_business: boolean;
  address2: string | null;
  contact_email: string | null;
  timezone: string | null;
  envelope_responsible: boolean;
}

export interface IProfile {
  /** The unique ID of the profile */
  id: string;
  /** The Verdocs back-end currently uses Auth0 for authentication. This value is a unique ID assigned by Auth0 to the
   * user. This is typically used to identify multiple profiles owned by a single user, but its implementation may
   * change in the future and developers should not develop code based on this field at this time. */
  user_id: string;
  /** The profile's organization ID, or a global "Realster" organization that all personal profiles are members of. */
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  /** If true, this is the caller's "currently selected" profile. All operations will performed "as" this profile. */
  current: boolean;
  /** The organization */
  organization: IOrganization;
  /** The permissions assigned to the profilel _NOTE: Only present in the "current" profile._ */
  permissions?: TPermission[];
  /** The roles assigned to the profilel _NOTE: Only present in the "current" profile._ */
  roles?: TRole[];
  /** The plans assigned to the profilel _NOTE: Only present in the "current" profile._ */
  plans?: TPlan[];
  /** The plans assigned to the profilel _NOTE: Only present in the "current" profile._ */
  groups?: IGroup[];
}

/**
 * Get the user's available profiles. The current profile will be marked with `current: true`.
 *
 * ```typescript
 * import {Profiles} from '@verdocs/js-sdk';
 *
 * const profiles = await Profiles.getProfiles()
 * ```
 */
export const getProfiles = () => Endpoint.get<IProfile[]>('/profiles').then((r) => r.data);

export interface IRole {
  /** Unique identifier for the role. */
  id: string;
  /** Display name for the role. */
  name: string;
}

/**
 * Get a list of system roles.
 *
 * ```typescript
 * import {Profiles} from '@verdocs/js-sdk';
 *
 * const roles = await Profiles.getRoles();
 * ```
 */
export const getRoles = () => Endpoint.get<IRole[]>('/roles').then((r) => r.data);

export interface IPermission {
  /** Unique identifier for the permission. */
  id: string;
  /** Display name for the permission. */
  name: string;
}

/**
 * Get a list of system roles.
 *
 * ```typescript
 * import {Profiles} from '@verdocs/js-sdk';
 *
 * const permissions = await Profiles.getPermissions();
 * ```
 */
export const getPermissions = () => Endpoint.get<IPermission[]>('/permissions').then((r) => r.data);

export interface CreateProfileRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

/**
 * Create a profile. If the caller does not have a "current" profile set, the new profile will be made current.
 *
 * ```typescript
 * import {Profiles} from '@verdocs/js-sdk';
 *
 * const newProfile = await Profiles.createProfile({ first_name: 'FIRST', last_name: 'LAST', email: 'EMAIL' });
 * ```
 */
export const createProfile = (params: CreateProfileRequest) =>
  Endpoint.post<IProfile>('/profiles', params).then((r) => r.data);

/**
 * Get a profile. The caller must have admin access to the given profile.
 * TODO: Add a "public" profile endpoint for public pages
 *
 * ```typescript
 * import {Profiles} from '@verdocs/js-sdk';
 *
 * const profile = await Profiles.getProfile('PROFILEID');
 * ```
 */
export const getProfile = (profileId: string) => Endpoint.get<IProfile>(`/profiles/${profileId}`).then((r) => r.data);

/**
 * Get a profile's permissions. The caller must have admin access to the given profile.
 *
 * ```typescript
 * import {Profiles} from '@verdocs/js-sdk';
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
 * import {Profiles} from '@verdocs/js-sdk';
 *
 * const groups = await Profiles.getProfileGroups('PROFILEID');
 * ```
 */
export const getProfileGroups = (profileId: string) =>
  Endpoint.get<IGroup[]>(`/profiles/${profileId}/groups`).then((r) => r.data);

export interface SwitchProfileResponse {
  profile: IProfile;
  idToken: string;
  accessToken: string;
  refreshToken: string;
}

/**
 * Switch the caller's "current" profile. The current profile is used for permissions checking and profile_id field settings
 * for most operations in Verdocs. It is important to select the appropropriate profile before calling other API functions.
 *
 * ```typescript
 * import {Profiles} from '@verdocs/js-sdk';
 *
 * const newProfile = await Profiles.switchProfile('PROFILEID');
 * ```
 */
export const switchProfile = (profileId: string) =>
  Endpoint.post<SwitchProfileResponse>(`/profiles/${profileId}/switch`).then((r) => r.data);

export interface IUpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

/**
 * Update a profile. For future expansion, the profile ID to update is required, but currently this must also be the
 * "current" profile for the caller.
 *
 * ```typescript
 * import {Profiles} from '@verdocs/js-sdk';
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
 * import {Profiles} from '@verdocs/js-sdk';
 *
 * await Profiles.deleteProfile('PROFILEID');
 * ```
 */
export const deleteProfile = (profileId: string) => Endpoint.delete(`/profiles/${profileId}`).then((r) => r.data);
