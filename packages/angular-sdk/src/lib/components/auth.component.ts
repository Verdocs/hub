import { VerdocsEndpoint } from '@verdocs/js-sdk';
import type { IAuthenticateResponse, IProfile, ISocialProviders, TSession, TSocialLoginProvider } from '@verdocs/js-sdk';
import { createCodeChallenge, createCodeVerifier, getMFAChallenge, getSocialLoginUrl, getSocialProviders } from '@verdocs/js-sdk';
import { authenticate, convertToE164, createProfile, getMyUser, resendVerification, resetPassword, verifyEmail } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, ElementRef, inject, input, linkedSignal, output, signal, viewChild } from '@angular/core';
import { VerdocsTextInputComponent } from '../controls/text-input.component';
import { VerdocsButtonComponent } from '../controls/button.component';
import { VERDOCS_ENDPOINT } from '../provide-verdocs';
import { SDKError, type IAuthStatus } from '../types';
import { showToast } from '../toast';

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

/**
 * Display an authentication panel that allows the user to log in or sign up,
 * including email verification and password reset flows. If the user is
 * already authenticated with a valid session, a sign-out button is shown
 * instead and the authenticated output fires immediately. It is up to the
 * host application to route to the next appropriate view.
 *
 * Authentication happens against a temporary, non-persisting endpoint so other
 * session listeners never observe a partially-verified login. Tokens are
 * pushed to the real endpoint only once verification checks pass.
 */
