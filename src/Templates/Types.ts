export type TTemplateSenderType = 'creator' | 'organization_member' | 'organization_member_as_creator' | 'everyone' | 'everyone_as_creator';

export type TTemplatePermission =
  | 'template:creator:create:public'
  | 'template:creator:create:org'
  | 'template:creator:create:personal'
  | 'template:creator:delete'
  | 'template:creator:visibility'
  | 'template:member:read'
  | 'template:member:write'
  | 'template:member:delete'
  | 'template:member:visibility';

export type TTemplateAction =
  | 'create_personal'
  | 'create_org'
  | 'create_public'
  | 'read'
  | 'write'
  | 'delete'
  | 'change_visibility_personal'
  | 'change_visibility_org'
  | 'change_visibility_public';

/**
 * Some template search and list endpoints return only a partial set of fields for each entry via this structure.
 */
export interface ITemplateSummary {
  id: string;
  name: string;
  description: string | null;
  sender: TTemplateSenderType;
  counter: number;
  star_counter: number;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
  /**
   * If true, the template is considered "sendable" (it has at least one signer, and every signer has at least one field.)
   */
  is_sendable: boolean;
  is_personal: boolean;
  is_public: boolean;
  profile_id: string;
  organization_id: string;
  reminder_id: string;
  tags: string[];

  allowed_operations: TTemplateAction[];
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
  sort_by?: TSortTemplateBy;
  ascending?: boolean;
  row?: number;
  page?: number;
}

export interface ITimePeriod {
  start_time: string; // Date
  end_time: string; // Date
}

export interface ITemplateSummaries {
  page: number;
  count: number;
  total: number;
  records: ITemplateSummary[];
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

export interface ITemplateOwnerInfo {
  email: string;
  name: string;
  profile_id: string;
}

export type TSortTemplateBy = 'created_at' | 'updated_at' | 'name' | 'last_used_at' | 'counter' | 'star_counter';
