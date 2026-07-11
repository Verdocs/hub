import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type {
  IRole,
  ITemplate,
  ITemplateCreateParams,
  ITemplateDocument,
  ITemplateField,
  VerdocsEndpoint,
} from '@verdocs/js-sdk';
import {
  createField as sdkCreateField,
  createTemplate as sdkCreateTemplate,
  createTemplateDocument as sdkCreateTemplateDocument,
  createTemplateRole as sdkCreateTemplateRole,
  deleteField as sdkDeleteField,
  deleteTemplate as sdkDeleteTemplate,
  deleteTemplateDocument as sdkDeleteTemplateDocument,
  deleteTemplateRole as sdkDeleteTemplateRole,
  getTemplate as sdkGetTemplate,
  updateField as sdkUpdateField,
  updateTemplate as sdkUpdateTemplate,
  updateTemplateRole as sdkUpdateTemplateRole,
} from '@verdocs/js-sdk';
import { invalidateTemplateLists } from './templates.js';

export interface ITemplateDetailQuery {
  /** The template to load, or undefined to leave the query idle (react-sdk's enabled: !!templateId). */
  templateId: string | undefined;
  endpoint: VerdocsEndpoint;
}

/**
 * Cache key for a single template's detail. Mirrors @verdocs/react-sdk's
 * useTemplate query key exactly: ['templates', templateId]. The template
 * mutations prime and drop this entry through the same key, so a list-to-detail
 * navigation renders warm.
 */
export const templateDetailKey = (templateId: string) => JSON.stringify([ 'templates', templateId ]);

// Same freshness window as the list store and the react-sdk provider defaults:
// a remount within 60s serves the cache without a refetch.
const STALE_MS = 60000;

const cache = new Map<string, { template: ITemplate; updatedAt: number }>();
const inflight = new Map<string, Promise<ITemplate>>();
const activeControllers = new Set<TemplateController>();

/**
 * Drop a template's cached detail and refetch it for any mounted controller
 * watching that id, resolving once those refetches land. The equivalent of
 * react-sdk invalidating the ['templates', templateId] key; the structure
 * mutations await it so a caller can read the refreshed template straight after.
 */
export const invalidateTemplateDetail = (templateId: string): Promise<void> => {
  cache.delete(templateDetailKey(templateId));
  const refreshes = [ ...activeControllers ]
    .filter(controller => controller.templateId === templateId)
    .map(controller => controller.refresh());
  return Promise.all(refreshes).then(() => undefined);
};

// Seed the cache with a known-good template and push it straight into any
// watching controller, the way react-sdk's setQueryData updates observers
// without a refetch. Used by create/update, where the server already returned
// the authoritative copy.
const primeTemplateDetail = (template: ITemplate) => {
  cache.set(templateDetailKey(template.id), { template, updatedAt: Date.now() });
  activeControllers.forEach(controller => {
    if (controller.templateId === template.id) {
      controller.applyData(template);
    }
  });
};

// Drop a detail entry outright (react-sdk's removeQueries), used after a delete.
const dropTemplateDetail = (templateId: string) => {
  cache.delete(templateDetailKey(templateId));
};

/**
 * ReactiveController that keeps one template's detail in sync with its host's
 * templateId. The host supplies the id and endpoint through the getQuery
 * callback, re-read on every host update; a change of id refetches while the
 * previous template stays visible until the new one lands. Mirrors react-sdk's
 * useTemplate.
 */
export class TemplateController implements ReactiveController {
  /** The loaded template, retained across background refreshes. */
  data?: ITemplate;
  /** The error from the most recent failed fetch, cleared by the next success. */
  error: unknown;
  /** True whenever a fetch is in flight, including background refreshes. */
  isFetching = false;
  /** The id currently being watched, exposed so the store can target invalidations. */
  templateId: string | undefined;

  private key = '';
  private seq = 0;

  constructor(
    private host: ReactiveControllerHost,
    private getQuery: () => ITemplateDetailQuery,
    private onError?: (error: unknown) => void,
  ) {
    host.addController(this);
  }

  /** True until the first result (or error) arrives for the current id. */
  get isPending() {
    return this.templateId !== undefined && this.data === undefined && this.error === undefined;
  }

  hostConnected() {
    activeControllers.add(this);
    this.sync();
  }

  hostUpdate() {
    this.sync();
  }

  hostDisconnected() {
    activeControllers.delete(this);
    // Invalidate in-flight responses and force a re-sync if we are reattached.
    this.seq++;
    this.key = '';
  }

  /** Force a refetch of the current template, bypassing the freshness window. */
  refresh(): Promise<void> {
    const query = this.getQuery();
    this.templateId = query.templateId;
    if (!query.templateId) {
      return Promise.resolve();
    }

    this.key = templateDetailKey(query.templateId);
    return this.load(query.endpoint, query.templateId, this.key);
  }

  /** Adopt a server-authoritative template without a refetch (setQueryData path). */
  applyData(template: ITemplate) {
    // Bump the sequence so any load still in flight for this controller is ignored.
    this.seq++;
    this.data = template;
    this.error = undefined;
    this.isFetching = false;
    this.host.requestUpdate();
  }

  private sync() {
    const query = this.getQuery();
    this.templateId = query.templateId;

    if (!query.templateId) {
      // Idle query: nothing to load, and no stale template should linger.
      if (this.key !== '') {
        this.key = '';
        this.data = undefined;
        this.error = undefined;
      }
      return;
    }

    const key = templateDetailKey(query.templateId);
    if (key === this.key) {
      return;
    }

    this.key = key;

    const cached = cache.get(key);
    if (cached) {
      this.data = cached.template;
      this.error = undefined;
      if (Date.now() - cached.updatedAt < STALE_MS) {
        return;
      }
    } else {
      // A new id with nothing cached: clear the previous template so the host
      // shows its loading state. useTemplate keeps no placeholder across ids.
      this.data = undefined;
      this.error = undefined;
    }

    this.load(query.endpoint, query.templateId, key).catch(() => undefined);
  }

