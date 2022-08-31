import {IProfile, TPermission, TRole} from '../Users/Types';

export interface IOrganization {
  /** The unique ID of the organization */
  id: string;
  /** The organization's name. */
  name: string;
  address: string | null;
  address2: string | null;
  phone: string | null;
  /** If true, the organization is a business */
  is_business: boolean;
  /** If the organization is a business, its name. Note that a business name can be different from an organization name. */
  business_name: string | null;
  contact_email: string | null;
  timezone: string | null;
  envelope_responsible: boolean;
}

export interface ICreateApiKeyRequest {
  name: string;
  profile_id: string;
}

export interface IUpdateApiKeyRequest {
  name?: string;
  profile_id?: string;
}

export interface IApiKey {
  client_id: string;
  name: string;
  profile_id: string;
  organization_id: string;
}

export interface IApiKeyWithSecret extends IApiKey {
  client_id: string;
  client_secret: string;
  name: string;
  profile_id: string;
  organization_id: string;
}

export interface IGroup {
  id: string;
  name: string;
  organization_id: string;
  /** For future expansion. In the future, Verdocs may support group hierarchies. Until then this field is always null. */
  parent: IGroup | null;
  /** For future expansion. In the future, Verdocs may support group hierarchies. Until then this field is always null. */
  parent_id: string | null;
  /** Some operations will additionally return a list of permissions. */
  permissions?: TPermission[];
  /** Some operations will additionally return a list of roles. */
  roles?: TRole[];
  /** Some operations will additionally return a list of profiles. */
  profiles?: IProfile[];
}

export interface IPermissionDetail {
  id: string;
  name: string;
  client_id: string;
}

export interface IRoleDetail {
  id: string;
  name: string;
  client_id: string;
}

export interface IGroupDetail {
  id: string;
  name: string;
  organization_id: string;
  permissions: IPermissionDetail[];
  roles: IRoleDetail[];
  profiles: IProfile[];
  /** For future expansion. In the future, Verdocs may support group hierarchies. Until then this field is always null. */
  parent: IGroup | null;
  /** For future expansion. In the future, Verdocs may support group hierarchies. Until then this field is always null. */
  parent_id: string | null;
}
