import { useQuery } from '@tanstack/react-query';
import type { VerdocsEndpoint } from '@verdocs/js-sdk';
import { getActiveEntitlements } from '@verdocs/js-sdk';
import { useResolvedEndpoint } from '../provider/VerdocsContext';

/**
 * The organization's currently active entitlements, collapsed to a dictionary keyed by
 * feature: an entry exists only while that feature is in contract. Components read it to
 * decide which paid options to offer, e.g. `!!data?.sms_auth` for SMS verification.
 *
 * The call requires a session (the server derives the organization from it), so the query
 * stays idle until one is loaded.
 */
export const useEntitlements = (endpointOverride?: VerdocsEndpoint) => {
  const endpoint = useResolvedEndpoint(endpointOverride);

  return useQuery({
    queryKey: ['entitlements', 'active'],
    queryFn: () => getActiveEntitlements(endpoint),
    enabled: !!endpoint.session,
  });
};
