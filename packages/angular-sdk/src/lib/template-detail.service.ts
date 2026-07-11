import { computed, DestroyRef, inject, Injectable, resource, type Signal } from '@angular/core';
import type { IRole, ITemplate, ITemplateCreateParams, ITemplateDocument, ITemplateField, VerdocsEndpoint } from '@verdocs/js-sdk';
import {
  createField,
  createTemplate,
  createTemplateDocument,
  createTemplateRole,
  deleteField,
  deleteTemplate,
  deleteTemplateDocument,
  deleteTemplateRole,
  getTemplate,
  getTemplateDocumentPageDisplayUri,
  updateField,
  updateTemplate,
  updateTemplateRole,
} from '@verdocs/js-sdk';
import { injectVerdocsEndpoint } from './provide-verdocs';
import { VerdocsTemplatesService } from './templates';
import { SDKError } from './types';

/** Convert a js-sdk (axios) rejection into the SDKError shape sdkError outputs emit. */
export const toSDKError = (error: unknown): SDKError => {
  const details = error as { message: string; response?: { status?: number; data?: unknown } };
  return new SDKError(details.message, details.response?.status, details.response?.data);
};

export interface ITemplateQuery {
  /** The template, once loaded. Undefined until the first result arrives or while no ID is set. */
  data: Signal<ITemplate | undefined>;
  /** True until the first result arrives. */
  isPending: Signal<boolean>;
  /** True whenever a fetch is in flight, including background refreshes. */
  isFetching: Signal<boolean>;
  error: Signal<unknown>;
  reload: () => void;
}

export interface IPageImageQuery {
  /** The server-rendered page image URI, once loaded. */
  data: Signal<string | undefined>;
  isPending: Signal<boolean>;
  error: Signal<unknown>;
  reload: () => void;
}

interface IActiveDetailQuery {
  templateId: () => string | undefined;
  prime: (template: ITemplate) => void;
  reload: () => void;
}

/**
 * Signal-based data access for a single template and its structure (roles,
 * fields, and documents). Query keys and invalidation semantics deliberately
 * mirror @verdocs/react-sdk's TanStack Query hooks: the detail query lives
 * under ['templates', id], document page images under
 * ['template-documents', documentId, 'page-image', page], and every mutation
 * refreshes the template's active detail queries plus every active list query,
 * the same reconciliation useTemplates/useTemplateStructure perform with
 * setQueryData and invalidateQueries.
 */
@Injectable({ providedIn: 'root' })
export class VerdocsTemplateDetailService {
  private readonly defaultEndpoint = injectVerdocsEndpoint();
  private readonly templatesService = inject(VerdocsTemplatesService);
  private readonly activeDetailQueries = new Set<IActiveDetailQuery>();

  /**
   * Create a reactive template detail query. Call from an injection context
   * (constructor or field initializer); the query is cleaned up with it. The
   * ID signal is tracked: changing it refetches, and an undefined ID leaves
   * the query idle, matching React's enabled: !!templateId. The optional
   * endpoint signal supports per-component endpoint overrides.
   */
  template(templateId: Signal<string | undefined>, endpointOverride?: Signal<VerdocsEndpoint | undefined>): ITemplateQuery {
    const templateResource = resource({
      params: () => {
        const id = templateId();
        return id ? { key: [ 'templates', id ] as const, endpoint: endpointOverride?.() ?? this.defaultEndpoint } : undefined;
      },
      loader: ({ params: p }) => getTemplate(p.endpoint, p.key[1]),
    });

    const registration: IActiveDetailQuery = {
      templateId,
      // Priming replaces the resource's value the way React's setQueryData
      // replaces the cache entry, without another network round trip.
      prime: template => templateResource.set(template),
      reload: () => templateResource.reload(),
    };

    this.activeDetailQueries.add(registration);
    inject(DestroyRef).onDestroy(() => this.activeDetailQueries.delete(registration));

    return {
      data: computed(() => (templateResource.hasValue() ? templateResource.value() : undefined)),
      isPending: computed(() => !templateResource.hasValue() && templateResource.status() !== 'error'),
      isFetching: computed(() => templateResource.isLoading()),
      error: computed(() => (templateResource.status() === 'error' ? templateResource.error() : null)),
      reload: registration.reload,
    };
  }

  /**
   * Create a reactive query for one server-rendered document page image,
   * mirroring the React SDK's ['template-documents', documentId, 'page-image',
   * page] query. Call from an injection context.
   */
  documentPageImage(
    params: Signal<{ documentId: string; page: number }>,
    endpointOverride?: Signal<VerdocsEndpoint | undefined>,
  ): IPageImageQuery {
    const imageResource = resource({
      params: () => ({
        key: [ 'template-documents', params().documentId, 'page-image', params().page ] as const,
        endpoint: endpointOverride?.() ?? this.defaultEndpoint,
      }),
      loader: ({ params: p }) => getTemplateDocumentPageDisplayUri(p.endpoint, p.key[1], p.key[3]),
    });

    return {
      data: computed(() => (imageResource.hasValue() ? imageResource.value() : undefined)),
      isPending: computed(() => !imageResource.hasValue() && imageResource.status() !== 'error'),
      error: computed(() => (imageResource.status() === 'error' ? imageResource.error() : null)),
      reload: () => imageResource.reload(),
    };
  }

  /**
   * Create a template. Active detail queries for the new template are primed
   * with the response and list queries reload, mirroring useCreateTemplate.
   */
  async createTemplate(params: ITemplateCreateParams, endpointOverride?: VerdocsEndpoint): Promise<ITemplate> {
    const created = await createTemplate(endpointOverride ?? this.defaultEndpoint, params);
    this.primeDetail(created);
    this.templatesService.invalidateLists();
    return created;
  }

