import {IOrganization} from '../Organizations/Types';

export interface ITemplate {
  template_document?: ITemplateDocument;
  pages?: IPage[];
  roles?: IRole[];
  counter?: number;
  star_counter?: number;
  name: string;
  id?: string;
  profile_id?: string;
  created_at?: string;
  updated_at?: string;
  last_used_at?: string;
  token?: string;
  reminder_id?: string;
  reminder?: IReminder;
  organization_id?: string;
  is_personal?: boolean;
  is_public?: boolean;
  sender?: TTemplateSender;
  description?: string;
  // TODO: Add to all API endpoint returns
  organization?: IOrganization;
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

export type TTemplateSender = 'creator' | 'organization_member' | 'organization_member_as_creator' | 'everyone' | 'everyone_as_creator';

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

export enum TemplateSenderTypes {
  CREATOR = 'creator', // same as legacy
  ORGANIZATION_MEMBER = 'organization_member',
  ORGANIZATION_MEMBER_AS_CREATOR = 'organization_member_as_creator',
  EVERYONE = 'everyone',
  EVERYONE_AS_CREATOR = 'everyone_as_creator', // Creator would be sender of envelope no matter who creates the envelope
}

export enum TemplateActions {
  CREATE_PERSONAL = 'create_personal',
  CREATE_ORG = 'create_org',
  CREATE_PUBLIC = 'create_public',
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  CHANGE_VISIBILITY_PERSONAL = 'change_visibility_personal',
  CHANGE_VISIBILITY_ORG = 'change_visibility_org',
  CHANGE_VISIBILITY_PUBLIC = 'change_visibility_public',
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

export interface IRole {
  template_id: string;
  name: string;
  full_name?: string;
  email?: string;
  type: string;
  sequence: number;
  fields?: ITemplateField[];
  delegator?: boolean;
  message?: string;
  phone?: string;
  rgba?: string;
}

export interface ITemplateDocument {
  url: string;
  name: string;
  page_numbers: number;
  id?: string;
  updated_at?: string;
  created_at?: string;
  template_id: string;
  mime: string;
  thumbnail_url: string;
}

export interface ITemplateField {
  name: string;
  role_name: string;
  template_id: string;
  type: string;
  required: boolean;
  setting: ITemplateFieldSetting;
  page_sequence: number;
  validator?: string;
  label?: string;
}

export interface ITemplateFieldSetting {
  x: number;
  y: number;
  result?: string;
  width?: number;
  height?: number;

  // Text field settings
  leading?: number;
  alignment?: number;
  upperCase?: boolean;

  // Dropdowns, checkboxes, radio groups
  options?: any[];

  [key: string]: any;
}

export interface IPage {
  template_id: string;
  document_id: string;
  template_document?: ITemplateDocument;
  sequence: number;
  page_number: number;
  thumbnail_url: string;
  fields?: ITemplateField[];
}

export interface IReminder {
  id?: string;
  created_at?: string;
  is_on: boolean;
  setup_time: number;
  interval_time: number;
  last_time: number;
  next_time: number;
  envelope_id: string;
  template_id: string;
}

export interface ITemplateOwnerInfo {
  email: string;
  name: string;
  profile_id: string;
}
