import {TEventName, TNotificationType, type TWebhookAuthMethod, TWebhookEvent} from '../BaseTypes';
import {TRole} from '../Sessions';

export interface ICreateApiKeyRequest {
  name: string;
  profile_id: string;
  global_admin?: boolean;
}

export interface IUpdateApiKeyRequest {
  name?: string;
  profile_id?: string;
  global_admin?: boolean;
}

export interface ICreateInvitationRequest {
  email: string;
  first_name: string;
  last_name: string;
  role: TRole;
}

export interface IAcceptOrganizationInvitationRequest {
  email: string;
  token: string;
  first_name: string;
  last_name: string;
  password: string;
}

export interface ISetWebhookRequest {
  url: string;
  active: boolean;
  client_id?: string | null;
  client_secret?: string | null;
  scope?: string | null;
  token_endpoint?: string | null;
  auth_method: TWebhookAuthMethod;
  events: Record<TWebhookEvent, boolean>;
}

export type TWebhookDeliveryStatus = 'delivered' | 'failed' | 'pending';

export interface IListWebhookDeliveriesParams {
  event?: TWebhookEvent;
  envelope_id?: string;
  status?: TWebhookDeliveryStatus;
  /** Only deliveries created at or after this date and time (ISO 8601). */
  created_after?: string;
  /** Only deliveries created before this date and time (ISO 8601). */
  created_before?: string;
  /** Page size, up to 100. Defaults to 25. */
  rows?: number;
  /** Page to retrieve (0-based). Defaults to 0. */
  page?: number;
}

export interface IWebhookDelivery {
  id: string;
  webhook_id: string;
  event: TWebhookEvent;
  envelope_id: string | null;
  url: string;
  created_at: string;
  last_attempt_at: string | null;
  delivered_at: string | null;
  last_status: number | null;
  attempts: number;
  status: TWebhookDeliveryStatus;
}

export interface IWebhookDeliveryDetail extends IWebhookDelivery {
  organization_id: string;
  body: any;
  last_result: string | null;
}

export interface IWebhookDeliveriesResponse {
  count: number;
  rows: number;
  page: number;
  deliveries: IWebhookDelivery[];
}

/** Delivery counts for one UTC day. */
export interface IWebhookDeliveryStats {
  /** In YYYY-MM-DD format. */
  date: string;
  delivered: number;
  failed: number;
  pending: number;
}

export interface ICreateBrandRequest {
  key: string;
  name?: string;
  full_logo_url?: string;
  thumbnail_url?: string;
  favicon_url?: string;
  page_title?: string;
  primary_color?: string;
  secondary_color?: string;
  powered_by_label?: string;
  email_sender_name?: string;
  powered_by_url?: string;
  style_overrides?: string;
  disclaimer?: string;
  terms_use_url?: string;
  privacy_policy_url?: string;
  support_contact?: string;
  pdf_signature_reason?: string;
  pdf_signature_location?: string;
  timezone?: string | null;
  locale?: string | null;
}

export interface IUpdateBrandRequest {
  name?: string | null;
  full_logo_url?: string | null;
  thumbnail_url?: string | null;
  favicon_url?: string | null;
  page_title?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  powered_by_label?: string | null;
  email_sender_name?: string | null;
  powered_by_url?: string | null;
  style_overrides?: string | null;
  disclaimer?: string | null;
  terms_use_url?: string | null;
  privacy_policy_url?: string | null;
  support_contact?: string | null;
  pdf_signature_reason?: string | null;
  pdf_signature_location?: string | null;
  timezone?: string | null;
  locale?: string | null;
}

export interface IAddBrandAppDomainRequest {
  subdomain: string;
}

export interface IAddBrandEmailDomainRequest {
  subdomain: string;
  local_part: string;
  display_name?: string;
  reply_to?: string;
}

export interface ICreateNotificationTemplateRequest {
  type: TNotificationType;
  event_name: TEventName;
  template_id?: string;
  html_template?: string;
  text_template?: string;
}

export interface IUpdateNotificationTemplateRequest {
  html_template?: string;
  text_template?: string;
}

/** What a caller sends for a data catalog key: text, an ISO 8601 date, true or false, or one of a fixed set of choices. */
export type TDataCatalogEntryType = 'text' | 'date' | 'boolean' | 'choice';

export interface IDataCatalogOption {
  /** What to send in prefill_data. The label is accepted too. */
  value: string;
  /** What the signer sees for this choice. */
  label: string;
}

/** An entry's content, as versions freeze it and update reviews compare it. */
export interface IDataCatalogEntryFields {
  /** Matches the data_key on template and envelope fields, such as "applicant.full_name". */
  key: string;
  /** What template owners see for this key, such as "Applicant name". */
  label: string;
  /** What a caller sends for this key. */
  type: TDataCatalogEntryType;
  /** What the value is. */
  description: string | null;
  /** An example value, real or made up, as the organization chose. */
  example: string | null;
  /** For a choice, the accepted values. */
  options: IDataCatalogOption[] | null;
  /** Keeps the example out of MCP answers and AI prompts. */
  sensitive: boolean;
}

export interface IDataCatalogEntry extends IDataCatalogEntryFields {
  /** The entry's ID. */
  id: string;
  /** The catalog the entry belongs to. */
  catalog_id: string;
  /** "active" entries can be used; "proposed" entries wait for an admin to approve them. */
  status: 'active' | 'proposed';
  /** The profile that proposed the entry, if a member did. */
  proposed_by: string | null;
  /** For an entry imported from the marketplace, the source's version of it, used to review updates. */
  source_entry: IDataCatalogEntryFields | null;
  /** When the entry was created. */
  created_at: string;
  /** When the entry last changed. */
  updated_at: string;
}

