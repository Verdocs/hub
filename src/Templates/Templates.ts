import {getEndpoint} from '../HTTP/Transport';

import {ITemplate, ITemplatesSearchResult, ITemplatesSummary} from './Types';

export const getTemplates = () =>
  getEndpoint()
    .get<any[]>('/templates/')
    .then((r) => r.data);

export const getTemplate = (templateId: string) =>
  getEndpoint()
    .get(`/templates/${templateId}`)
    .then((r) => r.data);

export const createTemplate = (params: any) =>
  getEndpoint()
    .post<ITemplate>('/templates/', params)
    .then((r) => r.data);

export const editTemplate = (templateId: string, params: any) =>
  getEndpoint()
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
export const searchTemplate = async (params: any): Promise<ITemplatesSearchResult> =>
  getEndpoint()
    .post('/templates/search', params)
    .then((r) => r.data);

export const getSummary = async (page: number): Promise<ITemplatesSummary> =>
  getEndpoint()
    .post('/templates/summary', {page})
    .then((r) => r.data);
