import {IPage} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';

export interface ICreatePageParams {
  document_id: string;
  page_number: number;
  sequence: number;
}

/**
 * Add a page to a template.
 */
export const createPage = (endpoint: VerdocsEndpoint, templateId: string, params: ICreatePageParams) =>
  endpoint.api //
    .post<IPage>(`/templates/${templateId}/pages`, params)
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
export const getPage = (endpoint: VerdocsEndpoint, templateId: string, sequence: number, thumbnail: boolean = false) =>
  endpoint.api //
    .get(`/templates/${templateId}/pages/${sequence}${thumbnail ? '?thumbnail=true' : ''}`, {
      timeout: 20000,
      'axios-retry': {
        retries: 5,
      },
    })
    .then((r) => r.data);

export interface IPageImageResponse {
  url: string;
}

/**
 * Get a page image (PNG format) from a template.
 */
export const getPageImage = (endpoint: VerdocsEndpoint, templateId: string, sequence: number) =>
  endpoint.api //
    .get<IPageImageResponse>(`/templates/${templateId}/pages/${sequence}/image`)
    .then((r) => r.data);

/**
 * Delete a page from a template
 */
export const deletePage = (endpoint: VerdocsEndpoint, templateId: string, sequence: string) =>
  endpoint.api //
    .delete(`/templates/${templateId}/pages/${sequence}`)
    .then((r) => r.data);
