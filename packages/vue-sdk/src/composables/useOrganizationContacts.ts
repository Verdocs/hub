import { useQuery } from '@tanstack/vue-query';
import type { VerdocsEndpoint } from '@verdocs/js-sdk';
import { getOrganizationContacts } from '@verdocs/js-sdk';
import { useSession } from './useSession';

/**
 * The caller's organization contacts, the address book behind recipient pickers. The call is
 * scoped to the session's organization by the server, so it takes no parameters, and it stays
 * idle without a session because the server has nobody to scope it to. Mirrors the React SDK's
 * useOrganizationContacts, key `['organizationContacts', 'list']`.
 */
export const useOrganizationContacts = (endpointOverride?: VerdocsEndpoint) => {
  // React re-reads endpoint.session on every render, which a setup function does not get. The
  // session composable turns it into a ref so the query enables itself when a login lands.
  const { authenticated, endpoint } = useSession(endpointOverride);

  return useQuery({
    queryKey: [ 'organizationContacts', 'list' ],
    queryFn: () => getOrganizationContacts(endpoint),
    enabled: authenticated,
  });
};
