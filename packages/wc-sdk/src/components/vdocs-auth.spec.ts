import axios from 'axios';
import { page } from 'vitest/browser';
import MockAdapter from 'axios-mock-adapter';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import { makeTestJwt, mount, TEST_API_BASE } from '../test/helpers.js';
import type { IAuthStatus } from '../types.js';
import './vdocs-auth.js';

describe('vdocs-auth', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    localStorage.clear();

    // Endpoints created after this point (the default endpoint and the
    // component's temp endpoint) inherit the mocked adapter via axios.create().
    mock = new MockAdapter(axios);
    mock.onGet('/v2/profiles').reply(200, []);

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
});
