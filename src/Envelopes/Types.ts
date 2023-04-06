import {IProfile} from '../Users/Types';

export interface ISigningSessionRequest {
  envelopeId: string;
  roleId: string;
  inviteCode: string;
}

export interface IInPersonAccessKey {
  id: string;
  created_at: string;
  recipient_name: string;
  envelope_id: string;
  type: 'in_person_link';
  key: string;
  expiration_date: string | null;
  first_used: string | null;
  last_used: string | null;
}

export enum RecipientActions {
  SUBMIT = 'submit',
  DECLINE = 'decline',
  PREPARE = 'prepare',
  UPDATE = 'update',
}

export type TRecipientAction = `${RecipientActions}`;

export enum EnvelopeStates {
  COMPLETE = 'complete',
  PENDING = 'pending',
  IN_PROGRESS = 'in progress',
  DECLINED = 'declined',
  CANCELED = 'canceled',
}

export type TEnvelopeStatus = `${EnvelopeStates}`;

export enum RecipientStates {
  INVITED = 'invited',
  OPENED = 'opened',
  SIGNED = 'signed',
  SUBMITTED = 'submitted',
  CANCELED = 'canceled',
  PENDING = 'pending',
  DECLINED = 'declined',
}

export type TRecipientStatus = `${RecipientStates}`;

export enum RecipientTypes {
  SIGNER = 'signer',
  CC = 'cc',
  APPROVER = 'approver',
}

export type TRecipientType = `${RecipientTypes}`;

/**
 * One entry in an envelope search result.
 * NOTE: Many of the fields here are undefined unless "summary=true" is included in the search terms
 */
export interface IEnvelopesSearchResultEntry {
  id: string;
  canceled_at: string;
  /** @deprecated. New envelopes may have more than one certificate attached. */
  certificate_document_id: string;
  /** @deprecated. New envelopes may have more than one document attached. */
  envelope_document_id: string;
  created_at: string;
  histories: IHistory[];
  indexed_at: string;
  name: string;
  no_contact: boolean;
  organization_id: string;
  profile_id: string;
  recipients: IRecipient[];
  reminder_id: string | null;
  status: TEnvelopeStatus;
  /** Defaults to 'private'. If set to 'shared', this envelope will be visible to other users in the same organization. Ignored for personal profiles. */
  visibility: 'private' | 'shared';
  next_recipient: {
    claimed: boolean;
    email: string;
    name: string;
    profile_id: string;
    status: TRecipientStatus;
    type: TRecipientType;
  };
  template_id: string;
  total_count: number;
  updated_at: string;
}

export interface IEnvelopesSearchResult {
  page: number;
  total: number;
  result: IEnvelopesSearchResultEntry[];
}

export interface IEnvelopesSummary {
  action_required: {
    page: number;
    total: number;
    result: IActivityEntry[];
  };
  completed: {
    page: number;
    total: number;
    result: IActivityEntry[];
  };
  waiting_others: {
    page: number;
    total: number;
    result: IActivityEntry[];
  };
}

export interface IRecipient {
  envelope_id: string;
  role_name: string;
  agreed: boolean;
  claimed: boolean;
  created_at: string;
  delegated_to: string | null;
  delegator: boolean;
  email: string;
  full_name: string;
  in_app_access_key?: string;
  key_used_to_conclude?: string;
  message: string | null;
  phone: string | null;
  profile_id: string;
  environment: string;
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
  status: TRecipientStatus;
  type: TRecipientType;
  updated_at: string;
  fields?: IEnvelopeField[];
}

export interface IEnvelopeDocument {
  id: string;
  envelope_id: string;
  name: string;
  url: string;
  mime: string;
  page_numbers: number;
  template_document_id: string | null;
  type: 'attachment' | 'certificate';
  created_at: string;
  updated_at: string;
}

export interface IEnvelopeFieldOptions {
  /** The unique ID of the field */
  id: string;

  /** The X position of the field on the page. Self-placed fields will have an X value of 0. */
  x: number;

  /** The Y position of the field on the page. Self-placed fields will have an X value of 0. */
  y: number;

  /** For checkboxes, whether it is currently checked */
  checked?: boolean;

  /** For radio buttons, whether it is currently selected */
  selected?: boolean;

  /** The visible label for the field e.g. 'Not Applicable' */
  value: string;
}

export interface IEnvelopeFieldSettings {
  type?: string;
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

  [key: string]: any;
}

export enum DocumentFieldTypes {
  SIGNATURE = 'signature',
  INITIAL = 'initial',
  CHECKBOX_GROUP = 'checkbox_group',
  RADIO_BUTTON_GROUP = 'radio_button_group',
  TEXTBOX = 'textbox',
  TIMESTAMP = 'timestamp',
  DATE = 'date',
  DROPDOWN = 'dropdown',
  TEXTAREA = 'textarea',
  ATTACHMENT = 'attachment',
  PAYMENT = 'payment',
}

export type TDocumentFieldType = `${DocumentFieldTypes}`;

