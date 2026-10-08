import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import userEvent from '@testing-library/user-event';
import { getSocialLoginUrl } from '@verdocs/js-sdk';
import type { ISocialProviders } from '@verdocs/js-sdk';
import { render, screen, waitFor } from '@testing-library/react';
import { makeTestJwt, TEST_API_BASE } from '../../test/setup';
import VerdocsProvider from '../../provider/VerdocsProvider';
import VerdocsAuth from './VerdocsAuth';

// Wrapped rather than stubbed: the real builder still runs, we just need to see the return URI
// the component hands it, which is the only place that value is observable.
vi.mock('@verdocs/js-sdk', async importOriginal => {
  const actual = await importOriginal<typeof import('@verdocs/js-sdk')>();
  return {
    ...actual,
    getSocialLoginUrl: vi.fn(actual.getSocialLoginUrl),
  };
});

describe('VerdocsAuth', () => {
  let mock: MockAdapter;
  let providers: ISocialProviders;

  beforeEach(() => {
    vi.mocked(getSocialLoginUrl).mockClear();
    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState({}, '', '/');
    providers = { google: false, microsoft: false };

    // Endpoints created after this point (the provider's and the component's temp endpoint)
    // inherit the mocked default adapter via axios.create().
    mock = new MockAdapter(axios);
    mock.onGet('/v2/profiles').reply(200, []);
    mock.onGet('/v2/oauth2/social/providers').reply(() => [ 200, providers ]);
  });

  afterEach(() => {
    mock.restore();
  });

  const renderAuth = (props = {}) =>
    render(
      <VerdocsProvider baseUrl={TEST_API_BASE}>
        <VerdocsAuth {...props} />
      </VerdocsProvider>,
    );

  const signIn = async (password = 'Password1!') => {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Email/), 'test@example.com');
    await user.type(screen.getByLabelText(/Password/), password);
    await user.click(screen.getByRole('button', { name: 'Login' }));
    return user;
  };

  const tokenRequests = () => mock.history.post.filter(request => request.url === '/v2/oauth2/token');

  it('renders the login form by default', () => {
    renderAuth();

    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Forgot your password?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('fires onAuthenticated(false) after the initial session check finds nothing', async () => {
    const onAuthenticated = vi.fn();
    renderAuth({ onAuthenticated });

    await waitFor(() => {
      expect(onAuthenticated).toHaveBeenCalledWith({ authenticated: false, session: null, profile: null });
    });
  });

  it('starts in the requested mode', () => {
    renderAuth({ initialMode: 'forgot' });

    expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Request Code' })).toBeInTheDocument();
  });

  it('switches to signup mode and enforces password complexity', async () => {
    const user = userEvent.setup();
    renderAuth();

    await user.click(screen.getByRole('button', { name: 'Sign Up' }));
    expect(screen.getByText('Sign up for a free account')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/First Name/), 'Test');
    await user.type(screen.getByLabelText(/Last Name/), 'User');
    await user.type(screen.getByLabelText(/Email Address/), 'test@example.com');
    await user.type(screen.getByLabelText(/^Password/), 'weakling');
    await user.type(screen.getByLabelText(/Confirm Password/), 'weakling');
    await user.type(screen.getByLabelText(/Phone Number/), '+15551234567');
    await user.type(screen.getByLabelText(/Organization Name/), 'Test Org');

    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(document.querySelector('.vdocs-toast')?.textContent).toContain('Password must be at least 8 characters');
    });
  });

  it('routes unverified logins to the verification step', async () => {
    mock.onPost('/v2/oauth2/token').reply(200, { access_token: makeTestJwt() });
    mock.onGet('/v2/users/me').reply(200, { email_verified: false });

    renderAuth();
    await signIn();

    await waitFor(() => {
      expect(screen.getByLabelText(/Verification Code/)).toBeInTheDocument();
    });

    expect(JSON.parse(String(tokenRequests()[0]?.data))).toEqual({
      username: 'test@example.com',
      password: 'Password1!',
      grant_type: 'password',
    });
  });

  it('shows a toast on failed logins', async () => {
    mock.onPost('/v2/oauth2/token').reply(401, { error: 'invalid_grant' });

    renderAuth();
    await signIn('wrong');

    await waitFor(() => {
      expect(document.querySelector('.vdocs-toast')?.textContent).toContain('Login failed');
    });
  });

  it('renders nothing when visible is false', () => {
    const { container } = renderAuth({ visible: false });

    expect(container.querySelector('form')).not.toBeInTheDocument();
  });

  it('hides the provider buttons when no provider is enabled', async () => {
    renderAuth();

    await waitFor(() => {
      expect(mock.history.get.some(request => request.url === '/v2/oauth2/social/providers')).toBe(true);
    });

    expect(screen.queryByRole('button', { name: 'Continue with Google' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue with Microsoft' })).not.toBeInTheDocument();
  });

  it('shows a button for each enabled provider', async () => {
    providers = { google: true, microsoft: false };
    renderAuth();

    expect(await screen.findByRole('button', { name: 'Continue with Google' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue with Microsoft' })).not.toBeInTheDocument();
  });

  it('enters the mfa step when the password grant answers mfa_required', async () => {
    mock.onPost('/v2/oauth2/token').reply(403, { error: 'mfa_required', mfa_token: 'MFATOKEN' });

    renderAuth();
    await signIn();

    expect(await screen.findByText('Two-factor authentication')).toBeInTheDocument();
    expect(screen.getByLabelText(/Authentication code/)).toBeInTheDocument();
  });

  it('completes the sign-in with a six-digit code', async () => {
    mock
      .onPost('/v2/oauth2/token')
      .replyOnce(403, { error: 'mfa_required', mfa_token: 'MFATOKEN' })
      .onPost('/v2/oauth2/token')
      .reply(200, { access_token: makeTestJwt() });
    mock.onGet('/v2/users/me').reply(200, { email_verified: true });

    renderAuth();
    const user = await signIn();

    await user.type(await screen.findByLabelText(/Authentication code/), '123456');

    await waitFor(() => {
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

    renderAuth();
    const user = await signIn();

    await user.click(await screen.findByRole('button', { name: 'Use a backup code instead' }));
    await user.type(screen.getByLabelText(/Backup code/), 'abcd1234');
    await user.click(screen.getByRole('button', { name: 'Verify' }));

    await waitFor(() => {
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

    renderAuth();
    const user = await signIn();

    await user.type(await screen.findByLabelText(/Authentication code/), '111111');

    expect(await screen.findByText('That code did not work. Try the current one from your app.')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Authentication code/), '222222');

    await waitFor(() => {
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

    renderAuth();
    const user = await signIn();

    await user.type(await screen.findByLabelText(/Authentication code/), '123456');

    await waitFor(() => {
      expect(document.querySelector('.vdocs-toast')?.textContent).toContain('Your sign-in timed out');
    });

    expect(document.querySelector('.vdocs-toast')?.textContent).not.toContain('invalid_grant');
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('shows the lock reason when too many codes lock the account', async () => {
    mock
      .onPost('/v2/oauth2/token')
      .replyOnce(403, { error: 'mfa_required', mfa_token: 'MFATOKEN' })
      .onPost('/v2/oauth2/token')
      .reply(401, { status: 'ERROR', error: 'Account locked. Please contact support@verdocs.com for assistance.' });

    renderAuth();
    const user = await signIn();

    await user.type(await screen.findByLabelText(/Authentication code/), '123456');

    await waitFor(() => {
      expect(document.querySelector('.vdocs-toast')?.textContent).toContain('Account locked. Please contact support@verdocs.com for assistance.');
    });

    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('exchanges a returned login_code and cleans the URL', async () => {
    mock.onPost('/v2/oauth2/token').reply(200, { access_token: makeTestJwt() });
    mock.onGet('/v2/users/me').reply(200, { email_verified: true });

    sessionStorage.setItem('vdocs-social-login', JSON.stringify({ verifier: 'VERIFIER', state: 'STATE', provider: 'google' }));
    window.history.replaceState({}, '', '/?login_code=LOGINCODE&state=STATE');

    renderAuth();

    await waitFor(() => {
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

    renderAuth();

    expect(await screen.findByText('Two-factor authentication')).toBeInTheDocument();
  });

  it('refuses a returned login_code whose state does not match', async () => {
    sessionStorage.setItem('vdocs-social-login', JSON.stringify({ verifier: 'VERIFIER', state: 'STATE', provider: 'google' }));
    window.history.replaceState({}, '', '/?login_code=LOGINCODE&state=TAMPERED');

    renderAuth();

    await waitFor(() => {
      expect(document.querySelector('.vdocs-toast')?.textContent).toContain('Sign-in could not be verified');
    });

    expect(tokenRequests()).toHaveLength(0);
    expect(window.location.search).toEqual('');
  });

  it('reports a provider error and cleans the URL', async () => {
    sessionStorage.setItem('vdocs-social-login', JSON.stringify({ verifier: 'VERIFIER', state: 'STATE', provider: 'google' }));
    window.history.replaceState({}, '', '/?error=email_unverified&state=STATE');

    renderAuth();

    await waitFor(() => {
      expect(document.querySelector('.vdocs-toast')?.textContent).toContain('verified email address');
    });

    expect(window.location.search).toEqual('');
  });

  it('explains a corporate email requirement', async () => {
    sessionStorage.setItem('vdocs-social-login', JSON.stringify({ verifier: 'VERIFIER', state: 'STATE', provider: 'google' }));
    window.history.replaceState({}, '', '/?error=corporate_email_required&state=STATE');

    renderAuth();

    await waitFor(() => {
      expect(document.querySelector('.vdocs-toast')?.textContent).toContain('Please use your corporate email address to create an account.');
    });
  });

  it('explains a locked account', async () => {
    sessionStorage.setItem('vdocs-social-login', JSON.stringify({ verifier: 'VERIFIER', state: 'STATE', provider: 'google' }));
    window.history.replaceState({}, '', '/?error=account_locked&state=STATE');

    renderAuth();

    await waitFor(() => {
      expect(document.querySelector('.vdocs-toast')?.textContent).toContain('That account is locked. Please contact support@verdocs.com.');
    });
  });

  it('leaves a stray error parameter alone when no sign-in was started', async () => {
    window.history.replaceState({}, '', '/?error=access_denied');

    // Toasts attach to document.body outside React, so cleanup leaves an earlier case's toast in
    // place and we would read it as our own.
    document.querySelectorAll('.vdocs-toast').forEach(toast => toast.remove());
    const replaceState = vi.spyOn(window.history, 'replaceState');

    renderAuth();

    await waitFor(() => {
      expect(mock.history.get.some(request => request.url === '/v2/oauth2/social/providers')).toBe(true);
    });

    expect(document.querySelector('.vdocs-toast')).toBeNull();
    expect(replaceState).not.toHaveBeenCalled();
    expect(window.location.search).toEqual('?error=access_denied');

    replaceState.mockRestore();
  });

  it('strips the state parameter after a provider error', async () => {
    sessionStorage.setItem('vdocs-social-login', JSON.stringify({ verifier: 'VERIFIER', state: 'STATE', provider: 'google' }));
    window.history.replaceState({}, '', '/?error=access_denied&state=STATE');

    renderAuth();

    await waitFor(() => {
      expect(document.querySelector('.vdocs-toast')?.textContent).toContain('Sign-in was canceled');
    });

    expect(window.location.search).toEqual('');
  });

  it('keeps the host page URL and its history state when cleaning up', async () => {
    sessionStorage.setItem('vdocs-social-login', JSON.stringify({ verifier: 'VERIFIER', state: 'STATE', provider: 'google' }));
    window.history.replaceState({ hostRoute: 'dashboard' }, '', '/app?tab=2&error=access_denied&state=STATE#section');

    renderAuth();

    await waitFor(() => {
      expect(document.querySelector('.vdocs-toast')?.textContent).toContain('Sign-in was canceled');
    });

    expect(window.location.search).toEqual('?tab=2');
    expect(window.location.hash).toEqual('#section');
    expect(window.history.state).toEqual({ hostRoute: 'dashboard' });
  });

  it('sends the full deep link as the return URI, minus our own parameters', async () => {
    providers = { google: true, microsoft: false };
    window.history.replaceState({}, '', '/app?tab=2&state=STALE#section');
    const { origin } = window.location;

    // jsdom cannot navigate away, so the start URL is swapped for a same-document one. What we
    // care about is the return URI we handed the builder.
    vi.mocked(getSocialLoginUrl).mockReturnValueOnce('#social-start');

    const user = userEvent.setup();
    renderAuth();

    await user.click(await screen.findByRole('button', { name: 'Continue with Google' }));

    await waitFor(() => {
      expect(getSocialLoginUrl).toHaveBeenCalled();
    });

    expect(vi.mocked(getSocialLoginUrl).mock.calls[0]?.[2].returnUri).toEqual(`${origin}/app?tab=2#section`);
  });
});
