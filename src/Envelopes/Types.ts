import {TEnvelopeStatus, TRecipientType} from '../BaseTypes';
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

  /** To enable KBA for the recipient, set to 'pin' or 'identity'. */
  kba_method?: 'pin' | 'identity' | null;

  /** If PIN-based KBA is used, the PIN to challenge the user to enter. */
  kba_pin?: string;

  /*
   * Pre-fill data for the recipient, if known. NOTE: If address and zip are both provided, an initial ID query
   * will be made for the recipient. If questions are returned immediately, the first challenge will be skipped and
   * the recipient will be immediately shown those questions, instead.
   */
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  ssn_last_4?: string;

  /**
   * Only returned in creation/getEnvelopeById requests by the creator. May be used for in-person signing. Note that
   * signing sessions started with this key will be marked as "In App" authenticated. For higher authentication levels,
   * e.g. email, the signer must follow a link send via the appropriate channel (email).
   */
  in_app_key?: string;
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
  /** Override the sender name of the envelope in email and other notifications. */
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
