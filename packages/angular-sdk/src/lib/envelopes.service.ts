import { computed, DestroyRef, inject, Injectable, linkedSignal, resource, type Signal } from '@angular/core';
import {
  cancelEnvelope,
  getEnvelope,
  getEnvelopes,
  getInPersonLink,
  remindRecipient,
  resetRecipient,
  updateEnvelope,
  updateRecipient,
} from '@verdocs/js-sdk';
import type {
  IEnvelope,
  IInPersonLinkResponse,
  IListEnvelopesParams,
  IRecipient,
  IUpdateRecipientParams,
  TEnvelopeUpdateResult,
  VerdocsEndpoint,
} from '@verdocs/js-sdk';
import { injectVerdocsEndpoint } from './provide-verdocs';

/** The envelope settings updateEnvelope can change, matching the js-sdk call. */
export type TUpdateEnvelopeParams = Parameters<typeof updateEnvelope>[2];

export interface IEnvelopesPage {
  count: number;
  rows: number;
  page: number;
  envelopes: IEnvelope[];
}

export interface IEnvelopesQuery {
  /** The latest page of results. Previous results are kept while a new page or filter set loads. */
  data: Signal<IEnvelopesPage | undefined>;
  /** True until the first result arrives. */
  isPending: Signal<boolean>;
  /** True whenever a fetch is in flight, including background refreshes. */
  isFetching: Signal<boolean>;
  error: Signal<unknown>;
  reload: () => void;
}

export interface IEnvelopeQuery {
  /** The envelope, once loaded. Undefined until the first result arrives or while no ID is set. */
  data: Signal<IEnvelope | undefined>;
  /** True until the first result arrives. */
  isPending: Signal<boolean>;
  /** True whenever a fetch is in flight, including background refreshes. */
  isFetching: Signal<boolean>;
  error: Signal<unknown>;
  reload: () => void;
}

interface IActiveDetailQuery {
  envelopeId: () => string | undefined;
  prime: (envelope: IEnvelope) => void;
  reload: () => void;
}

/**
 * Signal-based data access for envelopes. Query keys and invalidation
 * semantics deliberately mirror @verdocs/react-sdk's TanStack Query hooks:
 * list queries live under ['envelopes', 'list', params], detail queries under
 * ['envelopes', id], recipient and reminder mutations refresh the envelope's
 * active detail queries (React's invalidateQueries({ queryKey: ['envelopes',
 * envelopeId] })), and canceling refreshes the whole family, lists included
 * (React invalidates ['envelopes']).
 */
@Injectable({ providedIn: 'root' })
export class VerdocsEnvelopesService {
  private readonly defaultEndpoint = injectVerdocsEndpoint();
  private readonly activeListQueries = new Set<() => void>();
  private readonly activeDetailQueries = new Set<IActiveDetailQuery>();

  /**
   * Create a reactive envelopes list query. Call from an injection context
   * (constructor or field initializer); the query is cleaned up with it.
   * The params signal is tracked: changing filters or pages refetches. The
   * optional endpoint signal supports per-component endpoint overrides.
   */
  envelopes(params: Signal<IListEnvelopesParams>, endpointOverride?: Signal<VerdocsEndpoint | undefined>): IEnvelopesQuery {
    const envelopesResource = resource({
      params: () => ({
        key: [ 'envelopes', 'list', params() ] as const,
        endpoint: endpointOverride?.() ?? this.defaultEndpoint,
      }),
      loader: ({ params: p }) => getEnvelopes(p.endpoint, p.key[2]),
    });

    // Keep showing the previous page while the next one loads, so paginated
    // UIs do not flash empty.
    const data = linkedSignal<IEnvelopesPage | undefined, IEnvelopesPage | undefined>({
      source: () => (envelopesResource.hasValue() ? envelopesResource.value() : undefined),
      computation: (next, previous) => next ?? previous?.value,
    });

    const reload = () => envelopesResource.reload();

    this.activeListQueries.add(reload);
    inject(DestroyRef).onDestroy(() => this.activeListQueries.delete(reload));

    return {
      data: computed(() => data()),
      isPending: computed(() => data() === undefined && envelopesResource.status() !== 'error'),
      isFetching: computed(() => envelopesResource.isLoading()),
      error: computed(() => (envelopesResource.status() === 'error' ? envelopesResource.error() : null)),
      reload,
    };
  }

