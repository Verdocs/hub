import { VerdocsEndpoint } from '@verdocs/js-sdk';
import type { IAuthenticateResponse } from '@verdocs/js-sdk';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { authenticate, convertToE164, createProfile, getMyUser, resendVerification, resetPassword, verifyEmail } from '@verdocs/js-sdk';
import { SDKError, type IAuthStatus } from '../../types';
import { useSession } from '../../hooks/useSession';
import TextInput from '../../controls/TextInput';
import { showToast } from '../../utils/toast';
import Button from '../../controls/Button';

export type TAuthMode = 'login' | 'forgot' | 'reset' | 'signup' | 'verify';

export interface VerdocsAuthProps {
  /** Endpoint override for dual-session scenarios. Defaults to the provider's endpoint. */
  endpoint?: VerdocsEndpoint;

  /**
   * Normally, if the user has a valid session this component renders a sign-out
   * button, otherwise the login/signup forms. Set visible to false to render
   * nothing in either case; apps may use this to track session state via
   * onAuthenticated without rendering any UI.
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

  /**
   * Called when the session authentication process completes. Check the status
   * for the result. Always called at least once after the initial session check.
   */
  onAuthenticated?: (status: IAuthStatus) => void;

  /** Called if an error occurs, with information about the error. */
  onSdkError?: (error: SDKError) => void;
}

