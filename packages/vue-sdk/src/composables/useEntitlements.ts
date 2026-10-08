import { useQuery } from '@tanstack/vue-query';
import type { VerdocsEndpoint } from '@verdocs/js-sdk';
import { getActiveEntitlements } from '@verdocs/js-sdk';
import { useSession } from './useSession';

/**
 * The organization's currently active entitlements, collapsed to a dictionary keyed by
 * feature: an entry exists only while that feature is in contract. Components read it to
 * decide which paid options to offer, e.g. `!!data.value?.sms_auth` for SMS verification.
 *
 * The call requires a session (the server derives the organization from it), so the query
 * stays idle until one is loaded. Mirrors the React SDK's useEntitlements, key
 * `['entitlements', 'active']`.
 */
export const useEntitlements = (endpointOverride?: VerdocsEndpoint) => {
  // Same reason as useOrganizationContacts: the session has to be a ref for the enabled guard
  // to reopen once a login lands.
  const { authenticated, endpoint } = useSession(endpointOverride);

  return useQuery({
    queryKey: [ 'entitlements', 'active' ],
    queryFn: () => getActiveEntitlements(endpoint),
    enabled: authenticated,
  });
};