  /**
   * Create a reactive envelope detail query. Call from an injection context
   * (constructor or field initializer); the query is cleaned up with it. The
   * ID signal is tracked: changing it refetches, and an undefined ID leaves
   * the query idle, matching React's enabled: !!envelopeId. The optional
   * endpoint signal supports per-component endpoint overrides.
   */
  envelope(envelopeId: Signal<string | undefined>, endpointOverride?: Signal<VerdocsEndpoint | undefined>): IEnvelopeQuery {
    const envelopeResource = resource({
      params: () => {
        const id = envelopeId();
        return id ? { key: [ 'envelopes', id ] as const, endpoint: endpointOverride?.() ?? this.defaultEndpoint } : undefined;
      },
      loader: ({ params: p }) => getEnvelope(p.endpoint, p.key[1]),
    });

    const registration: IActiveDetailQuery = {
      envelopeId,
      // Priming replaces the resource's value the way React's setQueryData
      // replaces the cache entry, without another network round trip.
      prime: envelope => envelopeResource.set(envelope),
      reload: () => envelopeResource.reload(),
    };

    this.activeDetailQueries.add(registration);
    inject(DestroyRef).onDestroy(() => this.activeDetailQueries.delete(registration));

    return {
      data: computed(() => (envelopeResource.hasValue() ? envelopeResource.value() : undefined)),
      isPending: computed(() => !envelopeResource.hasValue() && envelopeResource.status() !== 'error'),
      isFetching: computed(() => envelopeResource.isLoading()),
      error: computed(() => (envelopeResource.status() === 'error' ? envelopeResource.error() : null)),
      reload: registration.reload,
    };
  }

  /**
   * Update a recipient's contact details or invite message. The envelope's
   * active detail queries are refreshed before the promise resolves.
   */
  async updateRecipient(
    envelopeId: string,
    roleName: string,
    params: IUpdateRecipientParams,
    endpointOverride?: VerdocsEndpoint,
  ): Promise<IRecipient> {
    const endpoint = endpointOverride ?? this.defaultEndpoint;
    const updated = await updateRecipient(endpoint, envelopeId, roleName, params);
    await this.refreshDetail(envelopeId, endpoint);
    return updated;
  }

  /**
   * Send a reminder to a recipient. The recipient must still be an active
   * member of the signing flow (not declined, already submitted, etc.).
   */
  async remindRecipient(envelopeId: string, roleName: string, endpointOverride?: VerdocsEndpoint): Promise<void> {
    const endpoint = endpointOverride ?? this.defaultEndpoint;
    await remindRecipient(endpoint, envelopeId, roleName);
    await this.refreshDetail(envelopeId, endpoint);
  }

  /**
   * Fully reset a recipient: clears their verification status and sends a new
   * signing invitation.
   */
  async resetRecipient(envelopeId: string, roleName: string, endpointOverride?: VerdocsEndpoint): Promise<void> {
    const endpoint = endpointOverride ?? this.defaultEndpoint;
    await resetRecipient(endpoint, envelopeId, roleName);
    await this.refreshDetail(envelopeId, endpoint);
  }

  /**
   * Update an envelope's settings, typically its reminder schedule. Refreshes
   * the envelope's active detail queries.
   */
  async updateEnvelope(envelopeId: string, params: TUpdateEnvelopeParams, endpointOverride?: VerdocsEndpoint): Promise<IEnvelope> {
    const endpoint = endpointOverride ?? this.defaultEndpoint;
    const updated = await updateEnvelope(endpoint, envelopeId, params);
    await this.refreshDetail(envelopeId, endpoint);
    return updated;
  }

  /**
   * Cancel an envelope. Cancellation also changes list rows, so every active
   * envelope query refreshes, detail and list alike, the same family-wide
   * invalidation React performs with the ['envelopes'] key.
   */
  async cancelEnvelope(envelopeId: string, endpointOverride?: VerdocsEndpoint): Promise<TEnvelopeUpdateResult> {
    const endpoint = endpointOverride ?? this.defaultEndpoint;
    const result = await cancelEnvelope(endpoint, envelopeId);

    const activeIds = new Set<string>();
    this.activeDetailQueries.forEach(query => {
      const id = query.envelopeId();
      if (id) {
        activeIds.add(id);
      }
    });
    await Promise.all([ ...activeIds ].map(id => this.refreshDetail(id, endpoint)));

    this.invalidateLists();
    return result;
  }

  /**
   * Get an in-person signing link for a recipient. Read-only from the cache's
   * point of view, so nothing is invalidated (matching React).
   */
  getInPersonLink(envelopeId: string, roleName: string, endpointOverride?: VerdocsEndpoint): Promise<IInPersonLinkResponse> {
    return getInPersonLink(endpointOverride ?? this.defaultEndpoint, envelopeId, roleName);
  }

  /** Reload every active envelopes list query. */
  invalidateLists() {
    this.activeListQueries.forEach(reload => reload());
  }

  /** Reload every active detail query for the given envelope. */
  invalidateDetail(envelopeId: string) {
    this.activeDetailQueries.forEach(query => {
      if (query.envelopeId() === envelopeId) {
        query.reload();
      }
    });
  }

  /**
   * Fetch the envelope once and prime every active detail query for it.
   * TanStack refetches an invalidated key once no matter how many observers
   * it has, and only when at least one is active; skipping the fetch when
   * nothing is mounted keeps that behavior. The refresh is awaited before
   * each mutation resolves (React returns the invalidation promise from
   * onSuccess for the same reason), so callers can read the refreshed
   * envelope as soon as their await completes.
   */
  private async refreshDetail(envelopeId: string, endpoint: VerdocsEndpoint): Promise<void> {
    const active = [ ...this.activeDetailQueries ].filter(query => query.envelopeId() === envelopeId);
    if (!active.length) {
      return;
    }

    const fresh = await getEnvelope(endpoint, envelopeId);
    active.forEach(query => query.prime(fresh));
  }
}
