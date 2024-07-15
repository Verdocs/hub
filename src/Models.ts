////////////////////////////// QA RULES ///////////////////////
// When code-reviewing changes to these types, to align with
// database models, optional fields should be e.g.
//    field: string|null;
// NOT:
//    field?: string;
// Whereas relations should be purely optional:
//    other_things?: OtherThing[]
///////////////////////////////////////////////////////////////

import type {
  TApiKeyPermission,
  TEnvelopeStatus,
  TEventDetail,
  TFieldType,
  THistoryEvent,
  TPermission,
  TRecipientStatus,
  TRecipientType,
  TRole,
  TTemplateSenderType,
} from './BaseTypes';

/////////////////////////////// NOTIFICATIONS /////////////////////////////

export interface IChannel {
  id: string;
  channel_type: string;
  event_name: string;

  disabled_channels?: IDisabledChannel[];
}

export interface IDisabledChannel {
  channel_id: string;
  profile_id: string;

  profile?: IProfile;
  channel?: IChannel;
}

export interface INotification {
  id: string;
  profile_id: string;
  event_name: string;
  data: any;
  read: boolean;
  deleted: boolean;
  message: string;
  time: string;

  profile?: IProfile;
}

//////////////////////////////////////// IAM //////////////////////////////

export interface IApiKey {
  client_id: string;
  name: string;
  organization_id: string;
  profile_id: string;
  client_secret?: string | null;
  permission: TApiKeyPermission;

  profile?: IProfile;
  organization?: IOrganization;
}

export interface IGroup {
  id: string;
  name: string;
  organization_id: string;
  permissions: TPermission[];

  organization?: IOrganization;
  profiles?: IGroupProfile[];
}

export interface IGroupProfile {
  group_id: string;
  profile_id: string;
  organization_id: string;

  group?: IGroup;
  profile?: IProfile;
  organization?: IOrganization;
}

export interface IOAuth2App {
  id: string;
  profile_id: string;
  organization_id: string;
  name: string;
  client_id: string;
  client_secret?: string | null;
  redirect_uris: string;
  origins: string;
  friendly_name: string;
  logo_uri: string;
  public_key: string;
  private_key: string;
  created_at: string;
  updated_at: string;

  organization?: IOrganization;
  profile?: IProfile;
}

export interface IOrganization {
  /** The unique ID of the organization */
  id: string;
  /** The organization's name. */
  name: string;
  address: string | null;
  address2: string | null;
  phone: string | null;
  /** If the organization is a business, its name. Note that a business name can be different from an organization name. */
  contact_email: string | null;
  slug?: string | null;
  /** Web site URL */
  url?: string | null;
  full_logo_url?: string | null;
  thumbnail_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  entitlements?: Record<string, any> | null;
  mtd_usage?: Record<string, any> | null;
  ytd_usage?: Record<string, any> | null;
  data?: Record<string, any> | null;
  /** Creation date/time. */
  created_at: string;
  /** Last-update date/time. */
  updated_at: string;

  api_keys?: IApiKey[];
  groups?: IGroup[];
  oauth2_apps?: IOAuth2App[];
  organization_invitations?: IOrganizationInvitation[];
  profiles?: IProfile[];
  webhooks?: IWebhook[];
  envelopes?: IEnvelope[];
  templates?: ITemplate[];
  group_profiles?: IGroupProfile[];
  pending_webhooks?: IPendingWebhook[];
}

export interface IOrganizationInvitation {
  organization_id: string;
  email: string;
  status: 'pending';
  role: TRole;
  generated_at: string;
  token?: string | null;

  organization?: IOrganization;
}

export interface IPendingWebhook {
  id: string;
  webhook_id: string;
  organization_id: string;
  url: string;
  body: any;
  created_at: string;
  delivered_at: string | null;
  last_attempt_at: string | null;
  last_status: number | null;
  last_result: string | null;

  webhook?: IWebhook;
  organization?: IOrganization;
}

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
  picture: string | null;
  /** If true, this is the caller's "currently selected" profile. All operations will performed "as" this profile. */
  current: boolean;
  permissions: TPermission[];
  roles: TRole[];
  // Creation date/time.
  created_at: string;
  // Last-update date/time.
  updated_at: string;

  /** The organization */
  organization?: IOrganization;
  api_keys?: IApiKey[];
  group_profiles?: IGroupProfile[];
  groups?: IGroup[];
  notifications?: INotification[];
  oauth2_apps?: IOAuth2App[];
  signatures?: ISignature[];
  initials?: IInitial[];
}

