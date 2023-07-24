/**
 * A Template defines how a Verdocs signing flow will be performed, including attachments, signing fields, and
 * recipients.
 *
 * @module
 */

import {IRole, ITemplate, ITemplateField, ITemplateOwnerInfo, ITemplatesSearchResult, ITemplatesSummary, TTemplateSender} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';

export interface IGetTemplatesParams {
  is_starred?: boolean;
  is_creator?: boolean;
  is_organization?: boolean;
}

/**
 * Get all templates accessible by the caller, with optional filters.
 *
 * ```typescript
 * import {Templates} from '@verdocs/js-sdk/Templates';
 *
 * await Templates.getTemplates((VerdocsEndpoint.getDefault());
 * await Templates.getTemplates((VerdocsEndpoint.getDefault(), { is_starred: true });
 * await Templates.getTemplates((VerdocsEndpoint.getDefault(), { is_creator: true });
 * await Templates.getTemplates((VerdocsEndpoint.getDefault(), { is_organization: true });
 * ```
 */
export const getTemplates = (endpoint: VerdocsEndpoint, params?: IGetTemplatesParams) =>
  endpoint.api //
    .post<ITemplate[]>('/templates', {params})
    .then((r) => r.data);

export interface IListTemplatesParams {
  name?: string;
  sharing?: 'all' | 'personal' | 'shared' | 'public';
  starred?: 'all' | 'starred' | 'unstarred';
  sort?: 'name' | 'created_at' | 'updated_at' | 'last_used_at' | 'counter' | 'star_counter';
  page?: number;
  rows?: number;
}

/**
 * Lists all templates accessible by the caller, with optional filters.
 *
 * ```typescript
 * import {Templates} from '@verdocs/js-sdk/Templates';
 *
 * await Templates.listTemplates((VerdocsEndpoint.getDefault(), { sharing: 'personal', sort: 'last_used_at' });
 * ```
 */
export const listTemplates = (endpoint: VerdocsEndpoint, params?: IListTemplatesParams) =>
  endpoint.api //
    .post<{records: ITemplate[]; total: number}>('/templates/list', params, {baseURL: endpoint.getBaseURLv2()})
    .then((r) => r.data);

/**
 * Get one template by its ID.
 *
 * ```typescript
 * import {Templates} from '@verdocs/js-sdk/Templates';
 *
 * const template = await Templates.getTemplate((VerdocsEndpoint.getDefault(), '83da3d70-7857-4392-b876-c4592a304bc9');
 * ```
 */
export const getTemplate = (endpoint: VerdocsEndpoint, templateId: string) =>
  endpoint.api //
    .get<ITemplate>(`/templates/${templateId}`)
    .then((r) => r.data);

/**
 * Get owner information for a template.
 *
 * ```typescript
 * import {Templates} from '@verdocs/js-sdk/Templates';
 *
 * const template = await Templates.getTemplateOwnerInfo((VerdocsEndpoint.getDefault(), '83da3d70-7857-4392-b876-c4592a304bc9');
 * ```
 */
export const getTemplateOwnerInfo = (endpoint: VerdocsEndpoint, templateId: string) =>
  endpoint.api //
    .get<ITemplateOwnerInfo>(`/templates/${templateId}`)
    .then((r) => r.data);

/**
 * Represents a document to be attached to a template via an externally-accessible URI. A copy of the document will be
 * downloaded from the specified URI. Note that the URI will be accessed without headers or other authorization methods
 * set, so the URI itself must encode any security tokens or keys required to access the file.
 */
export interface IDocumentFromUri {
  /** The URI to retrieve the file from. */
  uri: string;
  /** A name for the attachment. */
  name: string;
}

/**
 * Represents a document to be attached to a template via a Base64-encoded string attachment. This is the best option
 * for maximum security but there is a 10MB size limit for the entire creation request. Requests attaching larger files
 * should use `IDocumentFromUri` or add attachments via `createTemplateDocument` after creating the template.
 */
export interface IDocumentFromData {
  /** Base64-encoded file data. */
  data: string;
  /** A name for the attachment. */
  name: string;
}

export interface ITemplateCreateParams {
  /** Name for the template to create. */
  name: string;
  /**
   * Optional (defaults to true). Personal templates are only visible to the owner. Non-personal templates are shared
   * within the user's organization.
   */
  is_personal?: boolean;
  /**
   * Optional (defaults to false). Public templates may be found (via search) and viewed by anyone.
   */
  is_public?: boolean;
  /** Optional (defaults to EVERYONE_AS_CREATOR). Who may create and send envelopes using this template. */
  sender?: TTemplateSender;
  /** Optional description for the template to help identify it. */
  description?: string;
  /**
   * Optional list of roles to create. Documents are required if roles or fields will also be specified. Files may
   * be attached via a number of methods (browser File object, remote URI reference, or Base64-encoded string) but
   * all entries must of of the same type. If browser File objects are provided, the request will use a FORM POST
   * call, otherwise it will use traditional XHR.
   */
  documents?: File[] | IDocumentFromUri[] | IDocumentFromData[];
  /**
   * Optional list of roles to create. Note that if roles are not included in the request, fields will be ignored.
   */
  roles?: IRole[];
  /**
   * Optional list of fields to create.
   */
  fields?: ITemplateField[];
}