@Component({
  selector: 'verdocs-auth',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ VerdocsButtonComponent, VerdocsTextInputComponent ],
  host: { '[style.display]': `'block'` },
  template: `
    @if (visible()) {
      @if (session()) {
        <div class="vdocs:flex vdocs:justify-center vdocs:mt-8 vdocs:font-sans">
          <verdocs-button label="Sign Out" [disabled]="submitting()" (click)="signOut()" />
        </div>
      } @else {
        @switch (mode()) {
          @case ('signup') {
            <div [class]="formClasses">
              <a href="https://verdocs.com/en/">
                <img [src]="logo()" alt="Verdocs Logo" class="vdocs:w-32 vdocs:max-w-full vdocs:mt-5 vdocs:mb-7" />
              </a>

              <h3 class="vdocs:text-lg vdocs:font-normal vdocs:text-ink vdocs:text-center vdocs:leading-7 vdocs:m-0">Sign up for a free account</h3>
              <div class="vdocs:flex vdocs:items-center vdocs:gap-1 vdocs:text-sm vdocs:text-ink vdocs:my-2">
                Already have an account?
                <verdocs-button label="Log In" variant="text" size="small" [disabled]="submitting()" (click)="mode.set('login')" />
              </div>

              @if (showProviders()) {
                <div class="vdocs:w-full">
                  @if (providers().google) {
                    <verdocs-button label="Continue with Google" variant="outline" class="vdocs:w-full vdocs:mb-2.5 vdocs:block" [disabled]="submitting()" (click)="startSocialLogin('google')" />
                  }
                  @if (providers().microsoft) {
                    <verdocs-button label="Continue with Microsoft" variant="outline" class="vdocs:w-full vdocs:mb-2.5 vdocs:block" [disabled]="submitting()" (click)="startSocialLogin('microsoft')" />
                  }

                  <div class="vdocs:flex vdocs:items-center vdocs:gap-2 vdocs:my-4 vdocs:text-xs vdocs:text-muted">
                    <div class="vdocs:flex-1 vdocs:h-px vdocs:bg-edge"></div>
                    or
                    <div class="vdocs:flex-1 vdocs:h-px vdocs:bg-edge"></div>
                  </div>
                </div>
              }

              <form class="vdocs:w-full" (submit)="submitForm($event, handleSignup)">
                <div class="vdocs:flex vdocs:flex-row vdocs:gap-5">
                  <verdocs-text-input label="First Name" autocomplete="given-name" [required]="true" [(value)]="firstName" [disabled]="submitting()" class="vdocs:flex-1" />
                  <verdocs-text-input label="Last Name" autocomplete="family-name" [required]="true" [(value)]="lastName" [disabled]="submitting()" class="vdocs:flex-1" />
                </div>
                <verdocs-text-input label="Email Address" type="email" autocomplete="email" [required]="true" [(value)]="email" [disabled]="submitting()" />
                <verdocs-text-input label="Password" type="password" autocomplete="new-password" [required]="true" [(value)]="password" [disabled]="submitting()" />
                <verdocs-text-input label="Confirm Password" type="password" autocomplete="off" [required]="true" [(value)]="confirmPassword" [disabled]="submitting()" />
                <verdocs-text-input label="Phone Number" type="tel" autocomplete="tel" [required]="true" [(value)]="phone" [disabled]="submitting()" />
                <verdocs-text-input label="Organization Name" autocomplete="organization" [required]="true" [(value)]="orgName" [disabled]="submitting()" />

                <div class="vdocs:text-xs vdocs:text-muted vdocs:mt-2">
                  By clicking the Create Account button, you agree to the
                  <a href="https://verdocs.com/eula" target="_blank" rel="noreferrer" class="vdocs:text-ink vdocs:underline">End User License Agreement</a>.
                  Learn about how we use and protect your data and how you can opt-out in our
                  <a href="https://verdocs.com/privacy-policy" target="_blank" rel="noreferrer" class="vdocs:text-ink vdocs:underline">Privacy Policy</a>.
                </div>

                <div class="vdocs:flex vdocs:justify-center vdocs:mt-7">
                  <verdocs-button label="Next" type="submit" [disabled]="signupInvalid()" />
                </div>
              </form>
            </div>
          }
          @case ('verify') {
            <div [class]="formClasses">
              <form class="vdocs:w-full" (submit)="submitForm($event, handleVerification)">
                <p class="vdocs:text-sm vdocs:text-ink vdocs:my-4">Please check your e-mail inbox for a verification code and enter it below.</p>

                <verdocs-text-input label="Verification Code" [required]="true" [(value)]="verificationCode" [disabled]="submitting()" />

                <div class="vdocs:flex vdocs:flex-row vdocs:justify-center vdocs:gap-5 vdocs:mt-5">
                  <verdocs-button label="Sign Out" variant="outline" [disabled]="submitting()" (click)="signOut()" />
                  <verdocs-button label="Verify" type="submit" [disabled]="submitting() || verificationCode().length !== 6" />
                </div>
                <div class="vdocs:flex vdocs:justify-center vdocs:mt-2">
                  <verdocs-button label="Resend Code" variant="text" [disabled]="resendDisabled() || submitting()" (click)="resendVerificationCode()" />
                </div>
              </form>
            </div>
          }
          @case ('forgot') {
            <div [class]="formClasses">
              <a href="https://verdocs.com/en/">
                <img [src]="logo()" alt="Verdocs Logo" class="vdocs:w-32 vdocs:max-w-full vdocs:mt-5 vdocs:mb-7" />
              </a>

              <h3 class="vdocs:text-lg vdocs:font-normal vdocs:text-ink vdocs:text-center vdocs:leading-7 vdocs:m-0">Forgot your password?</h3>

              <p class="vdocs:text-sm vdocs:text-ink vdocs:my-4">
                Enter your e-mail address below. If the e-mail address is valid, a password reset code will be sent to your inbox. Please allow up to 15
                minutes to arrive, and check your spam folder if you do not receive the message.
              </p>

              <form class="vdocs:w-full" (submit)="submitForm($event, handleRequestResetCode)">
                <verdocs-text-input label="Email Address" type="email" autocomplete="email" [required]="true" [(value)]="email" [disabled]="submitting()" />

                <div class="vdocs:flex vdocs:flex-row vdocs:justify-center vdocs:gap-5 vdocs:mt-7">
                  <verdocs-button label="Cancel" size="small" variant="outline" [disabled]="submitting()" (click)="mode.set('login')" />
                  <verdocs-button label="Request Code" size="small" type="submit" [disabled]="submitting()" />
                </div>
              </form>
            </div>
          }
          @case ('reset') {
            <div [class]="formClasses">
              <a href="https://verdocs.com/en/">
                <img [src]="logo()" alt="Verdocs Logo" class="vdocs:w-32 vdocs:max-w-full vdocs:mt-5 vdocs:mb-7" />
              </a>

              <h3 class="vdocs:text-lg vdocs:font-normal vdocs:text-ink vdocs:text-center vdocs:leading-7 vdocs:m-0">Reset your password</h3>

              <p class="vdocs:text-sm vdocs:text-ink vdocs:my-4">
                Enter the verification code sent to your inbox below, along with your new password. Please allow up to 15 minutes for the code to arrive,
                and check your spam folder if you do not receive the message.
              </p>

              <form class="vdocs:w-full" (submit)="submitForm($event, handleResetPassword)">
                <verdocs-text-input label="Verification Code" [required]="true" [(value)]="verificationCode" [disabled]="submitting()" />
                <verdocs-text-input label="Password" type="password" autocomplete="off" [required]="true" [(value)]="newPassword" [disabled]="submitting()" />
                <verdocs-text-input label="Confirm Password" type="password" autocomplete="off" [required]="true" [(value)]="confirmPassword" [disabled]="submitting()" />

                <div class="vdocs:flex vdocs:flex-row vdocs:justify-center vdocs:gap-5 vdocs:mt-7">
                  <verdocs-button label="Cancel" variant="outline" [disabled]="submitting()" (click)="mode.set('login')" />
                  <verdocs-button label="Reset" type="submit" [disabled]="submitting()" />
                </div>

                <div class="vdocs:flex vdocs:justify-center vdocs:mt-2">
                  <verdocs-button label="Resend Code" variant="text" [disabled]="resendDisabled() || submitting()" (click)="resendResetCode()" />
                </div>
              </form>
            </div>
          }
          @case ('mfa') {
            <div [class]="formClasses">
              <a href="https://verdocs.com/en/">
                <img [src]="logo()" alt="Verdocs Logo" class="vdocs:w-32 vdocs:max-w-full vdocs:mt-5 vdocs:mb-7" />
              </a>

              <h3 class="vdocs:text-lg vdocs:font-normal vdocs:text-ink vdocs:text-center vdocs:leading-7 vdocs:m-0">Two-factor authentication</h3>

              <p class="vdocs:text-sm vdocs:text-ink vdocs:my-4">
                @if (useRecoveryCode()) {
                  Enter one of the backup codes you saved when you turned on two-factor authentication.
                } @else {
                  Enter the six-digit code from your authenticator app.
                }
              </p>

              <form class="vdocs:w-full" (submit)="submitForm($event, handleVerifyMFA)">
                @if (useRecoveryCode()) {
                  <verdocs-text-input
                    #mfaField
                    label="Backup code"
                    placeholder="xxxx-xxxx"
                    autocomplete="one-time-code"
                    [value]="recoveryCode()"
                    [disabled]="submitting()"
                    (valueChange)="onRecoveryCodeInput($event)" />
                } @else {
                  <verdocs-text-input
                    #mfaField
                    label="Authentication code"
                    inputmode="numeric"
                    autocomplete="one-time-code"
                    [value]="mfaCode()"
                    [disabled]="submitting()"
                    (valueChange)="onMFACodeInput($event)" />
                }

                @if (mfaError()) {
                  <div role="alert" class="vdocs:text-sm vdocs:text-danger vdocs:mb-2">{{ mfaError() }}</div>
                }

                <div class="vdocs:flex vdocs:flex-row vdocs:justify-center vdocs:gap-5 vdocs:mt-5">
                  <verdocs-button label="Cancel" variant="outline" [disabled]="submitting()" (click)="returnToLogin()" />
                  <verdocs-button label="Verify" type="submit" [disabled]="submitting() || !mfaCodeComplete()" />
                </div>

                <div class="vdocs:flex vdocs:justify-center vdocs:mt-2">
                  <verdocs-button
                    [label]="useRecoveryCode() ? 'Use your authenticator app instead' : 'Use a backup code instead'"
                    variant="text"
                    size="small"
                    [disabled]="submitting()"
                    (click)="toggleRecoveryCode()" />
                </div>
              </form>
            </div>
          }
          @default {
            <div [class]="formClasses">
              <a href="https://verdocs.com/en/">
                <img [src]="logo()" alt="Verdocs Logo" class="vdocs:w-32 vdocs:max-w-full vdocs:mt-5 vdocs:mb-7" />
              </a>

              <h3 class="vdocs:text-lg vdocs:font-normal vdocs:text-ink vdocs:text-center vdocs:leading-7 vdocs:m-0">Log in to your account</h3>
              <div class="vdocs:flex vdocs:items-center vdocs:gap-1 vdocs:text-sm vdocs:text-ink vdocs:my-2">
                Don't have an account?
                <verdocs-button label="Sign Up" variant="text" size="small" [disabled]="submitting()" (click)="mode.set('signup')" />
              </div>

              @if (showProviders()) {
                <div class="vdocs:w-full">
                  @if (providers().google) {
                    <verdocs-button label="Continue with Google" variant="outline" class="vdocs:w-full vdocs:mb-2.5 vdocs:block" [disabled]="submitting()" (click)="startSocialLogin('google')" />
                  }
                  @if (providers().microsoft) {
                    <verdocs-button label="Continue with Microsoft" variant="outline" class="vdocs:w-full vdocs:mb-2.5 vdocs:block" [disabled]="submitting()" (click)="startSocialLogin('microsoft')" />
                  }

                  <div class="vdocs:flex vdocs:items-center vdocs:gap-2 vdocs:my-4 vdocs:text-xs vdocs:text-muted">
                    <div class="vdocs:flex-1 vdocs:h-px vdocs:bg-edge"></div>
                    or
                    <div class="vdocs:flex-1 vdocs:h-px vdocs:bg-edge"></div>
                  </div>
                </div>
              }

              <form class="vdocs:w-full" (submit)="submitForm($event, handleLogin)">
                <verdocs-text-input label="Email" type="email" autocomplete="username" [(value)]="email" [disabled]="submitting()" />
                <verdocs-text-input label="Password" type="password" autocomplete="current-password" [(value)]="password" [disabled]="submitting()" />

                <div class="vdocs:flex vdocs:justify-center vdocs:mt-2.5 vdocs:mb-5">
                  <verdocs-button label="Forgot Your Password?" variant="text" size="small" [disabled]="submitting()" (click)="mode.set('forgot')" />
                </div>

                <div class="vdocs:flex vdocs:justify-center">
                  <verdocs-button label="Login" type="submit" [disabled]="submitting()" />
                </div>
              </form>
            </div>
          }
        }
      }
    }
  `,
})
export class VerdocsAuthComponent {
  /** Endpoint override for dual-session scenarios. Defaults to the provided endpoint. */
  readonly endpoint = input<VerdocsEndpoint>();

