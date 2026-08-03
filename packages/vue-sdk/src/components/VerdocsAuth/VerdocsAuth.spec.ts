import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import { flushPromises, mount } from '@vue/test-utils';
import { makeTestJwt, TEST_API_BASE } from '../../test/support';
import { VERDOCS_ENDPOINT_KEY } from '../../provider/keys';
import VerdocsAuth from './VerdocsAuth.vue';

describe('VerdocsAuth', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    localStorage.clear();

    // Endpoints created after this point (the test endpoint and the
    // component's temp endpoint) inherit the mocked default adapter via
    // axios.create().
    mock = new MockAdapter(axios);
    mock.onGet('/v2/profiles').reply(200, []);
  });

  afterEach(() => {
    mock.restore();
  });

  const mountAuth = (props = {}) => {
    const endpoint = new VerdocsEndpoint({ baseURL: TEST_API_BASE, persist: false });
    return mount(VerdocsAuth, {
      props,
      global: {
        provide: { [VERDOCS_ENDPOINT_KEY as symbol]: endpoint },
      },
    });
  };

  const setInput = async (wrapper: ReturnType<typeof mountAuth>, index: number, value: string) => {
    await wrapper.findAll('input')[index]!.setValue(value);
  };

  it('renders the login form by default', () => {
    const wrapper = mountAuth();

    expect(wrapper.text()).toContain('Log in to your account');
    expect(wrapper.find('input[type="email"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
    expect(wrapper.findAll('button').some(button => button.text() === 'Login')).toBe(true);
  });

  it('fires authenticated(false) after the initial session check finds nothing', () => {
    const wrapper = mountAuth();

    expect(wrapper.emitted('authenticated')).toEqual([ [ { authenticated: false, session: null, profile: null } ] ]);
  });

  it('starts in the requested mode', () => {
    const wrapper = mountAuth({ initialMode: 'forgot' });

    expect(wrapper.text()).toContain('Forgot your password?');
    expect(wrapper.findAll('button').some(button => button.text() === 'Request Code')).toBe(true);
  });

  it('switches to signup mode and enforces password complexity', async () => {
    const wrapper = mountAuth();

    await wrapper.findAll('button').find(button => button.text() === 'Sign Up')!.trigger('click');
    expect(wrapper.text()).toContain('Sign up for a free account');

    await setInput(wrapper, 0, 'Test');
    await setInput(wrapper, 1, 'User');
    await setInput(wrapper, 2, 'test@example.com');
    await setInput(wrapper, 3, 'weakling');
    await setInput(wrapper, 4, 'weakling');
    await setInput(wrapper, 5, '+15551234567');
    await setInput(wrapper, 6, 'Test Org');

    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(document.querySelector('.vdocs-toast')?.textContent).toContain('Password must be at least 8 characters');
  });

  it('routes unverified logins to the verification step', async () => {
    mock.onPost('/v2/oauth2/token').reply(200, { access_token: makeTestJwt() });
    mock.onGet('/v2/users/me').reply(200, { email_verified: false });

    const wrapper = mountAuth();

    await setInput(wrapper, 0, 'test@example.com');
    await setInput(wrapper, 1, 'Password1!');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    const tokenRequest = mock.history.post.find(request => request.url === '/v2/oauth2/token');
    expect(JSON.parse(String(tokenRequest?.data))).toEqual({
      username: 'test@example.com',
      password: 'Password1!',
      grant_type: 'password',
    });
    expect(wrapper.text()).toContain('verification code');
  });

  it('shows a toast on failed logins', async () => {
    mock.onPost('/v2/oauth2/token').reply(401, { error: 'invalid_grant' });

    const wrapper = mountAuth();

    await setInput(wrapper, 0, 'test@example.com');
    await setInput(wrapper, 1, 'wrong');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(document.querySelector('.vdocs-toast')?.textContent).toContain('Login failed');
  });

  it('renders nothing when visible is false', () => {
    const wrapper = mountAuth({ visible: false });

    expect(wrapper.find('form').exists()).toBe(false);
  });
});
