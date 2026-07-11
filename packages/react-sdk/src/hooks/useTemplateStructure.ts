import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { IRole, ITemplateField, VerdocsEndpoint } from '@verdocs/js-sdk';
import {
  createField,
  createTemplateRole,
  deleteField,
  deleteTemplateRole,
  updateField,
  updateTemplateRole,
} from '@verdocs/js-sdk';
import { useResolvedEndpoint } from '../provider/VerdocsContext';

/**
 * Mutations for a template's structure (roles and fields). Roles and fields
 * ride inside the template detail response, so every mutation invalidates the
 * template's detail entry and its lists; the fresh template is the source of
 * truth rather than hand-merging partial responses.
 */

const useTemplateStructureMutation = <TVariables, TResult>(
  endpointOverride: VerdocsEndpoint | undefined,
  mutationFn: (endpoint: VerdocsEndpoint, variables: TVariables) => Promise<TResult>,
) => {
  const endpoint = useResolvedEndpoint(endpointOverride);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: TVariables & { templateId: string }) => mutationFn(endpoint, variables),
    onSuccess: (_result, variables) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['templates', variables.templateId] }),
        queryClient.invalidateQueries({ queryKey: ['templates', 'list'] }),
      ]),
  });
};

export const useCreateTemplateRole = (endpointOverride?: VerdocsEndpoint) =>
  useTemplateStructureMutation(endpointOverride, (endpoint, { templateId, role }: { templateId: string; role: IRole }) =>
    createTemplateRole(endpoint, templateId, role));

export const useUpdateTemplateRole = (endpointOverride?: VerdocsEndpoint) =>
  useTemplateStructureMutation(
    endpointOverride,
    (endpoint, { templateId, name, params }: { templateId: string; name: string; params: Partial<IRole> }) =>
      updateTemplateRole(endpoint, templateId, name, params),
  );

export const useDeleteTemplateRole = (endpointOverride?: VerdocsEndpoint) =>
  useTemplateStructureMutation(endpointOverride, (endpoint, { templateId, name }: { templateId: string; name: string }) =>
    deleteTemplateRole(endpoint, templateId, name));

export const useCreateTemplateField = (endpointOverride?: VerdocsEndpoint) =>
  useTemplateStructureMutation(
    endpointOverride,
    (endpoint, { templateId, field }: { templateId: string; field: ITemplateField }) => createField(endpoint, templateId, field),
  );

export const useUpdateTemplateField = (endpointOverride?: VerdocsEndpoint) =>
  useTemplateStructureMutation(
    endpointOverride,
    (endpoint, { templateId, name, params }: { templateId: string; name: string; params: Partial<ITemplateField> }) =>
      updateField(endpoint, templateId, name, params),
  );

export const useDeleteTemplateField = (endpointOverride?: VerdocsEndpoint) =>
  useTemplateStructureMutation(endpointOverride, (endpoint, { templateId, name }: { templateId: string; name: string }) =>
    deleteField(endpoint, templateId, name));
