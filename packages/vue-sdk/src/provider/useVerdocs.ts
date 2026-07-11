import { inject } from 'vue';
import type { VerdocsEndpoint } from '@verdocs/js-sdk';
import { VERDOCS_ENDPOINT_KEY } from './keys';

export interface IVerdocsContext {
  endpoint: VerdocsEndpoint;
}

/**
 * Access the VerdocsEndpoint supplied by the nearest VerdocsProvider.
 */
export const useVerdocs = (): IVerdocsContext => {
  const endpoint = inject(VERDOCS_ENDPOINT_KEY, null);
  if (!endpoint) {
    throw new Error('useVerdocs must be used within a <VerdocsProvider>');
  }

  return { endpoint };
};

/**
 * Resolve the endpoint for a component: an explicit prop override wins,
 * otherwise the nearest provider's endpoint is used. Components that support
 * dual-session scenarios (a signing flow inside a user app) pass their
 * endpoint prop here.
 */
export const useResolvedEndpoint = (override?: VerdocsEndpoint): VerdocsEndpoint => {
  if (override) {
    return override;
  }

  const endpoint = inject(VERDOCS_ENDPOINT_KEY, null);
  if (!endpoint) {
    throw new Error('Verdocs components need a <VerdocsProvider> ancestor or an explicit endpoint prop');
  }

  return endpoint;
};
