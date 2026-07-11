import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { IProfile, TSession, VerdocsEndpoint } from '@verdocs/js-sdk';

/**
 * Reactive view of an endpoint's session state. Requests a host update
 * whenever the session changes (login, logout, profile switch), mirroring
 * react-sdk's useSession. The endpoint is re-read from the callback on every
 * host update, so an element's `endpoint` property override can change at
 * runtime and the controller follows it.
 */
export class SessionController implements ReactiveController {
  /** True once the initial session check has completed. */
  loaded = false;
  session: TSession = null;
  profile: IProfile | null = null;

  private attachedEndpoint?: VerdocsEndpoint;
  private unsubscribe?: () => void;

  constructor(
    private host: ReactiveControllerHost,
    private getEndpoint: () => VerdocsEndpoint,
    private onChange?: () => void,
  ) {
    host.addController(this);
  }

  get authenticated() {
    return !!this.session;
  }

  get endpoint(): VerdocsEndpoint {
    return this.attachedEndpoint ?? this.getEndpoint();
  }

  hostConnected() {
    this.attach();
  }

  hostUpdate() {
    // Follow endpoint property overrides that changed since we attached.
    if (this.attachedEndpoint && this.getEndpoint() !== this.attachedEndpoint) {
      this.detach();
      this.attach();
    }
  }

  hostDisconnected() {
    this.detach();
  }

  private attach() {
    const endpoint = this.getEndpoint();
    this.attachedEndpoint = endpoint;
    this.session = endpoint.session;
    this.profile = endpoint.profile;

    this.unsubscribe = endpoint.onSessionChanged((_endpoint, session, profile) => {
      this.loaded = true;
      this.session = session;
      this.profile = profile;
      this.host.requestUpdate();
      this.onChange?.();
    });

    endpoint.loadSession();

    // loadSession() notifies synchronously when it finds nothing, but not for
    // non-persisting endpoints. If no notification arrived and no session is
    // pending a profile fetch, settle as unauthenticated so `loaded` is
    // guaranteed to flip after the initial check.
    if (!this.loaded && !endpoint.session) {
      this.loaded = true;
      this.session = null;
      this.profile = null;
      this.host.requestUpdate();
      this.onChange?.();
    }
  }

  private detach() {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.attachedEndpoint = undefined;
    this.loaded = false;
  }
}
