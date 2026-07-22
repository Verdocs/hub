import { getTemplates } from '@verdocs/js-sdk';
import type { IGetTemplatesParams, ITemplate, VerdocsEndpoint } from '@verdocs/js-sdk';
import { computed, DestroyRef, inject, Injectable, linkedSignal, resource, signal, type Signal } from '@angular/core';
import { injectVerdocsEndpoint } from './provide-verdocs';

/**
 * js-sdk 6.10.0's toggleTemplateStar posts to /v2/templates/:id/stars/toggle,
 * a route the current API does not serve (the conformance suite caught the
 * drift). The deployed route is GET /v2/templates/:id/star, so call that
 * directly until js-sdk catches up. Note the deployed handler currently 400s
 * due to a server-side validation bug (see hub/STATUS.md), so this works end
 * to end only once the API fix ships.
 */
const toggleTemplateStar = (endpoint: VerdocsEndpoint, templateId: string): Promise<ITemplate> =>
  endpoint.api.get<ITemplate>(`/v2/templates/${templateId}/star`).then(r => r.data);

export interface ITemplatesPage {
  count: number;
  rows: number;
  page: number;
  templates: ITemplate[];
}

export interface ITemplatesQuery {
  /** The latest page of results. Previous results are kept while a new page or filter set loads. */
  data: Signal<ITemplatesPage | undefined>;
  /** True until the first result arrives. */
  isPending: Signal<boolean>;
  /** True whenever a fetch is in flight, including background refreshes. */
  isFetching: Signal<boolean>;
  error: Signal<unknown>;
  reload: () => void;
}

/**
 * Signal-based data access for templates. Query keys and invalidation
 * semantics deliberately mirror @verdocs/react-sdk's TanStack Query hooks:
 * a list query lives under ['templates', 'list', params] and toggling a star
 * reloads every active list query.
 */
@Injectable({ providedIn: 'root' })
export class VerdocsTemplatesService {
  private readonly defaultEndpoint = injectVerdocsEndpoint();
  private readonly activeListQueries = new Set<() => void>();

  /**
   * Create a reactive templates list query. Call from an injection context
   * (constructor or field initializer); the query is cleaned up with it.
   * The params signal is tracked: changing filters or pages refetches. The
   * optional endpoint signal supports per-component endpoint overrides.
   */
  templates(params: Signal<IGetTemplatesParams>, endpointOverride?: Signal<VerdocsEndpoint | undefined>): ITemplatesQuery {
    const templatesResource = resource({
      params: () => ({
        key: [ 'templates', 'list', params() ] as const,
        endpoint: endpointOverride?.() ?? this.defaultEndpoint,
      }),
      loader: ({ params: p }) => getTemplates(p.endpoint, p.key[2]),
    });

    // Keep showing the previous page while the next one loads, so paginated
    // UIs do not flash empty.
    const data = linkedSignal<ITemplatesPage | undefined, ITemplatesPage | undefined>({
      source: () => (templatesResource.hasValue() ? templatesResource.value() : undefined),
      computation: (next, previous) => next ?? previous?.value,
    });

    const reload = () => templatesResource.reload();

    this.activeListQueries.add(reload);
    inject(DestroyRef).onDestroy(() => this.activeListQueries.delete(reload));

    return {
      data: computed(() => data()),
      isPending: computed(() => data() === undefined && templatesResource.status() !== 'error'),
      isFetching: computed(() => templatesResource.isLoading()),
      error: computed(() => (templatesResource.status() === 'error' ? templatesResource.error() : null)),
      reload,
    };
  }

  /**
   * Toggle the caller's star on a template, then reload any active template
   * list queries so counts stay fresh.
   */
  async toggleStar(templateId: string, endpointOverride?: VerdocsEndpoint): Promise<ITemplate> {
    const endpoint = endpointOverride ?? this.defaultEndpoint;
    const updated = await toggleTemplateStar(endpoint, templateId);
    this.invalidateLists();
    return updated;
  }

  /** Reload every active templates list query. */
  invalidateLists() {
    this.activeListQueries.forEach(reload => reload());
  }
}

/** Small stateful helper for star toggling with a pending flag. */
export const createStarToggle = (service: VerdocsTemplatesService, endpointOverride?: Signal<VerdocsEndpoint | undefined>) => {
  const isPending = signal(false);

  return {
    isPending: isPending.asReadonly(),
    toggle: async (templateId: string): Promise<ITemplate> => {
      isPending.set(true);
      try {
        return await service.toggleStar(templateId, endpointOverride?.());
      } finally {
        isPending.set(false);
      }
    },
  };
};