  /**
   * Normally, if the user has a valid session this component renders a sign-out
   * button, otherwise the login/signup forms. Set visible to false to render
   * nothing in either case; apps may use this to track session state via the
   * authenticated output without rendering any UI.
   */
  readonly visible = input(true);

  /**
   * A Verdocs logo is displayed above the forms by default. Override its source
   * here (SVG format works best), or hide it via CSS overrides.
   */
  readonly logo = input('https://app.verdocs.com/assets/blue-logo.svg');

  /** The display mode to start in. */
  readonly initialMode = input<TAuthMode>('login');

  /**
   * If set, the component follows the window's #forgot hash: navigating to
   * #forgot switches to the forgot-password mode. Off by default.
   */
  readonly syncHash = input(false);

  /**
   * Emitted when the session authentication process completes. Check the status
   * for the result. Always emitted at least once after the initial session check.
   */
  readonly authenticated = output<IAuthStatus>();

  /** Emitted if an error occurs, with information about the error. */
  readonly sdkError = output<SDKError>();

  private readonly injectedEndpoint = inject(VERDOCS_ENDPOINT, { optional: true });

  protected readonly resolvedEndpoint = computed(() => {
    const resolved = this.endpoint() ?? this.injectedEndpoint;
    if (!resolved) {
      throw new Error('verdocs-auth needs provideVerdocs() in your application providers or an explicit endpoint input');
    }

    return resolved;
  });

