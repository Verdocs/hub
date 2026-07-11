import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { IEnvelope, IInPersonLinkResponse, IListEnvelopesParams, IRecipient, IUpdateRecipientParams, VerdocsEndpoint } from '@verdocs/js-sdk';
import {
  cancelEnvelope as apiCancelEnvelope,
  getEnvelope,
  getEnvelopes,
  getInPersonLink as apiGetInPersonLink,
  remindRecipient as apiRemindRecipient,
  resetRecipient as apiResetRecipient,
  updateEnvelope as apiUpdateEnvelope,
  updateRecipient as apiUpdateRecipient,
} from '@verdocs/js-sdk';

export interface IEnvelopesPage {
  count: number;
  rows: number;
  page: number;
  envelopes: IEnvelope[];
}

export interface IEnvelopesListQuery {
  params: IListEnvelopesParams;
  endpoint: VerdocsEndpoint;
}

export interface IEnvelopeDetailQuery {
  envelopeId: string | undefined;
  endpoint: VerdocsEndpoint;
}

/** The envelope settings updateEnvelope can change, matching the js-sdk call. */
export type TUpdateEnvelopeParams = Parameters<typeof apiUpdateEnvelope>[2];

/**
 * Cache keys mirror @verdocs/react-sdk's TanStack Query keys exactly: a list
 * lives under ['envelopes', 'list', params], a single envelope under
 * ['envelopes', id]. Object keys are sorted before serialization (as TanStack's
 * hash does) so key equality is order-independent.
 */
export const envelopesListKey = (params: IListEnvelopesParams) => {
  const sorted = Object.fromEntries(Object.entries(params).sort(([ a ], [ b ]) => a.localeCompare(b)));
  return JSON.stringify([ 'envelopes', 'list', sorted ]);
};

export const envelopeDetailKey = (envelopeId: string) => JSON.stringify([ 'envelopes', envelopeId ]);

// Mirrors the react-sdk provider's query defaults: results are fresh for 60s
// (a remount inside that window serves the cache without a refetch) and a
// failed fetch is retried once.
const STALE_MS = 60000;

const listCache = new Map<string, { page: IEnvelopesPage; updatedAt: number }>();
const listInflight = new Map<string, Promise<IEnvelopesPage>>();
const activeListControllers = new Set<EnvelopesListController>();

const detailCache = new Map<string, { envelope: IEnvelope; updatedAt: number }>();
const detailInflight = new Map<string, Promise<IEnvelope>>();
const activeDetailControllers = new Set<EnvelopeDetailController>();

/**
 * Drop the shared list cache and reload every mounted envelopes list. The
 * equivalent of react-sdk invalidating the ['envelopes', 'list'] key.
 */
export const invalidateEnvelopeLists = () => {
  listCache.clear();
  activeListControllers.forEach(controller => void controller.refresh());
};

/**
 * Drop a single envelope's detail cache and reload every mounted view of it.
 * The equivalent of react-sdk invalidating ['envelopes', envelopeId] after a
 * recipient or reminder change: active observers refetch, the rest go stale.
 */
export const invalidateEnvelope = (envelopeId: string) => {
  detailCache.delete(envelopeDetailKey(envelopeId));
  activeDetailControllers.forEach(controller => {
    if (controller.envelopeId === envelopeId) {
      controller.refresh().catch(() => undefined);
    }
  });
};

// Cancellation changes list rows and every detail view at once, so we clear
// both caches and reload every mounted query, matching react-sdk invalidating
// the whole ['envelopes'] family.
const invalidateAllEnvelopes = () => {
  detailCache.clear();
  activeDetailControllers.forEach(controller => void controller.refresh());
  invalidateEnvelopeLists();
};

/**
 * ReactiveController that keeps an envelopes list query in sync with its host's
 * filter state. The host supplies params and endpoint through the getQuery
 * callback, which is re-read on every host update; a change in params triggers
 * a fetch while the previous page stays visible, so paginated UIs do not
 * flicker (react-sdk's keepPreviousData behavior).
 */
