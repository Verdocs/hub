import { VerdocsEndpoint } from '@verdocs/js-sdk';
import { useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VerdocsContext } from './VerdocsContext';

export interface VerdocsProviderProps {
  /**
   * Base URL of the Verdocs API, e.g. https://api.verdocs.com. Ignored if an
   * endpoint instance is supplied.
   */
  baseUrl?: string;

  /**
   * A pre-configured VerdocsEndpoint to use. Supply one to share a session
   * with non-React code, or to control persistence and session type directly.
   */
  endpoint?: VerdocsEndpoint;

  /**
   * By default the provider owns an internal TanStack Query client. Apps that
   * already use TanStack Query may pass their own client to share one cache.
   */
  queryClient?: QueryClient;

  children: ReactNode;
}

/**
 * Supplies the API endpoint and query cache all Verdocs components depend on.
 * Wrap your app (or the subtree hosting Verdocs components) once:
 *
 * ```tsx
 * <VerdocsProvider baseUrl="https://api.verdocs.com">
 *   <App />
 * </VerdocsProvider>
 * ```
 */
export default function VerdocsProvider({ baseUrl, endpoint, queryClient, children }: VerdocsProviderProps) {
  const [resolvedEndpoint] = useState(() => {
    const resolved = endpoint ?? new VerdocsEndpoint(baseUrl ? { baseURL: baseUrl } : undefined);
    if (!endpoint) {
      resolved.setDefault();
    }

    // Load any persisted session now, before children mount, so queries fired
    // on first render already carry the session's auth header.
    if (typeof localStorage !== 'undefined') {
      resolved.loadSession();
    }

    return resolved;
  });

  const [internalQueryClient] = useState(() => queryClient ?? new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 60000,
        refetchOnWindowFocus: true,
      },
    },
  }));

  const context = useMemo(() => ({ endpoint: resolvedEndpoint }), [resolvedEndpoint]);

  return (
    <VerdocsContext.Provider value={context}>
      <QueryClientProvider client={internalQueryClient}>
        {children}
      </QueryClientProvider>
    </VerdocsContext.Provider>
  );
}
