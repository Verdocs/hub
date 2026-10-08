import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { IBrand, IOrganization, IProfile, VerdocsEndpoint } from '@verdocs/js-sdk';
import { getActiveEntitlements, getBrands, getOrganization, getOrganizationContacts } from '@verdocs/js-sdk';

/** The dictionary of in-contract entitlements getActiveEntitlements collapses its results into. */
export type TActiveEntitlements = Awaited<ReturnType<typeof getActiveEntitlements>>;

export interface IOrganizationScopedQuery {
  /** The organization to load, or undefined to leave the query idle (react-sdk's enabled: !!organizationId). */
  organizationId: string | undefined;
  endpoint: VerdocsEndpoint;
}

export interface ISessionScopedQuery {
  /** The server scopes these calls to the session's organization, so an endpoint is the whole query. */
  endpoint: VerdocsEndpoint;
}

/**
 * Cache keys mirror @verdocs/react-sdk's TanStack Query keys exactly, so the
 * two SDKs cache and invalidate the same things under the same names.
 */
export const brandsListKey = (organizationId: string) => JSON.stringify([ 'brands', 'list', organizationId ]);

export const organizationKey = (organizationId: string) => JSON.stringify([ 'organizations', organizationId ]);

export const organizationContactsKey = () => JSON.stringify([ 'organizationContacts', 'list' ]);

export const entitlementsKey = () => JSON.stringify([ 'entitlements', 'active' ]);

// Same freshness window as the other stores and the react-sdk provider
// defaults: a remount within 60s serves the cache without a refetch.
const STALE_MS = 60000;

// Keys are namespaced by the helpers above, so one cache serves all four queries.
const cache = new Map<string, { value: unknown; updatedAt: number }>();
const inflight = new Map<string, Promise<unknown>>();
const activeControllers = new Set<OrganizationQueryController<unknown>>();

/**
 * Drop every cached brand, organization, contacts, and entitlements result and
 * reload whatever is mounted. None of these have mutations in the SDK yet, so
 * nothing invalidates them on its own; this exists for hosts (and specs) that
 * change an organization out from under a mounted component.
 */
export const invalidateOrganizationQueries = () => {
  cache.clear();
  activeControllers.forEach(controller => {
    controller.refresh().catch(() => undefined);
  });
};

interface IResolvedQuery<T> {
  key: string;
  fetch: () => Promise<T>;
}

// Concurrent mounts of the same key share one request, the way a shared query
// cache would. Failures retry once before rejecting.
const fetchOnce = <T>(query: IResolvedQuery<T>): Promise<T> => {
  let promise = inflight.get(query.key) as Promise<T> | undefined;
  if (!promise) {
    promise = query
      .fetch()
      .catch(() => query.fetch())
      .finally(() => inflight.delete(query.key));
    inflight.set(query.key, promise);
  }

  return promise;
};

/**
 * Shared behavior for the organization-scoped read queries below: freshness
 * window, request dedupe, and the stale-while-idle rules react-sdk's useQuery
 * applies. The resolver is re-read on every host update, so a host whose
 * organization id or endpoint changes follows along, and a resolver that
 * returns null leaves the query idle.
 */
class OrganizationQueryController<T> implements ReactiveController {
  /** The loaded result, retained across background refreshes. */
  data?: T;
  /** The error from the most recent failed fetch, cleared by the next success. */
  error: unknown;
  /** True whenever a fetch is in flight, including background refreshes. */
  isFetching = false;

  private host: ReactiveControllerHost;
  private resolve: () => IResolvedQuery<T> | null;
  private onError?: (error: unknown) => void;
  private key = '';
  private seq = 0;

  constructor(host: ReactiveControllerHost, resolve: () => IResolvedQuery<T> | null, onError?: (error: unknown) => void) {
    this.host = host;
    this.resolve = resolve;
    this.onError = onError;
    host.addController(this);
  }

  /** True while a fetch is expected but no result has arrived. False for an idle query. */
  get isPending() {
    return this.resolve() !== null && this.data === undefined && this.error === undefined;
  }

  hostConnected() {
    activeControllers.add(this as OrganizationQueryController<unknown>);
    this.sync();
  }

  hostUpdate() {
    this.sync();
  }

