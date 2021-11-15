export interface ITemplate {
  template_document?: IDocument;
  pages?: IPage[];
  roles?: IRole[];
  counter?: number;
  star_counter?: number;
  name: string;
  id?: string;
  profile_id?: string;
  created_at?: Date;
  updated_at?: Date;
  last_used_at?: Date;
  token?: string;
  reminder_id?: string;
  reminder?: IReminder;
  organization_id?: string;
  is_personal?: boolean;
  is_public?: boolean;
  sender?: TTemplateSender;
  description?: string;
}

export interface ITemplateSummaryEntry {
  id: string;
  name: string;
  sender: TTemplateSender;
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

export type TTemplateSender =
  | 'creator'
  | 'organization_member'
  | 'organization_member_as_creator'
  | 'everyone'
  | 'everyone_as_creator';

export enum TemplatePermissions {
  TEMPLATE_CREATOR_CREATE_PUBLIC = 'template:creator:create:public',
  TEMPLATE_CREATOR_CREATE_ORG = 'template:creator:create:org',
  TEMPLATE_CREATOR_CREATE_PERSONAL = 'template:creator:create:personal',
  TEMPLATE_CREATOR_DELETE = 'template:creator:delete',
  TEMPLATE_CREATOR_VISIBILITY = 'template:creator:visibility',
  TEMPLATE_MEMBER_READ = 'template:member:read',
  TEMPLATE_MEMBER_WRITE = 'template:member:write',
  TEMPLATE_MEMBER_DELETE = 'template:member:delete',
  TEMPLATE_MEMBER_VISIBILITY = 'template:member:visibility',
}

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
  sort_by?: SortOptions;
  ascending?: boolean;
  row?: number;
  page?: number;
}

export interface ITimePeriod {
  start_time: string; // Date
  end_time: string; // Date
}

export enum SortOptions {
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
  NAME = 'name',
  LAST_USED_AT = 'last_used_at',
  COUNTER = 'counter',
  STAR_COUNTER = 'star_counter',
}

export interface ITemplatesSummary {
  page: number;
  total: number;
  result: ITemplateSummaryEntry[];
}

export interface ITemplatesSearchResult {
  page: number;
  total: number;
  result: ITemplate[];
}

export interface ITag {
  tag_name: string;
  template_id: string;
}

export interface ITags {
  name: string;
  featured?: boolean;
  created_at?: Date;
}

export interface IStar {
  template_id: string;
  profile_id: string;
}

export interface IRole {
  template_id: string;
  name: string;
  full_name?: string;
  email?: string;
  type: string;
  sequence: number;
  fields?: IField[];
  delegator?: boolean;
  message?: string;
  phone?: string;
}

export interface IDocument {
  url: string;
  name: string;
  page_numbers: number;
  id?: string;
  updated_at?: Date;
  created_at?: Date;
  template_id: string;
  mime: string;
  thumbnail_url: string;
}

export interface IField {
  name: string;
  role_name: string;
  template_id: string;
  type: string;
  required: boolean;
  setting?: ISetting;
  page_sequence: number;
  validator?: string;
  label?: string;
}

export interface ISetting {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  result?: string;
  type?: string;
  options?: any[];
  value?: string;
}

export interface IPage {
  template_id: string;
  document_id: string;
  template_document?: IDocument;
  sequence: number;
  page_number: number;
  thumbnail_url: string;
  fields?: IField[];
}

export interface IReminder {
  id?: string;
  created_at?: Date;
  is_on: boolean;
  setup_time: number;
  interval_time: number;
  last_time: number;
  next_time: number;
  envelope_id: string;
  template_id: string;
}
