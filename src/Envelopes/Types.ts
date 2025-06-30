import type {TEnvelopeStatus, TFieldType, TRecipientAuthMethod, TRecipientType} from '../BaseTypes';
import type {IDropdownOption, IEnvelope, IRecipient, TAccessKey} from '../Models';

export interface IEnvelopesSearchResult {
  page: number;
  total: number;
  result: IEnvelope[];
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

export interface ICreateEnvelopeRecipientFromTemplate {
  /**
   * Unique identifier for the recipient. When using a template, must match one of the pre-defined roles in the template's Recipients list.
   */
  role_name: string;

  /** The name of the recipient as it will be displayed in reports and queries, e.g. 'Paige Turner'. */
  first_name: string;
  last_name: string;

  /** The email address of the recipient. One of `email` or `phone` must be provided. */
  email?: string;

  /**
   * The phone number of the recipient. One of `email` or `phone` must be provided. If `phone` is included, the
   * recipient will receive an SMS notification for the document.
   */
  phone?: string;

  /** Whether the recipient may delegate their tasks to others. Should be false for most standard workflows. */
  delegator?: boolean;

  /** A custom message to include in the email or SMS invitation. May be left blank for a default message. */
  message?: string;

  /** To enable authentication for the recipient, set to 'pin' or 'identity'. */
  auth_methods?: TRecipientAuthMethod[];

  /** If Passcode-based authentication is used, the passcode to challenge the user to enter. */
  passcode?: string;

  /**
   * If SMS-based authentication is used, the phone number to which one-time codes should be sent.
   * NOTE: This may be different from the phone number used for notifications, but leaving it blank
   * will trigger an error rather than defaulting to the notifications phone number to avoid mistaken
   * assumptions (e.g. if SMS notifications are not enabled for the organization, but SMS authentication
   * is).
   */
  phone_auth?: string;

  /** Pre-fill KBA address for the recipient, if known. */
  address?: string;
  /** Pre-fill KBA city for the recipient, if known. */
  city?: string;
  /** Pre-fill KBA state for the recipient, if known. */
  state?: string;
  /** Pre-fill KBA zip for the recipient, if known. */
  zip?: string;
  /** Pre-fill KBA date-of-birth for the recipient, if known. */
  dob?: string;
  /** Pre-fill KBA SSN-Last-4 for the recipient, if known. */
  ssn_last_4?: string;
}

export interface ICreateEnvelopeRecipientDirectly {
  /** The type of role to create. Most participants in standard flows will be "signer" recipients. */
  type: TRecipientType;

  /**
   * Unique identifier for the recipient. When using a template, must match one of the pre-defined roles in the template's Recipients list.
   */
  role_name: string;

  /** The name of the recipient as it will be displayed in reports and queries, e.g. 'Paige Turner'. */
  first_name: string;
  last_name: string;

  /** The email address of the recipient. One of `email` or `phone` must be provided. */
  email?: string;

  /**
   * The phone number of the recipient. One of `email` or `phone` must be provided. If `phone` is included, the
   * recipient will receive an SMS notification for the document.
   */
  phone?: string;

  /**
   * The 1-based sequence number for the recipient. This can be used to override the template's workflow. Recipients
   * are processed in parallel for each matching sequence number (e.g. all recipients at level "1" may act in parallel)
   * and in series between sequence numbers (e.g. all recipients at level "1" must complete their tasks before
   * recipients at level "2" may act).
   */
  sequence?: number;

  /**
   * The 1-based order within the sequence for the recipient. Recipients at the same sequence act in parallel, so
   * this is only for display purposes.
   */
  order?: number;

  /** Whether the recipient may delegate their tasks to others. Should be false for most standard workflows. */
  delegator?: boolean;

  /** A custom message to include in the email or SMS invitation. May be left blank for a default message. */
  message?: string;

  /** To enable authentication for the recipient, set to 'pin' or 'identity'. */
  auth_methods?: TRecipientAuthMethod[];

  /** If Passcode-based authentication is used, the passcode to challenge the user to enter. */
  passcode?: string;

  /**
   * If SMS-based authentication is used, the phone number to which one-time codes should be sent.
   * NOTE: This may be different from the phone number used for notifications, but leaving it blank
   * will trigger an error rather than defaulting to the notifications phone number to avoid mistaken
   * assumptions (e.g. if SMS notifications are not enabled for the organization, but SMS authentication
   * is).
   */
  phone_auth?: string;

