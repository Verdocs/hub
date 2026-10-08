import { useQuery } from '@tanstack/react-query';
import { getOrganization } from '@verdocs/js-sdk';
import type { VerdocsEndpoint } from '@verdocs/js-sdk';
import { useResolvedEndpoint } from '../provider/VerdocsContext';

/**
 * Fetch one organization's settings, e.g. its default brand. Idle until an id is known.
 */
export const useOrganization = (organizationId: string | undefined, endpointOverride?: VerdocsEndpoint) => {
  const endpoint = useResolvedEndpoint(endpointOverride);

  return useQuery({
    queryKey: ['organizations', organizationId],
    queryFn: () => getOrganization(endpoint, organizationId!),
    enabled: !!organizationId,
  });
};
