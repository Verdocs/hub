import {
  THistoryEvent,
  TRecipientAuthMethod,
  TRecipientAuthStep,
  TRecipientStatus,
  TTemplateSender,
  TTemplateVisibility,
  TUsageType,
} from './BaseTypes';
import {TApiKeyPermission, TEntitlement, TEnvelopeStatus, TEventDetail, TFieldType, TRecipientType} from './BaseTypes';
import {TPermission, TRole} from './Sessions';

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
  global_admin: boolean;
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

export interface IEntitlement {
  id: string;
  organization_id: string;
  feature: TEntitlement;
  contract_id?: string | null;
  notes?: string | null;
  starts_at: string;
  ends_at: string;
  monthly_max: number;
  yearly_max: number;
  created_at: string;
  organization?: IOrganization;
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
  parent_id: string | null;
  disclaimer?: string | null;
  data?: Record<string, any> | null;
  /** Creation date/time. */
  created_at: string;
  /** Last-update date/time. */
  updated_at: string;

  api_keys?: IApiKey[];
  children?: IOrganization[];
  parent?: IOrganization;
  groups?: IGroup[];
  oauth2_apps?: IOAuth2App[];
  entitlements?: IEntitlement[];
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
  first_name: string;
  last_name: string;
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
   * In Verdocs, a user may have multiple profiles. A user represents a single person. A profile
   * represents that person within an organization. Some profiles may have no user atached, typically
   * Contacts and Signers. This can change if that person registers for a user later.
   */
  user_id: string | null;
  /** The profile's organization ID, or a global "Verdocs" organization that all personal profiles are members of. */
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

  user?: IUser;
  organization?: IOrganization;
  api_keys?: IApiKey[];
  group_profiles?: IGroupProfile[];
  groups?: IGroup[];
  notifications?: INotification[];
  oauth2_apps?: IOAuth2App[];
  signatures?: ISignature[];
  initials?: IInitial[];
}

export interface IUser {
  id: string;
  email: string;
  email_verified: boolean;
  pass_hash?: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  picture: string | null;
  b2cId: string | null;
  googleId: string | null;
  appleId: string | null;
  githubId?: string | null;
  created_at: string;
  updated_at: string;
}

export interface IWebhookEvents {
  envelope_created: boolean;
  envelope_completed: boolean;
  envelope_updated: boolean;
  envelope_canceled: boolean;

  template_created: boolean;
  template_updated: boolean;
  template_deleted: boolean;
  template_used: boolean;

  entitlement_used: boolean;
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
  role_name: string;
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
  /** Unique identifier for the envelope (UUID) */
  id: string;
  /** Current status of the envelope. Note that 'complete', 'declined', and 'canceled' are immutable/permanent end states. */
  status: TEnvelopeStatus;
  /** ID of the envelope's creator. */
  profile_id: string;
  /** ID of the template from which the envelope was created. */
  template_id: string | null;
  /** ID of the organization to which the envelope belongs. */
  organization_id: string;
  /** Name of the envelope. By defaut, inherited from the envelope's template, but may be overridden when the envelope is created. */
  name: string;
  /** If set to true, no email or SMS messages will be sent to any of the envelope's recipients. */
  no_contact?: boolean;
  /** Delay (in seconds) before the first reminder is sent (min: 4hrs). Set to 0 or null to disable. */
  initial_reminder: number | null;
  /** Delay (in seconds) before subsequent remidners are sent (min: 12hrs). Set to 0 or null to disable. */
  followup_reminders: number | null;
  /** When the next reminder is scheduled to be sent. */
  next_reminder: string | null;
  /** Date/time when the envelope was created. */
  created_at: string;
  /** Date/time when the envelope was created. */
  updated_at: string;
  /** Date/time when the envelope was canceled, or null. */
  canceled_at: string;
  /** Date/time when the envelope will automatically expire, or null. */
  expires_at?: string;
  /** Defaults to 'private'. If set to 'shared', this envelope will be visible to other users in the same organization. Ignored for personal profiles. */
  visibility: 'private' | 'shared';
  search_key?: string | null;
  /**
   * Storage for arbitrary data that may be used e.g. to track source database/record IDs to relate Envelopes back to
   * internal systems/applications.
   */
  data?: Record<string, any> | null;

  profile?: IProfile;
  template?: ITemplate | null;
  organization?: IOrganization;
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
  size: number;
  page_sizes: {width: number; height: number}[];
  created_at: string;
  updated_at: string;
}

export interface IDropdownOption {
  id: string;
  label: string;
}

export interface IEnvelopeField {
  /** The ID of the envelope the field is for. */
  envelope_id: string;
  /** The ID of the document the field is for. */
  document_id: string;
  /** The machine name of the field, e.g. `Buyer-textbox-1` */
  name: string;
  /** The ID of the role in the recipients list, e.g. `Recipient 2` */
  role_name: string;
  /** The type of the field */
  type: TFieldType;
  /** If true, the field will be required */
  required: boolean | null;
  /** If true, the field will be not be editable by the participant(s). NOTE: Fields may not be both required and readonly. */
  readonly: boolean | null;
  /** @deprecated. Use top-level fields instead. */
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
  /** For text boxes, allows more than one line of text to be entered. */
  multiline: boolean;
  /** For fields that support grouping (radio buttons and check boxes) the value selected will be stored under this name. */
  group: string | null;
  /** For dropdowns, the options that are selectable. */
  options: IDropdownOption[] | null;
  value: string | null;
  is_valid: boolean;
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
  type?: string;
  x?: number;
  y?: number;
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
  browser?: string;
  platform?: string;
  mobile?: boolean;
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

export interface IKBAQuestion {
  type: string;
  answer: string[];
  prompt: string;
}

export interface IRecipient {
  /** Used only by the Web SDK during builder processes. Not stored in the backend. */
  id?: string | null;