  // Authenticating directly against the shared endpoint would let other
  // listeners observe the session before verification checks are done, so all
  // intermediate calls go through a throwaway, non-persisting endpoint.
  private readonly tempEndpoint = computed(
    () => new VerdocsEndpoint({ baseURL: this.resolvedEndpoint().getBaseURL(), persist: false }),
  );

  protected readonly session = signal<TSession>(null);
  protected readonly profile = signal<IProfile | null>(null);
  // Follows the initialMode input until the user navigates between modes.
  protected readonly mode = linkedSignal(() => this.initialMode());
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly newPassword = signal('');
  protected readonly firstName = signal('');
  protected readonly lastName = signal('');
  protected readonly orgName = signal('');
  protected readonly phone = signal('');
  protected readonly verificationCode = signal('');
  protected readonly submitting = signal(false);
  protected readonly resendDisabled = signal(false);
  protected readonly providers = signal<ISocialProviders>({ google: false, microsoft: false });
  protected readonly mfaToken = signal('');
  protected readonly mfaCode = signal('');
  protected readonly recoveryCode = signal('');
  protected readonly useRecoveryCode = signal(false);
  protected readonly mfaError = signal('');

  private readonly mfaField = viewChild('mfaField', { read: ElementRef });

  protected readonly showProviders = computed(() => this.providers().google || this.providers().microsoft);

