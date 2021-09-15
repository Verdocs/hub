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

export interface IProfile {
  id: string;
  user_id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  current: boolean;
  organization: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    business_name: string | null;
    is_business: boolean;
    address2: string | null;
    contact_email: string | null;
    timezone: string | null;
    envelope_responsible: boolean;
  };
  // Only the "current" profile will include these fields
  permissions?: IPermission[];
  roles?: IRole[];
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

export interface AuthenticateRequest {
  username: string;
  password: string;
}

export interface AuthenticateResponse {
  idToken: string;
  accessToken: string;
  refreshToken: string;
}

/**
 * Authenticate to Verdocs via user/password authentication
 *
 * ```typescript
 * import {Auth, Endpoint} from '@verdocs/js-sdk';
 *
 * const {accessToken} = await Auth.authenticate({ username: 'test@test.com', password: 'PASSWORD' });
 * Endpoint.setAuthToken(accessToken);
 * ```
 */
export const authenticate = (request: AuthenticateRequest) =>
  Endpoint.post<AuthenticateResponse>('/authentication/login', request).then((r) => r.data);

/**
 * Get the user's available profiles. The current profile will be marked with `current: true`.
 *
 * ```typescript
 * import {Auth} from '@verdocs/js-sdk';
 *
 * const profiles = await Auth.getProfiles()
 * ```
 */
export const getProfiles = () => Endpoint.post<IProfile[]>('/profiles').then((r) => r.data);
