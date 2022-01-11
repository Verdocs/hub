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
  profile_id: 'guest|515c9dc1-4c5c-4255-9f75-44b6870fc0eb';
  document_id: 'f484a296-4f4c-4783-9adf-a3302915a503';
  role: 'Recipient 2';
  email: 'crobinson@medialantern.com';
  access_key: {
    id: 'a59ceb98-3fab-44d2-af8a-13088d6c1a32';
    type: 'email';
  };
  iss: 'https://stage-realster.auth0.com';
  aud: 'QYVTceK2qtOQvH8Nl2APUJaBMRys1y95';
  exp: 1641881182;
  iat: 1641873982;
}