  protected readonly mfaCodeComplete = computed(() =>
    (this.useRecoveryCode() ? this.recoveryCode().replace('-', '').length === 8 : this.mfaCode().length === 6));

  protected readonly signupInvalid = computed(
    () =>
      this.submitting() || !this.firstName() || !this.lastName() || !this.email() || !this.password() || !this.confirmPassword() || !this.phone() ||
      !this.orgName(),
  );

  protected readonly formClasses = 'vdocs:w-[350px] vdocs:max-w-[90%] vdocs:box-border vdocs:flex vdocs:flex-col vdocs:items-center vdocs:justify-center vdocs:p-5 vdocs:bg-surface vdocs:font-sans vdocs:mx-auto';

  private resendTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(onCleanup => {
      const endpoint = this.resolvedEndpoint();
      let notified = false;

      const unsubscribe = endpoint.onSessionChanged((_endpoint, session, profile) => {
        notified = true;
        this.session.set(session);
        this.profile.set(profile);
        this.authenticated.emit({ authenticated: !!session, session, profile });
      });

      endpoint.loadSession();

      // Settle as unauthenticated if the initial check notified nobody (e.g. a
      // non-persisting endpoint with no session), so the output always fires.
      if (!notified && !endpoint.session) {
        this.session.set(null);
        this.profile.set(null);
        this.authenticated.emit({ authenticated: false, session: null, profile: null });
      }

      onCleanup(unsubscribe);
    });

