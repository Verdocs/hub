import { getBrands } from '@verdocs/js-sdk';
import { useQuery } from '@tanstack/vue-query';
import type { VerdocsEndpoint } from '@verdocs/js-sdk';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { useResolvedEndpoint } from '../provider/useVerdocs';

/**
 * List the brands an organization has defined. The organization id usually comes from a
 * template or envelope, so the query stays idle until one is known. Mirrors the React SDK's
 * useBrands, key `['brands', 'list', organizationId]` and all.
 */
export const useBrands = (organizationId: MaybeRefOrGetter<string | undefined>, endpointOverride?: VerdocsEndpoint) => {
  const endpoint = useResolvedEndpoint(endpointOverride);

  // Normalized to a ref so it can sit in the query key alongside an enabled guard: vue-query
  // tracks refs in keys and unwraps them before hashing, which keeps the serialized key
  // interchangeable with the React SDK's.
  const resolvedId = computed(() => toValue(organizationId));

  return useQuery({
    queryKey: [ 'brands', 'list', resolvedId ],
    queryFn: () => getBrands(endpoint, resolvedId.value!),
    enabled: () => !!resolvedId.value,
  });
};
