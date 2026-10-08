import type { VerdocsEndpoint } from '@verdocs/js-sdk';

/**
 * Base URL of the Verdocs web app that matches an endpoint's environment. Components that
 * link a sender to their settings pages (branding, webhooks) use this, because beta and
 * production do not share a host and a link to the wrong one lands on a login screen.
 *
 * ```typescript
 * const brandingUrl = `${getWebAppUrl(endpoint)}/settings/branding`;
 * ```
 */
export const getWebAppUrl = (endpoint: VerdocsEndpoint) =>
  (endpoint.getEnvironment() === 'beta' ? 'https://beta.verdocs.com' : 'https://app.verdocs.com');
