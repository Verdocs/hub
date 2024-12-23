/**
 * A Template defines how a Verdocs signing flow will be performed, including attachments, signing fields, and
 * recipients.
 *
 * @module
 */

import type {TSortTemplateBy, TTemplateSender, TTemplateVisibility} from '../BaseTypes';
import type {IRole, ITemplate, ITemplateField} from '../Models';
import {VerdocsEndpoint} from '../VerdocsEndpoint';

export type ITemplateSortBy = 'created_at' | 'updated_at' | 'name' | 'last_used_at' | 'counter' | 'star_counter';

export type TTemplateVisibilityFilter = 'private_shared' | 'private' | 'shared' | 'public';

export interface IGetTemplatesParams {
  /** List only those templates whose names, descriptions, etc contain this search term. */
  q?: string;
  /** List only those templates with at least one "star". */
  is_starred?: boolean;
  /** List only those templates created by the caller. */
  is_creator?: boolean;
  /** Visibility status of templates to include. private_shared is the default (private + shared) */
  visibility?: TTemplateVisibilityFilter;
  /** Sort order */
  sort_by?: TSortTemplateBy;
  /** Set to true or false to control the sort order. Omit this field to sort dates descending, names ascending. */
  ascending?: boolean;
  /** Number of rows to retrieve. Defaults to 10. */
  rows?: number;
  /** Page to retrieve (0-based). Defaults to 0. */
  page?: number;
}

/**
 * Get all templates accessible by the caller, with optional filters.
 *
 * ```typescript
 * import {getTemplates} from '@verdocs/js-sdk/Templates';
 *
 * await getTemplates((VerdocsEndpoint.getDefault());
 * await getTemplates((VerdocsEndpoint.getDefault(), { is_starred: true });
 * await getTemplates((VerdocsEndpoint.getDefault(), { is_creator: true });
 * await getTemplates((VerdocsEndpoint.getDefault(), { is_organization: true });
 * ```
 *
 * @group Templates
 * @api GET /v2/templates Get Templates
 * @apiQuery string q? Find templates whose names/descriptions contain the specified query string
 * @apiQuery boolean is_starred? If true, returns only templates with at least one "star".
 * @apiQuery boolean is_creator? If true, returns only templates that the caller created.
 * @apiQuery string(enum: 'private_shared' | 'private' | 'shared' | 'public') visibility? Return only templates with the specified visibility.
 * @apiQuery string(enum: 'created_at' | 'updated_at' | 'name' | 'last_used_at' | 'counter' | 'star_counter') sort_by? Return results sorted by this criteria
 * @apiQuery boolean ascending? Set true/false to override the sort direction. Note that the default depends on `sort_by`. Date-based sorts default to descending, while name defaults to ascending.
 * @apiQuery integer(default: 20) rows? Limit the number of rows returned
 * @apiQuery integer(default: 0) page? Specify which page of results to return
 * @apiSuccess integer(format: int32) count The total number of records matching the query, helpful for pagination
 * @apiSuccess integer(format: int32) rows The number of rows returned in this response page
 * @apiSuccess integer(format: int32) page The page number of this response
 * @apiSuccess array(items: ITemplate) templates List of templates found
 */
export const getTemplates = (endpoint: VerdocsEndpoint, params?: IGetTemplatesParams) =>
  endpoint.api //
    .get<{count: number; rows: number; page: number; templates: ITemplate[]}>('/v2/templates', {params})
    .then((r) => r.data);

/**
 * Get one template by its ID.
 *
 * ```typescript
 * import {getTemplate} from '@verdocs/js-sdk/Templates';
 *
 * const template = await getTemplate((VerdocsEndpoint.getDefault(), '83da3d70-7857-4392-b876-c4592a304bc9');
 * ```
 *
 * @group Templates
 * @api GET /v2/templates/:template_id Get a template. Note that the caller must have at least View access to the template.
 * @apiSuccess ITemplate . The requested template
 */
export const getTemplate = (endpoint: VerdocsEndpoint, templateId: string) => {
  window?.console?.log('[JS_SDK] Loading template', templateId);

  return endpoint.api //
    .get<ITemplate>(`/v2/templates/${templateId}`)
    .then((r) => {
      const template = r.data;

      window?.console?.log('[JS_SDK] Post-processing template', template);

      // Post-process the template to upgrade to new data fields
      if (!template.documents && template.template_documents) {
        template.documents = template.template_documents;
      }

      template.documents?.forEach((document) => {
        if (!document.order) {
          document.order = 0;
        }

        if (document.page_numbers) {
          document.pages = document.page_numbers;
        }
      });

      // Temporary upgrade from legacy app
      template.fields?.forEach((field) => {
        if ((field as any).setting) {
          field.settings = (field as any).setting;
        }
      });

      return template;
    });
};

/**
 * Represents a document to be attached to a template via an externally-accessible URI. A copy of the document will be
 * downloaded from the specified URI. Note that the URI will be accessed without headers or other authorization methods
 * set, so the URI itself must encode any security tokens or keys required to access the file.
 */
