import {getEndpoint} from '../HTTP/Transport';
import {IPage} from './Types';

/**
 * Add a page to a template
 */
export const createPage = (templateId: string, params: IPage) =>
  getEndpoint()
    .api.post<IPage>(`/templates/${templateId}/pages/`, params)
    .then((r) => r.data);

/**
 * Update a template page.
 */
export const editPage = (templateId: string, sequence: string) =>
  getEndpoint()
    .api.put(`/templates/${templateId}/pages/${sequence}`)
    .then((r) => r.data);

/**
 * Get a page from a template.
 */
export const getPage = (templateId: string, sequence: string) =>
  getEndpoint()
    .api.get(`/templates/${templateId}/pages/${sequence}`)
    .then((r) => r.data);

/**
 * Delete a page from a template
 */
export const deletePage = (templateId: string, sequence: string) =>
  getEndpoint()
    .api.delete(`/templates/${templateId}/pages/${sequence}`)
    .then((r) => r.data);
