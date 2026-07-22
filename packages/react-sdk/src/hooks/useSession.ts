import { useEffect, useState } from 'react';
import type { IProfile, TSession, VerdocsEndpoint } from '@verdocs/js-sdk';
import { useResolvedEndpoint } from '../provider/VerdocsContext';

export interface ISessionState {
  /** True once the initial session check has completed. */
  loaded: boolean;
  /** True if a session is active. */
  authenticated: boolean;
  session: TSession;
  profile: IProfile | null;
  endpoint: VerdocsEndpoint;
}

/**
 * Reactive view of the endpoint's session state. Re-renders whenever the
 * session changes (login, logout, profile switch). Reads the endpoint from
 * the nearest VerdocsProvider unless an override is supplied.
 */
export const useSession = (endpointOverride?: VerdocsEndpoint): ISessionState => {
  const endpoint = useResolvedEndpoint(endpointOverride);
  const [state, setState] = useState<Omit<ISessionState, 'endpoint'>>(() => ({
    loaded: false,
    authenticated: !!endpoint.session,
    session: endpoint.session,
    profile: endpoint.profile,
  }));

  useEffect(() => {
    const unsubscribe = endpoint.onSessionChanged((_endpoint, session, profile) => {
      setState({ loaded: true, authenticated: !!session, session, profile });
    });

    endpoint.loadSession();

    // loadSession() notifies synchronously when it finds nothing, but not for
    // non-persisting endpoints. If no notification arrived and no session is
    // pending a profile fetch, settle as unauthenticated so `loaded` is
    // guaranteed to flip after the initial check.
    setState(previous => {
      if (previous.loaded || endpoint.session) {
        return previous;
      }

      return { loaded: true, authenticated: false, session: null, profile: null };
    });

    return unsubscribe;
  }, [endpoint]);

  return { ...state, endpoint };
};
