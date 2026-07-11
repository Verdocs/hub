import { html, nothing } from 'lit';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import type { PropertyValues, TemplateResult } from 'lit';
import type { IAuthenticateResponse } from '@verdocs/js-sdk';
import { authenticate, convertToE164, createProfile, getMyUser, resendVerification, resetPassword, verifyEmail } from '@verdocs/js-sdk';
import { SessionController } from '../base/session-controller.js';
import { SDKError, type IAuthStatus } from '../types.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { resolveEndpoint } from '../base/endpoint.js';
import { register } from '../base/register.js';
import { showToast } from '../utils/toast.js';
import '../controls/vdocs-text-input.js';
import '../controls/vdocs-button.js';

export type TAuthMode = 'login' | 'forgot' | 'reset' | 'signup' | 'verify';

const isPasswordComplex = (password: string) => {
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasSpecialChar = /[`!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?~ ]/.test(password);
  return password.length >= 8 && hasUppercase && hasLowercase && hasSpecialChar;
};

const PASSWORD_COMPLEXITY_MESSAGE = 'Password must be at least 8 characters long and contain at least one uppercase, one lowercase, and one special character.';

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

  private async handleLogin() {
    if (this.submitting) {
      return;
    }

    this.submitting = true;
    this.tempEndpoint.clearSession();

    try {
      const authResult = await authenticate(this.tempEndpoint, { username: this.email.trim(), password: this.password, grant_type: 'password' });
      this.tempEndpoint.setToken(authResult.access_token);

      const user = await getMyUser(this.tempEndpoint);
      this.submitting = false;

      if (!user.email_verified) {
        this.mode = 'verify';
      } else {
        this.completeLogin(authResult);
      }
    } catch {
      this.submitting = false;
      showToast('Login failed. Please check your credentials and try again.', { style: 'error' });
    }
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
