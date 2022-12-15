/**
 * A TemplateDocument represents a PDF or other attachment in a Template.
 *
 * @module
 */

import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {ITemplateDocument} from './Types';

/**
 * Get all the Template Documents associated to a particular Template.
 *
 * ```typescript
 * import {TemplateDocument} from '@verdocs/js-sdk/Templates';
 *
 * await TemplateDocument.getDocuments((VerdocsEndpoint.getDefault(), templateID);
 * ```
 */
export const getTemplateDocuments = (endpoint: VerdocsEndpoint, templateId: string) =>
  endpoint.api //
    .get<ITemplateDocument[]>(`/templates/${templateId}/documents/`)
    .then((r) => r.data);

/**
 * Create a Document for a particular Template.
 *
 * ```typescript
 * import {TemplateDocument} from '@verdocs/js-sdk/Templates';
 *
 * await TemplateDocument.createDocument((VerdocsEndpoint.getDefault(), templateID, params);
 * ```
 */
export const createTemplateDocument = (
  endpoint: VerdocsEndpoint,
  templateId: string,
  file: File,
  onUploadProgress?: (percent: number, loadedBytes: number, totalBytes: number) => void,
) => {
  const formData = new FormData();
  formData.append('document', file, file.name);

  return endpoint.api //
    .post<ITemplateDocument>(`/templates/${templateId}/documents`, formData, {
      timeout: 10000,
      onUploadProgress: (event) => onUploadProgress?.(Math.floor((event.loaded * 100) / event.total), event.loaded, event.total),
    })
    .then((r) => r.data);
};

/**
 * Get a specific Document.
 *
 * ```typescript
 * import {TemplateDocument} from '@verdocs/js-sdk/Templates';
 *
 * await TemplateDocument.getDocument((VerdocsEndpoint.getDefault(), templateID, documentID);
 * ```
 */
export const getTemplateDocument = (endpoint: VerdocsEndpoint, templateId: string, documentId: string) =>
  endpoint.api //
    .get<ITemplateDocument>(`/templates/${templateId}/documents/${documentId}`)
    .then((r) => r.data);

/**
 * Delete a specific Document.
 *
 * ```typescript
 * import {TemplateDocument} from '@verdocs/js-sdk/Templates';
 *
 * await TemplateDocument.deleteDocument((VerdocsEndpoint.getDefault(), templateID, documentID);
 * ```
 */
export const deleteTemplateDocument = (endpoint: VerdocsEndpoint, templateId: string, documentId: string) =>
  endpoint.api //
    .delete(`/templates/${templateId}/documents/${documentId}`)
    .then((r) => r.data);

/**
 * Get (binary download) a file attached to a Template. It is important to use this method
 * rather than a direct A HREF or similar link to set the authorization headers for the
 * request.
 */
export const getTemplateDocumentFile = async (endpoint: VerdocsEndpoint, templateId: string, documentId: string): Promise<string> =>
  endpoint.api //
    .get<string>(`/templates/${templateId}/documents/${documentId}?file=true`, {
      responseType: 'arraybuffer',
    })
    .then((r) => Buffer.from(r.data, 'binary').toString('base64'));

/**
 * Get (binary download) a file attached to a Template. It is important to use this method
 * rather than a direct A HREF or similar link to set the authorization headers for the
 * request.
 */
export const getTemplateDocumentThumbnail = async (endpoint: VerdocsEndpoint, templateId: string, documentId: string): Promise<string> =>
  endpoint.api //
    .get<string>(`/templates/${templateId}/documents/${documentId}?thumbnail=true`, {
      responseType: 'arraybuffer',
    })
    .then((r) => Buffer.from(r.data, 'binary').toString('base64'));