    effect(onCleanup => {
      if (!this.syncHash() || typeof window === 'undefined') {
        return;
      }

      const applyHash = () => {
        if (window.location.hash.replace(/^#/, '').toLowerCase() === 'forgot') {
          this.mode.set('forgot');
        }
      };

      applyHash();
      window.addEventListener('hashchange', applyHash);
      onCleanup(() => window.removeEventListener('hashchange', applyHash));
    });

    effect(() => {
      // A provider that is not configured 404s from its start URL, so we ask which ones exist
      // before offering them. If the probe itself fails we simply show no provider buttons.
      getSocialProviders(this.resolvedEndpoint())
        .then(result => this.providers.set(result))
        .catch(() => undefined);
    });

    // No signal is read here on purpose: the provider return is a one-shot read of the URL the
    // browser landed on, and the parameters are stripped before anything else can see them.
    effect(() => {
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
    });

    effect(() => {
      this.mfaField()?.nativeElement.querySelector('input')?.focus();
    });

    inject(DestroyRef).onDestroy(() => {
      if (this.resendTimer) {
        clearTimeout(this.resendTimer);
      }
    });
  }

  protected submitForm(event: Event, handler: () => void) {
    event.preventDefault();
    handler.call(this);
  }

  private clearForms() {
    this.submitting.set(false);
    this.resendDisabled.set(false);
    this.mfaToken.set('');
    this.mfaCode.set('');
    this.recoveryCode.set('');
    this.useRecoveryCode.set(false);
    this.mfaError.set('');
    this.email.set('');
    this.phone.set('');
    this.password.set('');
    this.newPassword.set('');
    this.confirmPassword.set('');
    this.verificationCode.set('');
    this.firstName.set('');
    this.lastName.set('');
    this.orgName.set('');
  }

  private completeLogin(result: IAuthenticateResponse) {
    this.clearForms();
    this.tempEndpoint().clearSession();
    this.resolvedEndpoint().setToken(result.access_token);
  }

  // The tail every route into a session shares: password, an mfa grant, or a provider login.
  private async finishLogin(authResult: IAuthenticateResponse) {
    this.tempEndpoint().setToken(authResult.access_token);

    const user = await getMyUser(this.tempEndpoint());
    this.submitting.set(false);

    if (!user.email_verified) {
      this.mode.set('verify');
    } else {
      this.completeLogin(authResult);
    }
  }

  private startMFA(token: string) {
    this.mfaToken.set(token);
    this.mfaCode.set('');
    this.recoveryCode.set('');
    this.useRecoveryCode.set(false);
    this.mfaError.set('');
    this.submitting.set(false);
    this.mode.set('mfa');
  }

  protected returnToLogin() {
    this.mfaToken.set('');
    this.mfaCode.set('');
    this.recoveryCode.set('');
    this.useRecoveryCode.set(false);
    this.mfaError.set('');
    this.password.set('');
    this.submitting.set(false);
    this.mode.set('login');
  }

