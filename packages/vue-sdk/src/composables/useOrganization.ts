import { useQuery } from '@tanstack/vue-query';
import { getOrganization } from '@verdocs/js-sdk';
import type { VerdocsEndpoint } from '@verdocs/js-sdk';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { useResolvedEndpoint } from '../provider/useVerdocs';

/**
 * Fetch one organization's settings, e.g. its default brand. Idle until an id is known.
 * Mirrors the React SDK's useOrganization, key `['organizations', organizationId]`.
 */
export const useOrganization = (organizationId: MaybeRefOrGetter<string | undefined>, endpointOverride?: VerdocsEndpoint) => {
  const endpoint = useResolvedEndpoint(endpointOverride);

  const resolvedId = computed(() => toValue(organizationId));

  return useQuery({
    queryKey: [ 'organizations', resolvedId ],
    queryFn: () => getOrganization(endpoint, resolvedId.value!),
    enabled: () => !!resolvedId.value,
  });
};
