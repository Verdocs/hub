import {IGroup, IOrganization} from '../Organizations/Types';

export type TRequestStatus = 'OK' | 'ERROR';

/**
 * Operation within Verdocs that users may perform.
 */
export enum Permissions {
  RCOMMON = 'rcommon:access',
  RFORM_ACCESS = 'rform:access',

  ORG_CREATE = 'org:create',
  ORG_VIEW = 'org:view',
  ORG_UPDATE = 'org:update',
  ORG_DELETE = 'org:delete',
  ORG_TRANSFER = 'org:transfer',
  ORG_LIST = 'org:list',

  OWNER_ADD = 'owner:add',
  OWNER_REMOVE = 'owner:remove',

  ADMIN_ADD = 'admin:add',
  ADMIN_REMOVE = 'admin:remove',

  MEMBER_VIEW = 'member:view',
  MEMBER_ADD = 'member:add',
  MEMBER_REMOVE = 'member:remove',

  TEMPLATE_CREATOR_DELETE = 'template:creator:delete',
  TEMPLATE_CREATOR_VISIBILITY = 'template:creator:visibility',
  TEMPLATE_CREATOR_CREATE_ORG = 'template:creator:create:org',
  TEMPLATE_CREATOR_CREATE_PUBLIC = 'template:creator:create:public',
  TEMPLATE_CREATOR_CREATE_PERSONAL = 'template:creator:create:personal',

  TEMPLATE_MEMBER_READ = 'template:member:read',
  TEMPLATE_MEMBER_WRITE = 'template:member:write',
  TEMPLATE_MEMBER_DELETE = 'template:member:delete',
  TEMPLATE_MEMBER_VISIBILITY = 'template:member:visibility',
}

export type TPermission = `${Permissions}`;

/**
 * Plans provide access to Verdocs product features.
 */
export enum Plans {
  ENV_ESSENTIAL = 'env:essential',
  ORG_STANDARD = 'org:standard',
}

export type TPlan = `${Plans}`;

/**
 * Roles provide access to groups of permissions.
 */
export enum Roles {
  OWNER = 'owner',
  BASIC_USER = 'basic_user',
  MEMBER = 'member',
}

export type TRole = `${Roles}`;

export interface IProfile {
  /** The unique ID of the profile */
  id: string;
  /**
   * The Verdocs back-end currently uses Auth0 for authentication. This value is a unique ID assigned by Auth0 to the
   * user. This is typically used to identify multiple profiles owned by a single user, but its implementation may
   * change in the future and developers should not develop code based on this field at this time.
   */
  user_id: string;
  /** The profile's organization ID, or a global "Realster" organization that all personal profiles are members of. */
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  /** If true, this is the caller's "currently selected" profile. All operations will performed "as" this profile. */
  current: boolean;
  // Creation date/time.
  created_at: string;
  // Last-update date/time.
  updated_at: string;
  /** The organization */
  organization?: IOrganization;
  /** The permissions assigned to the profilel _NOTE: Only present in the "current" profile._ */
  permissions?: TPermission[];
  /** The roles assigned to the profilel _NOTE: Only present in the "current" profile._ */
  roles?: TRole[];
  /** The plans assigned to the profilel _NOTE: Only present in the "current" profile._ */
  plans?: TPlan[];
  /** The plans assigned to the profilel _NOTE: Only present in the "current" profile._ */
  groups?: IGroup[];
}

export interface IRole {
  /** Unique identifier for the role. */
  id: string;
  /** Display name for the role. */
  name: string;
}

export interface IPermission {
  /** Unique identifier for the permission. */
  id: string;
  /** Display name for the permission. */
  name: string;
}

export interface ICreateProfileRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

export interface ISwitchProfileResponse {
  profile: IProfile;
  idToken: string;
  accessToken: string;
  refreshToken: string;
}

export interface IUpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface IAuthenticateUserRequest {
  username: string;
  password: string;
}

export interface IAuthenticateAppRequest {
  client_id: string;
  client_secret: string;
}

export interface IAuthenticateResponse {
  idToken: string;
  accessToken: string;
  refreshToken: string;
}

export interface TokenValidationRequest {
  token: string;
}

export interface TokenValidationResponse {
  /** True if the token is valid */
  valid: boolean;
  /** The decoded and validated body of the JWT */
  payload: any;
}

export interface IUpdatePasswordRequest {
  email: string;
  oldPassword: string;
  newPassword: string;
}

export interface UpdatePasswordResponse {
  status: TRequestStatus;
  /** Success or failure message */
  message: string;
}

export interface UpdateEmailRequest {
  email: string;
}

export interface UpdateEmailResponse {
  profiles: IProfile[];
}