  envelope_id: string;
  role_name: string;
  profile_id?: string | null;
  status: TRecipientStatus;
  first_name: string;
  last_name: string;
  /** @deprecated. Use first_name/last_name instead. */
  full_name?: string | null;
  email: string;
  /** Phone number for SMS invites */
  phone?: string | null;
  /** Street address. Only used in KBA workflows. Combine two-line addresses into a single string. */
  address?: string | null;
  /** Zip code. Only used in KBA workflows. */
  city?: string | null;
  /** Zip code. Only used in KBA workflows. */
  state?: string | null;
  /** Zip code. Only used in KBA workflows. */
  zip?: string | null;
  /** Last 4 digits of SSN. Only used in KBA workflows. */
  ssn_last_4?: string | null;
  /** The disclosure text the recipient accepted. */
  disclosure?: string | null;
  /** Date/time the recipient agreed to their e-signing disclosures. */
  disclosure_accepted_at?: string | null;
  /** Date of birth. Only used in KBA workflows. */
  dob?: string | null;
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
  environment?: string;
  created_at: string;
  updated_at: string;
  last_attempt_at?: string;
  /**
   * Only returned in creation/getEnvelopeById requests by the creator. May be used for in-person signing. Note that
   * signing sessions started with this key will be marked as "In App" authenticated. For higher authentication levels,
   * e.g. email, the signer must follow a link send via the appropriate channel (email).
   */
  in_app_key?: string;
  /**
   * The next verification step that must be performed.
   */
  auth_step?: TRecipientAuthStep | null;
  /** The types of authentication/verification required for this recipient. */
  auth_methods?: TRecipientAuthMethod[] | null;
  /** The status of each auth method enabled. */
  auth_method_states?: Record<TRecipientAuthMethod, 'complete' | 'failed' | 'challenge' | 'questions' | 'differentiator' | null> | null;
  /**
   * If auth_method is set to "passcode" this is the passcode required. For security reasons, this
   * field will only be visible to the creator of the envelope.
   */
  passcode?: string | null;
  /**
   * If a KBA step requires the user to answer a challenge/differentiator question, the
   * question(s) to ask.
   */
  kba_questions?: IKBAQuestion[] | null;
  envelope?: IEnvelope;
  profile?: IProfile;
}

/**
 * A placeholder for an individual recipient, CC, or other party in a signing flow. Roles may be "known" or "unknown."
 * "Known" roles will have their email address supplied in the template which will get copied to envelopes created from
 * it. This is used when a certain party will always be the same, e.g. a leasing agent counter-signing a lease.
 * "Unknown" roles are dynamic, and will be filled in later when the envelope is created.
 */
export interface IRole {
  /** Used only by the Web SDK during builder processes. Not stored in the backend. */
  id?: string | null;

  template_id: string;
  // The name of the recipient. Note that recipients do not have a separate ID - they are uniquely identified by name.
  name: string;
  type: TRecipientType;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
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
   * Who will "own" envelopes created from this template. Note that while either option is
   * technically allowed for all visibility settings, "template_owner" only has an effect if
   * visibility is "shared" or "public".
   */
  sender: TTemplateSender;
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
  /** Delay (in seconds) before the first reminder is sent (min: 4hrs). Set to 0 or null to disable. */
  initial_reminder: number | null;
  /** Delay (in seconds) before subsequent remidners are sent (min: 12hrs). Set to 0 or null to disable. */
  followup_reminders: number | null;
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
  visibility?: TTemplateVisibility;
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
  order: number;
  pages: number;
  mime: string;
  size: number;
  page_sizes: {width: number; height: number}[];
  created_at: string | null;
  updated_at: string | null;

  // @deprecated. Use pages instead.
  page_numbers?: number;

  template?: ITemplate;
}

export interface ITemplateField {
  /** The machine name of the field, e.g. `Buyer-textbox-1` */
  name: string;
  /** The ID of the role in the recipients list, e.g. `Recipient 2` */
  role_name: string;
  /** The ID of the template the field is for. */
  template_id: string;
  /** The ID of the document the field is for. */
  document_id: string;
  type: TFieldType;
  required: boolean;
  /** If true, the field will be not be editable by the participant(s). NOTE: Fields may not be both required and readonly. */
  readonly: boolean | null;
  /** @deprecated. Use top-level fields instead. */
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
  /** For text boxes, allows more than one line of text to be entered. */
  multiline: boolean;
  /** For fields that support grouping (radio buttons and check boxes) the value selected will be stored under this name. */
  group: string | null;
  /** For dropdowns, the options that are selectable. */
  options: IDropdownOption[] | null;

  value?: string | null;
  is_valid?: boolean;
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

export type TOrganizationUsage = Record<string, Record<TUsageType, number>>;