export interface IDataCatalog {
  /** The catalog's ID. */
  id: string;
  /** The organization that owns it. */
  organization_id: string;
  /** The catalog's name. */
  name: string;
  /** What the catalog is for. */
  description: string | null;
  /** How it started: from scratch, from an import, or from the marketplace. */
  source: 'scratch' | 'import' | 'marketplace';
  /** For a catalog imported from the marketplace, the catalog it came from. */
  source_catalog_id: string | null;
  /** The source version this catalog was imported or last updated from. */
  source_version: number | null;
  /** "shared" makes released versions available to every organization below this one. */
  sharing: 'private' | 'shared';
  /** The newest released version, 0 until the first release. */
  latest_version: number;
  /** Whether this is the organization's default catalog. */
  is_default?: boolean;
  /** For an imported catalog, whether its source has released a newer version. */
  update_available?: boolean;
  /** How many live entries it has (in lists). */
  entry_count?: number;
  /** The entries (when getting one catalog). Members see live entries and their own proposals; admins see every proposal. */
  entries?: IDataCatalogEntry[];
  /** When the catalog was created. */
  created_at: string;
  /** When the catalog last changed. */
  updated_at: string;
}

export interface ISaveDataCatalogEntry {
  /** Letters, digits, "_", and "-", with "." between levels. */
  key: string;
  /** What template owners see for this key. */
  label: string;
  /** Defaults to text. A choice needs options. */
  type?: TDataCatalogEntryType;
  /** What the value is. */
  description?: string | null;
  /** An example value. */
  example?: string | null;
  /** For a choice, the accepted values. */
  options?: IDataCatalogOption[] | null;
  /** Keeps the example out of MCP answers and AI prompts. Defaults to false. */
  sensitive?: boolean;
}

export interface IUpdateDataCatalogEntryRequest {
  /** What template owners see for this key. */
  label?: string;
  /** What a caller sends for this key. */
  type?: TDataCatalogEntryType;
  /** What the value is. */
  description?: string | null;
  /** An example value. */
  example?: string | null;
  /** For a choice, the accepted values. */
  options?: IDataCatalogOption[] | null;
  /** Keeps the example out of MCP answers and AI prompts. */
  sensitive?: boolean;
  /** Set to "active" to approve a proposal. */
  status?: 'active';
}

export interface IDataCatalogImport {
  /** A sample payload (nested objects become dotted keys), or a JSON Schema. */
  format: 'json_sample' | 'json_schema';
  /** The sample or schema, as an object or a JSON string. */
  content: Record<string, unknown> | string;
  /** Use the sample's values (or the schema's examples) as entry examples. Defaults to true. */
  keep_examples?: boolean;
}

export interface ICreateDataCatalogRequest {
  /** Required unless importing from the marketplace, where it defaults to the source's name. */
  name?: string;
  /** What the catalog is for. */
  description?: string | null;
  /** Create the catalog's entries from a JSON sample or schema. */
  import?: IDataCatalogImport;
  /** Import a copy of a marketplace catalog's newest version. */
  from_catalog_id?: string;
}

export interface IUpdateDataCatalogRequest {
  /** The catalog's name. */
  name?: string;
  /** What the catalog is for. */
  description?: string | null;
  /** "shared" makes released versions available to every organization below this one. */
  sharing?: 'private' | 'shared';
}

export interface IDataCatalogVersion {
  /** The version's ID. */
  id: string;
  /** The catalog it belongs to. */
  catalog_id: string;
  /** The version number, starting at 1. */
  version: number;
  /** The catalog's live entries when the version was released. */
  entries: IDataCatalogEntryFields[];
  /** What changed in this version. */
  notes: string | null;
  /** The profile that released it. */
  released_by: string | null;
  /** When it was released. */
  created_at: string;
}

export interface IDataCatalogListing {
  /** The catalog's ID, for createDataCatalog's from_catalog_id. */
  id: string;
  /** The catalog's name. */
  name: string;
  /** What the catalog is for. */
  description: string | null;
  /** How it's offered: shared by an organization above this one. */
  listing: 'shared';
  /** The organization that publishes it. */
  publisher: {id: string; name: string; logo_url: string | null};
  /** Its newest released version. */
  version: number;
  /** When that version was released. */
  released_at: string | null;
  /** How many keys that version has. */
  key_count: number;
  /** Whether this organization already imported it. */
  imported: boolean;
}

export interface IDataCatalogChange {
  /** The data key. */
  key: string;
  /** added (new upstream), removed (gone upstream), updated (changed upstream, untouched here), or conflict (changed in both). */
  kind: 'added' | 'removed' | 'updated' | 'conflict';
  /** This organization's version of the entry. */
  local?: IDataCatalogEntryFields;
  /** The source's new version of the entry. */
  source?: IDataCatalogEntryFields;
  /** For removed and conflicting keys, the templates that use the key. */
  templates?: {id: string; name: string}[];
}

export interface IDataCatalogUpdate {
  /** The source version this catalog is on. */
  from_version?: number;
  /** The source's newest version. */
  to_version?: number;
  /** What applying the update would change. Empty when there's nothing to apply. */
  changes: IDataCatalogChange[];
}
