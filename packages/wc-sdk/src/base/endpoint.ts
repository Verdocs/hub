import { VerdocsEndpoint } from '@verdocs/js-sdk';

/**
 * Resolve the endpoint an element should use. Web components have no provider
 * tree, so the js-sdk's default endpoint singleton plays that role: configure
 * it once at startup with `new VerdocsEndpoint({ baseURL }).setDefault()`.
 * Elements that support dual-session scenarios (a signing flow inside a user
 * app) accept an `endpoint` property override, which wins here.
 */
export const resolveEndpoint = (override?: VerdocsEndpoint): VerdocsEndpoint => override ?? VerdocsEndpoint.getDefault();
