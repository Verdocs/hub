import { VerdocsEndpoint } from '@verdocs/js-sdk';
import { act, renderHook, waitFor } from '@testing-library/react';
import { TEST_API_BASE } from '../test/setup';
import { useSession } from './useSession';

describe('useSession', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('settles as unauthenticated when no session is stored', async () => {
    const endpoint = new VerdocsEndpoint({ baseURL: TEST_API_BASE, persist: false });
    const { result } = renderHook(() => useSession(endpoint));

    await waitFor(() => {
      expect(result.current.loaded).toBe(true);
    });

    expect(result.current.authenticated).toBe(false);
    expect(result.current.session).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.endpoint).toBe(endpoint);
  });

  it('updates when the session changes', async () => {
    const endpoint = new VerdocsEndpoint({ baseURL: TEST_API_BASE, persist: false });
    const { result } = renderHook(() => useSession(endpoint));

    await waitFor(() => {
      expect(result.current.loaded).toBe(true);
    });

    // clearSession notifies listeners with a null session.
    act(() => {
      endpoint.clearSession();
    });

    expect(result.current.authenticated).toBe(false);
  });
});
