import { getTemplates } from '@verdocs/js-sdk';
import type { IGetTemplatesParams, ITemplate, VerdocsEndpoint } from '@verdocs/js-sdk';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useResolvedEndpoint } from '../provider/VerdocsContext';
import { toggleTemplateStar } from '../api/templateStar';

/**
 * List templates accessible to the caller. Thin TanStack Query wrapper over
 * js-sdk's getTemplates. Previous results are kept while a new page or filter
 * set loads, so paginated UIs do not flicker.
 */
export const useTemplates = (params: IGetTemplatesParams = {}, endpointOverride?: VerdocsEndpoint) => {
  const endpoint = useResolvedEndpoint(endpointOverride);

  return useQuery({
    queryKey: ['templates', 'list', params],
    queryFn: () => getTemplates(endpoint, params),
    placeholderData: keepPreviousData,
  });
};

/**
 * Toggle the caller's star on a template. Invalidates template list queries on
 * success so any mounted lists refresh their counts.
 */
export const useToggleTemplateStar = (endpointOverride?: VerdocsEndpoint) => {
  const endpoint = useResolvedEndpoint(endpointOverride);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => toggleTemplateStar(endpoint, templateId),
    onSuccess: (updated: ITemplate) => {
      queryClient.setQueryData(['templates', updated.id], updated);
      // Returned so the mutation stays pending until the lists refetch.
      return queryClient.invalidateQueries({ queryKey: ['templates', 'list'] });
    },
  });
};
