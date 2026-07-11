import type { IProfile, ITemplate, TSession, VerdocsEndpoint } from '@verdocs/js-sdk';

/**
 * Passed to sdkError handlers when the lower-level JS SDK emits an error.
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
 * Reported by VerdocsAuth (and useSession) whenever the session state changes.
 */
export interface IAuthStatus {
  authenticated: boolean;
  session: TSession;
  profile: IProfile | null;
}

/**
 * Payload for template-row events fired by VerdocsTemplatesList.
 */
export interface ITemplateEvent {
  endpoint: VerdocsEndpoint;
  template: ITemplate;
}
