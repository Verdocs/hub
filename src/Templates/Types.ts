import {IOrganization} from '../Organizations/Types';
import {TDocumentFieldType, TRecipientType} from '../Envelopes/Types';

/**
 * A reusable template for creating signable instruments. Templates are used to create Envelopes which contain
 * Documents to sign.
 */
export interface ITemplate {
  /**
   * The unique ID of the template.
   */
  id: string;
  /*
   The user-supplied name of the template.
  */
  name: string;
  /**
   * Optional description for the template.
   */
  description?: string;
  /**
   * Who may create new documents from the template.
   */
  sender: TTemplateSender;
  /**
   * The template's owner/creator.
   */
  profile_id: string;
  /**
   * Organization the template lives in.
   */
  organization_id: string;
  /**
   * Number of times the template has been used.
   */
  counter: number;
  /**
   * Number of times the template has been "starred".
   */
  star_counter: number;
  /**
   * If true, the template is considered "sendable" (it has at least one signer, and every signer has at least one field.)
   */
  is_sendable: boolean;
  /**
   * If true, the template is only visible to the creator. If false, the template will also be visible to the user's
   * organization, if any.
   */
  is_personal: boolean;
  /**
   * If true, the template is visible publicly. Note that this does not necessarily mean it is also visible to the
   * user's organization. It may be desirable to create documents that are public but that do not appear in the
   * organization's shared templates list. To achieve this, set both `is_personal` and `is_public` to TRUE.
   */
  is_public: boolean;
  /**
   * Creation date/time.
   */
  created_at: string;
  /**
   * Last-update date/time.
   */
  updated_at: string;
  /**
   * Last-used date/time (when the template was used to create a document).
   */
  last_used_at: string;
  /**
   * Secret token associated with the document. Note that this field is marked optional because it is only visible to
   * the creator. This token is used in some operations such as creating shareable links to the template.
   */
  token?: string;
  /**
   * If set, the template has reminders enabled.
   */
  reminder_id?: string;
  /**
   * If reminders are enabled, the reminder configuration.
   */
  reminder?: IReminder;
  /**
   * If set, the template has been post-processed (rendered server-side for display in Web and Mobile clients).
   */
  processed?: boolean;
  /**
   * If the template was created within an organization, details about that organization.
   */
  organization?: IOrganization;
  /**
   * Roles (recipients) attached to the template. (Note that roles are uniquely identified by name rather than ID.)
   */
  roles?: IRole[];
  /**
   * Pages attached to the template. Note that this is all of the pages for all document attachments in sequential order.
   */
  pages?: IPage[];
  /**
   * @deprecated. New code should use `template_documents`.
   */
  template_document?: ITemplateDocument;
  /**
   * File attachments for this template.
   */
  template_documents?: ITemplateDocument[];
  /**
   * Fields connected to the template.
   */
  fields?: ITemplateField[];
}

/**
 * Some template search and list endpoints return only a partial set of fields for each entry via this structure.
 */
export interface ITemplateSummaryEntry {
  id: string;
  name: string;
  sender: TTemplateSender;
  counter: number;
  description: string | null;
  created_at: string;
  updated_at: string;
  /**
   * If true, the template is considered "sendable" (it has at least one signer, and every signer has at least one field.)
   */
  is_sendable: boolean;
  is_personal: boolean;
  is_public: boolean;
  profile_id: string;
  organization_id: string;
  last_used_at: string | null;
  document_name: string | null;
  star_counter: number;
  tag_name: string | null;
  is_starred: boolean;
}

export enum TemplateSenderTypes {
  CREATOR = 'creator', // same as legacy
  ORGANIZATION_MEMBER = 'organization_member',
  ORGANIZATION_MEMBER_AS_CREATOR = 'organization_member_as_creator',
  EVERYONE = 'everyone',
  EVERYONE_AS_CREATOR = 'everyone_as_creator', // Creator would be sender of envelope no matter who creates the envelope
}

export type TTemplateSender = `${TemplateSenderTypes}`;

export enum TemplateActions {
  CREATE_PERSONAL = 'create_personal',
  CREATE_ORG = 'create_org',
  CREATE_PUBLIC = 'create_public',
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  CHANGE_VISIBILITY_PERSONAL = 'change_visibility_personal',
  CHANGE_VISIBILITY_ORG = 'change_visibility_org',
  CHANGE_VISIBILITY_PUBLIC = 'change_visibility_public',
}

export type TTemplateAction = `${TemplateActions}`;