export interface IWebhookEvents {
  envelope_created: boolean;
  envelope_completed: boolean;
  envelope_canceled: boolean;

  template_created: boolean;
  template_updated: boolean;
  template_deleted: boolean;
  template_used: boolean;
}

export interface IWebhook {
  id: string;
  organization_id: string;
  url: string;
  active: boolean;
  events: IWebhookEvents;
  status: string | null;
  last_success: string | null;
  last_failure: string | null;

  organization?: IOrganization;
  pending_webhooks?: IPendingWebhook[];
}

//////////////////////////////// FORMS ////////////////////////////////////

export interface IInPersonAccessKey {
  id: string;
  type: 'in_person_link';
  authentication?: string | null;
  recipient_name: string;
  envelope_id: string;
  key: string;
  expiration_date: string | null;
  created_at: string;
  first_used: string | null;
  last_used: string | null;

  envelope?: IEnvelope;
}

export interface IInAppAccessKey {
  id: string;
  type: 'in_app';
  authentication?: string | null;
  recipient_name: string;
  envelope_id: string;
  key: string;
  expiration_date: string | null;
  created_at: string;
  first_used: string | null;
  last_used: string | null;

  envelope?: IEnvelope;
}

export interface IEmailAccessKey {
  id: string;
  type: 'email';
  authentication?: string | null;
  recipient_name: string;
  envelope_id: string;
  key: string;
  expiration_date: string | null;
  created_at: string;
  first_used: string | null;
  last_used: string | null;

  envelope?: IEnvelope;
}

export interface ISMSAccessKey {
  id: string;
  type: 'sms';
  authentication?: string | null;
  recipient_name: string;
  envelope_id: string;
  key: string;
  expiration_date: string | null;
  created_at: string;
  first_used: string | null;
  last_used: string | null;

  envelope?: IEnvelope;
}

export type TAccessKey = IInPersonAccessKey | IInAppAccessKey | IEmailAccessKey | ISMSAccessKey;

/**
 * An Envelope is a workflow wrapper that shepherds one or more Documents through the various recipients in a signing
 * process.
 */
export interface IEnvelope {
  id: string;
  status: TEnvelopeStatus;
  profile_id: string;
  template_id: string | null;
  organization_id: string;
  reminder_id: string | null;
  name: string;
  no_contact: boolean;
  created_at: string;
  updated_at: string;
  canceled_at: string;
  /** Defaults to 'private'. If set to 'shared', this envelope will be visible to other users in the same organization. Ignored for personal profiles. */
  visibility: 'private' | 'shared';
  search_key: string | null;
  /**
   * Storage for arbitrary data that may be used e.g. to track source database/record IDs to relate Envelopes back to
   * internal systems/applications.
   */
  data: Record<string, any> | null;

  profile?: IProfile;
  template?: ITemplate | null;
  organization?: IOrganization;
  reminder?: IReminder | null;
  access_keys?: TAccessKey[];
  fields?: IEnvelopeField[];
  history_entries?: IEnvelopeHistory[];
  recipients: IRecipient[];
  /** Documents attached to this envelope */
  documents?: IEnvelopeDocument[] | null;
}

export interface IEnvelopeDocument {
  id: string;
  envelope_id: string;
  template_document_id: string | null;
  order: number;
  type: 'attachment' | 'certificate';
  name: string;
  pages: number;
  mime: string;
  created_at: string;
  updated_at: string;

  // @deprecated. Use pages instead.
  page_numbers: number;

  envelope?: IEnvelope | null;
  template_document?: ITemplateDocument | null;
  fields?: IEnvelopeField[];
}

