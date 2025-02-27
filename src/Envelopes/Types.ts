import {TEnvelopeStatus, TRecipientAuthMethod, TRecipientType} from '../BaseTypes';
import {IEnvelope, IEnvelopeDocument, IEnvelopeField, IRecipient, TAccessKey} from '../Models';

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

export interface ICreateEnvelopeRecipient {
  /** The type of role to create. Most participants in standard flows will be "signer" recipients. */
  type: TRecipientType;

  /**
   * The Role name of the recipient. Please note this is not the person's name. It is the ID of the role, e.g.
   * 'Recipient 1', 'Seller', etc. This must match one of the pre-defined roles in the template's Recipients list.
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
  sequence: number;

  /**
   * The 1-based order within the sequence for the recipient. Recipients at the same sequence act in parallel, so
   * this is only for display purposes.
   */
  order: number;

  /** Whether the recipient may delegate their tasks to others. Should be false for most standard workflows. */
  delegator?: boolean;

  /** A custom message to include in the email or SMS invitation. May be left blank for a default message. */
  message?: string;

  /** To enable authentication for the recipient, set to 'pin' or 'identity'. */
  auth_method?: TRecipientAuthMethod;

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

  /*
   * Pre-fill data for the recipient, if known. NOTE: Even when pre-filling these fields for a recipient, if
   * KBA is enabled, the recipient must be provided with the option to confirm those details before proceeding,
   * provide at least one data point themselves (typically date of birth). Providing every value here will
   trigger an error.
   */
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  dob?: string;
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

  /**
   * The next authentication step the recipient must perform, or null if no auth steps are needed.
   */
  auth_step: TRecipientAuthMethod | null;

  /**
   * If an authentication step must be performed, details related to it. Open-ended type to support
   * the modularity of the authentication system.
   */
  auth_details: Record<string, any> | null;
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

export interface ICreateEnvelopeFromTemplateRequest {
  template_id: string;
  recipients: ICreateEnvelopeRecipient[];
  name?: string;
  description?: string;
  fields?: Pick<IEnvelopeField, 'name' | 'role_name' | 'default'>[];
  environment?: string;
  no_contact?: boolean;
  /** Override the sender name of the envelope in email and other notifications. NOTE: To prevent spam filters from blocking messages, only the NAME may be overidden. The "from" email address will be notifications@verdocs.com and cannot be changed. */
  sender_name?: string;
  /** Delay (in seconds) before the first reminder is sent (min: 4hrs). Set to 0 or null to disable. */
  initial_reminder?: number;
  /** Delay (in seconds) before subsequent remidners are sent (min: 12hrs). Set to 0 or null to disable. */
  followup_reminders?: number;
}

export interface ICreateEnvelopeDirectlyRequest {
  name: string;
  description?: string;
  visiblity?: 'private' | 'shared';
  recipients: ICreateEnvelopeRecipient[];
  documents: IEnvelopeDocument[];
  fields: Pick<IEnvelopeField, 'name' | 'role_name' | 'default'>[];
  environment?: string;
  no_contact?: boolean;
  /** Delay (in seconds) before the first reminder is sent (min: 4hrs). Set to 0 or null to disable. */
  initial_reminder: number;
  /** Delay (in seconds) before subsequent remidners are sent (min: 12hrs). Set to 0 or null to disable. */
  followup_reminders: number;
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
