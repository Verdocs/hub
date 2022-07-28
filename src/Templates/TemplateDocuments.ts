/**
 * A TemplateDocument represents a PDF or other attachment in a Template.
 *
 * @module
 */

import {getEndpoint} from '../HTTP/Transport';
import {ITemplateDocument} from './Types';

/**
 * Get all the Template Documents associated to a particular Template.
 *
 * ```typescript
 * import {TemplateDocument} from '@verdocs/js-sdk/Templates';
 *
 * await TemplateDocument.getDocuments(templateID);
 * ```
 */
export const getTemplateDocuments = (templateId: string) =>
  getEndpoint()
    .api.get<ITemplateDocument[]>(`/templates/${templateId}/documents/`)
    .then((r) => r.data);

/**
 * Create a Document for a particular Template.
 *
 * ```typescript
 * import {TemplateDocument} from '@verdocs/js-sdk/Templates';
 *
 * await TemplateDocument.createDocument(templateID, params);
 * ```
 */
export const createTemplateDocument = (templateId: string, params: any) =>
  getEndpoint()
    .api.post<ITemplateDocument>(`/templates/${templateId}/documents/`, params)
    .then((r) => r.data);

/**
 * Get a specific Document.
 *
 * ```typescript
 * import {TemplateDocument} from '@verdocs/js-sdk/Templates';
 *
 * await TemplateDocument.getDocument(templateID, documentID);
 * ```
 */
export const getTemplateDocument = (templateId: string, documentId: string) =>
  getEndpoint()
    .api.get<ITemplateDocument>(`/templates/${templateId}/documents/${documentId}`)
    .then((r) => r.data);

/**
 * Delete a specific Document.
 *
 * ```typescript
 * import {TemplateDocument} from '@verdocs/js-sdk/Templates';
 *
 * await TemplateDocument.deleteDocument(templateID, documentID);
 * ```
 */
export const deleteTemplateDocument = (templateId: string, documentId: string) =>
  getEndpoint()
    .api.delete(`/templates/${templateId}/documents/${documentId}`)
    .then((r) => r.data);
