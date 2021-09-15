import {Endpoint} from './Endpoint';

export type IPermission =
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

export type IRole = 'owner' | 'basic_user' | 'member';

export type IPlan = 'env:essential' | 'org:standard';

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
  permissions?: IPermission[];
  /** The roles assigned to the profilel _NOTE: Only present in the "current" profile._ */
  roles?: IRole[];
  /** The plans assigned to the profilel _NOTE: Only present in the "current" profile._ */
  plans?: IPlan[];
}

export interface IActiveSession {
  sub: string;
  email: string;
  email_verified: boolean;
  iat: number;
  exp: number;
  permissions: IPermission[];
  roles: IRole[];
  plans: IPlan[];
  profile: IProfile;
  profile_id: string;
  organization_id: string;
}

/**
 * Get the user's available profiles. The current profile will be marked with `current: true`.
 *
 * ```typescript
 * import {Auth} from '@verdocs/js-sdk';
 *
 * const profiles = await Auth.getProfiles()
 * ```
 */
export const getProfiles = () => Endpoint.get<IProfile[]>('/profiles').then((r) => r.data);
