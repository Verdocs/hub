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
 * await TemplateDocument.getDocuments(templateID);
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
 * await TemplateDocument.createDocument(templateID, params);
 * ```
 */
export const createTemplateDocument = (endpoint: VerdocsEndpoint, templateId: string, params: any) =>
  endpoint.api //
    .post<ITemplateDocument>(`/templates/${templateId}/documents/`, params)
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
 * await TemplateDocument.deleteDocument(templateID, documentID);
 * ```
 */
export const deleteTemplateDocument = (endpoint: VerdocsEndpoint, templateId: string, documentId: string) =>
  endpoint.api //
    .delete(`/templates/${templateId}/documents/${documentId}`)
    .then((r) => r.data);
