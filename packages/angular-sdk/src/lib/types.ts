import type { IProfile, ITemplate, TSession, VerdocsEndpoint } from '@verdocs/js-sdk';

/**
 * Emitted by sdkError outputs when the lower-level JS SDK reports an error.
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
 * Emitted by VerdocsAuthComponent (and exposed by VerdocsSessionService)
 * whenever the session state changes.
 */
export interface IAuthStatus {
  authenticated: boolean;
  session: TSession;
  profile: IProfile | null;
}

/**
 * Payload for template-row outputs emitted by VerdocsTemplatesListComponent.
 */
export interface ITemplateEvent {
  endpoint: VerdocsEndpoint;
  template: ITemplate;
}
