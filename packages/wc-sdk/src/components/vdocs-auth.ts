import { html, nothing } from 'lit';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import type { PropertyValues, TemplateResult } from 'lit';
import type { IAuthenticateResponse, ISocialProviders, TSocialLoginProvider } from '@verdocs/js-sdk';
import { createCodeChallenge, createCodeVerifier, getMFAChallenge, getSocialLoginUrl, getSocialProviders } from '@verdocs/js-sdk';
import { authenticate, convertToE164, createProfile, getMyUser, resendVerification, resetPassword, verifyEmail } from '@verdocs/js-sdk';
import { SessionController } from '../base/session-controller.js';
import { SDKError, type IAuthStatus } from '../types.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { resolveEndpoint } from '../base/endpoint.js';
import { register } from '../base/register.js';
import { showToast } from '../utils/toast.js';
import '../controls/vdocs-text-input.js';
import '../controls/vdocs-button.js';

export type TAuthMode = 'login' | 'forgot' | 'reset' | 'signup' | 'verify' | 'mfa';

const isPasswordComplex = (password: string) => {
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasSpecialChar = /[`!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?~ ]/.test(password);
  return password.length >= 8 && hasUppercase && hasLowercase && hasSpecialChar;
};

const PASSWORD_COMPLEXITY_MESSAGE = 'Password must be at least 8 characters long and contain at least one uppercase, one lowercase, and one special character.';

const MFA_CODE_ERROR = 'That code did not work. Try the current one from your app.';

const SOCIAL_START_ERROR = 'Sign-in could not be started. Try again.';

const SOCIAL_LOGIN_KEY = 'vdocs-social-login';

// The provider flow leaves and comes back to this page, so the PKCE verifier and the state we
// generated have to survive a full page load. Session storage is per-tab, which is what we want.
interface ISocialLoginAttempt {
  verifier: string;
  state: string;
  provider: TSocialLoginProvider;
}

const SOCIAL_ERROR_MESSAGES: Record<string, string> = {
  email_unverified: 'That account does not have a verified email address.',
  provider_error: 'That provider could not sign you in. Try again.',
  access_denied: 'Sign-in was canceled.',
};

const socialErrorMessage = (code: string) => SOCIAL_ERROR_MESSAGES[code] || 'Sign-in did not work. Try again.';

const readSocialLoginAttempt = (): ISocialLoginAttempt | null => {
  try {
    const stored = window.sessionStorage.getItem(SOCIAL_LOGIN_KEY);
    return stored ? JSON.parse(stored) as ISocialLoginAttempt : null;
  } catch {
    return null;
  }
};

const clearSocialLoginAttempt = () => {
  try {
    window.sessionStorage.removeItem(SOCIAL_LOGIN_KEY);
  } catch {
    // Storage can be blocked in third-party embeds. Nothing to clean up if we never wrote it.
  }
};

// Our return parameters are not the host app's to route on, and leaving them in place would
// replay the exchange on a reload with a code that is already spent.
const cleanSocialLoginParams = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete('login_code');
  url.searchParams.delete('state');
  url.searchParams.delete('error');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
};

const currentReturnUri = () => `${window.location.origin}${window.location.pathname}`;

const formatRecoveryCode = (value: string) => {
  const cleaned = value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
  return cleaned.length > 4 ? `${cleaned.slice(0, 4)}-${cleaned.slice(4)}` : cleaned;
};

const FORM_CLASSES = 'vdocs:w-[350px] vdocs:max-w-[90%] vdocs:box-border vdocs:flex vdocs:flex-col vdocs:items-center vdocs:justify-center vdocs:p-5 vdocs:bg-surface vdocs:font-sans';

/**
 * Display an authentication panel that allows the user to log in or sign up,
 * including email verification and password reset flows. If the user is
 * already authenticated with a valid session, a sign-out button is shown
 * instead and the vdocs-authenticated event fires immediately. It is up to
 * the host application to render the next appropriate view.
 *
 * Uses the default endpoint unless the `endpoint` property is set.
 * Authentication happens against a temporary, non-persisting endpoint so
 * other session listeners never observe a partially-verified login. Tokens
 * are pushed to the real endpoint only once verification checks pass.
 *
 * @fires vdocs-authenticated - Fired with an IAuthStatus in detail whenever the session state changes, and at least once after the initial session check.
 * @fires vdocs-sdk-error - Fired with an SDKError in detail if an error occurs.
 */
export class VdocsAuth extends VdocsElement {
  static override properties = {
    endpoint: { attribute: false },
    visible: { attribute: false },
    logo: { type: String },
    initialMode: { type: String, attribute: 'initial-mode' },
    syncHash: { type: Boolean, attribute: 'sync-hash' },
    mode: { state: true },
    email: { state: true },
    password: { state: true },
    confirmPassword: { state: true },
    newPassword: { state: true },
    firstName: { state: true },
    lastName: { state: true },
    orgName: { state: true },
    phone: { state: true },
    verificationCode: { state: true },
    submitting: { state: true },
    resendDisabled: { state: true },
    providers: { state: true },
    mfaToken: { state: true },
    mfaCode: { state: true },
    recoveryCode: { state: true },
    useRecoveryCode: { state: true },
    mfaError: { state: true },
  };

  /** Endpoint override for dual-session scenarios. Defaults to the default endpoint. */
  declare endpoint?: VerdocsEndpoint;

  /**
   * Normally, if the user has a valid session this component renders a
   * sign-out button, otherwise the login/signup forms. Set visible to false
   * to render nothing in either case; apps may use this to track session
   * state via vdocs-authenticated without rendering any UI. Property-only
   * (it defaults to true, which a boolean attribute cannot switch off).
   */
  declare visible: boolean;

  /**
   * A Verdocs logo is displayed above the forms by default. Override its
   * source here (SVG format works best), or hide it via CSS overrides.
   */
  declare logo: string;

  /** The display mode to start in. */
  declare initialMode: TAuthMode;

  /**
   * If set, the component follows the window's #forgot hash: navigating to
   * #forgot switches to the forgot-password mode. Off by default.
   */
  declare syncHash: boolean;

  private declare mode: TAuthMode;
  private declare email: string;
  private declare password: string;
  private declare confirmPassword: string;
  private declare newPassword: string;
  private declare firstName: string;
  private declare lastName: string;
  private declare orgName: string;
  private declare phone: string;
  private declare verificationCode: string;
  private declare submitting: boolean;
  private declare resendDisabled: boolean;
  private declare providers: ISocialProviders;
  private declare mfaToken: string;
  private declare mfaCode: string;
  private declare recoveryCode: string;
  private declare useRecoveryCode: boolean;
  private declare mfaError: string;

  private resendTimer: ReturnType<typeof setTimeout> | null = null;
  private tempEndpointFor?: VerdocsEndpoint;
  private tempEndpointInstance?: VerdocsEndpoint;

  private session = new SessionController(this, () => this.resolvedEndpoint, () => {
    if (this.session.loaded) {
      this.emit<IAuthStatus>('vdocs-authenticated', {
        authenticated: this.session.authenticated,
        session: this.session.session,
        profile: this.session.profile,
      });
    }
  });

  constructor() {
    super();
    this.visible = true;
    this.logo = 'https://app.verdocs.com/assets/blue-logo.svg';
    this.initialMode = 'login';
    this.syncHash = false;
    this.mode = 'login';
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
    this.newPassword = '';
    this.firstName = '';
    this.lastName = '';
    this.orgName = '';
    this.phone = '';
    this.verificationCode = '';
    this.submitting = false;
    this.resendDisabled = false;
    this.providers = { google: false, microsoft: false };
    this.mfaToken = '';
    this.mfaCode = '';
    this.recoveryCode = '';
    this.useRecoveryCode = false;
    this.mfaError = '';
  }

  private get resolvedEndpoint(): VerdocsEndpoint {
    return resolveEndpoint(this.endpoint);
  }

  // Authenticating directly against the shared endpoint would let other
  // listeners observe the session before verification checks are done, so all
  // intermediate calls go through a throwaway, non-persisting endpoint.
  private get tempEndpoint(): VerdocsEndpoint {
    const resolved = this.resolvedEndpoint;
    if (!this.tempEndpointInstance || this.tempEndpointFor !== resolved) {
      this.tempEndpointInstance = new VerdocsEndpoint({ baseURL: resolved.getBaseURL(), persist: false });
      this.tempEndpointFor = resolved;
    }

    return this.tempEndpointInstance;
  }

  private applyHash = () => {
    if (window.location.hash.replace(/^#/, '').toLowerCase() === 'forgot') {
      this.mode = 'forgot';
    }
  };

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:block');

    // A provider that is not configured 404s from its start URL, so we ask which ones exist
    // before offering them. If the probe itself fails we simply show no provider buttons.
    getSocialProviders(this.resolvedEndpoint)
      .then(result => {
        this.providers = result;
      })
      .catch(() => undefined);

    this.handleSocialLoginReturn();
  }

  private handleSocialLoginReturn() {
    const params = new URLSearchParams(window.location.search);
    const loginCode = params.get('login_code');
    const state = params.get('state');
    const error = params.get('error');

    if (!loginCode && !error) {
      return;
    }

    const attempt = readSocialLoginAttempt();
    clearSocialLoginAttempt();
    cleanSocialLoginParams();

    if (error) {
      showToast(socialErrorMessage(error), { style: 'error' });
      return;
    }

    if (!loginCode) {
      return;
    }

    if (!attempt || attempt.state !== state) {
      showToast('Sign-in could not be verified. Try again.', { style: 'error' });
      return;
    }

    this.exchangeLoginCode(loginCode, attempt.verifier);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('hashchange', this.applyHash);
    if (this.resendTimer) {
      clearTimeout(this.resendTimer);
      this.resendTimer = null;
    }
  }

  override willUpdate(changed: PropertyValues<this>) {
    if (changed.has('initialMode') && this.initialMode) {
      this.mode = this.initialMode;
    }
  }

  override updated(changed: PropertyValues<this>) {
    // PropertyValues<this> only types public keys, and both of these are internal state.
    const changedState = changed as unknown as Map<string, unknown>;
    if ((changedState.has('mode') || changedState.has('useRecoveryCode')) && this.mode === 'mfa') {
      this.querySelector<HTMLInputElement>('vdocs-text-input input')?.focus();
    }

    if (changed.has('syncHash')) {
      if (this.syncHash) {
        this.applyHash();
        window.addEventListener('hashchange', this.applyHash);
      } else {
        window.removeEventListener('hashchange', this.applyHash);
      }
    }
  }

  private clearForms() {
    this.submitting = false;
    this.resendDisabled = false;
    this.mfaToken = '';
    this.mfaCode = '';
    this.recoveryCode = '';
    this.useRecoveryCode = false;
    this.mfaError = '';
    this.email = '';
    this.phone = '';
    this.password = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.verificationCode = '';
    this.firstName = '';
    this.lastName = '';
    this.orgName = '';
  }

  private completeLogin(result: IAuthenticateResponse) {
    this.clearForms();
    this.tempEndpoint.clearSession();
    this.resolvedEndpoint.setToken(result.access_token);
  }

  // The tail every route into a session shares: password, an mfa grant, or a provider login.
  private async finishLogin(authResult: IAuthenticateResponse) {
    this.tempEndpoint.setToken(authResult.access_token);

    const user = await getMyUser(this.tempEndpoint);
    this.submitting = false;

    if (!user.email_verified) {
      this.mode = 'verify';
    } else {
      this.completeLogin(authResult);
    }
  }

  private startMFA(token: string) {
    this.mfaToken = token;
    this.mfaCode = '';
    this.recoveryCode = '';
    this.useRecoveryCode = false;
    this.mfaError = '';
    this.submitting = false;
    this.mode = 'mfa';
  }

  private returnToLogin() {
    this.mfaToken = '';
    this.mfaCode = '';
    this.recoveryCode = '';
    this.useRecoveryCode = false;
    this.mfaError = '';
    this.password = '';
    this.submitting = false;
    this.mode = 'login';
  }

  private async handleLogin() {
    if (this.submitting) {
      return;
    }

    this.submitting = true;
    this.tempEndpoint.clearSession();

    try {
      const authResult = await authenticate(this.tempEndpoint, { username: this.email.trim(), password: this.password, grant_type: 'password' });
      await this.finishLogin(authResult);
    } catch (e) {
      const challenge = getMFAChallenge(e);
      if (challenge) {
        this.startMFA(challenge.mfa_token);
        return;
      }

      this.submitting = false;
      showToast('Login failed. Please check your credentials and try again.', { style: 'error' });
    }
  }

  private handleMFAFailure(e: unknown) {
    this.submitting = false;
    this.mfaCode = '';
    this.recoveryCode = '';

    // Every wrong attempt spends the token, so the API hands back a fresh one until the attempts
    // run out. A 401 means the challenge is gone and the password step starts over.
    const challenge = getMFAChallenge(e);
    if (challenge) {
      this.mfaToken = challenge.mfa_token;
      this.mfaError = MFA_CODE_ERROR;
      return;
    }

    if ((e as { response?: { status?: number } })?.response?.status === 401) {
      this.returnToLogin();
      showToast('Your sign-in timed out. Enter your password again.', { style: 'error' });
      return;
    }

    this.mfaError = MFA_CODE_ERROR;
  }

  private async submitMFA(code: string, isRecoveryCode: boolean) {
    if (this.submitting || !code) {
      return;
    }

    this.submitting = true;
    this.mfaError = '';
    this.tempEndpoint.clearSession();

    try {
      const authResult = await authenticate(
        this.tempEndpoint,
        isRecoveryCode ?
            { grant_type: 'urn:verdocs:params:oauth:grant-type:mfa-recovery-code', mfa_token: this.mfaToken, recovery_code: code } :
            { grant_type: 'urn:verdocs:params:oauth:grant-type:mfa-otp', mfa_token: this.mfaToken, otp: code },
      );
      await this.finishLogin(authResult);
    } catch (e) {
      this.handleMFAFailure(e);
    }
  }

  private handleVerifyMFA() {
    return this.submitMFA(this.useRecoveryCode ? this.recoveryCode : this.mfaCode, this.useRecoveryCode);
  }

  private handleMFACodeInput(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    this.mfaCode = digits;

    // Authenticator codes are always six digits, so there is nothing to wait for once we have them.
    if (digits.length === 6) {
      this.submitMFA(digits, false).catch(() => undefined);
    }
  }

  private handleRecoveryCodeInput(value: string) {
    this.recoveryCode = formatRecoveryCode(value);
  }

  private toggleRecoveryCode() {
    this.useRecoveryCode = !this.useRecoveryCode;
    this.mfaCode = '';
    this.recoveryCode = '';
    this.mfaError = '';
  }

  private startSocialLogin(provider: TSocialLoginProvider) {
    try {
      const verifier = createCodeVerifier();
      const state = createCodeVerifier();

      createCodeChallenge(verifier)
        .then(codeChallenge => {
          window.sessionStorage.setItem(SOCIAL_LOGIN_KEY, JSON.stringify({ verifier, state, provider } satisfies ISocialLoginAttempt));
          window.location.assign(getSocialLoginUrl(this.resolvedEndpoint, provider, { returnUri: currentReturnUri(), codeChallenge, state }));
        })
        .catch(() => showToast(SOCIAL_START_ERROR, { style: 'error' }));
    } catch {
      showToast(SOCIAL_START_ERROR, { style: 'error' });
    }
  }

  private exchangeLoginCode(loginCode: string, codeVerifier: string) {
    this.submitting = true;
    this.tempEndpoint.clearSession();

    authenticate(this.tempEndpoint, { grant_type: 'urn:verdocs:params:oauth:grant-type:login-code', login_code: loginCode, code_verifier: codeVerifier })
      .then(authResult => this.finishLogin(authResult))
      .catch(e => {
        const challenge = getMFAChallenge(e);
        if (challenge) {
          this.startMFA(challenge.mfa_token);
          return;
        }

        this.submitting = false;
        showToast('Sign-in did not work. Try again.', { style: 'error' });
      });
  }

  private async handleSignup() {
    if (!isPasswordComplex(this.password)) {
      showToast(PASSWORD_COMPLEXITY_MESSAGE, { style: 'error' });
      return;
    }

    if (this.password !== this.confirmPassword) {
      showToast('Passwords do not match.', { style: 'error' });
      return;
    }

    this.submitting = true;
    this.tempEndpoint.clearSession();
    const localeData = Intl.DateTimeFormat().resolvedOptions();

    try {
      const result = await createProfile(this.tempEndpoint, {
        email: this.email,
        password: this.password,
        first_name: this.firstName,
        last_name: this.lastName,
        org_name: this.orgName,
        phone: convertToE164(this.phone),
        timezone: localeData.timeZone,
        locale: localeData.locale,
      });

      this.tempEndpoint.setToken(result.access_token);
      // Keep the email around for the verification step, clear the rest.
      this.password = '';
      this.confirmPassword = '';
      this.phone = '';
      this.firstName = '';
      this.lastName = '';
      this.orgName = '';
      this.submitting = false;
      this.mode = 'verify';
    } catch (e) {
      const error = e as { message: string; response?: { status?: number; data?: { error?: string } } };
      this.submitting = false;
      this.emit<IAuthStatus>('vdocs-authenticated', { authenticated: false, session: null, profile: null });
      this.emit('vdocs-sdk-error', new SDKError(error.message, error.response?.status, error.response?.data));
      showToast(`Signup failed: ${error.response?.data?.error || 'Unknown Error'}`, { style: 'error' });
    }
  }

  private async handleVerification() {
    this.submitting = true;

    try {
      const verificationResult = await verifyEmail(this.tempEndpoint, { email: this.email, token: this.verificationCode });
      this.submitting = false;
      showToast('Thank you for verifying your email address.', { style: 'success' });
      this.completeLogin(verificationResult);
    } catch {
      this.submitting = false;
      showToast('Verification error, please check the code and try again.');
    }
  }

  private disableResendFor30s() {
    this.resendDisabled = true;
    this.resendTimer = setTimeout(() => {
      this.resendDisabled = false;
      this.resendTimer = null;
    }, 30000);
  }

  private handleResendVerification() {
    // The server rate-limits this anyway, but click-spamming it makes a poor
    // user experience, so disable the button for a while after each send.
    this.disableResendFor30s();

    resendVerification(this.tempEndpoint)
      .then(() => showToast('Please check your email for a verification code.', { style: 'info' }))
      .catch(() => showToast('Unable to resend code. Please try again later.', { style: 'error' }));
  }

  private handleResendReset() {
    this.disableResendFor30s();

    resetPassword(this.resolvedEndpoint, { email: this.email })
      .then(() => showToast('Please check your email again for a verification code.', { style: 'info' }))
      .catch(() => showToast('Unable to resend code. Please try again later.', { style: 'error' }));
  }

  private async handleRequestResetCode() {
    this.submitting = true;

    try {
      await resetPassword(this.resolvedEndpoint, { email: this.email });
      this.submitting = false;
      showToast('Please check your email inbox for a password reset code.', { style: 'success' });
      this.verificationCode = '';
      this.newPassword = '';
      this.confirmPassword = '';
      this.mode = 'reset';
    } catch {
      this.submitting = false;
      showToast('Request failed. Please check your email address and try again.');
    }
  }

  private async handleResetPassword() {
    if (!isPasswordComplex(this.newPassword)) {
      showToast(PASSWORD_COMPLEXITY_MESSAGE, { style: 'error' });
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      showToast('Passwords do not match.', { style: 'error' });
      return;
    }

    this.submitting = true;

    try {
      await resetPassword(this.resolvedEndpoint, { email: this.email, code: this.verificationCode, new_password: this.newPassword });
      this.submitting = false;
      showToast('Your password has been reset. You may now use your new password to login.', { style: 'success' });
      this.verificationCode = '';
      this.newPassword = '';
      this.confirmPassword = '';
      this.password = '';
      this.mode = 'login';
    } catch {
      this.submitting = false;
      showToast('Verification error, please check the code and try again.');
    }
  }

  private handleLogout() {
    this.resolvedEndpoint.clearSession();
    this.tempEndpoint.clearSession();
    this.clearForms();
    this.mode = 'login';
  }

  private setMode(mode: TAuthMode) {
    this.mode = mode;
  }

  private renderLogoHeader() {
    return html`
      <a href="https://verdocs.com/en/">
        <img src=${this.logo} alt="Verdocs Logo" class="vdocs:w-32 vdocs:max-w-full vdocs:mt-5 vdocs:mb-7" />
      </a>`;
  }

  private renderProviderButtons() {
    if (!this.providers.google && !this.providers.microsoft) {
      return nothing;
    }

    return html`
      <div class="vdocs:w-full">
        ${this.providers.google ?
          html`
            <vdocs-button
              label="Continue with Google"
              variant="outline"
              class="vdocs:w-full vdocs:mb-2.5 vdocs:block"
              .disabled=${this.submitting}
              @click=${() => this.startSocialLogin('google')}></vdocs-button>` :
          nothing}
        ${this.providers.microsoft ?
          html`
            <vdocs-button
              label="Continue with Microsoft"
              variant="outline"
              class="vdocs:w-full vdocs:mb-2.5 vdocs:block"
              .disabled=${this.submitting}
              @click=${() => this.startSocialLogin('microsoft')}></vdocs-button>` :
          nothing}

        <div class="vdocs:flex vdocs:items-center vdocs:gap-2 vdocs:my-4 vdocs:text-xs vdocs:text-muted">
          <div class="vdocs:flex-1 vdocs:h-px vdocs:bg-edge"></div>
          or
          <div class="vdocs:flex-1 vdocs:h-px vdocs:bg-edge"></div>
        </div>
      </div>`;
  }

  private renderMFA() {
    const codeComplete = this.useRecoveryCode ? this.recoveryCode.replace('-', '').length === 8 : this.mfaCode.length === 6;

    return html`
      <div class=${FORM_CLASSES}>
        ${this.renderLogoHeader()}

        <h3 class="vdocs:text-lg vdocs:font-normal vdocs:text-ink vdocs:text-center vdocs:leading-7 vdocs:m-0">Two-factor authentication</h3>

        <p class="vdocs:text-sm vdocs:text-ink vdocs:my-4">
          ${this.useRecoveryCode ?
            'Enter one of the backup codes you saved when you turned on two-factor authentication.' :
            'Enter the six-digit code from your authenticator app.'}
        </p>

        <form class="vdocs:w-full" @submit=${(e: Event) => this.submitForm(e, () => this.handleVerifyMFA())}>
          ${this.useRecoveryCode ?
            html`
              <vdocs-text-input
                label="Backup code"
                placeholder="xxxx-xxxx"
                autocomplete="one-time-code"
                .value=${this.recoveryCode}
                .disabled=${this.submitting}
                @vdocs-input=${(e: CustomEvent<{ value: string }>) => this.handleRecoveryCodeInput(e.detail.value)}></vdocs-text-input>` :
            html`
              <vdocs-text-input
                label="Authentication code"
                inputmode="numeric"
                autocomplete="one-time-code"
                .value=${this.mfaCode}
                .disabled=${this.submitting}
                @vdocs-input=${(e: CustomEvent<{ value: string }>) => this.handleMFACodeInput(e.detail.value)}></vdocs-text-input>`}

          ${this.mfaError ? html`<div role="alert" class="vdocs:text-sm vdocs:text-danger vdocs:mb-2">${this.mfaError}</div>` : nothing}

          <div class="vdocs:flex vdocs:flex-row vdocs:justify-center vdocs:gap-5 vdocs:mt-5">
            <vdocs-button label="Cancel" variant="outline" .disabled=${this.submitting} @click=${this.returnToLogin}></vdocs-button>
            <vdocs-button label="Verify" type="submit" .disabled=${this.submitting || !codeComplete}></vdocs-button>
          </div>

          <div class="vdocs:flex vdocs:justify-center vdocs:mt-2">
            <vdocs-button
              label=${this.useRecoveryCode ? 'Use your authenticator app instead' : 'Use a backup code instead'}
              variant="text"
              size="small"
              .disabled=${this.submitting}
              @click=${this.toggleRecoveryCode}></vdocs-button>
          </div>
        </form>
      </div>`;
  }

  private renderSignup() {
    const invalid = this.submitting ||
      !this.firstName || !this.lastName || !this.email || !this.password || !this.confirmPassword || !this.phone || !this.orgName;

    return html`
      <div class=${FORM_CLASSES}>
        ${this.renderLogoHeader()}

        <h3 class="vdocs:text-lg vdocs:font-normal vdocs:text-ink vdocs:text-center vdocs:leading-7 vdocs:m-0">Sign up for a free account</h3>
        <div class="vdocs:flex vdocs:items-center vdocs:gap-1 vdocs:text-sm vdocs:text-ink vdocs:my-2">
          Already have an account?
          <vdocs-button label="Log In" variant="text" size="small" .disabled=${this.submitting} @click=${() => this.setMode('login')}></vdocs-button>
        </div>

        ${this.renderProviderButtons()}

        <form class="vdocs:w-full" @submit=${(e: Event) => this.submitForm(e, () => this.handleSignup())}>
          <div class="vdocs:flex vdocs:flex-row vdocs:gap-5">
            <vdocs-text-input
              label="First Name"
              autocomplete="given-name"
              required
              class="vdocs:flex-1"
              .value=${this.firstName}
              .disabled=${this.submitting}
              @vdocs-input=${(e: CustomEvent<{ value: string }>) => {
                this.firstName = e.detail.value;
              }}></vdocs-text-input>
            <vdocs-text-input
              label="Last Name"
              autocomplete="family-name"
              required
              class="vdocs:flex-1"
              .value=${this.lastName}
              .disabled=${this.submitting}
              @vdocs-input=${(e: CustomEvent<{ value: string }>) => {
                this.lastName = e.detail.value;
              }}></vdocs-text-input>
          </div>
          <vdocs-text-input
            label="Email Address"
            type="email"
            autocomplete="email"
            required
            .value=${this.email}
            .disabled=${this.submitting}
            @vdocs-input=${(e: CustomEvent<{ value: string }>) => {
              this.email = e.detail.value;
            }}></vdocs-text-input>
          <vdocs-text-input
            label="Password"
            type="password"
            autocomplete="new-password"
            required
            .value=${this.password}
            .disabled=${this.submitting}
            @vdocs-input=${(e: CustomEvent<{ value: string }>) => {
              this.password = e.detail.value;
            }}></vdocs-text-input>
          <vdocs-text-input
            label="Confirm Password"
            type="password"
            autocomplete="off"
            required
            .value=${this.confirmPassword}
            .disabled=${this.submitting}
            @vdocs-input=${(e: CustomEvent<{ value: string }>) => {
              this.confirmPassword = e.detail.value;
            }}></vdocs-text-input>
          <vdocs-text-input
            label="Phone Number"
            type="tel"
            autocomplete="tel"
            required
            .value=${this.phone}
            .disabled=${this.submitting}
            @vdocs-input=${(e: CustomEvent<{ value: string }>) => {
              this.phone = e.detail.value;
            }}></vdocs-text-input>
          <vdocs-text-input
            label="Organization Name"
            autocomplete="organization"
            required
            .value=${this.orgName}
            .disabled=${this.submitting}
            @vdocs-input=${(e: CustomEvent<{ value: string }>) => {
              this.orgName = e.detail.value;
            }}></vdocs-text-input>

          <div class="vdocs:text-xs vdocs:text-muted vdocs:mt-2">
            By clicking the Create Account button, you agree to the
            <a href="https://verdocs.com/eula" target="_blank" rel="noreferrer" class="vdocs:text-ink vdocs:underline">End User License Agreement</a>.
            Learn about how we use and protect your data and how you can opt-out in our
            <a href="https://verdocs.com/privacy-policy" target="_blank" rel="noreferrer" class="vdocs:text-ink vdocs:underline">Privacy Policy</a>.
          </div>

          <div class="vdocs:flex vdocs:justify-center vdocs:mt-7">
            <vdocs-button label="Next" type="submit" .disabled=${invalid}></vdocs-button>
          </div>
        </form>
      </div>`;
  }

  private renderVerify() {
    return html`
      <div class=${FORM_CLASSES}>
        <form class="vdocs:w-full" @submit=${(e: Event) => this.submitForm(e, () => this.handleVerification())}>
          <p class="vdocs:text-sm vdocs:text-ink vdocs:my-4">Please check your e-mail inbox for a verification code and enter it below.</p>

          <vdocs-text-input
            label="Verification Code"
            required
            .value=${this.verificationCode}
            .disabled=${this.submitting}
            @vdocs-input=${(e: CustomEvent<{ value: string }>) => {
              this.verificationCode = e.detail.value;
            }}></vdocs-text-input>

          <div class="vdocs:flex vdocs:flex-row vdocs:justify-center vdocs:gap-5 vdocs:mt-5">
            <vdocs-button label="Sign Out" variant="outline" .disabled=${this.submitting} @click=${this.handleLogout}></vdocs-button>
            <vdocs-button label="Verify" type="submit" .disabled=${this.submitting || this.verificationCode.length !== 6}></vdocs-button>
          </div>
          <div class="vdocs:flex vdocs:justify-center vdocs:mt-2">
            <vdocs-button
              label="Resend Code"
              variant="text"
              .disabled=${this.resendDisabled || this.submitting}
              @click=${this.handleResendVerification}></vdocs-button>
          </div>
        </form>
      </div>`;
  }

  private renderForgot() {
    return html`
      <div class=${FORM_CLASSES}>
        ${this.renderLogoHeader()}

        <h3 class="vdocs:text-lg vdocs:font-normal vdocs:text-ink vdocs:text-center vdocs:leading-7 vdocs:m-0">Forgot your password?</h3>

        <p class="vdocs:text-sm vdocs:text-ink vdocs:my-4">
          Enter your e-mail address below. If the e-mail address is valid, a password reset code will be sent to your
          inbox. Please allow up to 15 minutes to arrive, and check your spam folder if you do not receive the message.
        </p>

        <form class="vdocs:w-full" @submit=${(e: Event) => this.submitForm(e, () => this.handleRequestResetCode())}>
          <vdocs-text-input
            label="Email Address"
            type="email"
            autocomplete="email"
            required
            .value=${this.email}
            .disabled=${this.submitting}
            @vdocs-input=${(e: CustomEvent<{ value: string }>) => {
              this.email = e.detail.value;
            }}></vdocs-text-input>

          <div class="vdocs:flex vdocs:flex-row vdocs:justify-center vdocs:gap-5 vdocs:mt-7">
            <vdocs-button label="Cancel" size="small" variant="outline" .disabled=${this.submitting} @click=${() => this.setMode('login')}></vdocs-button>
            <vdocs-button label="Request Code" size="small" type="submit" .disabled=${this.submitting}></vdocs-button>
          </div>
        </form>
      </div>`;
  }

  private renderReset() {
    return html`
      <div class=${FORM_CLASSES}>
        ${this.renderLogoHeader()}

        <h3 class="vdocs:text-lg vdocs:font-normal vdocs:text-ink vdocs:text-center vdocs:leading-7 vdocs:m-0">Reset your password</h3>

        <p class="vdocs:text-sm vdocs:text-ink vdocs:my-4">
          Enter the verification code sent to your inbox below, along with your new password. Please allow up to 15
          minutes for the code to arrive, and check your spam folder if you do not receive the message.
        </p>

        <form class="vdocs:w-full" @submit=${(e: Event) => this.submitForm(e, () => this.handleResetPassword())}>
          <vdocs-text-input
            label="Verification Code"
            required
            .value=${this.verificationCode}
            .disabled=${this.submitting}
            @vdocs-input=${(e: CustomEvent<{ value: string }>) => {
              this.verificationCode = e.detail.value;
            }}></vdocs-text-input>
          <vdocs-text-input
            label="Password"
            type="password"
            autocomplete="off"
            required
            .value=${this.newPassword}
            .disabled=${this.submitting}
            @vdocs-input=${(e: CustomEvent<{ value: string }>) => {
              this.newPassword = e.detail.value;
            }}></vdocs-text-input>
          <vdocs-text-input
            label="Confirm Password"
            type="password"
            autocomplete="off"
            required
            .value=${this.confirmPassword}
            .disabled=${this.submitting}
            @vdocs-input=${(e: CustomEvent<{ value: string }>) => {
              this.confirmPassword = e.detail.value;
            }}></vdocs-text-input>

          <div class="vdocs:flex vdocs:flex-row vdocs:justify-center vdocs:gap-5 vdocs:mt-7">
            <vdocs-button label="Cancel" variant="outline" .disabled=${this.submitting} @click=${() => this.setMode('login')}></vdocs-button>
            <vdocs-button label="Reset" type="submit" .disabled=${this.submitting}></vdocs-button>
          </div>

          <div class="vdocs:flex vdocs:justify-center vdocs:mt-2">
            <vdocs-button
              label="Resend Code"
              variant="text"
              .disabled=${this.resendDisabled || this.submitting}
              @click=${this.handleResendReset}></vdocs-button>
          </div>
        </form>
      </div>`;
  }

  private renderLogin() {
    return html`
      <div class=${FORM_CLASSES}>
        ${this.renderLogoHeader()}

        <h3 class="vdocs:text-lg vdocs:font-normal vdocs:text-ink vdocs:text-center vdocs:leading-7 vdocs:m-0">Log in to your account</h3>
        <div class="vdocs:flex vdocs:items-center vdocs:gap-1 vdocs:text-sm vdocs:text-ink vdocs:my-2">
          Don't have an account?
          <vdocs-button label="Sign Up" variant="text" size="small" .disabled=${this.submitting} @click=${() => this.setMode('signup')}></vdocs-button>
        </div>

        ${this.renderProviderButtons()}

        <form class="vdocs:w-full" @submit=${(e: Event) => this.submitForm(e, () => this.handleLogin())}>
          <vdocs-text-input
            label="Email"
            type="email"
            autocomplete="username"
            .value=${this.email}
            .disabled=${this.submitting}
            @vdocs-input=${(e: CustomEvent<{ value: string }>) => {
              this.email = e.detail.value;
            }}></vdocs-text-input>
          <vdocs-text-input
            label="Password"
            type="password"
            autocomplete="current-password"
            .value=${this.password}
            .disabled=${this.submitting}
            @vdocs-input=${(e: CustomEvent<{ value: string }>) => {
              this.password = e.detail.value;
            }}></vdocs-text-input>

          <div class="vdocs:flex vdocs:justify-center vdocs:mt-2.5 vdocs:mb-5">
            <vdocs-button
              label="Forgot Your Password?"
              variant="text"
              size="small"
              .disabled=${this.submitting}
              @click=${() => this.setMode('forgot')}></vdocs-button>
          </div>

          <div class="vdocs:flex vdocs:justify-center">
            <vdocs-button label="Login" type="submit" .disabled=${this.submitting}></vdocs-button>
          </div>
        </form>
      </div>`;
  }

  private submitForm(e: Event, handler: () => Promise<void>) {
    e.preventDefault();
    // Every submit handler catches its own failures (toast plus state reset),
    // so there is no rejection path left to handle here.
    handler().catch(() => undefined);
  }

  override render(): TemplateResult | typeof nothing {
    if (!this.visible) {
      return nothing;
    }

    if (this.session.session) {
      return html`
        <div class="vdocs:flex vdocs:justify-center vdocs:mt-8 vdocs:font-sans">
          <vdocs-button label="Sign Out" .disabled=${this.submitting} @click=${this.handleLogout}></vdocs-button>
        </div>`;
    }

    switch (this.mode) {
      case 'signup':
        return this.renderSignup();
      case 'verify':
        return this.renderVerify();
      case 'forgot':
        return this.renderForgot();
      case 'reset':
        return this.renderReset();
      case 'mfa':
        return this.renderMFA();
      default:
        return this.renderLogin();
    }
  }
}

register('vdocs-auth', VdocsAuth);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-auth': VdocsAuth;
  }

  interface GlobalEventHandlersEventMap {
    'vdocs-authenticated': CustomEvent<IAuthStatus>;
    'vdocs-sdk-error': CustomEvent<SDKError>;
  }
}
