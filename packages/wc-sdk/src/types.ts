import type { IProfile, ITemplate, TSession, VerdocsEndpoint } from '@verdocs/js-sdk';

/**
 * Carried by vdocs-sdk-error events when the lower-level JS SDK emits an error.
 */
export class SDKError extends Error {
  statusCode: number | undefined;
  response: unknown;

  constructor(message: string, statusCode?: number, response?: unknown) {
    super(message || 'SDK Error');
    this.statusCode = statusCode;
    this.response = response;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Carried by vdocs-authenticated events whenever the session state changes.
 */
export interface IAuthStatus {
  authenticated: boolean;
  session: TSession;
  profile: IProfile | null;
}

/**
 * Carried by template-row events fired by vdocs-templates-list.
 */
export interface ITemplateEvent {
  endpoint: VerdocsEndpoint;
  template: ITemplate;
}