  /** Update a template's settings. Same cache reconciliation as create. */
  async updateTemplate(templateId: string, params: Partial<ITemplateCreateParams>, endpointOverride?: VerdocsEndpoint): Promise<ITemplate> {
    const updated = await updateTemplate(endpointOverride ?? this.defaultEndpoint, templateId, params);
    this.primeDetail(updated);
    this.templatesService.invalidateLists();
    return updated;
  }

  /**
   * Delete a template, then reload list queries. React's useDeleteTemplate
   * also drops the detail cache entry; resources have no shared cache to drop,
   * so any detail query still mounted for the deleted template is left to the
   * host to unmount.
   */
  async deleteTemplate(templateId: string, endpointOverride?: VerdocsEndpoint): Promise<void> {
    await deleteTemplate(endpointOverride ?? this.defaultEndpoint, templateId);
    this.templatesService.invalidateLists();
  }

  /** Add a role to a template's signing workflow. */
  createRole(templateId: string, role: IRole, endpointOverride?: VerdocsEndpoint): Promise<IRole> {
    return this.structureMutation(templateId, endpointOverride, endpoint => createTemplateRole(endpoint, templateId, role));
  }

  /** Update a role. Roles are identified by name, not ID. */
  updateRole(templateId: string, name: string, params: Partial<IRole>, endpointOverride?: VerdocsEndpoint): Promise<IRole> {
    return this.structureMutation(templateId, endpointOverride, endpoint => updateTemplateRole(endpoint, templateId, name, params));
  }

  /** Remove a role from a template. Any fields assigned to it are removed as well. */
  deleteRole(templateId: string, name: string, endpointOverride?: VerdocsEndpoint): Promise<unknown> {
    return this.structureMutation(templateId, endpointOverride, endpoint => deleteTemplateRole(endpoint, templateId, name));
  }

  /** Add a field to a template. */
  createField(templateId: string, field: ITemplateField, endpointOverride?: VerdocsEndpoint): Promise<ITemplateField> {
    return this.structureMutation(templateId, endpointOverride, endpoint => createField(endpoint, templateId, field));
  }

  /** Update a field. Fields are identified by name, not ID. */
  updateField(templateId: string, name: string, params: Partial<ITemplateField>, endpointOverride?: VerdocsEndpoint): Promise<ITemplateField> {
    return this.structureMutation(templateId, endpointOverride, endpoint => updateField(endpoint, templateId, name, params));
  }

  /** Remove a field from a template. */
  deleteField(templateId: string, name: string, endpointOverride?: VerdocsEndpoint): Promise<unknown> {
    return this.structureMutation(templateId, endpointOverride, endpoint => deleteField(endpoint, templateId, name));
  }

  /** Attach a document to a template, reporting upload progress as it goes. */
  createDocument(
    templateId: string,
    file: File,
    onUploadProgress?: (percent: number, loadedBytes: number, totalBytes: number) => void,
    endpointOverride?: VerdocsEndpoint,
  ): Promise<ITemplateDocument> {
    return this.structureMutation(templateId, endpointOverride, endpoint =>
      createTemplateDocument(endpoint, templateId, file, onUploadProgress));
  }

  /**
   * Remove a document from a template. The js-sdk call needs only the document
   * ID; the template ID identifies the detail queries to refresh afterward.
   */
  deleteDocument(templateId: string, documentId: string, endpointOverride?: VerdocsEndpoint): Promise<ITemplate> {
    return this.structureMutation(templateId, endpointOverride, endpoint => deleteTemplateDocument(endpoint, documentId));
  }

  /** Reload every active detail query for the given template. */
  invalidateDetail(templateId: string) {
    this.activeDetailQueries.forEach(query => {
      if (query.templateId() === templateId) {
        query.reload();
      }
    });
  }

  /**
   * Roles, fields, and documents ride inside the template detail response, so
   * every structure mutation refreshes the template's detail queries and the
   * list queries; the fresh template is the source of truth rather than a
   * hand-merge of partial responses. The detail refresh is awaited before the
   * mutation resolves (React returns the invalidation promise from onSuccess
   * for the same reason), so callers can read the refreshed template as soon
   * as their await completes.
   */
  private async structureMutation<T>(
    templateId: string,
    endpointOverride: VerdocsEndpoint | undefined,
    mutation: (endpoint: VerdocsEndpoint) => Promise<T>,
  ): Promise<T> {
    const endpoint = endpointOverride ?? this.defaultEndpoint;
    const result = await mutation(endpoint);
    await this.refreshDetail(templateId, endpoint);
    this.templatesService.invalidateLists();
    return result;
  }

  /**
   * Fetch the template once and prime every active detail query for it.
   * TanStack refetches an invalidated key once no matter how many observers
   * it has, and only when at least one is active; skipping the fetch when
   * nothing is mounted keeps that behavior.
   */
  private async refreshDetail(templateId: string, endpoint: VerdocsEndpoint): Promise<void> {
    const active = [ ...this.activeDetailQueries ].filter(query => query.templateId() === templateId);
    if (!active.length) {
      return;
    }

    const fresh = await getTemplate(endpoint, templateId);
    active.forEach(query => query.prime(fresh));
  }

  private primeDetail(template: ITemplate) {
    this.activeDetailQueries.forEach(query => {
      if (query.templateId() === template.id) {
        query.prime(template);
      }
    });
  }
}
