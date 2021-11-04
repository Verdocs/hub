import {IGroup, IOrganization} from '../Organizations/Types';
import {TRequestStatus} from '../HTTP/Types';

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

export interface IActiveSession {
	  sub: string;
	  email: string;
	  email_verified: boolean;
	  iat: number;
	  exp: number;
	  permissions: IPermission[];
	  roles: IRole[];
	  profile: IProfile;
	  profile_id: string;
	  organization_id: string;
	  plans?: TPlan[];
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

export interface UpdatePasswordRequest {
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
