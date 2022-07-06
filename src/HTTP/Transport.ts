/**
 * The Transport is a global singleton used to call Verdocs APIs. There can only be one Transport per application, and
 * its configuration settings are shared for all callers. This is a simplified form of the Endpoint class where most
 * tasks such as general session-token-management are handled automatically for the caller.
 *
 * @module
 */

import {VerdocsEndpoint} from './VerdocsEndpoint';
import globalThis from './globalThis';

// @credit https://derickbailey.com/2016/03/09/creating-a-true-singleton-in-node-js-with-es6-symbols/
// Also see globalThis for comments about why we're doing this in the first place.
const ENDPOINT_KEY = Symbol.for('verdocs-api-endpoint');
if (!globalThis[ENDPOINT_KEY]) {
  globalThis[ENDPOINT_KEY] = new VerdocsEndpoint();
}

const globalEndpoint = globalThis[ENDPOINT_KEY] as VerdocsEndpoint;
let activeEndpoint = globalEndpoint;

/**
 * Helper to get the endpoint for direct access to HTTP functions.
 *
 * ```typescript
 * import {Transport} from '@verdocs/js-sdk/HTTP';
 *
 * console.log('Current timeout', Transport.getEndpoint().defaults.timeout);
 * ```
 */
export const getEndpoint = () => {
  return activeEndpoint;
};

/**
 * Change the endpoint that will be used when making calls to Verdocs. Only one endpoint may be active at a time.
 * Authorization and other configuration data is specific to each endpoint, and will not be carried over when the
 * endpoint is changed. The typical use-case is to change to a sandboxed endpoint for signing sessions, then revert
 * to the global endpoint when the signing session is complete. To revert, pass `null` as the endpoint to use.
 *
 * ```typescript
 * import {Transport} from '@verdocs/js-sdk/HTTP';
 *
 * const mySigningEndpoint = new VerdocsEndpoint();
 * setActiveEndpoint(mySigningEndpoint);
 * ... [Perform signing operations]
 * setActiveEndpoint(null);
 * ```
 */
export const setActiveEndpoint = (e: VerdocsEndpoint | null) => {
  activeEndpoint = e || globalEndpoint;
};
