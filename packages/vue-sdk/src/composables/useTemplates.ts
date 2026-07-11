import { getTemplates } from '@verdocs/js-sdk';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import type { IGetTemplatesParams, VerdocsEndpoint } from '@verdocs/js-sdk';
import { useResolvedEndpoint } from '../provider/useVerdocs';

/**
 * List templates accessible to the caller. Thin TanStack Query wrapper over
 * js-sdk's getTemplates. Previous results are kept while a new page or filter
 * set loads, so paginated UIs do not flicker.
 */
export const useTemplates = (params: MaybeRefOrGetter<IGetTemplatesParams> = {}, endpointOverride?: VerdocsEndpoint) => {
  const endpoint = useResolvedEndpoint(endpointOverride);

  // Normalized to a ref so it can sit in the query key: vue-query tracks refs
  // in keys and unwraps them before hashing, which keeps the serialized key
  // interchangeable with the React SDK's ['templates', 'list', params].
  const resolvedParams = computed(() => toValue(params));

  return useQuery({
    queryKey: [ 'templates', 'list', resolvedParams ],
    queryFn: () => getTemplates(endpoint, resolvedParams.value),
    placeholderData: keepPreviousData,
  });
};