export interface IDocumentFromUri {
  /** The URI to retrieve the file from. */
  uri: string;
  /** A name for the attachment. */
  name: string;
}

/**
 * Represents a document to be attached to a template via a Base64-encoded string attachment. This is the best option
 * for maximum security but there is a 10MB size limit for the entire creation request. Requests attaching larger files
 * should use `IDocumentFromUri` or add attachments via `createTemplateDocument` after creating the template.
 */
export interface IDocumentFromData {
  /** Base64-encoded file data. */
  data: string;
  /** A name for the attachment. */
  name: string;
}

export interface ITemplateCreateParams {
  /** Name for the template to create. */
  name: string;
  /**
   * If set, the visibility level for the template.
   */
  visibility?: TTemplateVisibility;
  /**
   * Optional (defaults to true). Personal templates are only visible to the owner. Non-personal templates are shared
   * within the user's organization.
   * @deprecated. See visibility.
   */
  is_personal?: boolean;
  /**
   * Optional (defaults to false). Public templates may be found (via search) and viewed by anyone.
   * @deprecated. See visibility.
   */
  is_public?: boolean;
  /** Optional (defaults to EVERYONE_AS_CREATOR). Who may create and send envelopes using this template. */
  sender?: TTemplateSender;
  /** Delay (in seconds) before the first reminder is sent (min: 4hrs). Set to 0 or null to disable. */
  initial_reminder?: number;
  /** Delay (in seconds) before subsequent remidners are sent (min: 12hrs). Set to 0 or null to disable. */
  followup_reminders?: number;
  /** Optional description for the template to help identify it. */
  description?: string;
  /**
   * Optional list of roles to create. Documents are required if roles or fields will also be specified. Files may
   * be attached via a number of methods (browser File object, remote URI reference, or Base64-encoded string) but
   * all entries must of of the same type. If browser File objects are provided, the request will use a FORM POST
   * call, otherwise it will use traditional XHR.
   */
  documents?: File[] | IDocumentFromUri[] | IDocumentFromData[];
  /**
   * Optional list of roles to create. Note that if roles are not included in the request, fields will be ignored.
   */
  roles?: IRole[];
  /**
   * Optional list of fields to create.
   */
  fields?: ITemplateField[];
}

const ALLOWED_CREATE_FIELDS: (keyof ITemplateCreateParams)[] = [
  'name',
  'is_personal',
  'is_public',
  'sender',
  'description',
  'roles',
  'fields',
];

/**
 * Create a template.
 *
 * ```typescript
 * import {createTemplate} from '@verdocs/js-sdk/Templates';
 *
 * const newTemplate = await createTemplate((VerdocsEndpoint.getDefault(), {...});
 * ```
 *
 * @group Templates
 * @api POST /v2/templates Create a template
 * @apiBody string name Template name
 * @apiBody string description? Optional description
 * @apiBody TTemplateVisibility visibility? Visibility setting
 * @apiBody boolean is_personal? Deprecated. If true, the template is personal and can only be seen by the caller. (Use "visibility" for new calls.)
 * @apiBody boolean is_public? Deprecated. If true, the template is public and can be seen by anybody. (Use "visibility" for new calls.)
 * @apiBody TTemplateSender sender? Who may send envelopes using this template
 * @apiBody number initial_reminder? Delay (in seconds) before the first reminder is sent (min: 4hrs). Set to 0 or null to disable.
 * @apiBody number followup_reminders? Delay (in seconds) before the subsequent reminders are sent (min: 12hrs). Set to 0 or null to disable.
 * @apiBody array(items:object) documents? Optional list of documents to attach to the template
 * @apiBody array(items:IRole) roles? Optional list of roles to create. Note that if roles are not included in the request, fields will be ignored.
 * @apiBody array(fields:ITemplateField) fields? Optional list of fields to create. Note that if fields that do not match a role will be ignored.
 * @apiSuccess ITemplate . The newly-created template
 */
export const createTemplate = (
  endpoint: VerdocsEndpoint,
  params: ITemplateCreateParams,
  onUploadProgress?: (percent: number, loadedBytes: number, totalBytes: number) => void,
) => {
  const options = {
    timeout: 120000,
    onUploadProgress: (event: any) => {
      const total = event.total || 1;
      const loaded = event.loaded || 0;
      onUploadProgress?.(Math.floor((loaded * 100) / (total || 1)), loaded, total || 1);
    },
  };

  if (params.documents && params.documents[0] instanceof File) {
    const formData = new FormData();
    ALLOWED_CREATE_FIELDS.forEach((allowedKey) => {
      if (params[allowedKey as keyof ITemplateCreateParams] !== undefined) {
        formData.append(allowedKey, params[allowedKey] as any);
      }
    });

    params.documents.forEach((file) => {
      formData.append('documents', file as never as File, file.name);
    });

    return endpoint.api.post<ITemplate>('/v2/templates', formData, options).then((r) => r.data);
  } else {
    return endpoint.api.post<ITemplate>('/v2/templates', params, options).then((r) => r.data);
  }
};