export interface IEnvelopeField {
  /**
   * The ID of the envelope the field is for. For historical reasons, this is called `envelope_id` because documents
   * were previously called envelopes.
   */
  envelope_id: string;
  /** The machine name of the field, e.g. `checkbox_groupP1-18` */
  name: string;
  /** If set, the placeholder/label for the field. */
  label: string | null;
  /** The 1-based page number the field is displayed on. "Self-placed" fields that the user must apply will be on page 0. */
  page: number;
  /** The ID of the role in the recipients list, e.g. `Recipient 2` */
  recipient_role: string;
  /** The type of the field */
  type: TDocumentFieldType;
  /** If true, the field will be required */
  required: boolean;
  settings?: IEnvelopeFieldSettings;
  validator: string | null;
  /** Not sent by the server. Used in the UI to identify prepared fields. */
  prepared?: boolean;
  /** If set, the tab index for the field. */
  tabindex: number;
  /** The X position of the field. */
  x: number;
  /** The Y position of the field. */
  y: number;
  /** The width of the field. */
  width: number;
  /** The height of the field. */
  height: number;
  /** The default value for the field. */
  default?: string;
  /** The placeholder to show in the field. */
  placeholder?: string;
  /** For fields that support grouping (radio buttons and check boxes) the value selected will be stored under this name. */
  group?: string;
}

/**
 * An Envelope is a workflow wrapper that shepherds one or more Documents through the various recipients in a signing
 * process.
 */
export interface IEnvelope {
  id: string;
  template_id: string;
  name: string;
  status: TEnvelopeStatus;
  profile_id: string;
  organization_id: string | null;
  no_contact: boolean;
  created_at: string;
  updated_at: string;
  canceled_at: string;
  reminder_id: string | null;
  /** @deprecated. New envelopes will support more than one document attachment so new code should no longer refer to this field. */
  envelope_document_id: string;
  /** @deprecated. New envelopes may have more than one certificate attached. */
  certificate_document_id: string | null;
  /** Defaults to 'private'. If set to 'shared', this envelope will be visible to other users in the same organization. Ignored for personal profiles. */
  visibility: 'private' | 'shared';
  histories: IHistory[];
  recipients: IRecipient[];
  profile?: IProfile | null;
  certificate?: IEnvelopeDocument | null;
  /** @deprecated. New code should use `documents[]`. */
  document?: IEnvelopeDocument | null;
  /** Documents attached to this envelope */
  documents?: IEnvelopeDocument[] | null;
  fields?: IEnvelopeField[];
}

export type TEnvelopeUpdateResult = Omit<IEnvelope, 'histories' | 'recipients' | 'certificate' | 'document' | 'fields' | 'profile'>;

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

export interface IHistory {
  created_at: string;
  envelope_id: string;
  event: THistoryEvent;
  event_detail: TEventDetail;
  id: string;
  role_name: string;
}

export interface IDocumentSearchOptions {
  rows?: number;
  page?: number;
  sort_by?: 'updated_at' | 'created_at';
  ascending?: boolean;
  is_owner?: boolean;
  is_recipient?: boolean;
  envelope_status?: TEnvelopeStatus[];
  recipient_status?: TEnvelopeStatus[];
}

export type THistoryEvent =
  | 'recipient:signed'
  | 'recipient:opened'
  | 'recipient:submitted'
  | 'recipient:prepared'
  | 'recipient:claimed'
  | 'recipient:agreed'
  | 'recipient:invited'
  | 'recipient:delegated'
  | 'recipient:updated_info'
  | 'recipient:declined'
  | 'invitation:resent'
  | 'envelope:cc'
  // TODO: These were removed and are not actually in use. See the created_at, updated_at (if status is completed)
  //  and canceled_at fields to identify these states.
  | 'created'
  | 'completed'
  | 'canceled'
  | 'owner:updated_recipient_info'
  | 'owner:canceled'
  | 'owner:get_in_person_link';

export type TEventDetail =
  | 'in_app'
  | 'mail'
  | 'signer'
  | 'sms'
  | 'reminder'
  | 'preparer'
  | 'manual'
  | 'in_person_link'
  | 'guest'
  | 'email'
  | ''
  | string; // Modification events have a string description

export interface ICreateEnvelopeRole {
  /** The type of role to create. Most participants in standard flows will be "signer" recipients. */
  type: TRecipientType;

  /**
   * The Role name of the recipient. Please note this is not the person's name. It is the ID of the role, e.g.
   * 'Recipient 1', 'Seller', etc. This must match one of the pre-defined roles in the template's Recipients list.
   */
  name: string;

  /** The full name of the recipient as it will be displayed in reports and queries, e.g. 'Paige Turner'. */
  full_name: string;

  /** The email address of the recipient. One of `email` or `phone` must be provided. */
  email?: string;

  /**
   * The phone number of the recipient. One of `email` or `phone` must be provided. If `phone` is included, the
   * recipient will receive an SMS notification for the document.
   */
  phone?: string;

  /**
   *  The 1-based sequence number for the recipient. This can be used to override the template's workflow. Recipients
   *  are processed in parallel for each matching sequence number (e.g. all recipients at level "1" may act in parallel)
   *  and in series between sequence numbers (e.g. all recipients at level "1" must complete their tasks before
   *  recipients at level "2" may act).
   */
  sequence: number;

  /** Whether the recipient may delegate their tasks to others. Should be false for most standard workflows. */
  delegator: boolean;

  /** A custom message to include in the email or SMS invitation. May be left blank for a default message. */
  message: string;
}
