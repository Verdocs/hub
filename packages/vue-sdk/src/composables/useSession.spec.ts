import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import { useSession, type ISessionState } from './useSession';

// The composable needs a component scope for its listener cleanup, so specs
// mount a minimal probe and assert against the returned refs.
const mountSession = (endpoint: VerdocsEndpoint) => {
  let state!: ISessionState;
  const Probe = defineComponent({
    setup() {
      state = useSession(endpoint);
      return () => h('div');
    },
  });

  const wrapper = mount(Probe);
  return { wrapper, state };
};

describe('useSession', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('settles as unauthenticated when no session is stored', () => {
    const endpoint = new VerdocsEndpoint({ baseURL: 'https://stage-api.verdocs.com', persist: false });
    const { state } = mountSession(endpoint);

    expect(state.loaded.value).toBe(true);
    expect(state.authenticated.value).toBe(false);
    expect(state.session.value).toBeNull();
    expect(state.profile.value).toBeNull();
    expect(state.endpoint).toBe(endpoint);
  });

  it('updates when the session changes', () => {
    const endpoint = new VerdocsEndpoint({ baseURL: 'https://stage-api.verdocs.com', persist: false });
    const { state } = mountSession(endpoint);

    expect(state.loaded.value).toBe(true);

    // clearSession notifies listeners with a null session.
    endpoint.clearSession();

    expect(state.authenticated.value).toBe(false);
    expect(state.session.value).toBeNull();
  });
});
