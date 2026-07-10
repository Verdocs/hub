import { createContext, useContext } from 'react';
import type { VerdocsEndpoint } from '@verdocs/js-sdk';

export interface IVerdocsContext {
  endpoint: VerdocsEndpoint;
}

export const VerdocsContext = createContext<IVerdocsContext | null>(null);

/**
 * Access the VerdocsEndpoint supplied by the nearest VerdocsProvider.
 */
export const useVerdocs = (): IVerdocsContext => {
  const context = useContext(VerdocsContext);
  if (!context) {
    throw new Error('useVerdocs must be used within a <VerdocsProvider>');
  }

  return context;
};

/**
 * Resolve the endpoint for a component: an explicit prop override wins,
 * otherwise the nearest provider's endpoint is used. Components that support
 * dual-session scenarios (a signing flow inside a user app) pass their
 * endpoint prop here.
 */
export const useResolvedEndpoint = (override?: VerdocsEndpoint): VerdocsEndpoint => {
  const context = useContext(VerdocsContext);
  if (override) {
    return override;
  }

  if (!context) {
    throw new Error('Verdocs components need a <VerdocsProvider> ancestor or an explicit endpoint prop');
  }

  return context.endpoint;
};
