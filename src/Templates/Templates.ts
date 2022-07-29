/**
 * A Template defines how a Verdocs signing flow will be performed, including attachments, signing fields, and
 * recipients.
 *
 * @module
 */

import {ITemplate, ITemplatesSearchResult, ITemplatesSummary} from './Types';
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
 * await Templates.getTemplates();
 * await Templates.getTemplates({ is_starred: true });
 * await Templates.getTemplates({ is_creator: true });
 * await Templates.getTemplates({ is_organization: true });
 * ```
 */
export const getTemplates = (endpoint: VerdocsEndpoint, params?: IGetTemplatesParams) =>
  endpoint.api //
    .get<any[]>('/templates/', {params})
    .then((r) => r.data);

/**
 * Get one template by its ID.
 *
 * ```typescript
 * import {Templates} from '@verdocs/js-sdk/Templates';
 *
 * const template = await Templates.getTemplate('83da3d70-7857-4392-b876-c4592a304bc9');
 * ```
 */
export const getTemplate = (endpoint: VerdocsEndpoint, templateId: string) =>
  endpoint.api //
    .get(`/templates/${templateId}`)
    .then((r) => r.data);

/**
 * Create a template.
 *
 * ```typescript
 * import {Templates} from '@verdocs/js-sdk/Templates';
 *
 * const newTemplate = await Templates.createTemplate({...});
 * ```
 */
export const createTemplate = (endpoint: VerdocsEndpoint, params: any) =>
  endpoint.api //
    .post<ITemplate>('/templates/', params)
    .then((r) => r.data);

/**
 * Update a template.
 *
 * ```typescript
 * import {Templates} from '@verdocs/js-sdk/Templates';
 *
 * const updatedTemplate = await Templates.updateTemplate('83da3d70-7857-4392-b876-c4592a304bc9', { name: 'New Name' });
 * ```
 */
export const updateTemplate = (endpoint: VerdocsEndpoint, templateId: string, params: any) =>
  endpoint.api //
    .put<ITemplate>(`/templates/${templateId}`, params)
    .then((r) => r.data);

/**
 * Search for templates matching various criteria.
 *
 * ```typescript
 * import {Templates} from '@verdocs/js-sdk/Templates';
 *
 * const {result, page, total} = await Templates.search({ ... });
 * ```
 */
export const searchTemplates = async (endpoint: VerdocsEndpoint, params: any): Promise<ITemplatesSearchResult> =>
  endpoint.api //
    .post('/templates/search', params)
    .then((r) => r.data);

/**
 * Get a summary of template data, typically used to populate admin panel dashboard pages.
 *
 * ```typescript
 * import {Templates} from '@verdocs/js-sdk/Templates';
 *
 * const summary = await Templates.getSummary(0);
 * ```
 */
export const getSummary = async (endpoint: VerdocsEndpoint, page: number): Promise<ITemplatesSummary> =>
  endpoint.api //
    .post('/templates/summary', {page})
    .then((r) => r.data);
