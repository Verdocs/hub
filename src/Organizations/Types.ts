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