export class EnvelopesListController implements ReactiveController {
  /** The latest page of results. Holds the previous page while a new one loads. */
  data?: IEnvelopesPage;
  /** The error from the most recent failed fetch, cleared by the next success. */
  error: unknown;
  /** True whenever a fetch is in flight, including background refreshes. */
  isFetching = false;

  private key = '';
  private seq = 0;

  constructor(
    private host: ReactiveControllerHost,
    private getQuery: () => IEnvelopesListQuery,
    private onError?: (error: unknown) => void,
  ) {
    host.addController(this);
  }

  /** True until the first result (or first error) arrives. */
  get isPending() {
    return this.data === undefined && this.error === undefined;
  }

  hostConnected() {
    activeListControllers.add(this);
    this.sync();
  }

  hostUpdate() {
    this.sync();
  }

  hostDisconnected() {
    activeListControllers.delete(this);
    // Invalidate in-flight responses and force a re-sync if we are reattached.
    this.seq++;
    this.key = '';
  }

  /** Force a refetch of the current query, bypassing the freshness window. */
  refresh(): Promise<void> {
    const query = this.getQuery();
    this.key = envelopesListKey(query.params);
    return this.load(query, this.key);
  }

  private sync() {
    const query = this.getQuery();
    const key = envelopesListKey(query.params);
    if (key === this.key) {
      return;
    }

    this.key = key;

    const cached = listCache.get(key);
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

  private async load(query: IEnvelopesListQuery, key: string) {
    const mySeq = ++this.seq;
    this.isFetching = true;
    this.host.requestUpdate();

    try {
      const page = await fetchEnvelopes(query, key);
      if (mySeq !== this.seq || key !== this.key) {
        return;
      }

      listCache.set(key, { page, updatedAt: Date.now() });
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

/**
 * ReactiveController for a single envelope's detail query. The host supplies
 * the id and endpoint through getQuery, re-read on every host update; an
 * undefined id leaves the query idle, matching react-sdk's enabled:
 * !!envelopeId. Recipient and reminder mutations invalidate the id and this
 * controller refetches, mirroring the detail query in useEnvelope.
 */
export class EnvelopeDetailController implements ReactiveController {
  /** The envelope, once loaded. Undefined while no id is set or before the first result. */
  data?: IEnvelope;
  /** The error from the most recent failed fetch, cleared by the next success. */
  error: unknown;
  /** True whenever a fetch is in flight, including background refreshes. */
  isFetching = false;

  /** The id this controller is currently tracking, so invalidation can target it. */
  envelopeId?: string;

  private key = '';
  private seq = 0;

  constructor(
    private host: ReactiveControllerHost,
    private getQuery: () => IEnvelopeDetailQuery,
    private onError?: (error: unknown) => void,
  ) {
    host.addController(this);
  }

  /** True while a fetch is expected but no result has arrived. False when no id is set. */
  get isPending() {
    return !!this.envelopeId && this.data === undefined && this.error === undefined;
  }

  hostConnected() {
    activeDetailControllers.add(this);
    this.sync();
  }

  hostUpdate() {
    this.sync();
  }

  hostDisconnected() {
    activeDetailControllers.delete(this);
    this.seq++;
    this.key = '';
  }

  /** Force a refetch of the current envelope, bypassing the freshness window. */
  refresh(): Promise<void> {
    const query = this.getQuery();
    if (!query.envelopeId) {
      return Promise.resolve();
    }

    this.key = envelopeDetailKey(query.envelopeId);
    return this.load(query.envelopeId, query.endpoint, this.key);
  }

  private sync() {
    const query = this.getQuery();
    this.envelopeId = query.envelopeId;

    // With no id the query is disabled: clear any prior result and stay idle.
    if (!query.envelopeId) {
      this.key = '';
      this.data = undefined;
      this.error = undefined;
      return;
    }

    const key = envelopeDetailKey(query.envelopeId);
    if (key === this.key) {
      return;
    }

    this.key = key;

    const cached = detailCache.get(key);
    if (cached) {
      this.data = cached.envelope;
      this.error = undefined;
      if (Date.now() - cached.updatedAt < STALE_MS) {
        return;
      }
    } else {
      // A different envelope than before: don't show the old one while loading.
      this.data = undefined;
    }

    this.load(query.envelopeId, query.endpoint, key).catch(() => undefined);
  }

  private async load(envelopeId: string, endpoint: VerdocsEndpoint, key: string) {
    const mySeq = ++this.seq;
    this.isFetching = true;
    this.host.requestUpdate();

    try {
      const envelope = await fetchEnvelope(envelopeId, endpoint, key);
      if (mySeq !== this.seq || key !== this.key) {
        return;
      }

      detailCache.set(key, { envelope, updatedAt: Date.now() });
      this.data = envelope;
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
const fetchEnvelopes = (query: IEnvelopesListQuery, key: string): Promise<IEnvelopesPage> => {
  let promise = listInflight.get(key);
  if (!promise) {
    promise = getEnvelopes(query.endpoint, query.params)
      .catch(() => getEnvelopes(query.endpoint, query.params))
      .finally(() => listInflight.delete(key));
    listInflight.set(key, promise);
  }

  return promise;
};

const fetchEnvelope = (envelopeId: string, endpoint: VerdocsEndpoint, key: string): Promise<IEnvelope> => {
  let promise = detailInflight.get(key);
  if (!promise) {
    promise = getEnvelope(endpoint, envelopeId)
      .catch(() => getEnvelope(endpoint, envelopeId))
      .finally(() => detailInflight.delete(key));
    detailInflight.set(key, promise);
  }

  return promise;
};

/**
 * Update a recipient's contact details or invite message, then invalidate the
 * envelope so any mounted views refresh (react-sdk invalidates ['envelopes',
 * envelopeId] on success).
 */
export const updateRecipient = async (
  endpoint: VerdocsEndpoint,
  envelopeId: string,
  roleName: string,
  params: IUpdateRecipientParams,
): Promise<IRecipient> => {
  const updated = await apiUpdateRecipient(endpoint, envelopeId, roleName, params);
  invalidateEnvelope(envelopeId);
  return updated;
};

/**
 * Send a reminder to a recipient, then invalidate the envelope's detail views.
 */
export const remindRecipient = async (endpoint: VerdocsEndpoint, envelopeId: string, roleName: string) => {
  const result = await apiRemindRecipient(endpoint, envelopeId, roleName);
  invalidateEnvelope(envelopeId);
  return result;
};

/**
 * Fully reset a recipient (clears verification, sends a new invite), then
 * invalidate the envelope's detail views.
 */
export const resetRecipient = async (endpoint: VerdocsEndpoint, envelopeId: string, roleName: string) => {
  const result = await apiResetRecipient(endpoint, envelopeId, roleName);
  invalidateEnvelope(envelopeId);
  return result;
};

/**
 * Update an envelope's settings, typically its reminder schedule, then
 * invalidate the envelope's detail views.
 */
export const updateEnvelope = async (endpoint: VerdocsEndpoint, envelopeId: string, params: TUpdateEnvelopeParams): Promise<IEnvelope> => {
  const updated = await apiUpdateEnvelope(endpoint, envelopeId, params);
  invalidateEnvelope(envelopeId);
  return updated;
};

/**
 * Cancel an envelope. Cancellation also changes list rows, so the whole
 * ['envelopes'] family is invalidated, detail and list alike.
 */
export const cancelEnvelope = async (endpoint: VerdocsEndpoint, envelopeId: string) => {
  const result = await apiCancelEnvelope(endpoint, envelopeId);
  invalidateAllEnvelopes();
  return result;
};

/**
 * Get an in-person signing link for a recipient. Read-only from the cache's
 * point of view, so nothing is invalidated (matching react-sdk).
 */
export const getInPersonLink = (endpoint: VerdocsEndpoint, envelopeId: string, roleName: string): Promise<IInPersonLinkResponse> =>
  apiGetInPersonLink(endpoint, envelopeId, roleName);
