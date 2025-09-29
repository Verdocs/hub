/**
 * A TemplateDocument represents a PDF or other attachment in a Template.
 *
 * @module
 */

import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {ITemplate, ITemplateDocument} from '../Models';

/**
 * Create a Document for a particular Template.
 *
 * ```typescript
 * import {TemplateDocument} from '@verdocs/js-sdk/Templates';
 *
 * await TemplateDocument.createDocument((VerdocsEndpoint.getDefault(), templateID, params);
 * ```
 *
 * @group Template Documents
 * @api POST /v2/templates/:template_id/documents Attach a document to a template
 * @apiBody string(format:binary) file Document file to attach. The file name will automatically be used as the document name.
 * @apiSuccess ITemplateDocument . Template document
 */
export const createTemplateDocument = (
  endpoint: VerdocsEndpoint,
  template_id: string,
  file: File,
  onUploadProgress?: (percent: number, loadedBytes: number, totalBytes: number) => void,
) => {
  const formData = new FormData();
  formData.append('document', file, file.name);
  formData.append('template_id', template_id);

  return endpoint.api //
    .post<ITemplateDocument>(`/v2/template-documents`, formData, {
      timeout: 120000,
      onUploadProgress: (event) => {
        const total = event.total || 1;
        const loaded = event.loaded || 0;
        onUploadProgress?.(Math.floor((loaded * 100) / (total || 1)), loaded, total || 1);
      },
    })
    .then((r) => r.data);
};

/**
 * Delete a specific Document.
 *
 * ```typescript
 * import {TemplateDocument} from '@verdocs/js-sdk/Templates';
 *
 * await TemplateDocument.deleteDocument((VerdocsEndpoint.getDefault(), templateID, documentID);
 * ```
 *
 * @group Template Documents
 * @api DELETE /v2/templates/:temlate_id/documents/:document_id Delete a template document
 * @apiSuccess string . Success
 */
export const deleteTemplateDocument = (endpoint: VerdocsEndpoint, templateId: string, documentId: string) =>
  endpoint.api //
    .delete<ITemplate>(`/v2/templates/${templateId}/documents/${documentId}`)
    .then((r) => r.data);

/**
 * Get all metadata for a template document. Note that when called by non-creators (e.g. Org Collaborators)
 * this will return only the **metadata** the caller is allowed to view.
 *
 * @group Template Documents
 * @api GET /v2/envelope-documents/:id Get envelope document
 * @apiParam string(format: 'uuid') document_id The ID of the document to retrieve.
 * @apiSuccess IEnvelopeDocument . The detailed metadata for the document requested
 */
export const getTemplateDocument = async (endpoint: VerdocsEndpoint, documentId: string) =>
  endpoint.api //
    .get<ITemplateDocument>(`/v2/template-documents/${documentId}`)
    .then((r) => r.data);

/**
 * Download a document directly.
 */
export const downloadTemplateDocument = async (endpoint: VerdocsEndpoint, documentId: string) =>
  endpoint.api //
    .get(`/v2/template-documents/${documentId}?type=file`, {responseType: 'blob'})
    .then((r) => r.data);

/**
 * Get an envelope document's metadata, or the document itself. If no "type" parameter is specified,
 * the document metadata is returned. If "type" is set to "file", the document binary content is
 * returned with Content-Type set to the MIME type of the file. If "type" is set to "download", a
 * string download link will be returned. If "type" is set to "preview" a string preview link will
 * be returned. This link expires quickly, so it should be accessed immediately and never shared.
 *
 * @group Template Documents
 * @api GET /v2/envelope-documents/:document_id Preview, Download, or Link to a Document
 * @apiParam string(format: 'uuid') document_id The ID of the document to retrieve.
 * @apiQuery string(enum:'file'|'download'|'preview') type? Download the file directly, generate a download link, or generate a preview link.
 * @apiSuccess string . The generated link.
 */
export const getTemplateDocumentDownloadLink = async (endpoint: VerdocsEndpoint, _envelopeId: string, documentId: string) =>
  endpoint.api //
    .get<string>(`/v2/template-documents/${documentId}?type=download`)
    .then((r) => r.data);

/**
 * Get a pre-signed preview link for an Envelope Document. This link expires quickly, so it should
 * be accessed immediately and never shared. Content-Disposition will be set to "inline".
 */
export const getTemplateDocumentPreviewLink = async (endpoint: VerdocsEndpoint, _envelopeId: string, documentId: string) =>
  endpoint.api //
    .get<string>(`/v2/envelope-documents/${documentId}?type=preview`)
    .then((r) => r.data);

/**
 * Get (binary download) a file attached to a Template. It is important to use this method
 * rather than a direct A HREF or similar link to set the authorization headers for the
 * request.
 */
export const getTemplateDocumentFile = async (endpoint: VerdocsEndpoint, templateId: string, documentId: string) =>
  endpoint.api //
    .get(`/v2/templates/${templateId}/documents/${documentId}?file=true`, {responseType: 'blob'})
    .then((r) => r.data);

/**
 * Get (binary download) a file attached to a Template. It is important to use this method
 * rather than a direct A HREF or similar link to set the authorization headers for the
 * request.
 */
export const getTemplateDocumentThumbnail = async (endpoint: VerdocsEndpoint, templateId: string, documentId: string) =>
  endpoint.api //
    .get(`/v2/templates/${templateId}/documents/${documentId}?thumbnail=true`, {responseType: 'blob'})
    .then((r) => r.data);

/**
 * Get a display URI for a given page in a file attached to a template document. These pages are rendered server-side
 * into PNG resources suitable for display in IMG tags although they may be used elsewhere. Note that these are intended
 * for DISPLAY ONLY, are not legally binding documents, and do not contain any encoded metadata from participants. The
 * original asset may be obtained by calling `getTemplateDocumentFile()` or similar.
 */
export const getTemplateDocumentPageDisplayUri = async (
  endpoint: VerdocsEndpoint,
  documentId: string,
  page: number,
  variant: 'original' | 'tagged' = 'original',
) => endpoint.api.get<string>(`/v2/template-documents/page-image/${documentId}/${variant}/${page}`, {timeout: 20000}).then((r) => r.data);