  hostDisconnected() {
    activeControllers.delete(this as OrganizationQueryController<unknown>);
    // Invalidate in-flight responses and force a re-sync if we are reattached.
    this.seq++;
    this.key = '';
  }

  /** Force a refetch of the current query, bypassing the freshness window. */
  refresh(): Promise<void> {
    const query = this.resolve();
    if (!query) {
      return Promise.resolve();
    }

    this.key = query.key;
    return this.load(query);
  }

  private sync() {
    const query = this.resolve();

    // Idle query: nothing to load, and no stale result should linger.
    if (!query) {
      if (this.key !== '') {
        this.key = '';
        this.data = undefined;
        this.error = undefined;
      }
      return;
    }

    if (query.key === this.key) {
      return;
    }

    this.key = query.key;

    const cached = cache.get(query.key);
    if (cached) {
      this.data = cached.value as T;
      this.error = undefined;
      if (Date.now() - cached.updatedAt < STALE_MS) {
        return;
      }
    } else {
      // A different key than before: don't show the old result while loading.
      this.data = undefined;
      this.error = undefined;
    }

    this.load(query).catch(() => undefined);
  }

  private async load(query: IResolvedQuery<T>) {
    const mySeq = ++this.seq;
    this.isFetching = true;
    this.host.requestUpdate();

    try {
      const value = await fetchOnce(query);
      if (mySeq !== this.seq || query.key !== this.key) {
        return;
      }

      cache.set(query.key, { value, updatedAt: Date.now() });
      this.data = value;
      this.error = undefined;
    } catch (error) {
      if (mySeq !== this.seq || query.key !== this.key) {
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
 * The brands an organization has defined. The organization id usually comes
 * from a template or envelope, so the query stays idle until one is known.
 * Mirrors react-sdk's useBrands.
 */
export class BrandsController extends OrganizationQueryController<IBrand[]> {
  constructor(host: ReactiveControllerHost, getQuery: () => IOrganizationScopedQuery, onError?: (error: unknown) => void) {
    super(
      host,
      () => {
        const { organizationId, endpoint } = getQuery();
        return organizationId ? { key: brandsListKey(organizationId), fetch: () => getBrands(endpoint, organizationId) } : null;
      },
      onError,
    );
  }
}

/**
 * One organization's settings, e.g. its default brand. Idle until an id is
 * known. Mirrors react-sdk's useOrganization.
 */
export class OrganizationController extends OrganizationQueryController<IOrganization> {
  constructor(host: ReactiveControllerHost, getQuery: () => IOrganizationScopedQuery, onError?: (error: unknown) => void) {
    super(
      host,
      () => {
        const { organizationId, endpoint } = getQuery();
        return organizationId ? { key: organizationKey(organizationId), fetch: () => getOrganization(endpoint, organizationId) } : null;
      },
      onError,
    );
  }
}

/**
 * The caller's organization contacts, the address book behind recipient
 * pickers. The server scopes the call to the session's organization, so it
 * stays idle without a session because the server has nobody to scope it to.
 * Mirrors react-sdk's useOrganizationContacts.
 */
export class OrganizationContactsController extends OrganizationQueryController<IProfile[]> {
  constructor(host: ReactiveControllerHost, getQuery: () => ISessionScopedQuery, onError?: (error: unknown) => void) {
    super(
      host,
      () => {
        const { endpoint } = getQuery();
        return endpoint.session ? { key: organizationContactsKey(), fetch: () => getOrganizationContacts(endpoint) } : null;
      },
      onError,
    );
  }
}

/**
 * The organization's currently active entitlements, keyed by feature: an entry
 * exists only while that feature is in contract. Components read it to decide
 * which paid options to offer, e.g. `!!data?.sms_auth` for SMS verification.
 * Requires a session, so the query is idle without one. Mirrors react-sdk's
 * useEntitlements.
 */
export class EntitlementsController extends OrganizationQueryController<TActiveEntitlements> {
  constructor(host: ReactiveControllerHost, getQuery: () => ISessionScopedQuery, onError?: (error: unknown) => void) {
    super(
      host,
      () => {
        const { endpoint } = getQuery();
        return endpoint.session ? { key: entitlementsKey(), fetch: () => getActiveEntitlements(endpoint) } : null;
      },
      onError,
    );
  }
}
