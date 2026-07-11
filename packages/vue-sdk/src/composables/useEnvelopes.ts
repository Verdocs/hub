import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import type {
  IInPersonLinkResponse,
  IListEnvelopesParams,
  IRecipient,
  IUpdateRecipientParams,
  TEnvelopeUpdateResult,
  VerdocsEndpoint,
} from '@verdocs/js-sdk';
import {
  cancelEnvelope,
  getEnvelope,
  getEnvelopes,
  getInPersonLink,
  remindRecipient,
  resetRecipient,
  updateEnvelope,
  updateRecipient,
} from '@verdocs/js-sdk';
import { useResolvedEndpoint } from '../provider/useVerdocs';

/** The envelope settings updateEnvelope can change, matching the js-sdk call. */
export type TUpdateEnvelopeParams = Parameters<typeof updateEnvelope>[2];

/** Variables for the recipient update mutation: the role to change plus the changed fields. */
export interface IUpdateRecipientVariables {
  roleName: string;
  params: IUpdateRecipientParams;
}

/**
 * List envelopes visible to the caller. Thin TanStack Query wrapper over
 * js-sdk's getEnvelopes. Same conventions as useTemplates: hierarchical keys
 * and kept-previous-data so paging does not flicker.
 */
export const useEnvelopes = (params: MaybeRefOrGetter<IListEnvelopesParams> = {}, endpointOverride?: VerdocsEndpoint) => {
  const endpoint = useResolvedEndpoint(endpointOverride);

  // Normalized to a ref so it can sit in the query key: vue-query tracks refs
  // in keys and unwraps them before hashing, which keeps the serialized key
  // interchangeable with the React SDK's ['envelopes', 'list', params].
  const resolvedParams = computed(() => toValue(params));

  return useQuery({
    queryKey: [ 'envelopes', 'list', resolvedParams ],
    queryFn: () => getEnvelopes(endpoint, resolvedParams.value),
    placeholderData: keepPreviousData,
  });
};

/**
 * Fetch a single envelope by id. Recipients see only the metadata they are
 * allowed to view; the server scopes the response. An undefined id leaves the
 * query idle, matching React's enabled: !!envelopeId.
 */
export const useEnvelope = (envelopeId: MaybeRefOrGetter<string | undefined>, endpointOverride?: VerdocsEndpoint) => {
  const endpoint = useResolvedEndpoint(endpointOverride);

  const resolvedId = computed(() => toValue(envelopeId));

  return useQuery({
    queryKey: [ 'envelopes', resolvedId ],
    queryFn: () => getEnvelope(endpoint, resolvedId.value!),
    enabled: () => !!resolvedId.value,
  });
};

/**
 * Update a recipient's contact details or invite message. Refreshes the
 * envelope's detail family so any mounted views pick up the change, mirroring
 * React's invalidateQueries({ queryKey: ['envelopes', envelopeId] }). The
 * invalidation promise is returned so isPending holds until the refetch lands.
 */
export const useUpdateRecipient = (envelopeId: MaybeRefOrGetter<string>, endpointOverride?: VerdocsEndpoint) => {
  const endpoint = useResolvedEndpoint(endpointOverride);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleName, params }: IUpdateRecipientVariables): Promise<IRecipient> =>
      updateRecipient(endpoint, toValue(envelopeId), roleName, params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ 'envelopes', toValue(envelopeId) ] }),
  });
};

/**
 * Send a reminder to a recipient, keyed by role name. The recipient must still
 * be an active member of the signing flow (not declined, already submitted,
 * etc.). Refreshes the envelope's detail family.
 */
export const useRemindRecipient = (envelopeId: MaybeRefOrGetter<string>, endpointOverride?: VerdocsEndpoint) => {
  const endpoint = useResolvedEndpoint(endpointOverride);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleName: string) => remindRecipient(endpoint, toValue(envelopeId), roleName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ 'envelopes', toValue(envelopeId) ] }),
  });
};

/**
 * Fully reset a recipient, keyed by role name: clears their verification status
 * and sends a new signing invitation. Refreshes the envelope's detail family.
 */
export const useResetRecipient = (envelopeId: MaybeRefOrGetter<string>, endpointOverride?: VerdocsEndpoint) => {
  const endpoint = useResolvedEndpoint(endpointOverride);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleName: string) => resetRecipient(endpoint, toValue(envelopeId), roleName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ 'envelopes', toValue(envelopeId) ] }),
  });
};

/**
 * Update an envelope's settings, typically its reminder schedule. Refreshes the
 * envelope's detail family.
 */
export const useUpdateEnvelope = (envelopeId: MaybeRefOrGetter<string>, endpointOverride?: VerdocsEndpoint) => {
  const endpoint = useResolvedEndpoint(endpointOverride);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: TUpdateEnvelopeParams) => updateEnvelope(endpoint, toValue(envelopeId), params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ 'envelopes', toValue(envelopeId) ] }),
  });
};

/**
 * Cancel an envelope. Cancellation also changes list rows, so the whole
 * ['envelopes'] family refetches, detail and lists alike, the same family-wide
 * invalidation React performs.
 */
export const useCancelEnvelope = (envelopeId: MaybeRefOrGetter<string>, endpointOverride?: VerdocsEndpoint) => {
  const endpoint = useResolvedEndpoint(endpointOverride);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (): Promise<TEnvelopeUpdateResult> => cancelEnvelope(endpoint, toValue(envelopeId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ 'envelopes' ] }),
  });
};

/**
 * Get an in-person signing link for a recipient, keyed by role name. Read-only
 * from the cache's point of view, so nothing is invalidated (matching React).
 */
export const useInPersonLink = (envelopeId: MaybeRefOrGetter<string>, endpointOverride?: VerdocsEndpoint) => {
  const endpoint = useResolvedEndpoint(endpointOverride);

  return useMutation({
    mutationFn: (roleName: string): Promise<IInPersonLinkResponse> => getInPersonLink(endpoint, toValue(envelopeId), roleName),
  });
};
