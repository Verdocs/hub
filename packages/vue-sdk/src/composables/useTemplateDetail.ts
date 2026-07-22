import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import type { ITemplate, ITemplateCreateParams, VerdocsEndpoint } from '@verdocs/js-sdk';
import { createTemplate, deleteTemplate, getTemplate, updateTemplate } from '@verdocs/js-sdk';
import { useResolvedEndpoint } from '../provider/useVerdocs';

/**
 * Fetch a single template by id. The detail cache entry is also primed by the
 * template mutations, so a list-to-detail navigation usually renders warm.
 * Mirrors the React SDK's useTemplate, key `['templates', id]` and all.
 */
export const useTemplate = (templateId: MaybeRefOrGetter<string | undefined>, endpointOverride?: VerdocsEndpoint) => {
  const endpoint = useResolvedEndpoint(endpointOverride);

  // Normalized to a ref so it can sit in the query key alongside an enabled
  // guard: vue-query tracks refs in keys and unwraps them before hashing, which
  // keeps the serialized key interchangeable with the React SDK's.
  const resolvedId = computed(() => toValue(templateId));

  return useQuery({
    queryKey: [ 'templates', resolvedId ],
    queryFn: () => getTemplate(endpoint, resolvedId.value!),
    enabled: () => !!resolvedId.value,
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
      queryClient.setQueryData([ 'templates', created.id ], created);
      return queryClient.invalidateQueries({ queryKey: [ 'templates', 'list' ] });
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
      queryClient.setQueryData([ 'templates', updated.id ], updated);
      return queryClient.invalidateQueries({ queryKey: [ 'templates', 'list' ] });
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
      queryClient.removeQueries({ queryKey: [ 'templates', templateId ] });
      return queryClient.invalidateQueries({ queryKey: [ 'templates', 'list' ] });
    },
  });
};
