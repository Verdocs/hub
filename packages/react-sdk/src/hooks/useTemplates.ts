import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTemplate, deleteTemplate, getTemplate, getTemplates, updateTemplate } from '@verdocs/js-sdk';
import type { IGetTemplatesParams, ITemplate, ITemplateCreateParams, VerdocsEndpoint } from '@verdocs/js-sdk';
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
 * Fetch a single template by id. The detail cache entry is also primed by the
 * template mutations, so a list-to-detail navigation usually renders warm.
 */
export const useTemplate = (templateId: string | undefined, endpointOverride?: VerdocsEndpoint) => {
  const endpoint = useResolvedEndpoint(endpointOverride);

  return useQuery({
    queryKey: ['templates', templateId],
    queryFn: () => getTemplate(endpoint, templateId!),
    enabled: !!templateId,
  });
};

/**
 * Create a template. On success the detail cache is primed and list queries
 * refetch; the mutation stays pending until they land.
 */
export const useCreateTemplate = (endpointOverride?: VerdocsEndpoint) => {
  const endpoint = useResolvedEndpoint(endpointOverride);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ITemplateCreateParams) => createTemplate(endpoint, params),
    onSuccess: (created: ITemplate) => {
      queryClient.setQueryData(['templates', created.id], created);
      return queryClient.invalidateQueries({ queryKey: ['templates', 'list'] });
    },
  });
};

/**
 * Update a template's settings. Same cache reconciliation as create.
 */
export const useUpdateTemplate = (endpointOverride?: VerdocsEndpoint) => {
  const endpoint = useResolvedEndpoint(endpointOverride);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, params }: { templateId: string; params: Partial<ITemplateCreateParams> }) =>
      updateTemplate(endpoint, templateId, params),
    onSuccess: (updated: ITemplate) => {
      queryClient.setQueryData(['templates', updated.id], updated);
      return queryClient.invalidateQueries({ queryKey: ['templates', 'list'] });
    },
  });
};

/**
 * Delete a template. Drops the detail cache entry and refetches lists.
 */
export const useDeleteTemplate = (endpointOverride?: VerdocsEndpoint) => {
  const endpoint = useResolvedEndpoint(endpointOverride);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => deleteTemplate(endpoint, templateId),
    onSuccess: (_result, templateId) => {
      queryClient.removeQueries({ queryKey: ['templates', templateId] });
      return queryClient.invalidateQueries({ queryKey: ['templates', 'list'] });
    },
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