export interface IEnvelopeField {
  /** The ID of the envelope the field is for. */
  envelope_id: string;
  /** The ID of the document the field is for. */
  document_id: string;
  /** The machine name of the field, e.g. `checkbox_groupP1-18` */
  name: string;
  /** The ID of the role in the recipients list, e.g. `Recipient 2` */
  recipient_role: string;
  /** The type of the field */
  type: TFieldType;
  /** If true, the field will be required */
  required: boolean | null;
  settings: IEnvelopeFieldSettings | null;
  validator: string | null;
  /** If set, the placeholder/label for the field. */
  label: string | null;
  /** Not sent by the server. Used in the UI to identify prepared fields. */
  prepared: boolean | null;
  /** The 1-based page number the field is displayed on. "Self-placed" fields that the user must apply will be on page 0. */
  page: number;
  /** The X position of the field. */
  x: number;
  /** The Y position of the field. */
  y: number;
  /** The width of the field. */
  width: number;
  /** The height of the field. */
  height: number;
  /** The default value for the field. */
  default: string | null;
  /** The placeholder to show in the field. */
  placeholder: string | null;
  /** For fields that support grouping (radio buttons and check boxes) the value selected will be stored under this name. */
  group: string | null;
  value: string | null;
  is_valid: boolean;

  envelope?: IEnvelope;
  document?: IEnvelopeDocument;
}

export interface IEnvelopeFieldOptions {
  /** The unique ID of the field */
  id: string;

  /** The X position of the field on the page. Self-placed fields will have an X value of 0. */
  x: number;

  /** The Y position of the field on the page. Self-placed fields will have an X value of 0. */
  y: number;

  /** For checkboxes, whether it is currently checked */
  checked: boolean | null;

  /** For radio buttons, whether it is currently selected */
  selected: boolean | null;

  /** The visible label for the field e.g. 'Not Applicable' */
  value: string;
}

export interface IEnvelopeFieldSettings {
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  value?: number | string;
  /** If the field has been filled in, this contains the current value */
  result?: any;
  /** Text field settings */
  leading?: number;
  alignment?: number;
  upperCase?: boolean;
  /** Dropdowns, checkboxes, radio groups */
  options?: IEnvelopeFieldOptions[];
  /** Signatures and Initials, result will be "signed" */
  base64?: string;
  hash?: string;
  ip_address?: string;
  signature_id?: string;
  signed_at?: string;
  /** Checkbox settings */
  minimum_checked?: number;
  maximum_checked?: number;
}

export interface IEnvelopeHistory {
  id: string;
  envelope_id: string;
  role_name: string;
  event: THistoryEvent;
  event_detail: TEventDetail;
  created_at: string;

  envelope?: IEnvelope;
}

export interface IInitial {
  id: string | null;
  profile_id: string;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;

  profile?: IProfile;
}

export interface IKbaPINRequired {
  type: 'pin';
}

export interface IRecipient {
  envelope_id: string;
  role_name: string;
  profile_id: string;
  status: TRecipientStatus;
  email: string;
  phone: string | null;
  full_name: string;
  /**
   * The sequence number indicates the order in which Recipients act. Multiple recipients may have the same sequence
   * number, in which case they may act in parallel. (e.g. all Recipients at sequence 2 will receive invites once
   * all Recipients at sequence 1 have signed.)
   */
  sequence: number;
  /**
   * The order indicates the order in which recipients are listed in a single "level" of the workflow. Note that
   * recipients at the same level may act in parallel despite this value. However, it can often be useful to visually
   * arrange recipients to match related business processes so this field allows for that.
   */
  order: number;
  type: TRecipientType;
  delegator: boolean;
  delegated_to: string | null;
  message: string | null;
  claimed: boolean;
  agreed: boolean;
  key_used_to_conclude?: string;
  environment: string;
  created_at: string;
  updated_at: string;
  last_attempt_at: string;
  /**
   * If set, "KBA required" will carry through to automatically enable the same setting in Envelopes
   * created from this template. For privacy reasons, this field will only be visible to the creator
   * of the envelope and the recipient referenced.
   */
  kba_method: 'pin' | 'identity' | null;
  /**
   * If KBA is set to "PIN" this will be set to the PIN code required. For security reasons, this
   * field will only be visible to the creator of the envelope.
   */
  kba_pin?: string | null;
  /**
   * If KBA has been completed successfully, this will be set to true. For privacy reasons, this
   * field will only be visible to the creator of the envelope and the recipient referenced.
   */
  kba_completed: boolean;
  /**
   * If KBA has been completed (or partially successfully, this will contain metadata related to
   * the questions and answers from the process. For privacy reasons, this field will only be visible
   * to the recipient referenced.
   */
  kba_details: Record<string, any>;

  envelope?: IEnvelope;
  profile?: IProfile;
}

