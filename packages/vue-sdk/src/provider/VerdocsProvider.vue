<script lang="ts">
import { QueryClient } from '@tanstack/vue-query';
import { VerdocsEndpoint } from '@verdocs/js-sdk';

/**
 * Props for VerdocsProvider, which supplies the API endpoint and query cache
 * all Verdocs components depend on. Wrap your app (or the subtree hosting
 * Verdocs components) once:
 *
 * ```vue
 * <VerdocsProvider base-url="https://api.verdocs.com">
 *   <App />
 * </VerdocsProvider>
 * ```
 */
export interface VerdocsProviderProps {
  /**
   * Base URL of the Verdocs API, e.g. https://api.verdocs.com. Ignored if an
   * endpoint instance is supplied.
   */
  baseUrl?: string;

  /**
   * A pre-configured VerdocsEndpoint to use. Supply one to share a session
   * with non-Vue code, or to control persistence and session type directly.
   */
  endpoint?: VerdocsEndpoint;

  /**
   * By default the provider owns an internal TanStack Query client. Apps that
   * already use vue-query may pass their own client to share one cache.
   */
  queryClient?: QueryClient;
}
</script>

<script setup lang="ts">
import { onScopeDispose, provide } from 'vue';
import { VUE_QUERY_CLIENT } from '@tanstack/vue-query';
import { VERDOCS_ENDPOINT_KEY } from './keys';

const { baseUrl, endpoint, queryClient } = defineProps<VerdocsProviderProps>();

// The endpoint and client resolve once, at setup. Mirroring the React
// provider, later prop changes are ignored: swapping endpoints mid-flight
// would strand every mounted component's queries and listeners.
const resolvedEndpoint = endpoint ?? new VerdocsEndpoint(baseUrl ? { baseURL: baseUrl } : undefined);
if (!endpoint) {
  resolvedEndpoint.setDefault();
}

// Load any persisted session now, before children mount, so queries fired
// on first render already carry the session's auth header.
if (typeof localStorage !== 'undefined') {
  resolvedEndpoint.loadSession();
}

const client = queryClient ?? new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60000,
      refetchOnWindowFocus: true,
    },
  },
});

provide(VERDOCS_ENDPOINT_KEY, resolvedEndpoint);

// vue-query has no provider component; it normally installs app-wide through
// VueQueryPlugin. Providing under its public injection key scopes the cache
// to this subtree instead, and mount/unmount wires up the window focus and
// online listeners the plugin would otherwise manage.
provide(VUE_QUERY_CLIENT, client);
client.mount();
onScopeDispose(() => client.unmount());
</script>

<template>
  <slot />
</template>
