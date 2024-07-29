import {ITemplate} from '../Models';

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