export interface IReminder {
  id?: string;
  is_on: boolean;
  key: string;
  setup_time: number;
  interval_time: number;
  created_at: string | null;
  last_time: number | null;
  next_time: number | null;
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
  type: TRecipientType;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
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
  delegator: boolean | null;
  /**
   * If set, "KBA required" will carry through to automatically enable the same setting in Envelopes
   * created from this template.
   */
  kba_method: 'pin' | 'identity' | null;
}

export interface ISignature {
  id: string;
  profile_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  profile?: IProfile;
}

/**
 * A reusable template for creating signable instruments. Templates are used to create Envelopes which contain
 * Documents to sign.
 */
export interface ITemplate {
  /**
   * The unique ID of the template.
   */
  id: string;
  /**
   * The template's owner/creator.
   */
  profile_id: string;
  /**
   * Organization the template lives in.
   */
  organization_id: string;
  /**
   * If set, the template has reminders enabled.
   */
  reminder_id: string | null;
  /**
   * Who may create new documents from the template.
   */
  sender: TTemplateSenderType;
  /*
   The user-supplied name of the template.
  */
  name: string;
  /**
   * Optional description for the template.
   */
  description?: string;
  /**
   * Number of times the template has been used.
   */
  counter: number;
  /**
   * Number of times the template has been "starred".
   */
  star_counter: number;
  /**
   * If true, the template is only visible to the creator. If false, the template will also be visible to the user's
   * organization, if any.
   * @deprecated. See "visibility".
   */
  is_personal: boolean;
  /**
   * If true, the template is visible publicly. Note that this does not necessarily mean it is also visible to the
   * user's organization. It may be desirable to create documents that are public but that do not appear in the
   * organization's shared templates list. To achieve this, set both `is_personal` and `is_public` to TRUE.
   * @deprecated. See "visibility".
   */
  is_public: boolean;
  /**
   * If set, the visibility level for the template.
   */
  visibility?: string;
  /**
   * If true, the template is considered "sendable" (it has at least one signer, and every signer has at least one field.)
   */
  is_sendable: boolean;
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
  last_used_at: string | null;
  search_key: string;
  /**
   * Storage for arbitrary data that may be used e.g. to track source database/record IDs to relate Templates back to
   * internal systems/applications.
   */
  data: Record<string, any> | null;
  tags?: string[];

  profile?: IProfile;
  organization?: IOrganization;
  reminder?: IReminder | null;
  roles?: IRole[];
  documents?: ITemplateDocument[];
  fields?: ITemplateField[];

  // @deprecated. Use documents instead.
  template_documents?: ITemplateDocument[];
}

/**
 * A file attached to the template for display/signing.
 */
export interface ITemplateDocument {
  id: string;
  name: string;
  template_id: string;
  pages: number;
  mime: string;
  order: number;
  page_sizes: {width: number; height: number}[];
  created_at: string | null;
  updated_at: string | null;

  // @deprecated. Use pages instead.
  page_numbers?: number;

  template?: ITemplate;
}

export interface ITemplateField {
  /** The machine name of the field, e.g. `checkbox_groupP1-18` */
  name: string;
  /** The ID of the role in the recipients list, e.g. `Recipient 2` */
  role_name: string;
  /** The ID of the template the field is for. */
  template_id: string;
  /** The ID of the document the field is for. */
  document_id: string;
  type: TFieldType;
  required: boolean;
  settings: ITemplateFieldSetting | null;
  page: number;
  validator: string | null;
  label: string | null;
  /** The X position of the field. */
  x: number;
  /** The Y position of the field. */
  y: number;
  /** The width of the field. */
  width: number;
  /** The height of the field. */
  height: number;
  /** The default value for the field. */
  default: string | null;
  /** The placeholder to show in the field. */
  placeholder: string | null;
  /** For fields that support grouping (radio buttons and check boxes) the value selected will be stored under this name. */
  group: string | null;

  // @deprecated. Use settings instead.
  setting?: ITemplateFieldSetting | null;
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

export interface IActivityEntry {
  id: string;
  name: string;
  canceled_at: string;
  created_at: string;
  updated_at: string;
  profile_id: string;
  status: TEnvelopeStatus;
  template_id: string;
  recipient: {
    claimed: boolean;
    email: string;
    name: string;
    profile_id: string;
    status: TRecipientStatus;
    type: TRecipientType;
  };
}
