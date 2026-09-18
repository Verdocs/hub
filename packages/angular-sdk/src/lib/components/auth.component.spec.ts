import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import type { ISocialProviders } from '@verdocs/js-sdk';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { VerdocsAuthComponent } from './auth.component';
import { provideVerdocs } from '../provide-verdocs';
import { makeTestJwt } from '../test-support';
import { TEST_API_BASE } from '../session';

describe('VerdocsAuthComponent', () => {
  let mock: MockAdapter;
  let providers: ISocialProviders;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState({}, '', '/');
    providers = { google: false, microsoft: false };

    // Endpoints created after this point (the provider's and the component's
    // temp endpoint) inherit the mocked default adapter via axios.create().
    mock = new MockAdapter(axios);
    mock.onGet('/v2/profiles').reply(200, []);
    mock.onGet('/v2/oauth2/social/providers').reply(() => [ 200, providers ]);

    TestBed.configureTestingModule({
      providers: [ provideVerdocs({ baseUrl: TEST_API_BASE }) ],
    });
  });

  afterEach(() => {
    mock.restore();
  });

  const setValue = (fixture: ComponentFixture<VerdocsAuthComponent>, selector: string, value: string) => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(selector);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const clickButton = (fixture: ComponentFixture<VerdocsAuthComponent>, label: string) => {
    const button = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button'))
      .find(candidate => candidate.textContent?.trim() === label);
    button?.click();
    fixture.detectChanges();
  };

  const buttonLabels = (fixture: ComponentFixture<VerdocsAuthComponent>) =>
    Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).map(button => button.textContent?.trim());

  // whenStable settles Angular's own work, not the SDK's promise chains, so give the mocked
  // axios responses a macrotask to land before asserting on the rendered result.
  const settle = async (fixture: ComponentFixture<VerdocsAuthComponent>) => {
    await new Promise(resolve => setTimeout(resolve, 0));
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const signIn = async (fixture: ComponentFixture<VerdocsAuthComponent>, password = 'Password1!') => {
    setValue(fixture, 'input[type="email"]', 'test@example.com');
    setValue(fixture, 'input[type="password"]', password);

    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));
    await settle(fixture);
  };

  const tokenRequests = () => mock.history.post.filter(request => request.url === '/v2/oauth2/token');

  it('renders the login form by default', () => {
    const fixture = TestBed.createComponent(VerdocsAuthComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Log in to your account');
    expect(fixture.nativeElement.querySelector('input[type="email"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('input[type="password"]')).toBeTruthy();
  });

  it('starts in the requested mode', () => {
    const fixture = TestBed.createComponent(VerdocsAuthComponent);
    fixture.componentRef.setInput('initialMode', 'forgot');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Forgot your password?');
  });

  it('routes unverified logins to the verification step', async () => {
    mock.onPost('/v2/oauth2/token').reply(200, { access_token: makeTestJwt() });
    mock.onGet('/v2/users/me').reply(200, { email_verified: false });

    const fixture = TestBed.createComponent(VerdocsAuthComponent);
    fixture.detectChanges();

    const emailInput: HTMLInputElement = fixture.nativeElement.querySelector('input[type="email"]');
    emailInput.value = 'test@example.com';
    emailInput.dispatchEvent(new Event('input'));

    const passwordInput: HTMLInputElement = fixture.nativeElement.querySelector('input[type="password"]');
    passwordInput.value = 'Password1!';
    passwordInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    const tokenRequest = mock.history.post.find(request => request.url === '/v2/oauth2/token');
    expect(tokenRequest).toBeTruthy();
    expect(JSON.parse(String(tokenRequest?.data))).toEqual({
      username: 'test@example.com',
      password: 'Password1!',
      grant_type: 'password',
    });
    expect(fixture.nativeElement.textContent).toContain('verification code');
  });

  it('shows a toast on failed logins', async () => {
    mock.onPost('/v2/oauth2/token').reply(401, { error: 'invalid_grant' });

    const fixture = TestBed.createComponent(VerdocsAuthComponent);
    fixture.detectChanges();

    const emailInput: HTMLInputElement = fixture.nativeElement.querySelector('input[type="email"]');
    emailInput.value = 'test@example.com';
    emailInput.dispatchEvent(new Event('input'));

    const passwordInput: HTMLInputElement = fixture.nativeElement.querySelector('input[type="password"]');
    passwordInput.value = 'wrong';
    passwordInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(document.querySelector('.vdocs-toast')?.textContent).toContain('Login failed');
  });

  it('renders nothing when visible is false', () => {
    const fixture = TestBed.createComponent(VerdocsAuthComponent);
    fixture.componentRef.setInput('visible', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('hides the provider buttons when no provider is enabled', async () => {
    const fixture = TestBed.createComponent(VerdocsAuthComponent);
    fixture.detectChanges();
    await settle(fixture);

    expect(mock.history.get.some(request => request.url === '/v2/oauth2/social/providers')).toBe(true);
    expect(buttonLabels(fixture)).not.toContain('Continue with Google');
    expect(buttonLabels(fixture)).not.toContain('Continue with Microsoft');
  });

  it('shows a button for each enabled provider', async () => {
    providers = { google: true, microsoft: false };

    const fixture = TestBed.createComponent(VerdocsAuthComponent);
    fixture.detectChanges();
    await settle(fixture);

    expect(buttonLabels(fixture)).toContain('Continue with Google');
    expect(buttonLabels(fixture)).not.toContain('Continue with Microsoft');
  });

  it('enters the mfa step when the password grant answers mfa_required', async () => {
    mock.onPost('/v2/oauth2/token').reply(403, { error: 'mfa_required', mfa_token: 'MFATOKEN' });

    const fixture = TestBed.createComponent(VerdocsAuthComponent);
    fixture.detectChanges();
    await signIn(fixture);

    expect(fixture.nativeElement.textContent).toContain('Two-factor authentication');
    expect(fixture.nativeElement.textContent).toContain('six-digit code');
  });

  it('completes the sign-in with a six-digit code', async () => {
    mock
      .onPost('/v2/oauth2/token')
      .replyOnce(403, { error: 'mfa_required', mfa_token: 'MFATOKEN' })
      .onPost('/v2/oauth2/token')
      .reply(200, { access_token: makeTestJwt() });
    mock.onGet('/v2/users/me').reply(200, { email_verified: true });

    const fixture = TestBed.createComponent(VerdocsAuthComponent);
    fixture.detectChanges();
    await signIn(fixture);

    setValue(fixture, 'input', '123456');
    await settle(fixture);

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

    const fixture = TestBed.createComponent(VerdocsAuthComponent);
    fixture.detectChanges();
    await signIn(fixture);

    clickButton(fixture, 'Use a backup code instead');
    setValue(fixture, 'input', 'abcd1234');
    clickButton(fixture, 'Verify');
    await settle(fixture);

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

    const fixture = TestBed.createComponent(VerdocsAuthComponent);
    fixture.detectChanges();
    await signIn(fixture);

    setValue(fixture, 'input', '111111');
    await settle(fixture);

    expect(fixture.nativeElement.textContent).toContain('That code did not work. Try the current one from your app.');

    setValue(fixture, 'input', '222222');
    await settle(fixture);

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

    const fixture = TestBed.createComponent(VerdocsAuthComponent);
    fixture.detectChanges();
    await signIn(fixture);

    setValue(fixture, 'input', '123456');
    await settle(fixture);

    expect(document.querySelector('.vdocs-toast')?.textContent).toContain('Your sign-in timed out');
    expect(fixture.nativeElement.textContent).toContain('Log in to your account');
  });

  it('exchanges a returned login_code and cleans the URL', async () => {
    mock.onPost('/v2/oauth2/token').reply(200, { access_token: makeTestJwt() });
    mock.onGet('/v2/users/me').reply(200, { email_verified: true });

    sessionStorage.setItem('vdocs-social-login', JSON.stringify({ verifier: 'VERIFIER', state: 'STATE', provider: 'google' }));
    window.history.replaceState({}, '', '/?login_code=LOGINCODE&state=STATE');

    const fixture = TestBed.createComponent(VerdocsAuthComponent);
    fixture.detectChanges();
    await settle(fixture);

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

    const fixture = TestBed.createComponent(VerdocsAuthComponent);
    fixture.detectChanges();
    await settle(fixture);

    expect(fixture.nativeElement.textContent).toContain('Two-factor authentication');
  });

  it('refuses a returned login_code whose state does not match', async () => {
    sessionStorage.setItem('vdocs-social-login', JSON.stringify({ verifier: 'VERIFIER', state: 'STATE', provider: 'google' }));
    window.history.replaceState({}, '', '/?login_code=LOGINCODE&state=TAMPERED');

    const fixture = TestBed.createComponent(VerdocsAuthComponent);
    fixture.detectChanges();
    await settle(fixture);

    expect(document.querySelector('.vdocs-toast')?.textContent).toContain('Sign-in could not be verified');
    expect(tokenRequests()).toHaveLength(0);
    expect(window.location.search).toEqual('');
  });

  it('reports a provider error and cleans the URL', async () => {
    window.history.replaceState({}, '', '/?error=email_unverified');

    const fixture = TestBed.createComponent(VerdocsAuthComponent);
    fixture.detectChanges();
    await settle(fixture);

    expect(document.querySelector('.vdocs-toast')?.textContent).toContain('verified email address');
    expect(window.location.search).toEqual('');
  });
});
