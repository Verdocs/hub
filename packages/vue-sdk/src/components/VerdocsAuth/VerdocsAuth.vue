<script lang="ts">
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import { SDKError, type IAuthStatus } from '../../types';

export type TAuthMode = 'login' | 'forgot' | 'reset' | 'signup' | 'verify' | 'mfa';

/**
 * Props for VerdocsAuth, an authentication panel that allows the user to log
 * in or sign up, including email verification and password reset flows. If
 * the user is already authenticated with a valid session, a sign-out button
 * is shown instead and the authenticated event fires immediately. It is up to
 * the host application to render the next appropriate view.
 *
 * Authentication happens against a temporary, non-persisting endpoint so other
 * session listeners never observe a partially-verified login. Tokens are
 * pushed to the real endpoint only once verification checks pass.
 */
export interface VerdocsAuthProps {
  /** Endpoint override for dual-session scenarios. Defaults to the provider's endpoint. */
  endpoint?: VerdocsEndpoint;

  /**
   * Normally, if the user has a valid session this component renders a sign-out
   * button, otherwise the login/signup forms. Set visible to false to render
   * nothing in either case; apps may use this to track session state via the
   * authenticated event without rendering any UI.
   */
  visible?: boolean;

  /**
   * A Verdocs logo is displayed above the forms by default. Override its source
   * here (SVG format works best), or hide it via CSS overrides.
   */
  logo?: string;

  /** The display mode to start in. */
  initialMode?: TAuthMode;

  /**
   * If set, the component follows the window's #forgot hash: navigating to
   * #forgot switches to the forgot-password mode. Off by default.
   */
  syncHash?: boolean;
}
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue';
import { authenticate, convertToE164, createProfile, getMyUser, resendVerification, resetPassword, verifyEmail } from '@verdocs/js-sdk';
import { createCodeChallenge, createCodeVerifier, getMFAChallenge, getSocialLoginUrl, getSocialProviders } from '@verdocs/js-sdk';
import type { IAuthenticateResponse, ISocialProviders, TSocialLoginProvider } from '@verdocs/js-sdk';
import VerdocsTextInput from '../../controls/VerdocsTextInput.vue';
import VerdocsButton from '../../controls/VerdocsButton.vue';
import { useSession } from '../../composables/useSession';
import { showToast } from '../../utils/toast';

const {
  endpoint = undefined,
  visible = true,
  logo = 'https://app.verdocs.com/assets/blue-logo.svg',
  initialMode = 'login',
  syncHash = false,
} = defineProps<VerdocsAuthProps>();

const emit = defineEmits<{
  /**
   * Fired when the session authentication process completes. Check the status
   * for the result. Always fired at least once after the initial session check.
   */
  authenticated: [status: IAuthStatus];
  /** Fired if an error occurs, with information about the error. */
  sdkError: [error: SDKError];
}>();