const ALLOWED_CREATE_FIELDS: (keyof ITemplateCreateParams)[] = [
  'name',
  'is_personal',
  'is_public',
  'sender',
  'description',
  'roles',
  'fields',
];

/**
 * Create a template.
 *
 * ```typescript
 * import {Templates} from '@verdocs/js-sdk/Templates';
 *
 * const newTemplate = await Templates.createTemplate((VerdocsEndpoint.getDefault(), {...});
 * ```
 */
export const createTemplate = (
  endpoint: VerdocsEndpoint,
  params: ITemplateCreateParams,
  onUploadProgress?: (percent: number, loadedBytes: number, totalBytes: number) => void,
) => {
  const options = {
    timeout: 120000,
    onUploadProgress: (event: any) => {
      const total = event.total || 1;
      const loaded = event.loaded || 0;
      onUploadProgress?.(Math.floor((loaded * 100) / (total || 1)), loaded, total || 1);
    },
  };

  if (params.documents && params.documents[0] instanceof File) {
    if (params.documents.length > 10) {
      throw new Error('createTemplate() has a maximum of 10 documents that can be attached.');
    }

    const formData = new FormData();
    ALLOWED_CREATE_FIELDS.forEach((allowedKey) => {
      if (params[allowedKey as keyof ITemplateCreateParams] !== undefined) {
        formData.append(allowedKey, params[allowedKey] as any);
      }
    });

    params.documents.forEach((file) => {
      formData.append('documents', file as never as File, file.name);
    });

    return endpoint.api.post<ITemplate>('/templates', formData, options).then((r) => r.data);
  } else {
    return endpoint.api.post<ITemplate>('/templates', params, options).then((r) => r.data);
  }
};

/**
 * Update a template.
 *
 * ```typescript
 * import {Templates} from '@verdocs/js-sdk/Templates';
 *
 * const updatedTemplate = await Templates.updateTemplate((VerdocsEndpoint.getDefault(), '83da3d70-7857-4392-b876-c4592a304bc9', { name: 'New Name' });
 * ```
 */
export const updateTemplate = (endpoint: VerdocsEndpoint, templateId: string, params: Partial<ITemplateCreateParams>) =>
  endpoint.api //
    .put<ITemplate>(`/templates/${templateId}`, params)
    .then((r) => r.data);

/**
 * Delete a template.
 *
 * ```typescript
 * import {Templates} from '@verdocs/js-sdk/Templates';
 *
 * await Templates.deleteTemplate((VerdocsEndpoint.getDefault(), '83da3d70-7857-4392-b876-c4592a304bc9');
 * ```
 */
export const deleteTemplate = (endpoint: VerdocsEndpoint, templateId: string) =>
  endpoint.api //
    .delete(`/templates/${templateId}`)
    .then((r) => r.data);

/**
 * Search for templates matching various criteria.
 *
 * ```typescript
 * import {Templates} from '@verdocs/js-sdk/Templates';
 *
 * const {result, page, total} = await Templates.search((VerdocsEndpoint.getDefault(), { ... });
 * ```
 */
export const searchTemplates = async (endpoint: VerdocsEndpoint, params: any) =>
  endpoint.api //
    .post<ITemplatesSearchResult>('/templates/search', params)
    .then((r) => r.data);

export interface ISearchTimeRange {
  start_time: string;
  end_time: string;
}

export type IGetTemplateSummarySortBy = 'created_at' | 'updated_at' | 'name' | 'last_used_at' | 'counter' | 'star_counter';

export interface IGetTemplateSummaryParams {
  id?: string;
  name?: string;
  sender?: string;
  profile_id?: string;
  organization_id?: string;
  description?: string;
  created_at?: ISearchTimeRange;
  updated_at?: ISearchTimeRange;
  last_used_at?: ISearchTimeRange;
  is_personal?: boolean;
  is_public?: boolean;
  is_starred?: boolean;
  sort_by?: IGetTemplateSummarySortBy;
  ascending?: boolean;
  row?: number;
  page?: number;
}

/**
 * Get a summary of template data, typically used to populate admin panel dashboard pages.
 *
 * ```typescript
 * import {Templates} from '@verdocs/js-sdk/Templates';
 *
 * const summary = await Templates.getSummary((VerdocsEndpoint.getDefault(), 0);
 * ```
 */
export const getSummary = async (endpoint: VerdocsEndpoint, params: IGetTemplateSummaryParams = {}) =>
  endpoint.api //
    .post<ITemplatesSummary>('/templates/summary', params)
    .then((r) => r.data);

const cachedTemplates: Record<string, {loaded: number; template: ITemplate}> = {};

/**
 * Wrapper for `getTemplate()` that limits queries to one every 2 seconds per template ID.
 * This is intended for use in component hierarchies that all rely on the same template
 * to avoid unnecessary repeat server calls.
 */
export const throttledGetTemplate = (endpoint: VerdocsEndpoint, templateId: string) => {
  if (cachedTemplates[templateId] && cachedTemplates[templateId].loaded + 2000 < new Date().getTime()) {
    return cachedTemplates[templateId].template;
  }

  return getTemplate(endpoint, templateId).then((template) => {
    cachedTemplates[templateId] = {loaded: new Date().getTime(), template};
    return template;
  });
};