/**
 * Duplicate a template. Creates a complete clone, including all settings (e.g. reminders), fields,
 * roles, and documents.
 *
 * ```typescript
 * import {duplicateTemplate} from '@verdocs/js-sdk/Templates';
 *
 * const newTemplate = await duplicateTemplate((VerdocsEndpoint.getDefault(), originalTemplateId, 'My Template Copy');
 * ```
 *
 * @group Templates
 * @api PUT /v2/templates/:template_id Perform an operation on a template
 * @apiBody string(enum:'duplicate') action Action to perform
 * @apiBody string name? If duplicating the template, a name for the new copy
 * @apiSuccess ITemplate . The newly-copied template
 */
export const duplicateTemplate = (endpoint: VerdocsEndpoint, templateId: string, name: string) =>
  endpoint.api //
    .put<ITemplate>(`/v2/templates/${templateId}`, {action: 'duplicate', name})
    .then((r) => r.data);

export interface ITemplateCreateFromSharepointParams {
  /** Name for the template to create. */
  name: string;
  /** The site ID the source file is in. */
  siteId: string;
  /** The item ID of the source file. */
  itemId: string;
  /**
   * On-Behalf-Of access token generated for the request. This must have an audience of "https://graph.microsoft.com"
   * with Read access to the source file. This token is used ephemerally and discarded after the request, but it is
   * still recommended that you generate it with the minimal permissions possible.
   */
  oboToken: string;
}

/**
 * Create a template from a Sharepoint asset.
 *
 * ```typescript
 * import {createTemplateFromSharepoint} from '@verdocs/js-sdk/Templates';
 *
 * const newTemplate = await createTemplateFromSharepoint((VerdocsEndpoint.getDefault(), {...});
 * ```
 *
 * @group Templates
 * @api POST /v2/templates/from-sharepoint Create a template from an asset in Sharepoint
 * @apiBody string name Name for the new template
 * @apiBody string siteId Name for the new template
 * @apiBody string itemId Name for the new template
 * @apiBody string oboToken On-Behalf-Of token for calls to Sharepoint. Should be generated as a short-expiration token with at least Read privileges to the siteId/itemId. This token will be discarded after being used.
 * @apiSuccess ITemplate . The newly-created template
 */
export const createTemplateFromSharepoint = (endpoint: VerdocsEndpoint, params: ITemplateCreateFromSharepointParams) => {
  const options = {
    timeout: 120000,
  };

  return endpoint.api.post<ITemplate>('/v2/templates/from-sharepoint', params, options).then((r) => r.data);
};

/**
 * Update a template.
 *
 * ```typescript
 * import {updateTemplate} from '@verdocs/js-sdk/Templates';
 *
 * const updatedTemplate = await updateTemplate((VerdocsEndpoint.getDefault(), '83da3d70-7857-4392-b876-c4592a304bc9', { name: 'New Name' });
 * ```
 *
 * @group Templates
 * @api PATCH /v2/templates/:template_id Update a template
 * @apiBody string name? Template name
 * @apiBody string description? Optional description
 * @apiBody TTemplateVisibility visibility? Visibility setting
 * @apiBody boolean is_personal? Deprecated. If true, the template is personal and can only be seen by the caller. (Use "visibility" for new calls.)
 * @apiBody boolean is_public? Deprecated. If true, the template is public and can be seen by anybody. (Use "visibility" for new calls.)
 * @apiBody TTemplateSender sender? Who may send envelopes using this template
 * @apiBody number initial_reminder? Delay (in seconds) before the first reminder is sent (min: 4hrs). Set to 0 or null to disable.
 * @apiBody number followup_reminders? Delay (in seconds) before the subsequent reminders are sent (min: 12hrs). Set to 0 or null to disable.
 * @apiSuccess ITemplate . The updated template
 */
export const updateTemplate = (endpoint: VerdocsEndpoint, templateId: string, params: Partial<ITemplateCreateParams>) =>
  endpoint.api //
    .patch<ITemplate>(`/v2/templates/${templateId}`, params)
    .then((r) => r.data);

/**
 * Delete a template.
 *
 * ```typescript
 * import {deleteTemplate} from '@verdocs/js-sdk/Templates';
 *
 * await deleteTemplate((VerdocsEndpoint.getDefault(), '83da3d70-7857-4392-b876-c4592a304bc9');
 * ```
 *
 * @group Templates
 * @api DELETE /v2/templates/:template_id Delete a template
 * @apiSuccess string . Success
 */
export const deleteTemplate = (endpoint: VerdocsEndpoint, templateId: string) =>
  endpoint.api //
    .delete<string>(`/v2/templates/${templateId}`)
    .then((r) => r.data);