const isPasswordComplex = (password: string) => {
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasSpecialChar = /[`!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?~ ]/.test(password);
  return password.length >= 8 && hasUppercase && hasLowercase && hasSpecialChar;
};

const PASSWORD_COMPLEXITY_MESSAGE =
  'Password must be at least 8 characters long and contain at least one uppercase, one lowercase, and one special character.';

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

const { loaded, session, profile, endpoint: resolvedEndpoint } = useSession(endpoint);

const mode = ref<TAuthMode>(initialMode);
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const newPassword = ref('');
const firstName = ref('');
const lastName = ref('');
const orgName = ref('');
const phone = ref('');
const verificationCode = ref('');
const submitting = ref(false);
const resendDisabled = ref(false);
const providers = ref<ISocialProviders>({ google: false, microsoft: false });
const mfaToken = ref('');
const mfaCode = ref('');
const recoveryCode = ref('');
const useRecoveryCode = ref(false);
const mfaError = ref('');
const mfaForm = ref<HTMLFormElement | null>(null);

let resendTimer: ReturnType<typeof setTimeout> | null = null;

// Authenticating directly against the shared endpoint would let other
// listeners observe the session before verification checks are done, so all
// intermediate calls go through a throwaway, non-persisting endpoint.
const tempEndpoint = new VerdocsEndpoint({ baseURL: resolvedEndpoint.getBaseURL(), persist: false });

watch(
  [loaded, session, profile],
  ([isLoaded, currentSession, currentProfile]) => {
    if (isLoaded) {
      emit('authenticated', { authenticated: !!currentSession, session: currentSession, profile: currentProfile });
    }
  },
  { immediate: true },
);

watchEffect(onCleanup => {
  if (!syncHash || typeof window === 'undefined') {
    return;
  }

  const applyHash = () => {
    if (window.location.hash.replace(/^#/, '').toLowerCase() === 'forgot') {
      mode.value = 'forgot';
    }
  };

  applyHash();
  window.addEventListener('hashchange', applyHash);
  onCleanup(() => window.removeEventListener('hashchange', applyHash));
});

onBeforeUnmount(() => {
  if (resendTimer) {
    clearTimeout(resendTimer);
  }
});

const clearForms = () => {
  submitting.value = false;
  resendDisabled.value = false;
  mfaToken.value = '';
  mfaCode.value = '';
  recoveryCode.value = '';
  useRecoveryCode.value = false;
  mfaError.value = '';
  email.value = '';
  phone.value = '';
  password.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
  verificationCode.value = '';
  firstName.value = '';
  lastName.value = '';
  orgName.value = '';
};

const completeLogin = (result: IAuthenticateResponse) => {
  clearForms();
  tempEndpoint.clearSession();
  resolvedEndpoint.setToken(result.access_token);
};

// The tail every route into a session shares: password, an mfa grant, or a provider login.
const finishLogin = async (authResult: IAuthenticateResponse) => {
  tempEndpoint.setToken(authResult.access_token);

  const user = await getMyUser(tempEndpoint);
  submitting.value = false;

  if (!user.email_verified) {
    mode.value = 'verify';
  } else {
    completeLogin(authResult);
  }
};

const startMFA = (token: string) => {
  mfaToken.value = token;
  mfaCode.value = '';
  recoveryCode.value = '';
  useRecoveryCode.value = false;
  mfaError.value = '';
  submitting.value = false;
  mode.value = 'mfa';
};

const returnToLogin = () => {
  mfaToken.value = '';
  mfaCode.value = '';
  recoveryCode.value = '';
  useRecoveryCode.value = false;
  mfaError.value = '';
  password.value = '';
  submitting.value = false;
  mode.value = 'login';
};

const handleLogin = async () => {
  if (submitting.value) {
    return;
  }

  submitting.value = true;
  tempEndpoint.clearSession();

  try {
    const authResult = await authenticate(tempEndpoint, { username: email.value.trim(), password: password.value, grant_type: 'password' });
    await finishLogin(authResult);
  } catch (e) {
    const challenge = getMFAChallenge(e);
    if (challenge) {
      startMFA(challenge.mfa_token);
      return;
    }

    submitting.value = false;
    showToast('Login failed. Please check your credentials and try again.', { style: 'error' });
  }
};

const handleMFAFailure = (e: unknown) => {
  submitting.value = false;
  mfaCode.value = '';
  recoveryCode.value = '';

  // Every wrong attempt spends the token, so the API hands back a fresh one until the attempts
  // run out. A 401 means the challenge is gone and the password step starts over.
  const challenge = getMFAChallenge(e);
  if (challenge) {
    mfaToken.value = challenge.mfa_token;
    mfaError.value = MFA_CODE_ERROR;
    return;
  }

  if ((e as { response?: { status?: number } })?.response?.status === 401) {
    returnToLogin();
    showToast('Your sign-in timed out. Enter your password again.', { style: 'error' });
    return;
  }

  mfaError.value = MFA_CODE_ERROR;
};

const submitMFA = async (code: string, isRecoveryCode: boolean) => {
  if (submitting.value || !code) {
    return;
  }

  submitting.value = true;
  mfaError.value = '';
  tempEndpoint.clearSession();

  try {
    const authResult = await authenticate(
      tempEndpoint,
      isRecoveryCode
        ? { grant_type: 'urn:verdocs:params:oauth:grant-type:mfa-recovery-code', mfa_token: mfaToken.value, recovery_code: code }
        : { grant_type: 'urn:verdocs:params:oauth:grant-type:mfa-otp', mfa_token: mfaToken.value, otp: code },
    );
    await finishLogin(authResult);
  } catch (e) {
    handleMFAFailure(e);
  }
};

const handleVerifyMFA = () => {
  submitMFA(useRecoveryCode.value ? recoveryCode.value : mfaCode.value, useRecoveryCode.value).catch(() => undefined);
};

const handleMFACodeInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 6);
  mfaCode.value = digits;

  // Authenticator codes are always six digits, so there is nothing to wait for once we have them.
  if (digits.length === 6) {
    submitMFA(digits, false).catch(() => undefined);
  }
};

const handleRecoveryCodeInput = (value: string) => {
  recoveryCode.value = formatRecoveryCode(value);
};

const toggleRecoveryCode = () => {
  useRecoveryCode.value = !useRecoveryCode.value;
  mfaCode.value = '';
  recoveryCode.value = '';
  mfaError.value = '';
};

const handleSocialLogin = (provider: TSocialLoginProvider) => {
  try {
    const verifier = createCodeVerifier();
    const state = createCodeVerifier();

    createCodeChallenge(verifier)
      .then(codeChallenge => {
        window.sessionStorage.setItem(SOCIAL_LOGIN_KEY, JSON.stringify({ verifier, state, provider } satisfies ISocialLoginAttempt));
        window.location.assign(getSocialLoginUrl(resolvedEndpoint, provider, { returnUri: currentReturnUri(), codeChallenge, state }));
      })
      .catch(() => showToast(SOCIAL_START_ERROR, { style: 'error' }));
  } catch {
    showToast(SOCIAL_START_ERROR, { style: 'error' });
  }
};

const exchangeLoginCode = (loginCode: string, codeVerifier: string) => {
  submitting.value = true;
  tempEndpoint.clearSession();

  authenticate(tempEndpoint, { grant_type: 'urn:verdocs:params:oauth:grant-type:login-code', login_code: loginCode, code_verifier: codeVerifier })
    .then(finishLogin)
    .catch(e => {
      const challenge = getMFAChallenge(e);
      if (challenge) {
        startMFA(challenge.mfa_token);
        return;
      }

      submitting.value = false;
      showToast('Sign-in did not work. Try again.', { style: 'error' });
    });
};

onMounted(() => {
  // A provider that is not configured 404s from its start URL, so we ask which ones exist
  // before offering them. If the probe itself fails we simply show no provider buttons.
  getSocialProviders(resolvedEndpoint)
    .then(result => {
      providers.value = result;
    })
    .catch(() => undefined);

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

  exchangeLoginCode(loginCode, attempt.verifier);
});

watch([ mode, useRecoveryCode ], ([ currentMode ]) => {
  if (currentMode !== 'mfa') {
    return;
  }

  nextTick(() => mfaForm.value?.querySelector('input')?.focus()).catch(() => undefined);
});

const handleSignup = async () => {
  if (!isPasswordComplex(password.value)) {
    showToast(PASSWORD_COMPLEXITY_MESSAGE, { style: 'error' });
    return;
  }

  if (password.value !== confirmPassword.value) {
    showToast('Passwords do not match.', { style: 'error' });
    return;
  }

  submitting.value = true;
  tempEndpoint.clearSession();
  const localeData = Intl.DateTimeFormat().resolvedOptions();

  try {
    const result = await createProfile(tempEndpoint, {
      email: email.value,
      password: password.value,
      first_name: firstName.value,
      last_name: lastName.value,
      org_name: orgName.value,
      phone: convertToE164(phone.value),
      timezone: localeData.timeZone,
      locale: localeData.locale,
    });

    tempEndpoint.setToken(result.access_token);
    // Keep the email around for the verification step, clear the rest.
    password.value = '';
    confirmPassword.value = '';
    phone.value = '';
    firstName.value = '';
    lastName.value = '';
    orgName.value = '';
    submitting.value = false;
    mode.value = 'verify';
  } catch (e) {
    const error = e as { message: string; response?: { status?: number; data?: { error?: string } } };
    submitting.value = false;
    emit('authenticated', { authenticated: false, session: null, profile: null });
    emit('sdkError', new SDKError(error.message, error.response?.status, error.response?.data));
    showToast(`Signup failed: ${error.response?.data?.error || 'Unknown Error'}`, { style: 'error' });
  }
};

const handleVerification = async () => {
  submitting.value = true;

  try {
    const verificationResult = await verifyEmail(tempEndpoint, { email: email.value, token: verificationCode.value });
    submitting.value = false;
    showToast('Thank you for verifying your email address.', { style: 'success' });
    completeLogin(verificationResult);
  } catch {
    submitting.value = false;
    showToast('Verification error, please check the code and try again.');
  }
};

const disableResendFor30s = () => {
  resendDisabled.value = true;
  resendTimer = setTimeout(() => {
    resendDisabled.value = false;
    resendTimer = null;
  }, 30000);
};

const handleResendVerification = () => {
  // The server rate-limits this anyway, but click-spamming it makes a poor
  // user experience, so disable the button for a while after each send.
  disableResendFor30s();

  resendVerification(tempEndpoint)
    .then(() => showToast('Please check your email for a verification code.', { style: 'info' }))
    .catch(() => showToast('Unable to resend code. Please try again later.', { style: 'error' }));
};

const handleResendReset = () => {
  disableResendFor30s();

  resetPassword(resolvedEndpoint, { email: email.value })
    .then(() => showToast('Please check your email again for a verification code.', { style: 'info' }))
    .catch(() => showToast('Unable to resend code. Please try again later.', { style: 'error' }));
};

const handleRequestResetCode = async () => {
  submitting.value = true;

  try {
    await resetPassword(resolvedEndpoint, { email: email.value });
    submitting.value = false;
    showToast('Please check your email inbox for a password reset code.', { style: 'success' });
    verificationCode.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    mode.value = 'reset';
  } catch {
    submitting.value = false;
    showToast('Request failed. Please check your email address and try again.');
  }
};

const handleResetPassword = async () => {
  if (!isPasswordComplex(newPassword.value)) {
    showToast(PASSWORD_COMPLEXITY_MESSAGE, { style: 'error' });
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    showToast('Passwords do not match.', { style: 'error' });
    return;
  }

  submitting.value = true;

  try {
    await resetPassword(resolvedEndpoint, { email: email.value, code: verificationCode.value, new_password: newPassword.value });
    submitting.value = false;
    showToast('Your password has been reset. You may now use your new password to login.', { style: 'success' });
    verificationCode.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    password.value = '';
    mode.value = 'login';
  } catch {
    submitting.value = false;
    showToast('Verification error, please check the code and try again.');
  }
};

const handleLogout = () => {
  resolvedEndpoint.clearSession();
  tempEndpoint.clearSession();
  clearForms();
  mode.value = 'login';
};

const showProviders = computed(() => providers.value.google || providers.value.microsoft);

const mfaCodeComplete = computed(() =>
  (useRecoveryCode.value ? recoveryCode.value.replace('-', '').length === 8 : mfaCode.value.length === 6));

const signupInvalid = computed(
  () =>
    submitting.value
    || !firstName.value
    || !lastName.value
    || !email.value
    || !password.value
    || !confirmPassword.value
    || !phone.value
    || !orgName.value,
);

const formClasses =
  'vdocs:w-[350px] vdocs:max-w-[90%] vdocs:box-border vdocs:flex vdocs:flex-col vdocs:items-center vdocs:justify-center vdocs:p-5 vdocs:bg-surface vdocs:font-sans';
</script>

<template>
  <template v-if="visible">
    <div
      v-if="session"
      class="vdocs:flex vdocs:justify-center vdocs:mt-8 vdocs:font-sans"
    >
      <VerdocsButton
        label="Sign Out"
        :disabled="submitting"
        @click="handleLogout"
      />
    </div>

    <div
      v-else-if="mode === 'signup'"
      :class="formClasses"
    >
      <a href="https://verdocs.com/en/">
        <img
          :src="logo"
          alt="Verdocs Logo"
          class="vdocs:w-32 vdocs:max-w-full vdocs:mt-5 vdocs:mb-7"
        >
      </a>

      <h3 class="vdocs:text-lg vdocs:font-normal vdocs:text-ink vdocs:text-center vdocs:leading-7 vdocs:m-0">
        Sign up for a free account
      </h3>
      <div class="vdocs:flex vdocs:items-center vdocs:gap-1 vdocs:text-sm vdocs:text-ink vdocs:my-2">
        Already have an account?
        <VerdocsButton
          label="Log In"
          variant="text"
          size="small"
          :disabled="submitting"
          @click="mode = 'login'"
        />
      </div>

      <div
        v-if="showProviders"
        class="vdocs:w-full"
      >
        <VerdocsButton
          v-if="providers.google"
          label="Continue with Google"
          variant="outline"
          class="vdocs:w-full vdocs:mb-2.5"
          :disabled="submitting"
          @click="handleSocialLogin('google')"
        />
        <VerdocsButton
          v-if="providers.microsoft"
          label="Continue with Microsoft"
          variant="outline"
          class="vdocs:w-full vdocs:mb-2.5"
          :disabled="submitting"
          @click="handleSocialLogin('microsoft')"
        />

        <div class="vdocs:flex vdocs:items-center vdocs:gap-2 vdocs:my-4 vdocs:text-xs vdocs:text-muted">
          <div class="vdocs:flex-1 vdocs:h-px vdocs:bg-edge" />
          or
          <div class="vdocs:flex-1 vdocs:h-px vdocs:bg-edge" />
        </div>
      </div>

      <form
        class="vdocs:w-full"
        @submit.prevent="handleSignup"
      >
        <div class="vdocs:flex vdocs:flex-row vdocs:gap-5">
          <VerdocsTextInput
            v-model="firstName"
            label="First Name"
            autocomplete="given-name"
            required
            :disabled="submitting"
          />
          <VerdocsTextInput
            v-model="lastName"
            label="Last Name"
            autocomplete="family-name"
            required
            :disabled="submitting"
          />
        </div>
        <VerdocsTextInput
          v-model="email"
          label="Email Address"
          type="email"
          autocomplete="email"
          required
          :disabled="submitting"
        />
        <VerdocsTextInput
          v-model="password"
          label="Password"
          type="password"
          autocomplete="new-password"
          required
          :disabled="submitting"
        />
        <VerdocsTextInput
          v-model="confirmPassword"
          label="Confirm Password"
          type="password"
          autocomplete="off"
          required
          :disabled="submitting"
        />
        <VerdocsTextInput
          v-model="phone"
          label="Phone Number"
          type="tel"
          autocomplete="tel"
          required
          :disabled="submitting"
        />
        <VerdocsTextInput
          v-model="orgName"
          label="Organization Name"
          autocomplete="organization"
          required
          :disabled="submitting"
        />

        <div class="vdocs:text-xs vdocs:text-muted vdocs:mt-2">
          By clicking the Create Account button, you agree to the
          <a
            href="https://verdocs.com/eula"
            target="_blank"
            rel="noreferrer"
            class="vdocs:text-ink vdocs:underline"
          >
            End User License Agreement
          </a>. Learn about how we use and protect your data and how you can opt-out in our
          <a
            href="https://verdocs.com/privacy-policy"
            target="_blank"
            rel="noreferrer"
            class="vdocs:text-ink vdocs:underline"
          >
            Privacy Policy
          </a>.
        </div>

        <div class="vdocs:flex vdocs:justify-center vdocs:mt-7">
          <VerdocsButton
            label="Next"
            type="submit"
            :disabled="signupInvalid"
          />
        </div>
      </form>
    </div>

    <div
      v-else-if="mode === 'verify'"
      :class="formClasses"
    >
      <form
        class="vdocs:w-full"
        @submit.prevent="handleVerification"
      >
        <p class="vdocs:text-sm vdocs:text-ink vdocs:my-4">
          Please check your e-mail inbox for a verification code and enter it below.
        </p>

        <VerdocsTextInput
          v-model="verificationCode"
          label="Verification Code"
          required
          :disabled="submitting"
        />

        <div class="vdocs:flex vdocs:flex-row vdocs:justify-center vdocs:gap-5 vdocs:mt-5">
          <VerdocsButton
            label="Sign Out"
            variant="outline"
            :disabled="submitting"
            @click="handleLogout"
          />
          <VerdocsButton
            label="Verify"
            type="submit"
            :disabled="submitting || verificationCode.length !== 6"
          />
        </div>
        <div class="vdocs:flex vdocs:justify-center vdocs:mt-2">
          <VerdocsButton
            label="Resend Code"
            variant="text"
            :disabled="resendDisabled || submitting"
            @click="handleResendVerification"
          />
        </div>
      </form>
    </div>

    <div
      v-else-if="mode === 'forgot'"
      :class="formClasses"
    >
      <a href="https://verdocs.com/en/">
        <img
          :src="logo"
          alt="Verdocs Logo"
          class="vdocs:w-32 vdocs:max-w-full vdocs:mt-5 vdocs:mb-7"
        >
      </a>

      <h3 class="vdocs:text-lg vdocs:font-normal vdocs:text-ink vdocs:text-center vdocs:leading-7 vdocs:m-0">
        Forgot your password?
      </h3>

      <p class="vdocs:text-sm vdocs:text-ink vdocs:my-4">
        Enter your e-mail address below. If the e-mail address is valid, a password reset code will be sent to your
        inbox. Please allow up to 15 minutes to arrive, and check your spam folder if you do not receive the message.
      </p>

      <form
        class="vdocs:w-full"
        @submit.prevent="handleRequestResetCode"
      >
        <VerdocsTextInput
          v-model="email"
          label="Email Address"
          type="email"
          autocomplete="email"
          required
          :disabled="submitting"
        />

        <div class="vdocs:flex vdocs:flex-row vdocs:justify-center vdocs:gap-5 vdocs:mt-7">
          <VerdocsButton
            label="Cancel"
            size="small"
            variant="outline"
            :disabled="submitting"
            @click="mode = 'login'"
          />
          <VerdocsButton
            label="Request Code"
            size="small"
            type="submit"
            :disabled="submitting"
          />
        </div>
      </form>
    </div>

    <div
      v-else-if="mode === 'reset'"
      :class="formClasses"
    >
      <a href="https://verdocs.com/en/">
        <img
          :src="logo"
          alt="Verdocs Logo"
          class="vdocs:w-32 vdocs:max-w-full vdocs:mt-5 vdocs:mb-7"
        >
      </a>

      <h3 class="vdocs:text-lg vdocs:font-normal vdocs:text-ink vdocs:text-center vdocs:leading-7 vdocs:m-0">
        Reset your password
      </h3>

      <p class="vdocs:text-sm vdocs:text-ink vdocs:my-4">
        Enter the verification code sent to your inbox below, along with your new password. Please allow up to 15
        minutes for the code to arrive, and check your spam folder if you do not receive the message.
      </p>

      <form
        class="vdocs:w-full"
        @submit.prevent="handleResetPassword"
      >
        <VerdocsTextInput
          v-model="verificationCode"
          label="Verification Code"
          required
          :disabled="submitting"
        />
        <VerdocsTextInput
          v-model="newPassword"
          label="Password"
          type="password"
          autocomplete="off"
          required
          :disabled="submitting"
        />
        <VerdocsTextInput
          v-model="confirmPassword"
          label="Confirm Password"
          type="password"
          autocomplete="off"
          required
          :disabled="submitting"
        />

        <div class="vdocs:flex vdocs:flex-row vdocs:justify-center vdocs:gap-5 vdocs:mt-7">
          <VerdocsButton
            label="Cancel"
            variant="outline"
            :disabled="submitting"
            @click="mode = 'login'"
          />
          <VerdocsButton
            label="Reset"
            type="submit"
            :disabled="submitting"
          />
        </div>

        <div class="vdocs:flex vdocs:justify-center vdocs:mt-2">
          <VerdocsButton
            label="Resend Code"
            variant="text"
            :disabled="resendDisabled || submitting"
            @click="handleResendReset"
          />
        </div>
      </form>
    </div>

    <div
      v-else-if="mode === 'mfa'"
      :class="formClasses"
    >
      <a href="https://verdocs.com/en/">
        <img
          :src="logo"
          alt="Verdocs Logo"
          class="vdocs:w-32 vdocs:max-w-full vdocs:mt-5 vdocs:mb-7"
        >
      </a>

      <h3 class="vdocs:text-lg vdocs:font-normal vdocs:text-ink vdocs:text-center vdocs:leading-7 vdocs:m-0">
        Two-factor authentication
      </h3>

      <p class="vdocs:text-sm vdocs:text-ink vdocs:my-4">
        {{ useRecoveryCode
          ? 'Enter one of the backup codes you saved when you turned on two-factor authentication.'
          : 'Enter the six-digit code from your authenticator app.' }}
      </p>

      <form
        ref="mfaForm"
        class="vdocs:w-full"
        @submit.prevent="handleVerifyMFA"
      >
        <VerdocsTextInput
          v-if="useRecoveryCode"
          label="Backup code"
          placeholder="xxxx-xxxx"
          autocomplete="one-time-code"
          :model-value="recoveryCode"
          :disabled="submitting"
          @update:model-value="handleRecoveryCodeInput"
        />
        <VerdocsTextInput
          v-else
          label="Authentication code"
          inputmode="numeric"
          autocomplete="one-time-code"
          :model-value="mfaCode"
          :disabled="submitting"
          @update:model-value="handleMFACodeInput"
        />

        <div
          v-if="mfaError"
          role="alert"
          class="vdocs:text-sm vdocs:text-danger vdocs:mb-2"
        >
          {{ mfaError }}
        </div>

        <div class="vdocs:flex vdocs:flex-row vdocs:justify-center vdocs:gap-5 vdocs:mt-5">
          <VerdocsButton
            label="Cancel"
            variant="outline"
            :disabled="submitting"
            @click="returnToLogin"
          />
          <VerdocsButton
            label="Verify"
            type="submit"
            :disabled="submitting || !mfaCodeComplete"
          />
        </div>

        <div class="vdocs:flex vdocs:justify-center vdocs:mt-2">
          <VerdocsButton
            :label="useRecoveryCode ? 'Use your authenticator app instead' : 'Use a backup code instead'"
            variant="text"
            size="small"
            :disabled="submitting"
            @click="toggleRecoveryCode"
          />
        </div>
      </form>
    </div>

    <div
      v-else
      :class="formClasses"
    >
      <a href="https://verdocs.com/en/">
        <img
          :src="logo"
          alt="Verdocs Logo"
          class="vdocs:w-32 vdocs:max-w-full vdocs:mt-5 vdocs:mb-7"
        >
      </a>

      <h3 class="vdocs:text-lg vdocs:font-normal vdocs:text-ink vdocs:text-center vdocs:leading-7 vdocs:m-0">
        Log in to your account
      </h3>
      <div class="vdocs:flex vdocs:items-center vdocs:gap-1 vdocs:text-sm vdocs:text-ink vdocs:my-2">
        Don't have an account?
        <VerdocsButton
          label="Sign Up"
          variant="text"
          size="small"
          :disabled="submitting"
          @click="mode = 'signup'"
        />
      </div>

      <div
        v-if="showProviders"
        class="vdocs:w-full"
      >
        <VerdocsButton
          v-if="providers.google"
          label="Continue with Google"
          variant="outline"
          class="vdocs:w-full vdocs:mb-2.5"
          :disabled="submitting"
          @click="handleSocialLogin('google')"
        />
        <VerdocsButton
          v-if="providers.microsoft"
          label="Continue with Microsoft"
          variant="outline"
          class="vdocs:w-full vdocs:mb-2.5"
          :disabled="submitting"
          @click="handleSocialLogin('microsoft')"
        />

        <div class="vdocs:flex vdocs:items-center vdocs:gap-2 vdocs:my-4 vdocs:text-xs vdocs:text-muted">
          <div class="vdocs:flex-1 vdocs:h-px vdocs:bg-edge" />
          or
          <div class="vdocs:flex-1 vdocs:h-px vdocs:bg-edge" />
        </div>
      </div>

      <form
        class="vdocs:w-full"
        @submit.prevent="handleLogin"
      >
        <VerdocsTextInput
          v-model="email"
          label="Email"
          type="email"
          autocomplete="username"
          :disabled="submitting"
        />
        <VerdocsTextInput
          v-model="password"
          label="Password"
          type="password"
          autocomplete="current-password"
          :disabled="submitting"
        />

        <div class="vdocs:flex vdocs:justify-center vdocs:mt-2.5 vdocs:mb-5">
          <VerdocsButton
            label="Forgot Your Password?"
            variant="text"
            size="small"
            :disabled="submitting"
            @click="mode = 'forgot'"
          />
        </div>

        <div class="vdocs:flex vdocs:justify-center">
          <VerdocsButton
            label="Login"
            type="submit"
            :disabled="submitting"
          />
        </div>
      </form>
    </div>
  </template>
</template>
