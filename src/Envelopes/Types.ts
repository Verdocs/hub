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

export interface IInPersonLinkResponse {
  link: string;
  envelope_id: string;
  profile_id: string;
  role_name: string;
  access_key: string;
  expiration_date: string;
  type: TAccessKey;
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
  name: string;
  description?: string;
  fields?: Pick<IEnvelopeField, 'name' | 'role_name' | 'default'>[];
  environment?: string;
  no_contact?: boolean;
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
}

export type TCreateEnvelopeRequest = ICreateEnvelopeFromTemplateRequest | ICreateEnvelopeDirectlyRequest;
