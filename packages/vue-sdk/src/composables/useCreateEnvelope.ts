import { createEnvelope } from '@verdocs/js-sdk';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import type { IEnvelope, TCreateEnvelopeRequest, VerdocsEndpoint } from '@verdocs/js-sdk';
import { useResolvedEndpoint } from '../provider/useVerdocs';

/**
 * Create an envelope, either from a template or with documents supplied directly. On success
 * the new envelope primes its detail cache entry and envelope lists refetch; the mutation
 * stays pending until they land. Same cache reconciliation as the React SDK's useCreateEnvelope.
 */
export const useCreateEnvelope = (endpointOverride?: VerdocsEndpoint) => {
  const endpoint = useResolvedEndpoint(endpointOverride);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: TCreateEnvelopeRequest) => createEnvelope(endpoint, request),
    onSuccess: (created: IEnvelope) => {
      queryClient.setQueryData([ 'envelopes', created.id ], created);
      return queryClient.invalidateQueries({ queryKey: [ 'envelopes', 'list' ] });
    },
  });
};
