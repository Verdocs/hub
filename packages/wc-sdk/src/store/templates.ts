import { getTemplates } from '@verdocs/js-sdk';
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { IGetTemplatesParams, ITemplate, VerdocsEndpoint } from '@verdocs/js-sdk';

export interface ITemplatesPage {
  count: number;
  rows: number;
  page: number;
  templates: ITemplate[];
}

export interface ITemplatesQuery {
  params: IGetTemplatesParams;
  endpoint: VerdocsEndpoint;
}

/**
 * Cache keys mirror @verdocs/react-sdk's TanStack Query keys exactly: a list
 * lives under ['templates', 'list', params]. Object keys are sorted before
 * serialization (as TanStack's hash does) so key equality is order-independent.
 */
export const templatesListKey = (params: IGetTemplatesParams) => {
  const sorted = Object.fromEntries(Object.entries(params).sort(([ a ], [ b ]) => a.localeCompare(b)));
  return JSON.stringify([ 'templates', 'list', sorted ]);
};

// Mirrors the react-sdk provider's query defaults: results are fresh for 60s
// (a remount inside that window serves the cache without a refetch) and a
// failed fetch is retried once.
const STALE_MS = 60000;

const cache = new Map<string, { page: ITemplatesPage; updatedAt: number }>();
const inflight = new Map<string, Promise<ITemplatesPage>>();
const activeControllers = new Set<TemplatesController>();

/**
 * Drop the shared cache and reload every mounted templates list. The
 * equivalent of react-sdk invalidating the ['templates', 'list'] key after a
 * mutation; call it after any operation that changes template rows.
 */
export const invalidateTemplateLists = () => {
  cache.clear();
  activeControllers.forEach(controller => {
    controller.refresh().catch(() => undefined);
  });
};

/**
 * ReactiveController that keeps a templates list query in sync with its
 * host's filter state. The host supplies params and endpoint through the
 * getQuery callback, which is re-read on every host update; a change in
 * params triggers a fetch while the previous page stays visible, so
 * paginated UIs do not flicker (react-sdk's keepPreviousData behavior).
 */
export class TemplatesController implements ReactiveController {
  /** The latest page of results. Holds the previous page while a new one loads. */
  data?: ITemplatesPage;
  /** The error from the most recent failed fetch, cleared by the next success. */
  error: unknown;
  /** True whenever a fetch is in flight, including background refreshes. */
  isFetching = false;

  private key = '';
  private seq = 0;

  constructor(
    private host: ReactiveControllerHost,
    private getQuery: () => ITemplatesQuery,
    private onError?: (error: unknown) => void,
  ) {
    host.addController(this);
  }

  /** True until the first result (or first error) arrives. */
  get isPending() {
    return this.data === undefined && this.error === undefined;
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

  /** Force a refetch of the current query, bypassing the freshness window. */
  refresh(): Promise<void> {
    const query = this.getQuery();
    this.key = templatesListKey(query.params);
    return this.load(query, this.key);
  }

  private sync() {
    const query = this.getQuery();
    const key = templatesListKey(query.params);
    if (key === this.key) {
      return;
    }

    this.key = key;

    const cached = cache.get(key);
    if (cached) {
      this.data = cached.page;
      this.error = undefined;
      if (Date.now() - cached.updatedAt < STALE_MS) {
        return;
      }
    }

    // load() reports failures through onError and never rejects, so there is
    // no rejection path left to handle here.
    this.load(query, key).catch(() => undefined);
  }

  private async load(query: ITemplatesQuery, key: string) {
    const mySeq = ++this.seq;
    this.isFetching = true;
    this.host.requestUpdate();

    try {
      const page = await fetchTemplates(query, key);
      if (mySeq !== this.seq || key !== this.key) {
        return;
      }

      cache.set(key, { page, updatedAt: Date.now() });
      this.data = page;
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

// Concurrent mounts of the same key share one request, the way a shared query
// cache would. Failures retry once before rejecting.
const fetchTemplates = (query: ITemplatesQuery, key: string): Promise<ITemplatesPage> => {
  let promise = inflight.get(key);
  if (!promise) {
    promise = getTemplates(query.endpoint, query.params)
      .catch(() => getTemplates(query.endpoint, query.params))
      .finally(() => inflight.delete(key));
    inflight.set(key, promise);
  }

  return promise;
};