const isPasswordComplex = (password: string) => {
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasSpecialChar = /[`!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?~ ]/.test(password);
  return password.length >= 8 && hasUppercase && hasLowercase && hasSpecialChar;
};

const PASSWORD_COMPLEXITY_MESSAGE =
  'Password must be at least 8 characters long and contain at least one uppercase, one lowercase, and one special character.';

/**
 * Display an authentication panel that allows the user to log in or sign up,
 * including email verification and password reset flows. If the user is
 * already authenticated with a valid session, a sign-out button is shown
 * instead and the onAuthenticated callback fires immediately. It is up to the
 * host application to render the next appropriate view.
 *
 * Authentication happens against a temporary, non-persisting endpoint so other
 * session listeners never observe a partially-verified login. Tokens are
 * pushed to the real endpoint only once verification checks pass.
 */
export default function VerdocsAuth({
  endpoint,
  visible = true,
  logo = 'https://app.verdocs.com/assets/blue-logo.svg',
  initialMode = 'login',
  syncHash = false,
  onAuthenticated,
  onSdkError,
}: VerdocsAuthProps) {
  const { loaded, session, profile, endpoint: resolvedEndpoint } = useSession(endpoint);

  const [mode, setMode] = useState<TAuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);

  const resendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Authenticating directly against the shared endpoint would let other
  // listeners observe the session before verification checks are done, so all
  // intermediate calls go through a throwaway, non-persisting endpoint.
  const tempEndpoint = useMemo(
    () => new VerdocsEndpoint({ baseURL: resolvedEndpoint.getBaseURL(), persist: false }),
    [resolvedEndpoint],
  );

  const onAuthenticatedRef = useRef(onAuthenticated);
  onAuthenticatedRef.current = onAuthenticated;
  const onSdkErrorRef = useRef(onSdkError);
  onSdkErrorRef.current = onSdkError;

  useEffect(() => {
    if (loaded) {
      onAuthenticatedRef.current?.({ authenticated: !!session, session, profile });
    }
  }, [loaded, session, profile]);

  useEffect(() => {
    if (!syncHash || typeof window === 'undefined') {
      return;
    }

    const applyHash = () => {
      if (window.location.hash.replace(/^#/, '').toLowerCase() === 'forgot') {
        setMode('forgot');
      }
    };

    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, [syncHash]);

  useEffect(() => () => {
    if (resendTimerRef.current) {
      clearTimeout(resendTimerRef.current);
    }
  }, []);

  const clearForms = () => {
    setSubmitting(false);
    setResendDisabled(false);
    setEmail('');
    setPhone('');
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setVerificationCode('');
    setFirstName('');
    setLastName('');
    setOrgName('');
  };

  const completeLogin = (result: IAuthenticateResponse) => {
    clearForms();
    tempEndpoint.clearSession();
    resolvedEndpoint.setToken(result.access_token);
  };

  const handleLogin = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    tempEndpoint.clearSession();

    try {
      const authResult = await authenticate(tempEndpoint, { username: email.trim(), password, grant_type: 'password' });
      tempEndpoint.setToken(authResult.access_token);

      const user = await getMyUser(tempEndpoint);
      setSubmitting(false);

      if (!user.email_verified) {
        setMode('verify');
      } else {
        completeLogin(authResult);
      }
    } catch {
      setSubmitting(false);
      showToast('Login failed. Please check your credentials and try again.', { style: 'error' });
    }
  };

  const handleSignup = async () => {
    if (!isPasswordComplex(password)) {
      showToast(PASSWORD_COMPLEXITY_MESSAGE, { style: 'error' });
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', { style: 'error' });
      return;
    }

    setSubmitting(true);
    tempEndpoint.clearSession();
    const localeData = Intl.DateTimeFormat().resolvedOptions();

    try {
      const result = await createProfile(tempEndpoint, {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        org_name: orgName,
        phone: convertToE164(phone),
        timezone: localeData.timeZone,
        locale: localeData.locale,
      });

      tempEndpoint.setToken(result.access_token);
      // Keep the email around for the verification step, clear the rest.
      setPassword('');
      setConfirmPassword('');
      setPhone('');
      setFirstName('');
      setLastName('');
      setOrgName('');
      setSubmitting(false);
      setMode('verify');
    } catch (e) {
      const error = e as { message: string; response?: { status?: number; data?: { error?: string } } };
      setSubmitting(false);
      onAuthenticatedRef.current?.({ authenticated: false, session: null, profile: null });
      onSdkErrorRef.current?.(new SDKError(error.message, error.response?.status, error.response?.data));
      showToast(`Signup failed: ${error.response?.data?.error || 'Unknown Error'}`, { style: 'error' });
    }
  };

  const handleVerification = async () => {
    setSubmitting(true);

    try {
      const verificationResult = await verifyEmail(tempEndpoint, { email, token: verificationCode });
      setSubmitting(false);
      showToast('Thank you for verifying your email address.', { style: 'success' });
      completeLogin(verificationResult);
    } catch {
      setSubmitting(false);
      showToast('Verification error, please check the code and try again.');
    }
  };

  const disableResendFor30s = () => {
    setResendDisabled(true);
    resendTimerRef.current = setTimeout(() => {
      setResendDisabled(false);
      resendTimerRef.current = null;
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

    resetPassword(resolvedEndpoint, { email })
      .then(() => showToast('Please check your email again for a verification code.', { style: 'info' }))
      .catch(() => showToast('Unable to resend code. Please try again later.', { style: 'error' }));
  };

  const handleRequestResetCode = async () => {
    setSubmitting(true);

    try {
      await resetPassword(resolvedEndpoint, { email });
      setSubmitting(false);
      showToast('Please check your email inbox for a password reset code.', { style: 'success' });
      setVerificationCode('');
      setNewPassword('');
      setConfirmPassword('');
      setMode('reset');
    } catch {
      setSubmitting(false);
      showToast('Request failed. Please check your email address and try again.');
    }
  };

  const handleResetPassword = async () => {
    if (!isPasswordComplex(newPassword)) {
      showToast(PASSWORD_COMPLEXITY_MESSAGE, { style: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', { style: 'error' });
      return;
    }

    setSubmitting(true);

    try {
      await resetPassword(resolvedEndpoint, { email, code: verificationCode, new_password: newPassword });
      setSubmitting(false);
      showToast('Your password has been reset. You may now use your new password to login.', { style: 'success' });
      setVerificationCode('');
      setNewPassword('');
      setConfirmPassword('');
      setPassword('');
      setMode('login');
    } catch {
      setSubmitting(false);
      showToast('Verification error, please check the code and try again.');
    }
  };

  const handleLogout = () => {
    resolvedEndpoint.clearSession();
    tempEndpoint.clearSession();
    clearForms();
    setMode('login');
  };

  const submitForm = (handler: () => void) => (e: FormEvent) => {
    e.preventDefault();
    handler();
  };

  if (!visible) {
    return null;
  }

  if (session) {
    return (
      <div className="vdocs:flex vdocs:justify-center vdocs:mt-8 vdocs:font-sans">
        <Button label="Sign Out" disabled={submitting} onClick={handleLogout} />
      </div>
    );
  }

  const formClasses = 'vdocs:w-[350px] vdocs:max-w-[90%] vdocs:box-border vdocs:flex vdocs:flex-col vdocs:items-center vdocs:justify-center vdocs:p-5 vdocs:bg-surface vdocs:font-sans';

  const logoHeader = (
    <a href="https://verdocs.com/en/">
      <img src={logo} alt="Verdocs Logo" className="vdocs:w-32 vdocs:max-w-full vdocs:mt-5 vdocs:mb-7" />
    </a>
  );

  if (mode === 'signup') {
    const invalid = submitting || !firstName || !lastName || !email || !password || !confirmPassword || !phone || !orgName;

    return (
      <div className={formClasses}>
        {logoHeader}

        <h3 className="vdocs:text-lg vdocs:font-normal vdocs:text-ink vdocs:text-center vdocs:leading-7 vdocs:m-0">
          Sign up for a free account
        </h3>
        <div className="vdocs:flex vdocs:items-center vdocs:gap-1 vdocs:text-sm vdocs:text-ink vdocs:my-2">
          Already have an account?
          <Button label="Log In" variant="text" size="small" disabled={submitting} onClick={() => setMode('login')} />
        </div>

        <form className="vdocs:w-full" onSubmit={submitForm(handleSignup)}>
          <div className="vdocs:flex vdocs:flex-row vdocs:gap-5">
            <TextInput label="First Name" autoComplete="given-name" required value={firstName} disabled={submitting} onChange={e => setFirstName(e.target.value)} />
            <TextInput label="Last Name" autoComplete="family-name" required value={lastName} disabled={submitting} onChange={e => setLastName(e.target.value)} />
          </div>
          <TextInput label="Email Address" type="email" autoComplete="email" required value={email} disabled={submitting} onChange={e => setEmail(e.target.value)} />
          <TextInput label="Password" type="password" autoComplete="new-password" required value={password} disabled={submitting} onChange={e => setPassword(e.target.value)} />
          <TextInput label="Confirm Password" type="password" autoComplete="off" required value={confirmPassword} disabled={submitting} onChange={e => setConfirmPassword(e.target.value)} />
          <TextInput label="Phone Number" type="tel" autoComplete="tel" required value={phone} disabled={submitting} onChange={e => setPhone(e.target.value)} />
          <TextInput label="Organization Name" autoComplete="organization" required value={orgName} disabled={submitting} onChange={e => setOrgName(e.target.value)} />

          <div className="vdocs:text-xs vdocs:text-muted vdocs:mt-2">
            By clicking the Create Account button, you agree to the
            {' '}
            <a href="https://verdocs.com/eula" target="_blank" rel="noreferrer" className="vdocs:text-ink vdocs:underline">
              End User License Agreement
            </a>
            . Learn about how we use and protect your data and how you can opt-out in our
            {' '}
            <a href="https://verdocs.com/privacy-policy" target="_blank" rel="noreferrer" className="vdocs:text-ink vdocs:underline">
              Privacy Policy
            </a>
            .
          </div>

          <div className="vdocs:flex vdocs:justify-center vdocs:mt-7">
            <Button label="Next" type="submit" disabled={invalid} />
          </div>
        </form>
      </div>
    );
  }

  if (mode === 'verify') {
    return (
      <div className={formClasses}>
        <form className="vdocs:w-full" onSubmit={submitForm(handleVerification)}>
          <p className="vdocs:text-sm vdocs:text-ink vdocs:my-4">
            Please check your e-mail inbox for a verification code and enter it below.
          </p>

          <TextInput label="Verification Code" required value={verificationCode} disabled={submitting} onChange={e => setVerificationCode(e.target.value)} />

          <div className="vdocs:flex vdocs:flex-row vdocs:justify-center vdocs:gap-5 vdocs:mt-5">
            <Button label="Sign Out" variant="outline" disabled={submitting} onClick={handleLogout} />
            <Button label="Verify" type="submit" disabled={submitting || verificationCode.length !== 6} />
          </div>
          <div className="vdocs:flex vdocs:justify-center vdocs:mt-2">
            <Button label="Resend Code" variant="text" disabled={resendDisabled || submitting} onClick={handleResendVerification} />
          </div>
        </form>
      </div>
    );
  }

  if (mode === 'forgot') {
    return (
      <div className={formClasses}>
        {logoHeader}

        <h3 className="vdocs:text-lg vdocs:font-normal vdocs:text-ink vdocs:text-center vdocs:leading-7 vdocs:m-0">
          Forgot your password?
        </h3>

        <p className="vdocs:text-sm vdocs:text-ink vdocs:my-4">
          Enter your e-mail address below. If the e-mail address is valid, a password reset code will be sent to your
          inbox. Please allow up to 15 minutes to arrive, and check your spam folder if you do not receive the message.
        </p>

        <form className="vdocs:w-full" onSubmit={submitForm(handleRequestResetCode)}>
          <TextInput label="Email Address" type="email" autoComplete="email" required value={email} disabled={submitting} onChange={e => setEmail(e.target.value)} />

          <div className="vdocs:flex vdocs:flex-row vdocs:justify-center vdocs:gap-5 vdocs:mt-7">
            <Button label="Cancel" size="small" variant="outline" disabled={submitting} onClick={() => setMode('login')} />
            <Button label="Request Code" size="small" type="submit" disabled={submitting} />
          </div>
        </form>
      </div>
    );
  }

  if (mode === 'reset') {
    return (
      <div className={formClasses}>
        {logoHeader}

        <h3 className="vdocs:text-lg vdocs:font-normal vdocs:text-ink vdocs:text-center vdocs:leading-7 vdocs:m-0">
          Reset your password
        </h3>

        <p className="vdocs:text-sm vdocs:text-ink vdocs:my-4">
          Enter the verification code sent to your inbox below, along with your new password. Please allow up to 15
          minutes for the code to arrive, and check your spam folder if you do not receive the message.
        </p>

        <form className="vdocs:w-full" onSubmit={submitForm(handleResetPassword)}>
          <TextInput label="Verification Code" required value={verificationCode} disabled={submitting} onChange={e => setVerificationCode(e.target.value)} />
          <TextInput label="Password" type="password" autoComplete="off" required value={newPassword} disabled={submitting} onChange={e => setNewPassword(e.target.value)} />
          <TextInput label="Confirm Password" type="password" autoComplete="off" required value={confirmPassword} disabled={submitting} onChange={e => setConfirmPassword(e.target.value)} />

          <div className="vdocs:flex vdocs:flex-row vdocs:justify-center vdocs:gap-5 vdocs:mt-7">
            <Button label="Cancel" variant="outline" disabled={submitting} onClick={() => setMode('login')} />
            <Button label="Reset" type="submit" disabled={submitting} />
          </div>

          <div className="vdocs:flex vdocs:justify-center vdocs:mt-2">
            <Button label="Resend Code" variant="text" disabled={resendDisabled || submitting} onClick={handleResendReset} />
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={formClasses}>
      {logoHeader}

      <h3 className="vdocs:text-lg vdocs:font-normal vdocs:text-ink vdocs:text-center vdocs:leading-7 vdocs:m-0">
        Log in to your account
      </h3>
      <div className="vdocs:flex vdocs:items-center vdocs:gap-1 vdocs:text-sm vdocs:text-ink vdocs:my-2">
        Don&apos;t have an account?
        <Button label="Sign Up" variant="text" size="small" disabled={submitting} onClick={() => setMode('signup')} />
      </div>

      <form className="vdocs:w-full" onSubmit={submitForm(handleLogin)}>
        <TextInput label="Email" type="email" autoComplete="username" value={email} disabled={submitting} onChange={e => setEmail(e.target.value)} />
        <TextInput label="Password" type="password" autoComplete="current-password" value={password} disabled={submitting} onChange={e => setPassword(e.target.value)} />

        <div className="vdocs:flex vdocs:justify-center vdocs:mt-2.5 vdocs:mb-5">
          <Button label="Forgot Your Password?" variant="text" size="small" disabled={submitting} onClick={() => setMode('forgot')} />
        </div>

        <div className="vdocs:flex vdocs:justify-center">
          <Button label="Login" type="submit" disabled={submitting} />
        </div>
      </form>
    </div>
  );
}
