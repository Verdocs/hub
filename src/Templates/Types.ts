import {TSortTemplateBy} from '../BaseTypes';
import {ITimePeriod} from '../Utils';
import {ITemplate} from '../Models';

export interface ITemplateSearchParams {
  id?: string;
  name?: string;
  sender?: string;
  description?: string;
  profile_id?: string;
  organization_id?: string;
  updated_at?: ITimePeriod;
  created_at?: ITimePeriod;
  last_used_at?: ITimePeriod;
  is_personal?: boolean;
  is_public?: boolean;
  tags?: string[];
  document_name?: string;
  sort_by?: TSortTemplateBy;
  ascending?: boolean;
  row?: number;
  page?: number;
}

export interface ITemplateTag {
  tag_name: string;
  template_id: string;
}

export interface ITag {
  name: string;
  featured?: boolean;
  organization_id?: string;
  created_at?: string;
}

export interface IStar {
  template_id: string;
  profile_id: string;
}

export interface ITemplateSearchResult {
  page: number;
  row: number;
  total: number;
  result: ITemplate[];
}
