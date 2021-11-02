import {Endpoint} from '../HTTP/Transport';
import {IDocument} from './Types';

/**
 * Get all the Documents associated to a particular Template.
 *
 * ```typescript
 * import {Documents} from '@verdocs/js-sdk/Templates';
 *
 * await Documents.getDocuments(templateID);
 * ```
 */
export const getDocuments = (templateId: string) =>
  Endpoint.get(`/templates/${templateId}/documents/`).then((r) => r.data);

/**
 * Create a Document for a particular Template.
 *
 * ```typescript
 * import {Documents} from '@verdocs/js-sdk/Templates';
 *
 * await Documents.createDocument(templateID, params);
 * ```
 */
export const createDocument = (templateId: string, params: any) =>
  Endpoint.post<IDocument>(`/templates/${templateId}/documents/`, params).then((r) => r.data);

/**
 * Get a specific Document.
 *
 * ```typescript
 * import {Documents} from '@verdocs/js-sdk/Templates';
 *
 * await Documents.getDocument(templateID, documentID);
 * ```
 */
export const getDocument = (templateId: string, documentId: string) =>
  Endpoint.get<IDocument>(`/templates/${templateId}/documents/${documentId}`).then((r) => r.data);

/**
 * Delete a specific Document.
 *
 * ```typescript
 * import {Documents} from '@verdocs/js-sdk/Templates';
 *
 * await Documents.deleteDocument(templateID, documentID);
 * ```
 */
export const deleteDocument = (templateId: string, documentId: string) =>
  Endpoint.delete(`/templates/${templateId}/documents/${documentId}`).then((r) => r.data);