  protected async handleLogin() {
    if (this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.tempEndpoint().clearSession();

    try {
      const authResult = await authenticate(this.tempEndpoint(), {
        username: this.email().trim(),
        password: this.password(),
        grant_type: 'password',
      });
      await this.finishLogin(authResult);
    } catch (e) {
      const challenge = getMFAChallenge(e);
      if (challenge) {
        this.startMFA(challenge.mfa_token);
        return;
      }

      this.submitting.set(false);
      showToast('Login failed. Please check your credentials and try again.', { style: 'error' });
    }
  }

  private handleMFAFailure(e: unknown) {
    this.submitting.set(false);
    this.mfaCode.set('');
    this.recoveryCode.set('');

    // Every wrong attempt spends the token, so the API hands back a fresh one until the attempts
    // run out. A 401 means the challenge is gone and the password step starts over.
    const challenge = getMFAChallenge(e);
    if (challenge) {
      this.mfaToken.set(challenge.mfa_token);
      this.mfaError.set(MFA_CODE_ERROR);
      return;
    }

    if ((e as { response?: { status?: number } })?.response?.status === 401) {
      this.returnToLogin();
      showToast('Your sign-in timed out. Enter your password again.', { style: 'error' });
      return;
    }

    this.mfaError.set(MFA_CODE_ERROR);
  }

  private async submitMFA(code: string, isRecoveryCode: boolean) {
    if (this.submitting() || !code) {
      return;
    }

    this.submitting.set(true);
    this.mfaError.set('');
    this.tempEndpoint().clearSession();

    try {
      const authResult = await authenticate(
        this.tempEndpoint(),
        isRecoveryCode ?
            { grant_type: 'urn:verdocs:params:oauth:grant-type:mfa-recovery-code', mfa_token: this.mfaToken(), recovery_code: code } :
            { grant_type: 'urn:verdocs:params:oauth:grant-type:mfa-otp', mfa_token: this.mfaToken(), otp: code },
      );
      await this.finishLogin(authResult);
    } catch (e) {
      this.handleMFAFailure(e);
    }
  }

  protected handleVerifyMFA() {
    this.submitMFA(this.useRecoveryCode() ? this.recoveryCode() : this.mfaCode(), this.useRecoveryCode()).catch(() => undefined);
  }

  protected onMFACodeInput(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    this.mfaCode.set(digits);

    // Authenticator codes are always six digits, so there is nothing to wait for once we have them.
    if (digits.length === 6) {
      this.submitMFA(digits, false).catch(() => undefined);
    }
  }

  protected onRecoveryCodeInput(value: string) {
    this.recoveryCode.set(formatRecoveryCode(value));
  }

  protected toggleRecoveryCode() {
    this.useRecoveryCode.set(!this.useRecoveryCode());
    this.mfaCode.set('');
    this.recoveryCode.set('');
    this.mfaError.set('');
  }

  protected startSocialLogin(provider: TSocialLoginProvider) {
    try {
      const verifier = createCodeVerifier();
      const state = createCodeVerifier();

      createCodeChallenge(verifier)
        .then(codeChallenge => {
          window.sessionStorage.setItem(SOCIAL_LOGIN_KEY, JSON.stringify({ verifier, state, provider } satisfies ISocialLoginAttempt));
          window.location.assign(getSocialLoginUrl(this.resolvedEndpoint(), provider, { returnUri: currentReturnUri(), codeChallenge, state }));
        })
        .catch(() => showToast(SOCIAL_START_ERROR, { style: 'error' }));
    } catch {
      showToast(SOCIAL_START_ERROR, { style: 'error' });
    }
  }

  private exchangeLoginCode(loginCode: string, codeVerifier: string) {
    this.submitting.set(true);
    this.tempEndpoint().clearSession();

    authenticate(this.tempEndpoint(), { grant_type: 'urn:verdocs:params:oauth:grant-type:login-code', login_code: loginCode, code_verifier: codeVerifier })
      .then(authResult => this.finishLogin(authResult))
      .catch(e => {
        const challenge = getMFAChallenge(e);
        if (challenge) {
          this.startMFA(challenge.mfa_token);
          return;
        }

        this.submitting.set(false);
        showToast('Sign-in did not work. Try again.', { style: 'error' });
      });
  }

  protected async handleSignup() {
    if (!isPasswordComplex(this.password())) {
      showToast(PASSWORD_COMPLEXITY_MESSAGE, { style: 'error' });
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      showToast('Passwords do not match.', { style: 'error' });
      return;
    }

    this.submitting.set(true);
    this.tempEndpoint().clearSession();
    const localeData = Intl.DateTimeFormat().resolvedOptions();

    try {
      const result = await createProfile(this.tempEndpoint(), {
        email: this.email(),
        password: this.password(),
        first_name: this.firstName(),
        last_name: this.lastName(),
        org_name: this.orgName(),
        phone: convertToE164(this.phone()),
        timezone: localeData.timeZone,
        locale: localeData.locale,
      });

      this.tempEndpoint().setToken(result.access_token);
      // Keep the email around for the verification step, clear the rest.
      this.password.set('');
      this.confirmPassword.set('');
      this.phone.set('');
      this.firstName.set('');
      this.lastName.set('');
      this.orgName.set('');
      this.submitting.set(false);
      this.mode.set('verify');
    } catch (e) {
      const error = e as { message: string; response?: { status?: number; data?: { error?: string } } };
      this.submitting.set(false);
      this.authenticated.emit({ authenticated: false, session: null, profile: null });
      this.sdkError.emit(new SDKError(error.message, error.response?.status, error.response?.data));
      showToast(`Signup failed: ${error.response?.data?.error || 'Unknown Error'}`, { style: 'error' });
    }
  }

  protected async handleVerification() {
    this.submitting.set(true);

    try {
      const verificationResult = await verifyEmail(this.tempEndpoint(), { email: this.email(), token: this.verificationCode() });
      this.submitting.set(false);
      showToast('Thank you for verifying your email address.', { style: 'success' });
      this.completeLogin(verificationResult);
    } catch {
      this.submitting.set(false);
      showToast('Verification error, please check the code and try again.');
    }
  }

  private disableResendFor30s() {
    // The server rate-limits this anyway, but click-spamming it makes a poor
    // user experience, so disable the button for a while after each send.
    this.resendDisabled.set(true);
    this.resendTimer = setTimeout(() => {
      this.resendDisabled.set(false);
      this.resendTimer = null;
    }, 30000);
  }

  protected resendVerificationCode() {
    this.disableResendFor30s();

    resendVerification(this.tempEndpoint())
      .then(() => showToast('Please check your email for a verification code.', { style: 'info' }))
      .catch(() => showToast('Unable to resend code. Please try again later.', { style: 'error' }));
  }

  protected resendResetCode() {
    this.disableResendFor30s();

    resetPassword(this.resolvedEndpoint(), { email: this.email() })
      .then(() => showToast('Please check your email again for a verification code.', { style: 'info' }))
      .catch(() => showToast('Unable to resend code. Please try again later.', { style: 'error' }));
  }

  protected async handleRequestResetCode() {
    this.submitting.set(true);

    try {
      await resetPassword(this.resolvedEndpoint(), { email: this.email() });
      this.submitting.set(false);
      showToast('Please check your email inbox for a password reset code.', { style: 'success' });
      this.verificationCode.set('');
      this.newPassword.set('');
      this.confirmPassword.set('');
      this.mode.set('reset');
    } catch {
      this.submitting.set(false);
      showToast('Request failed. Please check your email address and try again.');
    }
  }

  protected async handleResetPassword() {
    if (!isPasswordComplex(this.newPassword())) {
      showToast(PASSWORD_COMPLEXITY_MESSAGE, { style: 'error' });
      return;
    }

    if (this.newPassword() !== this.confirmPassword()) {
      showToast('Passwords do not match.', { style: 'error' });
      return;
    }

    this.submitting.set(true);

    try {
      await resetPassword(this.resolvedEndpoint(), {
        email: this.email(),
        code: this.verificationCode(),
        new_password: this.newPassword(),
      });
      this.submitting.set(false);
      showToast('Your password has been reset. You may now use your new password to login.', { style: 'success' });
      this.verificationCode.set('');
      this.newPassword.set('');
      this.confirmPassword.set('');
      this.password.set('');
      this.mode.set('login');
    } catch {
      this.submitting.set(false);
      showToast('Verification error, please check the code and try again.');
    }
  }

  protected signOut() {
    this.resolvedEndpoint().clearSession();
    this.tempEndpoint().clearSession();
    this.clearForms();
    this.mode.set('login');
  }
}