  private async load(endpoint: VerdocsEndpoint, templateId: string, key: string) {
    const mySeq = ++this.seq;
    this.isFetching = true;
    this.host.requestUpdate();

    try {
      const template = await fetchTemplate(endpoint, templateId, key);
      if (mySeq !== this.seq || key !== this.key) {
        return;
      }

      cache.set(key, { template, updatedAt: Date.now() });
      this.data = template;
      this.error = undefined;
    } catch (error) {
      if (mySeq !== this.seq || key !== this.key) {
        return;
      }

      this.error = error;
      this.onError?.(error);
    } finally {
      if (mySeq === this.seq) {
        this.isFetching = false;
        this.host.requestUpdate();
      }
    }
  }
}

// Concurrent mounts of the same id share one request. Failures retry once.
const fetchTemplate = (endpoint: VerdocsEndpoint, templateId: string, key: string): Promise<ITemplate> => {
  let promise = inflight.get(key);
  if (!promise) {
    promise = sdkGetTemplate(endpoint, templateId)
      .catch(() => sdkGetTemplate(endpoint, templateId))
      .finally(() => inflight.delete(key));
    inflight.set(key, promise);
  }

  return promise;
};

// Roles, fields, and attachments all ride inside the template detail response,
// so a structure change refetches the detail (and the lists, which show usage
// that a role/field change can affect). Mirrors useTemplateStructure's Promise.all.
const invalidateStructure = (templateId: string): Promise<void> => {
  invalidateTemplateLists();
  return invalidateTemplateDetail(templateId);
};

/**
 * Create a template, then prime its detail cache and refetch the lists, exactly
 * as react-sdk's useCreateTemplate does on success.
 */
export const createTemplate = async (endpoint: VerdocsEndpoint, params: ITemplateCreateParams): Promise<ITemplate> => {
  const created = await sdkCreateTemplate(endpoint, params);
  primeTemplateDetail(created);
  invalidateTemplateLists();
  return created;
};

/** Update a template's settings, with the same cache reconciliation as create. */
export const updateTemplate = async (
  endpoint: VerdocsEndpoint,
  templateId: string,
  params: Partial<ITemplateCreateParams>,
): Promise<ITemplate> => {
  const updated = await sdkUpdateTemplate(endpoint, templateId, params);
  primeTemplateDetail(updated);
  invalidateTemplateLists();
  return updated;
};

/** Delete a template, dropping its detail entry and refetching the lists. */
export const deleteTemplate = async (endpoint: VerdocsEndpoint, templateId: string): Promise<void> => {
  await sdkDeleteTemplate(endpoint, templateId);
  dropTemplateDetail(templateId);
  invalidateTemplateLists();
};

/** Add a role to a template and refresh its structure. */
export const createTemplateRole = async (endpoint: VerdocsEndpoint, templateId: string, role: IRole): Promise<IRole> => {
  const result = await sdkCreateTemplateRole(endpoint, templateId, role);
  await invalidateStructure(templateId);
  return result;
};

/** Update a role by its current name and refresh the template structure. */
export const updateTemplateRole = async (
  endpoint: VerdocsEndpoint,
  templateId: string,
  name: string,
  params: Partial<IRole>,
): Promise<IRole> => {
  const result = await sdkUpdateTemplateRole(endpoint, templateId, name, params);
  await invalidateStructure(templateId);
  return result;
};

/** Delete a role by name and refresh the template structure. */
export const deleteTemplateRole = async (endpoint: VerdocsEndpoint, templateId: string, name: string): Promise<void> => {
  await sdkDeleteTemplateRole(endpoint, templateId, name);
  await invalidateStructure(templateId);
};

/** Add a field to a template and refresh its structure. */
export const createTemplateField = async (endpoint: VerdocsEndpoint, templateId: string, field: ITemplateField): Promise<ITemplateField> => {
  const result = await sdkCreateField(endpoint, templateId, field);
  await invalidateStructure(templateId);
  return result;
};

/** Update a field by its current name and refresh the template structure. */
export const updateTemplateField = async (
  endpoint: VerdocsEndpoint,
  templateId: string,
  name: string,
  params: Partial<ITemplateField>,
): Promise<ITemplateField> => {
  const result = await sdkUpdateField(endpoint, templateId, name, params);
  await invalidateStructure(templateId);
  return result;
};

/** Delete a field by name and refresh the template structure. */
export const deleteTemplateField = async (endpoint: VerdocsEndpoint, templateId: string, name: string): Promise<void> => {
  await sdkDeleteField(endpoint, templateId, name);
  await invalidateStructure(templateId);
};

/**
 * Attach a document to a template. Attachments ride inside the template detail,
 * so this refetches only that entry (react-sdk's TemplateAttachments invalidates
 * ['templates', templateId] alone, not the lists).
 */
export const createTemplateDocument = async (
  endpoint: VerdocsEndpoint,
  templateId: string,
  file: File,
  onUploadProgress?: (percent: number, loadedBytes: number, totalBytes: number) => void,
): Promise<ITemplateDocument> => {
  const result = await sdkCreateTemplateDocument(endpoint, templateId, file, onUploadProgress);
  await invalidateTemplateDetail(templateId);
  return result;
};

/** Remove a document from a template and refetch that template's detail. */
export const deleteTemplateDocument = async (endpoint: VerdocsEndpoint, documentId: string, templateId: string): Promise<void> => {
  await sdkDeleteTemplateDocument(endpoint, documentId);
  await invalidateTemplateDetail(templateId);
};
