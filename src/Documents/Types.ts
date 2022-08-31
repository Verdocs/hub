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
