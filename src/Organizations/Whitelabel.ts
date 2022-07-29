/**
 * White-labeling allows applications to store visual-styling configuration data on the Verdocs servers. This data is not used by
 * Verdocs itself, but may be retrieved later by the application to support changing styles in user interfaces.
 *
 * The advantage to this approach is white-label data is stored at an organization-wide level. If you are building just one
 * application, you may not need this feature. But if you are building an application that may have many different "looks"
 * depending on who the user is (what organization the user is in) this endpoint can be very helpful.
 *
 * @module
 */

import {VerdocsEndpoint} from '../VerdocsEndpoint';

/**
 * Create or update white-label data. The caller's organization ID will be used as the key for the operation.
 *
 * ```typescript
 * import {Whitelabel} from '@verdocs/js-sdk/Organizations';
 *
 * await Whitelabel.setWhitelabel({ logo: '/path/to/logo.png' });
 * ```
 */
export const setWhitelabel = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .post('/whitelabel')
    .then((r) => r.data);

/**
 * Retrieve white-label data.
 *
 * ```typescript
 * import {Whitelabel} from '@verdocs/js-sdk/Organizations';
 *
 * const {logo} = await Whitelabel.getWhitelabel();
 * ```
 */
export const getWhitelabel = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get('/whitelabel')
    .then((r) => r.data);
