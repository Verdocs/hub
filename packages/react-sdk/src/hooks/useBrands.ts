import { getBrands } from '@verdocs/js-sdk';
import { useQuery } from '@tanstack/react-query';
import type { VerdocsEndpoint } from '@verdocs/js-sdk';
import { useResolvedEndpoint } from '../provider/VerdocsContext';

/**
 * List the brands an organization has defined. The organization id usually comes from a
 * template or envelope, so the query stays idle until one is known.
 */
export const useBrands = (organizationId: string | undefined, endpointOverride?: VerdocsEndpoint) => {
  const endpoint = useResolvedEndpoint(endpointOverride);

  return useQuery({
    queryKey: ['brands', 'list', organizationId],
    queryFn: () => getBrands(endpoint, organizationId!),
    enabled: !!organizationId,
  });
};
