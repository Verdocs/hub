import {IActivityEntry, IEnvelopeDocument, IEnvelopeField, IEnvelopeHistory, IRecipient, TAccessKey} from '../Models';
import {TEnvelopeStatus, TRecipientStatus, TRecipientType} from '../BaseTypes';

/**
 * One entry in an envelope search result.
 * NOTE: Many of the fields here are undefined unless "summary=true" is included in the search terms
 */
export interface IEnvelopesSearchResultEntry {
  id: string;
  canceled_at: string;
  certificate_document_id: string;
  created_at: string;
  histories: IEnvelopeHistory[];
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

export interface IEnvelopeSummary {
  id: string;
  profile_id: string;
  organization_id: string | null;
  name: string;
  status: TEnvelopeStatus;
  template_id: string;
  created_at: string;
  updated_at: string;
  canceled_at: string;
  envelope_document_id: string;
  certificate_document_id: string | null;
  reminder_id: string | null;
  no_contact: boolean;
  visibility: 'private' | 'shared';
  documents: IEnvelopeDocument[];
  recipients: IRecipient[];
  fields: IEnvelopeField[];
}

export interface IEnvelopeSummaries {
  page: number;
  count: number;
  total: number;
  records: IEnvelopeSummary[];
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
  full_name: string;
  email: string;
}

export interface IUpdateRecipientStatus {
  new_full_name?: string;
  agreed?: boolean;
  action?: 'prepare' | 'update';
}

export interface IUpdateRecipientAgreedParams {
  action: 'update';
  agreed: boolean;
}

export interface IUpdateRecipientNameParams {
  action: 'update';
  new_full_name: string;
}

export interface IUpdateRecipientPrepareParams {
  action: 'prepare';
  recipients: IRecipient[];
}

export interface ICreateEnvelopeReminderRequest {
  setup_time: number;
  interval_time: number;
}

export interface ICreateEnvelopeRequest {
  template_id: string;
  roles: ICreateEnvelopeRole[];
  name: string;
  environment?: string;
  prepared_fields?: {name: string; value: string}[];
}
