import {IProfile} from '../Users/Types';

export type TRecipientAction = 'submit' | 'decline' | 'prepare' | 'update';

export interface ITemplateSummaryEntry {
  id: string;
  name: string;
  sender: string;
  counter: number;
  description: string | null;
  created_at: string;
  updated_at: string;
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

export interface ITemplatesSummary {
  page: number;
  total: number;
  result: ITemplateSummaryEntry[];
}

export interface ISigningSessionRequest {
  documentId: string;
  roleId: string;
  inviteCode: string;
}

export interface ISigningSession {
  profile_id: string;
  document_id: string;
  role: string;
  email: string;
  access_key: {
    id: string;
    type: string;
  };
  iss: string;
  aud: string;
  exp: number;
  iat: number;

  [key: string]: any;
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

export type TDocumentStatus = 'complete' | 'pending' | 'in progress' | 'declined' | 'canceled';

export type TRecipientStatus = 'invited' | 'opened' | 'signed' | 'submitted' | 'canceled' | 'pending' | 'declined';

export type TRecipientType = 'signer' | 'cc' | 'approver';

// NOTE: Many of the fields here are undefined unless "summary=true" is included in the search terms
export interface IDocumentsSearchResultEntry {
  id: string;
  canceled_at: string;
  certificate_document_id: string;
  created_at: string;
  envelope_document_id: string;
  histories: IHistory[];
  indexed_at: string;
  name: string;
  no_contact: boolean;
  organization_id: string;
  profile_id: string;
  recipients: IRecipient[];
  reminder_id: string | null;
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
  in_app_access_key?: string;
  key_used_to_conclude?: string;
  message: string | null;
  phone: string | null;
  profile_id: string;
  role_name: string;
  // The sequence number indicates the order in which recipients act. Note that it is the workflow "level" not the
  // recipient's individual index in the list. There may be multiple recipients with the same sequence. Recipients
  // with the same sequence number may act independently, in parallel to each other (co-signers), as long as all
  // Recipients with an earlier sequence number have completed their tasks.
  sequence: number;
  status: TRecipientStatus;
  type: TRecipientType;
  updated_at: string;
}

export interface IDocumentAsset {
  created_at: string;
  id: string;
  mime: string;
  name: string;
  page_numbers: number;
  updated_at: string;
  url: string;
}

export interface IDocumentFieldSettings {
  type?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  value?: number | string;
  result?: any;

  // Text field settings
  leading?: number;
  alignment?: number;
  upperCase?: boolean;

  // Dropdowns, checkboxes, radio groups
  options?: any[];

  // Signatures and Initials, result will be "signed"
  base64?: string;
  hash?: string;
  ip_address?: string;
  signature_id?: string;
  signed_at?: string;

  [key: string]: any;
}

export interface IDocumentField {
  envelope_id: string;
  label: string | null;
  name: string;
  page: number;
  recipient_role: string;
  type: string;
  required: boolean;
  settings?: IDocumentFieldSettings;
  validator: string | null;

  // Not sent by the server. Used in the UI to identify prepared fields.
  prepared?: boolean;
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

  certificate?: IDocumentAsset | null;
  document?: IDocumentAsset | null;
  fields?: IDocumentField[];
  profile?: IProfile;
}

export type TDocumentUpdateResult = Omit<IDocument, 'histories' | 'recipients' | 'certificate' | 'document' | 'fields' | 'profile'>;

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
  envelope_status: TDocumentStatus[];
  recipient_status: TDocumentStatus[];
}

export type THistoryEvent = 'recipient:invited' | 'recipient:opened' | 'recipient:agreed' | 'recipient:signed' | 'recipient:submitted';

export type TEventDetail = 'in_app' | 'mail' | 'signer' | '';
