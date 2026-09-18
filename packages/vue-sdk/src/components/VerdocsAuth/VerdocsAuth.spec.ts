import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import { flushPromises, mount } from '@vue/test-utils';
import type { ISocialProviders } from '@verdocs/js-sdk';
import { makeTestJwt, TEST_API_BASE } from '../../test/support';
import { VERDOCS_ENDPOINT_KEY } from '../../provider/keys';
import VerdocsAuth from './VerdocsAuth.vue';

describe('VerdocsAuth', () => {
  let mock: MockAdapter;
  let providers: ISocialProviders;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState({}, '', '/');
    providers = { google: false, microsoft: false };

    // Endpoints created after this point (the test endpoint and the
    // component's temp endpoint) inherit the mocked default adapter via
    // axios.create().
    mock = new MockAdapter(axios);
    mock.onGet('/v2/profiles').reply(200, []);
    mock.onGet('/v2/oauth2/social/providers').reply(() => [ 200, providers ]);
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

  const clickButton = async (wrapper: ReturnType<typeof mountAuth>, label: string) => {
    await wrapper.findAll('button').find(button => button.text() === label)!.trigger('click');
  };

  const signIn = async (wrapper: ReturnType<typeof mountAuth>, password = 'Password1!') => {
    await setInput(wrapper, 0, 'test@example.com');
    await setInput(wrapper, 1, password);
    await wrapper.get('form').trigger('submit');
    await flushPromises();
  };

  const tokenRequests = () => mock.history.post.filter(request => request.url === '/v2/oauth2/token');

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

  it('hides the provider buttons when no provider is enabled', async () => {
    const wrapper = mountAuth();
    await flushPromises();

    expect(mock.history.get.some(request => request.url === '/v2/oauth2/social/providers')).toBe(true);
    expect(wrapper.findAll('button').some(button => button.text() === 'Continue with Google')).toBe(false);
    expect(wrapper.findAll('button').some(button => button.text() === 'Continue with Microsoft')).toBe(false);
  });

  it('shows a button for each enabled provider', async () => {
    providers = { google: true, microsoft: false };

    const wrapper = mountAuth();
    await flushPromises();

    expect(wrapper.findAll('button').some(button => button.text() === 'Continue with Google')).toBe(true);
    expect(wrapper.findAll('button').some(button => button.text() === 'Continue with Microsoft')).toBe(false);
  });

  it('enters the mfa step when the password grant answers mfa_required', async () => {
    mock.onPost('/v2/oauth2/token').reply(403, { error: 'mfa_required', mfa_token: 'MFATOKEN' });

    const wrapper = mountAuth();
    await signIn(wrapper);

    expect(wrapper.text()).toContain('Two-factor authentication');
    expect(wrapper.text()).toContain('six-digit code');
  });

  it('completes the sign-in with a six-digit code', async () => {
    mock
      .onPost('/v2/oauth2/token')
      .replyOnce(403, { error: 'mfa_required', mfa_token: 'MFATOKEN' })
      .onPost('/v2/oauth2/token')
      .reply(200, { access_token: makeTestJwt() });
    mock.onGet('/v2/users/me').reply(200, { email_verified: true });

    const wrapper = mountAuth();
    await signIn(wrapper);

    await setInput(wrapper, 0, '123456');
    await flushPromises();

    expect(tokenRequests()).toHaveLength(2);
    expect(JSON.parse(String(tokenRequests()[1]?.data))).toEqual({
      grant_type: 'urn:verdocs:params:oauth:grant-type:mfa-otp',
      mfa_token: 'MFATOKEN',
      otp: '123456',
    });
  });

  it('sends the recovery-code grant once the backup toggle is on', async () => {
    mock
      .onPost('/v2/oauth2/token')
      .replyOnce(403, { error: 'mfa_required', mfa_token: 'MFATOKEN' })
      .onPost('/v2/oauth2/token')
      .reply(200, { access_token: makeTestJwt() });
    mock.onGet('/v2/users/me').reply(200, { email_verified: true });

    const wrapper = mountAuth();
    await signIn(wrapper);

    await clickButton(wrapper, 'Use a backup code instead');
    await setInput(wrapper, 0, 'abcd1234');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(tokenRequests()).toHaveLength(2);
    expect(JSON.parse(String(tokenRequests()[1]?.data))).toEqual({
      grant_type: 'urn:verdocs:params:oauth:grant-type:mfa-recovery-code',
      mfa_token: 'MFATOKEN',
      recovery_code: 'abcd-1234',
    });
  });

  it('shows an inline error and keeps the new token when a code is wrong', async () => {
    mock
      .onPost('/v2/oauth2/token')
      .replyOnce(403, { error: 'mfa_required', mfa_token: 'MFATOKEN' })
      .onPost('/v2/oauth2/token')
      .replyOnce(403, { error: 'mfa_required', mfa_token: 'SECONDTOKEN' })
      .onPost('/v2/oauth2/token')
      .reply(200, { access_token: makeTestJwt() });
    mock.onGet('/v2/users/me').reply(200, { email_verified: true });

    const wrapper = mountAuth();
    await signIn(wrapper);

    await setInput(wrapper, 0, '111111');
    await flushPromises();

    expect(wrapper.text()).toContain('That code did not work. Try the current one from your app.');

    await setInput(wrapper, 0, '222222');
    await flushPromises();

    expect(tokenRequests()).toHaveLength(3);
    expect(JSON.parse(String(tokenRequests()[2]?.data))).toEqual({
      grant_type: 'urn:verdocs:params:oauth:grant-type:mfa-otp',
      mfa_token: 'SECONDTOKEN',
      otp: '222222',
    });
  });

  it('returns to the login form when the challenge expires', async () => {
    mock
      .onPost('/v2/oauth2/token')
      .replyOnce(403, { error: 'mfa_required', mfa_token: 'MFATOKEN' })
      .onPost('/v2/oauth2/token')
      .reply(401, { error: 'invalid_grant' });

    const wrapper = mountAuth();
    await signIn(wrapper);

    await setInput(wrapper, 0, '123456');
    await flushPromises();

    expect(document.querySelector('.vdocs-toast')?.textContent).toContain('Your sign-in timed out');
    expect(wrapper.text()).toContain('Log in to your account');
  });

  it('exchanges a returned login_code and cleans the URL', async () => {
    mock.onPost('/v2/oauth2/token').reply(200, { access_token: makeTestJwt() });
    mock.onGet('/v2/users/me').reply(200, { email_verified: true });

    sessionStorage.setItem('vdocs-social-login', JSON.stringify({ verifier: 'VERIFIER', state: 'STATE', provider: 'google' }));
    window.history.replaceState({}, '', '/?login_code=LOGINCODE&state=STATE');

    mountAuth();
    await flushPromises();

    expect(tokenRequests()).toHaveLength(1);
    expect(JSON.parse(String(tokenRequests()[0]?.data))).toEqual({
      grant_type: 'urn:verdocs:params:oauth:grant-type:login-code',
      login_code: 'LOGINCODE',
      code_verifier: 'VERIFIER',
    });
    expect(window.location.search).toEqual('');
    expect(sessionStorage.getItem('vdocs-social-login')).toBeNull();
  });

  it('enters the mfa step when a returned login_code answers mfa_required', async () => {
    mock.onPost('/v2/oauth2/token').reply(403, { error: 'mfa_required', mfa_token: 'MFATOKEN' });

    sessionStorage.setItem('vdocs-social-login', JSON.stringify({ verifier: 'VERIFIER', state: 'STATE', provider: 'google' }));
    window.history.replaceState({}, '', '/?login_code=LOGINCODE&state=STATE');

    const wrapper = mountAuth();
    await flushPromises();

    expect(wrapper.text()).toContain('Two-factor authentication');
  });

  it('refuses a returned login_code whose state does not match', async () => {
    sessionStorage.setItem('vdocs-social-login', JSON.stringify({ verifier: 'VERIFIER', state: 'STATE', provider: 'google' }));
    window.history.replaceState({}, '', '/?login_code=LOGINCODE&state=TAMPERED');

    mountAuth();
    await flushPromises();

    expect(document.querySelector('.vdocs-toast')?.textContent).toContain('Sign-in could not be verified');
    expect(tokenRequests()).toHaveLength(0);
    expect(window.location.search).toEqual('');
  });

  it('reports a provider error and cleans the URL', async () => {
    window.history.replaceState({}, '', '/?error=email_unverified');

    mountAuth();
    await flushPromises();

    expect(document.querySelector('.vdocs-toast')?.textContent).toContain('verified email address');
    expect(window.location.search).toEqual('');
  });
});
