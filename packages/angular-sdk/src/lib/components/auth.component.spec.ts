import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { TestBed } from '@angular/core/testing';
import { VerdocsAuthComponent } from './auth.component';
import { provideVerdocs } from '../provide-verdocs';
import { makeTestJwt } from '../test-support';

describe('VerdocsAuthComponent', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    localStorage.clear();

    // Endpoints created after this point (the provider's and the component's
    // temp endpoint) inherit the mocked default adapter via axios.create().
    mock = new MockAdapter(axios);
    mock.onGet('/v2/profiles').reply(200, []);

    TestBed.configureTestingModule({
      providers: [ provideVerdocs({ baseUrl: 'https://stage-api.verdocs.com' }) ],
    });
  });

  afterEach(() => {
    mock.restore();
  });

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
});
