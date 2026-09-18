import axios from 'axios';
import { page } from 'vitest/browser';
import MockAdapter from 'axios-mock-adapter';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import type { ISocialProviders } from '@verdocs/js-sdk';
import { makeTestJwt, mount, TEST_API_BASE } from '../test/helpers.js';
import type { IAuthStatus } from '../types.js';
import './vdocs-auth.js';

describe('vdocs-auth', () => {
  let mock: MockAdapter;
  let providers: ISocialProviders;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState({}, '', '/');
    providers = { google: false, microsoft: false };

    // Endpoints created after this point (the default endpoint and the
    // component's temp endpoint) inherit the mocked adapter via axios.create().
    // Under NodeNext resolution the spec sees axios's ESM types and the adapter's CJS types see the CJS
    // ones, and the Axios class has private members, so the two AxiosInstance declarations do not unify.
    mock = new MockAdapter(axios as unknown as ConstructorParameters<typeof MockAdapter>[0]);
    mock.onGet('/v2/profiles').reply(200, []);
    mock.onGet('/v2/oauth2/social/providers').reply(() => [ 200, providers ]);

    new VerdocsEndpoint({ baseURL: TEST_API_BASE }).setDefault();
  });

  afterEach(() => {
    mock.restore();
    document.body.replaceChildren();
  });

  const mountAuth = async (configure?: (el: HTMLElementTagNameMap['vdocs-auth']) => void) => {
    const el = document.createElement('vdocs-auth');
    configure?.(el);
    return mount(el);
  };

  const signIn = async (password = 'Password1!') => {
    await page.getByLabelText(/^\s*Email/).fill('test@example.com');
    await page.getByLabelText(/^\s*Password/).fill(password);
    await page.getByRole('button', { name: 'Login' }).click();
  };

  const tokenRequests = () => mock.history.post.filter(request => request.url === '/v2/oauth2/token');

  it('renders the login form by default', async () => {
    const el = await mountAuth();

    expect(el.textContent).toContain('Log in to your account');
    expect(el.querySelector('input[type="email"]')).not.toBeNull();
    expect(el.querySelector('input[type="password"]')).not.toBeNull();
  });

  it('fires vdocs-authenticated(false) after the initial session check finds nothing', async () => {
    const statuses: IAuthStatus[] = [];
    const el = document.createElement('vdocs-auth');
    el.addEventListener('vdocs-authenticated', e => statuses.push(e.detail));
    await mount(el);

    await vi.waitFor(() => {
      expect(statuses).toContainEqual({ authenticated: false, session: null, profile: null });
    });
  });

  it('starts in the requested mode', async () => {
    const el = await mountAuth(auth => {
      auth.initialMode = 'forgot';
    });

    expect(el.textContent).toContain('Forgot your password?');
  });

  it('routes unverified logins to the verification step', async () => {
    mock.onPost('/v2/oauth2/token').reply(200, { access_token: makeTestJwt() });
    mock.onGet('/v2/users/me').reply(200, { email_verified: false });

    const el = await mountAuth();

    await page.getByLabelText(/^\s*Email/).fill('test@example.com');
    await page.getByLabelText(/^\s*Password/).fill('Password1!');
    await page.getByRole('button', { name: 'Login' }).click();

    await vi.waitFor(() => {
      expect(el.textContent).toContain('verification code');
    });

    const tokenRequest = mock.history.post.find(request => request.url === '/v2/oauth2/token');
    expect(tokenRequest).toBeTruthy();
    expect(JSON.parse(String(tokenRequest?.data))).toEqual({
      username: 'test@example.com',
      password: 'Password1!',
      grant_type: 'password',
    });
  });

  it('shows a toast on failed logins', async () => {
    mock.onPost('/v2/oauth2/token').reply(401, { error: 'invalid_grant' });

    await mountAuth();

    await page.getByLabelText(/^\s*Email/).fill('test@example.com');
    await page.getByLabelText(/^\s*Password/).fill('wrong');
    await page.getByRole('button', { name: 'Login' }).click();

    await vi.waitFor(() => {
      expect(document.querySelector('.vdocs-toast')?.textContent).toContain('Login failed');
    });
  });

  it('switches to signup mode and enforces password complexity', async () => {
    await mountAuth();

    await page.getByRole('button', { name: 'Sign Up' }).click();
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('Sign up for a free account');
    });

    await page.getByLabelText(/First Name/).fill('Test');
    await page.getByLabelText(/Last Name/).fill('User');
    await page.getByLabelText(/Email Address/).fill('test@example.com');
    await page.getByLabelText(/^\s*Password/).fill('weakling');
    await page.getByLabelText(/Confirm Password/).fill('weakling');
    await page.getByLabelText(/Phone Number/).fill('+15551234567');
    await page.getByLabelText(/Organization Name/).fill('Test Org');

    await page.getByRole('button', { name: 'Next' }).click();

    await vi.waitFor(() => {
      expect(document.querySelector('.vdocs-toast')?.textContent).toContain('Password must be at least 8 characters');
    });
  });

  it('renders nothing when visible is false', async () => {
    const el = await mountAuth(auth => {
      auth.visible = false;
    });

    expect(el.querySelector('form')).toBeNull();
  });

  it('hides the provider buttons when no provider is enabled', async () => {
    const el = await mountAuth();

    await vi.waitFor(() => {
      expect(mock.history.get.some(request => request.url === '/v2/oauth2/social/providers')).toBe(true);
    });

    expect(el.textContent).not.toContain('Continue with Google');
    expect(el.textContent).not.toContain('Continue with Microsoft');
  });

  it('shows a button for each enabled provider', async () => {
    providers = { google: true, microsoft: false };

    const el = await mountAuth();

    await vi.waitFor(() => {
      expect(el.textContent).toContain('Continue with Google');
    });

    expect(el.textContent).not.toContain('Continue with Microsoft');
  });

  it('enters the mfa step when the password grant answers mfa_required', async () => {
    mock.onPost('/v2/oauth2/token').reply(403, { error: 'mfa_required', mfa_token: 'MFATOKEN' });

    const el = await mountAuth();
    await signIn();

    await vi.waitFor(() => {
      expect(el.textContent).toContain('Two-factor authentication');
    });

    expect(el.textContent).toContain('six-digit code');
  });

  it('completes the sign-in with a six-digit code', async () => {
    mock
      .onPost('/v2/oauth2/token')
      .replyOnce(403, { error: 'mfa_required', mfa_token: 'MFATOKEN' })
      .onPost('/v2/oauth2/token')
      .reply(200, { access_token: makeTestJwt() });
    mock.onGet('/v2/users/me').reply(200, { email_verified: true });

    await mountAuth();
    await signIn();

    await page.getByLabelText(/Authentication code/).fill('123456');

    await vi.waitFor(() => {
      expect(tokenRequests()).toHaveLength(2);
    });

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

    await mountAuth();
    await signIn();

    await page.getByRole('button', { name: 'Use a backup code instead' }).click();
    await page.getByLabelText(/Backup code/).fill('abcd1234');
    await page.getByRole('button', { name: 'Verify' }).click();

    await vi.waitFor(() => {
      expect(tokenRequests()).toHaveLength(2);
    });

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

    const el = await mountAuth();
    await signIn();

    await page.getByLabelText(/Authentication code/).fill('111111');

    await vi.waitFor(() => {
      expect(el.textContent).toContain('That code did not work. Try the current one from your app.');
    });

    await page.getByLabelText(/Authentication code/).fill('222222');

    await vi.waitFor(() => {
      expect(tokenRequests()).toHaveLength(3);
    });

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

    const el = await mountAuth();
    await signIn();

    await page.getByLabelText(/Authentication code/).fill('123456');

    await vi.waitFor(() => {
      expect(document.querySelector('.vdocs-toast')?.textContent).toContain('Your sign-in timed out');
    });

    expect(el.textContent).toContain('Log in to your account');
  });

  it('exchanges a returned login_code and cleans the URL', async () => {
    mock.onPost('/v2/oauth2/token').reply(200, { access_token: makeTestJwt() });
    mock.onGet('/v2/users/me').reply(200, { email_verified: true });

    sessionStorage.setItem('vdocs-social-login', JSON.stringify({ verifier: 'VERIFIER', state: 'STATE', provider: 'google' }));
    window.history.replaceState({}, '', '/?login_code=LOGINCODE&state=STATE');

    await mountAuth();

    await vi.waitFor(() => {
      expect(tokenRequests()).toHaveLength(1);
    });

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

    const el = await mountAuth();

    await vi.waitFor(() => {
      expect(el.textContent).toContain('Two-factor authentication');
    });
  });

  it('refuses a returned login_code whose state does not match', async () => {
    sessionStorage.setItem('vdocs-social-login', JSON.stringify({ verifier: 'VERIFIER', state: 'STATE', provider: 'google' }));
    window.history.replaceState({}, '', '/?login_code=LOGINCODE&state=TAMPERED');

    await mountAuth();

    await vi.waitFor(() => {
      expect(document.querySelector('.vdocs-toast')?.textContent).toContain('Sign-in could not be verified');
    });

    expect(tokenRequests()).toHaveLength(0);
    expect(window.location.search).toEqual('');
  });

  it('reports a provider error and cleans the URL', async () => {
    window.history.replaceState({}, '', '/?error=email_unverified');

    await mountAuth();

    await vi.waitFor(() => {
      expect(document.querySelector('.vdocs-toast')?.textContent).toContain('verified email address');
    });

    expect(window.location.search).toEqual('');
  });
});
