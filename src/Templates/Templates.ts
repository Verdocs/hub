/**
 * A Template defines how a Verdocs signing flow will be performed, including attachments, signing fields, and
 * recipients.
 *
 * @module
 */

import {ITemplate, ITemplateOwnerInfo, ITemplatesSearchResult, ITemplatesSummary, TTemplateSender} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {IEnvelope} from '../Envelopes/Types';

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

/**
 * Get one template by its ID.
 *
 * ```typescript
 * import {Templates} from '@verdocs/js-sdk/Templates';
 *
 * const template = await Templates.getTemplate((VerdocsEndpoint.getDefault(), '83da3d70-7857-4392-b876-c4592a304bc9');
 * ```
 */
export const getTemplate = (endpoint: VerdocsEndpoint, templateId: string, ssr?: boolean) =>
  endpoint.api //
    .get<ITemplate>(`/templates/${templateId}` + (ssr ? '?ssr=true' : ''))
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

export interface ITemplateCreateParams {
  name: string;
  is_personal?: boolean;
  is_public?: boolean;
  sender?: TTemplateSender;
  description?: string;
}

/**
 * Create a template.
 *
 * ```typescript
 * import {Templates} from '@verdocs/js-sdk/Templates';
 *
 * const newTemplate = await Templates.createTemplate((VerdocsEndpoint.getDefault(), {...});
 * ```
 */
export const createTemplate = (endpoint: VerdocsEndpoint, params: ITemplateCreateParams) =>
  endpoint.api //
    .post<ITemplate>('/templates/', params)
    .then((r) => r.data);

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
  sort_by?: 'created_at' | 'updated_at' | 'name' | 'last_used_at' | 'counter' | 'star_counter';
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
