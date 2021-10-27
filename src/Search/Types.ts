import {IDocumentStatus, IRecipientStatus} from '../Documents/Documents';

export interface IDocumentFile {
  id: string;
  url: string;
  name: string;
  created_at: string;
  updated_at: string;
  page_numbers: number;
  mime: string;
}

export interface IDocumentResult {
  id: string;
  name: string;
  status: IDocumentStatus;
  profile_id: string;
  template_id: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  canceled_at: string | null;
  no_contact: boolean;
  instrument: IDocumentFile;
  certificate: IDocumentFile | null;
}

export interface ITemplateResult {
  id: string;
  name: string;
  status: IDocumentStatus;
  profile_id: string;
  template_id: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  canceled_at: string | null;
  no_contact: boolean;
  instrument: IDocumentFile;
  certificate: IDocumentFile | null;
}

export interface ISearchParams {
  page?: number;
  limit?: number;
  q?: string;
  tags?: string[];
  type?: 'template' | 'document' | 'organization';
  shared?: 'private' | 'shared' | 'public';
  mine?: boolean;
  status?: IDocumentStatus | IRecipientStatus;
}

export interface IRecentSearch {
  id: string;
  created_at: string;
  updated_at: string;
  profile_id: string;
  organization_id: string;
  params: ISearchParams;
}

export interface ISavedSearch {
  id: string;
  created_at: string;
  updated_at: string;
  profile_id: string;
  organization_id: string;
  name: string;
  params: ISearchParams;
}

export interface ISearchHistory {
  recent: IRecentSearch[];
  saved: ISavedSearch[];
}

export interface ISearchResult {
  matches: number;
  templates: any[];
  documents: IDocumentResult[];
}