export interface ITemplateSearchParams {
  id?: string;
  name?: string;
  sender?: string;
  description?: string;
  profile_id?: string;
  organization_id?: string;
  updated_at?: ITimePeriod;
  created_at?: ITimePeriod;
  last_used_at?: ITimePeriod;
  is_personal?: boolean;
  is_public?: boolean;
  tags?: string[];
  document_name?: string;
  sort_by?: SortOptions;
  ascending?: boolean;
  row?: number;
  page?: number;
}

export interface ITimePeriod {
  start_time: string; // Date
  end_time: string; // Date
}

export enum SortOptions {
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
  NAME = 'name',
  LAST_USED_AT = 'last_used_at',
  COUNTER = 'counter',
  STAR_COUNTER = 'star_counter',
}

export interface ITemplatesSummary {
  page: number;
  total: number;
  result: ITemplateSummaryEntry[];
}

export interface ITemplatesSearchResult {
  page: number;
  total: number;
  result: ITemplate[];
}

export interface ITemplateTag {
  tag_name: string;
  template_id: string;
}

export interface ITag {
  name: string;
  featured?: boolean;
  organization_id?: string;
  created_at?: string;
}

export interface IStar {
  template_id: string;
  profile_id: string;
}

/**
 * A placeholder for an individual recipient, CC, or other party in a signing flow. Roles may be "known" or "unknown."
 * "Known" roles will have their email address supplied in the template which will get copied to envelopes created from
 * it. This is used when a certain party will always be the same, e.g. a leasing agent counter-signing a lease.
 * "Unknown" roles are dynamic, and will be filled in later when the envelope is created.
 */
export interface IRole {
  template_id: string;
  // The name of the recipient. Note that recipients do not have a separate ID - they are uniquely identified by name.
  name: string;
  full_name?: string;
  email?: string;
  type: TRecipientType;
  /**
   * The sequence number indicates the order in which Roles act. Multiple roles may have the same sequence
   * number, in which case they may act in parallel. (e.g. all Roles at sequence 2 will receive invites once
   * all Recipients at sequence 1 have signed.)
   */
  sequence: number;
  /**
   * The order indicates the order in which recipients are listed in a single "level" of the workflow. Note that
   * recipients at the same level may act in parallel despite this value. However, it can often be useful to visually
   * arrange recipients to match related business processes so this field allows for that.
   */
  order: number;
  /**
   * @deprecated. Use the fields array at the template level instead. This nested block will be removed in a future release.
   */
  fields?: ITemplateField[];
  delegator?: boolean;
  message?: string;
  phone?: string;
  rgba?: string;
}

/**
 * A file attached to the template for display/signing.
 */
export interface ITemplateDocument {
  url: string;
  name: string;
  page_numbers: number;
  order: number;
  id?: string;
  updated_at?: string;
  created_at?: string;
  template_id: string;
  mime: string;
  thumbnail_url: string;
  pages?: IPage[];
}

export interface ITemplateField {
  name: string;
  role_name: string;
  template_id: string;
  type: TDocumentFieldType;
  required: boolean;
  setting: ITemplateFieldSetting;
  page_sequence: number;
  validator?: string;
  label?: string;
}

export interface ITextFieldSetting {
  x: number;
  y: number;
  width: number;
  height: number;
  result: string;
  leading: number;
  alignment: number;
  upperCase: boolean;
}

export interface ITemplateFieldSetting {
  x?: number;
  y?: number;
  result?: string;
  width?: number;
  height?: number;

  // Text field settings
  leading?: number;
  alignment?: number;
  upperCase?: boolean;

  // Dropdowns, checkboxes, radio groups
  options?: any[];

  [key: string]: any;
}

export interface IPage {
  template_id: string;
  document_id: string;
  envelope_id: string;
  /**
   * Note: Page numbers are 1-based
   */
  sequence: number;
  /**
   * @deprecated. New code should use `sequence`
   */
  page_number: number;
  /**
   * @deprecated. Clients should not attempt to access images directly. Call `getTemplateDocumentPageDisplayUri()`
   * instead.
   */
  thumbnail_url?: string;
  /**
   * @deprecated. Clients should not attempt to access images directly. Call `getTemplateDocumentPageDisplayUri()`
   * instead.
   */
  image_uri?: string | null;
  template_document?: ITemplateDocument;
  fields?: ITemplateField[];
}

export interface IReminder {
  id?: string;
  created_at?: string;
  is_on: boolean;
  setup_time: number;
  interval_time: number;
  last_time: number;
  next_time: number;
  envelope_id: string;
  template_id: string;
}

export interface ITemplateOwnerInfo {
  email: string;
  name: string;
  profile_id: string;
}
