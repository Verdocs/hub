import {IPage} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';

/**
 * Add a page to a template
 */
export const createPage = (endpoint: VerdocsEndpoint, templateId: string, params: IPage) =>
  endpoint.api //
    .post<IPage>(`/templates/${templateId}/pages/`, params)
    .then((r) => r.data);

/**
 * Update a template page.
 */
export const editPage = (endpoint: VerdocsEndpoint, templateId: string, sequence: string) =>
  endpoint.api //
    .put(`/templates/${templateId}/pages/${sequence}`)
    .then((r) => r.data);

/**
 * Get a page from a template.
 */
export const getPage = (endpoint: VerdocsEndpoint, templateId: string, sequence: string) =>
  endpoint.api //
    .get(`/templates/${templateId}/pages/${sequence}`)
    .then((r) => r.data);

/**
 * Delete a page from a template
 */
export const deletePage = (endpoint: VerdocsEndpoint, templateId: string, sequence: string) =>
  endpoint.api //
    .delete(`/templates/${templateId}/pages/${sequence}`)
    .then((r) => r.data);
