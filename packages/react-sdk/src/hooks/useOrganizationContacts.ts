import { useQuery } from '@tanstack/react-query';
import type { VerdocsEndpoint } from '@verdocs/js-sdk';
import { getOrganizationContacts } from '@verdocs/js-sdk';
import { useResolvedEndpoint } from '../provider/VerdocsContext';

/**
 * The caller's organization contacts, the address book behind recipient pickers. The call is
 * scoped to the session's organization by the server, so it takes no parameters, and it stays
 * idle without a session because the server has nobody to scope it to.
 */
export const useOrganizationContacts = (endpointOverride?: VerdocsEndpoint) => {
  const endpoint = useResolvedEndpoint(endpointOverride);

  return useQuery({
    queryKey: ['organizationContacts', 'list'],
    queryFn: () => getOrganizationContacts(endpoint),
    enabled: !!endpoint.session,
  });
};
