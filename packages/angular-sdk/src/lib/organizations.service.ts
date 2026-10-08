import { computed, Injectable, resource, type Signal } from '@angular/core';
import { getActiveEntitlements, getBrands, getOrganization, getOrganizationContacts } from '@verdocs/js-sdk';
import type { IBrand, IEntitlement, IOrganization, IProfile, TEntitlement, VerdocsEndpoint } from '@verdocs/js-sdk';
import { injectVerdocsEndpoint } from './provide-verdocs';

/** The active entitlements, keyed by feature. An entry exists only while that feature is in contract. */
export type TActiveEntitlements = Partial<Record<TEntitlement, IEntitlement>>;

/** The query surface every organization query returns, with TanStack's meanings. */
export interface IOrganizationQuery<T> {
  /** The result, once loaded. Undefined until the first result arrives or while the query is idle. */
  data: Signal<T | undefined>;
  /** True until the first result arrives. */
  isPending: Signal<boolean>;
  /** True whenever a fetch is in flight, including background refreshes. */
  isFetching: Signal<boolean>;
  error: Signal<unknown>;
  reload: () => void;
}

/**
 * Signal-based data access for the organization records components read alongside templates
 * and envelopes: brands, settings, the contacts address book, and entitlements. Query keys
 * deliberately mirror @verdocs/react-sdk's TanStack Query hooks: ['brands', 'list',
 * organizationId], ['organizations', organizationId], ['organizationContacts', 'list'], and
 * ['entitlements', 'active']. All four are read-only, so nothing here invalidates anything.
 */
@Injectable({ providedIn: 'root' })
export class VerdocsOrganizationsService {
  private readonly defaultEndpoint = injectVerdocsEndpoint();

  /**
   * List the brands an organization has defined. The organization id usually comes from a
   * template or envelope, so the query stays idle until one is known, matching React's
   * enabled: !!organizationId. Call from an injection context.
   */
  brands(organizationId: Signal<string | undefined>, endpointOverride?: Signal<VerdocsEndpoint | undefined>): IOrganizationQuery<IBrand[]> {
    const brandsResource = resource({
      params: () => {
        const id = organizationId();
        return id ? { key: [ 'brands', 'list', id ] as const, endpoint: endpointOverride?.() ?? this.defaultEndpoint } : undefined;
      },
      loader: ({ params: p }) => getBrands(p.endpoint, p.key[2]),
    });

    return toQuery<IBrand[]>(brandsResource);
  }

  /**
   * Fetch one organization's settings, e.g. its default brand. Idle until an id is known.
   * Call from an injection context.
   */
  organization(
    organizationId: Signal<string | undefined>,
    endpointOverride?: Signal<VerdocsEndpoint | undefined>,
  ): IOrganizationQuery<IOrganization> {
    const organizationResource = resource({
      params: () => {
        const id = organizationId();
        return id ? { key: [ 'organizations', id ] as const, endpoint: endpointOverride?.() ?? this.defaultEndpoint } : undefined;
      },
      loader: ({ params: p }) => getOrganization(p.endpoint, p.key[1]),
    });

    return toQuery<IOrganization>(organizationResource);
  }

  /**
   * The caller's organization contacts, the address book behind recipient pickers. The server
   * scopes the call to the session's organization, so it takes no parameters and stays idle
   * until the caller is signed in: pass a signal of that state, React's enabled:
   * !!endpoint.session. Call from an injection context.
   */
  contacts(enabled: Signal<boolean>, endpointOverride?: Signal<VerdocsEndpoint | undefined>): IOrganizationQuery<IProfile[]> {
    const contactsResource = resource({
      params: () => (enabled() ? { key: [ 'organizationContacts', 'list' ] as const, endpoint: endpointOverride?.() ?? this.defaultEndpoint } : undefined),
      loader: ({ params: p }) => getOrganizationContacts(p.endpoint),
    });

    return toQuery<IProfile[]>(contactsResource);
  }

  /**
   * The organization's currently active entitlements, collapsed to a dictionary keyed by
   * feature. Components read it to decide which paid options to offer, e.g. `!!data()?.sms_auth`
   * for SMS verification. The server derives the organization from the session, so this takes
   * the same enabled signal as contacts(). Call from an injection context.
   */
  entitlements(enabled: Signal<boolean>, endpointOverride?: Signal<VerdocsEndpoint | undefined>): IOrganizationQuery<TActiveEntitlements> {
    const entitlementsResource = resource({
      params: () => (enabled() ? { key: [ 'entitlements', 'active' ] as const, endpoint: endpointOverride?.() ?? this.defaultEndpoint } : undefined),
      loader: ({ params: p }) => getActiveEntitlements(p.endpoint),
    });

    return toQuery<TActiveEntitlements>(entitlementsResource);
  }
}

interface IResourceLike<T> {
  hasValue: () => boolean;
  value: () => T | undefined;
  status: () => string;
  isLoading: () => boolean;
  error: () => unknown;
  reload: () => void;
}

const toQuery = <T>(source: IResourceLike<T>): IOrganizationQuery<T> => ({
  data: computed(() => (source.hasValue() ? source.value() : undefined)),
  isPending: computed(() => !source.hasValue() && source.status() !== 'error'),
  isFetching: computed(() => source.isLoading()),
  error: computed(() => (source.status() === 'error' ? source.error() : null)),
  reload: () => source.reload(),
});
