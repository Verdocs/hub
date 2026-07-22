import { VerdocsEndpoint } from '@verdocs/js-sdk';
import { inject, InjectionToken, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';

export interface VerdocsConfig {
  /**
   * Base URL of the Verdocs API, e.g. https://api.verdocs.com. Ignored if an
   * endpoint instance is supplied.
   */
  baseUrl?: string;

  /**
   * A pre-configured VerdocsEndpoint to use. Supply one to share a session
   * with non-Angular code, or to control persistence and session type directly.
   */
  endpoint?: VerdocsEndpoint;
}

export const VERDOCS_ENDPOINT = new InjectionToken<VerdocsEndpoint>('VERDOCS_ENDPOINT');

/**
 * Resolve the endpoint for a component: an explicit input override wins,
 * otherwise the injected endpoint is used. Must be called in an injection
 * context.
 */
export const injectVerdocsEndpoint = (): VerdocsEndpoint => {
  const endpoint = inject(VERDOCS_ENDPOINT, { optional: true });
  if (!endpoint) {
    throw new Error('Verdocs components need provideVerdocs() in your application providers or an explicit endpoint input');
  }

  return endpoint;
};

/**
 * Register the Verdocs endpoint all Verdocs components and services depend on.
 * Add it once to your application providers:
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [provideVerdocs({ baseUrl: 'https://api.verdocs.com' })],
 * });
 * ```
 */
export function provideVerdocs(config: VerdocsConfig = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: VERDOCS_ENDPOINT,
      useFactory: () => {
        const endpoint = config.endpoint ?? new VerdocsEndpoint(config.baseUrl ? { baseURL: config.baseUrl } : undefined);
        if (!config.endpoint) {
          endpoint.setDefault();
        }

        // Load any persisted session immediately so the first requests made by
        // components already carry the session's auth header.
        if (typeof localStorage !== 'undefined') {
          endpoint.loadSession();
        }

        return endpoint;
      },
    },
  ]);
}
