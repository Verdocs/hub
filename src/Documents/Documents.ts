import {getEndpoint} from '../HTTP/Transport';

export type TDocumentStatus = 'complete' | 'pending' | 'in progress' | 'declined' | 'canceled';

export type TRecipientStatus = 'invited' | 'opened' | 'signed' | 'submitted' | 'canceled' | 'pending' | 'declined';

export type TRecipientType = 'signer' | 'cc' | 'approver';

export interface IDocumentsSearchResultEntry {
  id: string;
  canceled_at: string;
  created_at: string;
  name: string;
  profile_id: string;
  status: TDocumentStatus;
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

export interface IDocumentsSearchResult {
  page: number;
  total: number;
  result: IDocumentsSearchResultEntry[];
}

export interface IDocumentsSummary {
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
  agreed: boolean;
  claimed: boolean;
  created_at: string;
  delegated_to: string | null;
  delegator: boolean;
  email: string;
  envelope_id: string;
  full_name: string;
  in_app_access_key: string;
  key_used_to_conclude: string;
  message: string | null;
  phone: string;
  profile_id: string;
  role_name: string;
  sequence: number;
  status: TRecipientStatus;
  type: TRecipientType;
  updated_at: string;
}

export interface IDocument {
  id: string;
  created_at: string;
  canceled_at: string;
  envelope_document_id: string;
  certificate_document_id: string | null;
  histories: IHistory[];
  recipients: IRecipient[];
  name: string;
  no_contact: boolean;
  profile_id: string;
  reminder_id: string | null;
  status: TDocumentStatus;
  template_id: string;
  updated_at: string;
  organization_id: string | null;
}

export interface IActivityEntry {
  id: string;
  name: string;
  canceled_at: string;
  created_at: string;
  updated_at: string;
  profile_id: string;
  status: TDocumentStatus;
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
  event: IHistoryEvent;
  event_detail: IEventDetail;
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
  envelope_status: TDocumentStatus[];
  recipient_status: TDocumentStatus[];
}

export type IHistoryEvent =
  | 'recipient:invited'
  | 'recipient:opened'
  | 'recipient:agreed'
  | 'recipient:signed'
  | 'recipient:submitted';

export type IEventDetail = 'in_app' | 'mail' | 'signer' | '';

/**
 * Get a summary of currently active documents.
 *
 * ```typescript
 * import {Documents} from '@verdocs/js-sdk/Documents';
 *
 * const {action_required, completed, waiting_on_others} = await Documents.getSummary();
 * ```
 */
export const getSummary = async (page: number) =>
  getEndpoint()
    .post<IDocumentsSummary>('/documents/summary', {page})
    .then((r) => r.data);

/**
 * Search for documents matching various criteria.
 *
 * ```typescript
 * import {Documents} from '@verdocs/js-sdk/Documents';
 *
 * const {result, page, total} = await Documents.search({ ... });
 * ```
 */
export const searchDocuments = async (params: any) =>
  getEndpoint()
    .post<IDocumentsSearchResult>('/documents/search', params)
    .then((r) => r.data);
