import { getEnvelope, getEnvelopes } from '@verdocs/js-sdk';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { IListEnvelopesParams, VerdocsEndpoint } from '@verdocs/js-sdk';
import { useResolvedEndpoint } from '../provider/VerdocsContext';

/**
 * List envelopes visible to the caller. Same conventions as useTemplates:
 * hierarchical keys and kept-previous-data so paging does not flicker.
 */
export const useEnvelopes = (params: IListEnvelopesParams = {}, endpointOverride?: VerdocsEndpoint) => {
  const endpoint = useResolvedEndpoint(endpointOverride);

  return useQuery({
    queryKey: ['envelopes', 'list', params],
    queryFn: () => getEnvelopes(endpoint, params),
    placeholderData: keepPreviousData,
  });
};

/**
 * Fetch a single envelope by id. Recipients see only the metadata they are
 * allowed to view; the server scopes the response.
 */
export const useEnvelope = (envelopeId: string | undefined, endpointOverride?: VerdocsEndpoint) => {
  const endpoint = useResolvedEndpoint(endpointOverride);

  return useQuery({
    queryKey: ['envelopes', envelopeId],
    queryFn: () => getEnvelope(endpoint, envelopeId!),
    enabled: !!envelopeId,
  });
};
