import {TDocumentStatus, TRecipientStatus} from '../Documents/Documents';
import {TTemplateSender} from '../Templates/Types';

export type TMimeType = 'application/pdf' | string;

/**
 * An individual hit in a document search result. Note that this schema does not precisely match IDocument because fields
 * are optimized for search performance.
 */
export interface IDocumentHit {
  id: string;
  template_id: string;
  name: string;
  profile_id: string;
  organization_id: string;
  organization_name: string;
  status: TDocumentStatus;
  recipient_emails: string[];
  recipient_names: string[];
  updated_at: string;
  canceled_at: string;
  file_mime: TMimeType;
  file_name: string;
  file_page_count: number;
  file_url: string;
  certificate_mime: TMimeType;
  certificate_name: string;
  certificate_page_count: number;
  certificate_url: string;
}

/**
 * An individual hit in a template search result. Note that this schema does not precisely match ITemplate because fields
 * are optimized for search performance.
 */
export interface ITemplateHit {
  id: string;
  name: string;
  description: string;
  profile_id: string;
  organization_id: string;
  organization_name: string;
  page_count: number;
  is_personal: boolean;
  is_public: boolean;
  sender: TTemplateSender;
  counter: number;
  star_counter: number;
  mime: TMimeType;
  file_name: string;
  file_url: string;
  thumbnail_url: string;
  last_used_at: string;
  updated_at: string;
  tags: [];
}

/**
 * An individual hit in an organization search result. Note that this schema does not precisely match IOrganization because fields
 * are optimized for search performance.
 */
export interface IOrganizationHit {
  id: string;
  name: string;
  slug: string;
}

export interface IFacetResultEntry {
  count: number;
  highlighted: string;
  value: string;
}

export interface IFacetResult {
  field_name: string;
  stats: any;
  counts: IFacetResultEntry[];
}

export interface IHit<T> {
  document: T;
  highlights: any[];
  text_match: number;
}

export interface ISearchRequestParams {
  collection_name: string;
  per_page: number;
  q: string;
}

export interface ISearchResultCollection<T> {
  facet_counts: IFacetResult[];
  page: number;
  found: number;
  out_of: number;
  hits: IHit<T>;
  request_params: ISearchRequestParams;
  search_time_ms: number;
}

export interface ISearchResult {
  documents: ISearchResultCollection<IDocumentHit>;
  myTemplates: ISearchResultCollection<ITemplateHit>;
  publicTemplates: ISearchResultCollection<ITemplateHit>;
  organizations: ISearchResultCollection<IOrganizationHit>;
}

export interface ISearchParams {
  page?: number;
  limit?: number;
  q?: string;
  tags?: string[];
  type?: 'template' | 'document' | 'organization';
  shared?: 'private' | 'shared' | 'public';
  mine?: boolean;
  status?: TDocumentStatus | TRecipientStatus;
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
