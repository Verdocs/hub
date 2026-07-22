import { onScopeDispose, ref, shallowRef, type Ref } from 'vue';
import type { IProfile, TSession, VerdocsEndpoint } from '@verdocs/js-sdk';
import { useResolvedEndpoint } from '../provider/useVerdocs';

export interface ISessionState {
  /** True once the initial session check has completed. */
  loaded: Ref<boolean>;
  /** True if a session is active. */
  authenticated: Ref<boolean>;
  session: Ref<TSession>;
  profile: Ref<IProfile | null>;
  endpoint: VerdocsEndpoint;
}

/**
 * Reactive view of the endpoint's session state. Updates whenever the session
 * changes (login, logout, profile switch). Reads the endpoint from the nearest
 * VerdocsProvider unless an override is supplied.
 */
export const useSession = (endpointOverride?: VerdocsEndpoint): ISessionState => {
  const endpoint = useResolvedEndpoint(endpointOverride);

  const loaded = ref(false);
  const authenticated = ref(!!endpoint.session);
  // Sessions and profiles are replaced wholesale by the endpoint, never
  // mutated in place, so shallow refs are enough.
  const session = shallowRef<TSession>(endpoint.session);
  const profile = shallowRef<IProfile | null>(endpoint.profile);

  const unsubscribe = endpoint.onSessionChanged((_endpoint, nextSession, nextProfile) => {
    loaded.value = true;
    authenticated.value = !!nextSession;
    session.value = nextSession;
    profile.value = nextProfile;
  });
  onScopeDispose(unsubscribe);

  endpoint.loadSession();

  // loadSession() notifies synchronously when it finds nothing, but not for
  // non-persisting endpoints. If no notification arrived and no session is
  // pending a profile fetch, settle as unauthenticated so `loaded` is
  // guaranteed to flip after the initial check.
  if (!loaded.value && !endpoint.session) {
    loaded.value = true;
    authenticated.value = false;
    session.value = null;
    profile.value = null;
  }

  return { loaded, authenticated, session, profile, endpoint };
};
