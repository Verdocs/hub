import type { IProfile, TSession, VerdocsEndpoint } from '@verdocs/js-sdk';
import { computed, DestroyRef, inject, Injectable, signal, type Signal } from '@angular/core';
import { injectVerdocsEndpoint } from './provide-verdocs';

export interface ISessionSignals {
  /** True once the initial session check has completed. */
  loaded: Signal<boolean>;
  /** True if a session is active. */
  authenticated: Signal<boolean>;
  session: Signal<TSession>;
  profile: Signal<IProfile | null>;
  endpoint: VerdocsEndpoint;
}

/**
 * Build reactive session signals for an endpoint. Used internally by the
 * components (which may target an endpoint override) and by
 * VerdocsSessionService for the app-wide endpoint. Must be called in an
 * injection context so the listener is cleaned up with it.
 */
export const createSessionSignals = (endpoint: VerdocsEndpoint): ISessionSignals => {
  const session = signal<TSession>(endpoint.session);
  const profile = signal<IProfile | null>(endpoint.profile);
  const loaded = signal(false);

  const unsubscribe = endpoint.onSessionChanged((_endpoint, nextSession, nextProfile) => {
    session.set(nextSession);
    profile.set(nextProfile);
    loaded.set(true);
  });

  endpoint.loadSession();

  // loadSession() notifies synchronously when it finds nothing, but not for
  // non-persisting endpoints. If no notification arrived and no session is
  // pending a profile fetch, settle as unauthenticated so `loaded` is
  // guaranteed to flip after the initial check.
  if (!loaded() && !endpoint.session) {
    loaded.set(true);
  }

  inject(DestroyRef).onDestroy(unsubscribe);

  return {
    session: session.asReadonly(),
    profile: profile.asReadonly(),
    loaded: loaded.asReadonly(),
    authenticated: computed(() => !!session()),
    endpoint,
  };
};

/**
 * Reactive view of the application endpoint's session state, for guards,
 * headers, and anything else outside the Verdocs components:
 *
 * ```ts
 * const session = inject(VerdocsSessionService);
 * if (session.authenticated()) { ... }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class VerdocsSessionService {
  private readonly signals = createSessionSignals(injectVerdocsEndpoint());

  readonly endpoint = this.signals.endpoint;
  readonly session = this.signals.session;
  readonly profile = this.signals.profile;
  readonly loaded = this.signals.loaded;
  readonly authenticated = this.signals.authenticated;

  signOut() {
    this.endpoint.clearSession();
  }
}