  /** Pre-fill KBA address for the recipient, if known. */
  address?: string;
  /** Pre-fill KBA city for the recipient, if known. */
  city?: string;
  /** Pre-fill KBA state for the recipient, if known. */
  state?: string;
  /** Pre-fill KBA zip for the recipient, if known. */
  zip?: string;
  /** Pre-fill KBA date-of-birth for the recipient, if known. */
  dob?: string;
  /** Pre-fill KBA SSN-Last-4 for the recipient, if known. */
  ssn_last_4?: string;
}

export interface ISignerTokenResponse {
  /**
   * An access token that may be used with a VerdocsEndpoint to perform signing operations.
   * When signing, the caller's "authentication" status will be recorded as "in-person".
   */
  access_token: string;
  /**
   * A copy of the envelope related to the signing session. This is almost always needed when
   * a signing session is being started, so it is included here for convenience.
   */
  envelope: IEnvelope;
  /**
   * A copy of the recipient record related to the signing session. This is almost always needed when
   * a signing session is being started, so it is included here for convenience.
   */
  recipient: IRecipient;
}

export interface IInPersonLinkResponse {
  /** A valid Verdocs Web URL that hosts a signing experience. */
  link: string;
  /**
   * An access token that may be used with a VerdocsEndpoint to perform signing operations.
   * When signing, the caller's "authentication" status will be recorded as "in-person".
   */
  access_token: string;
  /**
   * The access key that matches the signing session. May be used for later initiation requests
   * if in-person signing was desired, but not necessarily instant (e.g. to hand-off to a
   * companion application. **NOTE: Access keys are as sensitive as Bearer Tokens and must be
   * protected from theft and unauthorized sharing!**
   */
  access_key: TAccessKey;
  /**
   * A copy of the envelope related to the signing session. This is almost always needed when
   * a signing session is being started, so it is included here for convenience.
   */
  envelope: IEnvelope;
  /**
   * A copy of the recipient record related to the signing session. This is almost always needed when
   * a signing session is being started, so it is included here for convenience.
   */
  recipient: IRecipient;
}

export interface IUpdateRecipientSubmitParams {
  action: 'submit';
}

export interface IUpdateRecipientDeclineParams {
  action: 'decline';
}

export interface IUpdateRecipientClaimEnvelope {
  action: 'owner_update';
  first_name: string;
  last_name: string;
  email: string;
}

export interface IUpdateRecipientStatus {
  first_name?: string;
  last_name?: string;
  agreed?: boolean;
  action?: 'prepare' | 'update';
}

export interface IUpdateRecipientAgreedParams {
  action: 'update';
  agreed: boolean;
  disclosure?: string;
}

export interface IUpdateRecipientNameParams {
  action: 'update';
  first_name: string;
  last_name: string;
}

export interface IUpdateRecipientPrepareParams {
  action: 'prepare';
  recipients: IRecipient[];
}

export interface ICreateEnvelopeReminderRequest {
  setup_time: number;
  interval_time: number;
}

export interface IUpdateRecipientParams {
  /** The name of the recipient as it will be displayed in reports and queries, e.g. 'Paige Turner'. */
  first_name?: string;
  last_name?: string;
  /** The email address of the recipient. If changed, a new invite will be sent. */
  email?: string;
  /** The phone number of the recipient. If changed, a new invite will be sent. */
  phone?: string;
  /** A custom message to include in the email or SMS invitation. May be left blank for a default message. */
  message?: string;
  /** If Passcode-based authentication is used, the passcode to challenge the user to enter. May only be changed if the recipient has not already completed passcode-based auth. */
  passcode?: string;
  /** If KBA-based authentication is used, the recipient's address to prefill. May only be changed if the recipient has not already completed KBA-based auth. */
  address?: string;
  /** If KBA-based authentication is used, the recipient's city to prefill. May only be changed if the recipient has not already completed KBA-based auth. */
  city?: string;
  /** If KBA-based authentication is used, the recipient's state to prefill. May only be changed if the recipient has not already completed KBA-based auth. */
  state?: string;
  /** If KBA-based authentication is used, the recipient's zip code to prefill. May only be changed if the recipient has not already completed KBA-based auth. */
  zip?: string;
  /** If KBA-based authentication is used, the recipient's date of birth to prefill. May only be changed if the recipient has not already completed KBA-based auth. */
  dob?: string;
  /** If KBA-based authentication is used, the recipient's SSN-Last-4 to prefill. May only be changed if the recipient has not already completed KBA-based auth. */
  ssn_last_4?: string;
}

export interface ICreateEnvelopeDocumentFromData {
  /** The order in which the document should be displayed. */
  order?: number;
  /** Override the detected MIME type for the document. */
  mime?: string;
  /** The name of the document. Will be used to generate the final filename. */
  name?: string;
  /** Base-64 encoded content of the document. */
  data: string;
}

export interface ICreateEnvelopeDocumentFromUri {
  /** The order in which the document should be displayed. */
  order?: number;
  /** Override the detected MIME type for the document. */
  mime?: string;
  /** The name of the document. Will be used to generate the final filename. */
  name?: string;
  /** URI from which Verdocs should download a copy of the document. Pre-signed URLs with short (<60s) expirations are strongly recommended. */
  uri: string;
}

export interface ICreateEnvelopeDocumentFromFile {
  /** The order in which the document should be displayed. */
  order?: number;
  /** Override the detected MIME type for the document. */
  mime?: string;
  /** The name of the document. Will be used to generate the final filename. */
  name?: string;
  /** Directly attach a file via form-url-encoded POST attachment. */
  file?: any;
}

export interface ICreateEnvelopeFieldFromTemplate {
  /** The machine name of the field, e.g. `Buyer-textbox-1` */
  name: string;
  /** The ID of the role in the recipients list, e.g. `Recipient 2` */
  role_name: string;
  /** Override the "required" setting from the template. */
  required?: boolean;
  /** Override the "readonly" setting from the template. */
  readonly?: boolean;
  /** Override the "label" setting from the template. */
  label?: string;
  /** Override the "default" setting from the template. If a default is provided, the field will be marked as "prepared". */
  default?: string;
  /** Override the "placeholder" setting from the template. */
  placeholder?: string;
  /** Override the "multiline" setting from the template. */
  multiline?: boolean;
  /** For fields that support grouping (radio buttons and check boxes) the value selected will be stored under this name. */
  group?: string;
  /** Override the "options" setting from the template. */
  options?: IDropdownOption[] | null;
}

export interface ICreateEnvelopeFieldDirectly {
  /** The array index of the document the field is for. */
  document_id: number;
  /** The machine name of the field, e.g. `Buyer-textbox-1` */
  name: string;
  /** The ID of the role in the recipients list, e.g. `Recipient 2` */
  role_name: string;
  /** The type of the field */
  type: TFieldType;
  /** The 1-based page number the field is displayed on. "Self-placed" fields that the user must apply will be on page 0. */
  page: number;
  /** The X position of the field. */
  x: number;
  /** The Y position of the field. */
  y: number;
  /** The width of the field. */
  width?: number;
  /** The height of the field. */
  height?: number;
  /** If true, the field will be required */
  required?: boolean;
  /** If true, the field will be not be editable by the participant(s). NOTE: Fields may not be both required and readonly. */
  readonly?: boolean;
  /** If set, the placeholder/label for the field. */
  label?: string;
  /** The default value for the field. */
  default?: string;
  /** The placeholder to show in the field. */
  placeholder?: string;
  /** For text boxes, allows more than one line of text to be entered. */
  multiline?: boolean;
  /** For fields that support grouping (radio buttons and check boxes) the value selected will be stored under this name. */
  group?: string;
  /** For dropdowns, the options that are selectable. */
  options?: IDropdownOption[] | null;
}

export interface ICreateEnvelopeFromTemplateRequest {
  template_id: string;
  /** Override the name of the envelope to create. */
  name?: string;
  /** Override the description of the envelope to create. */
  description?: string;
  /** Override the sender name of the envelope in email and other notifications. NOTE: To prevent spam filters from blocking messages, only the NAME may be overidden. The "from" email address will be notifications@verdocs.com and cannot be changed. */
  sender_name?: string;
  /** If set, Verdocs will not attempt to contact the recipient via email or SMS. */
  no_contact?: boolean;
  /** If set, the envelope will automatically expire at the specified date/time (ISO8601, UTC) */
  expires_at?: string;
  /** Environment in which to execute the envelope. Do not set this unless instructed to do so by Verdocs support. */
  environment?: string;
  /** Visibility of the envelope. If set to 'shared', the envelope will be visible to all users in the organization. If set to 'private', only the creator and recipients will see it. */
  visibility?: 'private' | 'shared';
  /** Delay (in seconds) before the first reminder is sent (min: 4hrs). Set to 0 or null to disable. */
  initial_reminder?: number;
  /** Delay (in seconds) before subsequent remidners are sent (min: 12hrs). Set to 0 or null to disable. */
  followup_reminders?: number;
  /** List of recipients to configure. */
  recipients: ICreateEnvelopeRecipientFromTemplate[];
  /** Optional metadata to attach to the envelope. This is not used by Verdocs, but may be used for internal tracking purposes by the caller. This is not shown to recipients, but is not private and should not be used to store sensitive data. */
  data?: any;
  /** Fields to create in the envelope. Note that document_id is a number in this call and should match the index of the document in the documents array. */
  fields?: ICreateEnvelopeFieldFromTemplate;
}

export interface ICreateEnvelopeDirectlyRequest {
  /** The name of the envelope to create. */
  name: string;
  /** The description of the envelope to create. */
  description?: string;
  /** Override the sender name of the envelope in email and other notifications. NOTE: To prevent spam filters from blocking messages, only the NAME may be overidden. The "from" email address will be notifications@verdocs.com and cannot be changed. */
  sender_name?: string;
  /** If set, Verdocs will not attempt to contact the recipient via email or SMS. */
  no_contact?: boolean;
  /** If set, the envelope will automatically expire at the specified date/time (ISO8601, UTC) */
  expires_at?: string;
  /** Environment in which to execute the envelope. Do not set this unless instructed to do so by Verdocs support. */
  environment?: string;
  /** Visibility of the envelope. If set to 'shared', the envelope will be visible to all users in the organization. If set to 'private', only the creator and recipients will see it. */
  visibility?: 'private' | 'shared';
  /** Delay (in seconds) before the first reminder is sent (min: 4hrs). Set to 0 or null to disable. */
  initial_reminder: number;
  /** Delay (in seconds) before subsequent remidners are sent (min: 12hrs). Set to 0 or null to disable. */
  followup_reminders: number;
  /** Optional metadata to attach to the envelope. This is not used by Verdocs, but may be used for internal tracking purposes by the caller. This is not shown to recipients, but is not private and should not be used to store sensitive data. */
  data?: any;
  /** List of recipients to configure. */
  recipients: ICreateEnvelopeRecipientDirectly[];
  /** Documents to attach to the envelope. */
  documents: (ICreateEnvelopeDocumentFromData | ICreateEnvelopeDocumentFromUri | ICreateEnvelopeDocumentFromFile)[];
  /** Fields to create in the envelope. Note that document_id is a number in this call and should match the index of the document in the documents array. */
  fields: ICreateEnvelopeFieldDirectly[];
}

export type TCreateEnvelopeRequest = ICreateEnvelopeFromTemplateRequest | ICreateEnvelopeDirectlyRequest;

export interface IAuthenticateRecipientViaPasscodeRequest {
  auth_method: 'passcode';
  code: string;
}

export interface IAuthenticateRecipientViaEmailRequest {
  auth_method: 'email';
  code: string;
  resend?: boolean;
}

export interface IAuthenticateRecipientViaSMSRequest {
  auth_method: 'sms';
  code: string;
  resend?: boolean;
}

export interface IKBAResponse {
  type: string;
  answer: string | number;
}

export interface IAuthenticateRecipientViaKBARequest {
  auth_method: 'kba';
  first_name?: string;
  last_name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  ssn_last_4?: string;
  dob?: string;
  responses?: IKBAResponse[];
}

export type TAuthenticateRecipientRequest =
  | IAuthenticateRecipientViaPasscodeRequest
  | IAuthenticateRecipientViaEmailRequest
  | IAuthenticateRecipientViaSMSRequest
  | IAuthenticateRecipientViaKBARequest;
