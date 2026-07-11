import type { InjectionKey } from 'vue';
import type { VerdocsEndpoint } from '@verdocs/js-sdk';

/**
 * Injection key under which VerdocsProvider supplies its endpoint. Exported so
 * tests (and hosts with unusual embedding needs) can provide an endpoint
 * without mounting the provider component.
 */
export const VERDOCS_ENDPOINT_KEY = Symbol('VerdocsEndpoint') as InjectionKey<VerdocsEndpoint>;
