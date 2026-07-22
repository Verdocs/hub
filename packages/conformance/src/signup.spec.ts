import { randomBytes } from 'node:crypto';
import { authenticate, createProfile, getMyUser, verifyEmail, VerdocsEndpoint } from '@verdocs/js-sdk';
import { loadImapEnv, waitForMessage } from './imap.js';
import { loadEnv } from './support.js';

/**
 * Gated signup lane: exercises the full self-serve signup flow against beta
 * with the SDK only (no browser), mirroring the call sequence VerdocsAuth
 * makes: createProfile, verification code by email, verifyEmail, then a fresh
 * password-grant login as the new identity.
 *
 * Each run creates ONE real account (and its own new org) on beta, so this
 * lane needs an explicit opt-in (VERDOCS_SIGNUP_E2E=1) on top of the IMAP
 * mailbox variables; otherwise every routine conformance run would mint a new
 * account. The signup address is always a plus-addressed variant of the
 * mailbox user; the bare base address must never be signed up because signup
 * consumes it forever.
 */

const optedIn = process.env.VERDOCS_SIGNUP_E2E === '1';
const imapEnv = optedIn ? loadImapEnv() : null;

if (!optedIn) {
  console.warn('[signup] Skipping the gated signup lane: set VERDOCS_SIGNUP_E2E=1 to run it (creates one real beta account per run).');
} else if (!imapEnv) {
  console.warn('[signup] Skipping the gated signup lane: VERDOCS_TEST_IMAP_HOST, VERDOCS_TEST_IMAP_USER, and VERDOCS_TEST_IMAP_PASSWORD are not all set.');
}

// UTC, e.g. 20260710-181530. One account per run, so per-second uniqueness is enough.
const timestamp = () => new Date().toISOString().slice(0, 19).replace(/-|:/g, '').replace('T', '-');

// Complexity rules from VerdocsAuth: 8+ chars with upper, lower, and special.
// The fixed prefix guarantees all of them no matter what the random tail is.
const generatePassword = () => `Sdk1!${randomBytes(12).toString('base64url')}`;

// The verification mail is multipart/alternative with a one-line stub in
// text/plain; the real content is HTML with "Please use the code below to
// verify your email address." followed by a 6-digit code. We strip style
// blocks and tags, then look for digits near the word "code", falling back to
// any standalone 4-8 digit run (the only one in the current mail is the code).
const extractVerificationCode = (parts: { text: string; html: string }): string | null => {
  for (const raw of [ parts.text, parts.html ]) {
    if (!raw) {
      continue;
    }

    const text = raw.replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
    const nearKeyword = text.match(/code[^0-9]{0,80}?(\d{4,8})/i);
    if (nearKeyword?.[1]) {
      return nearKeyword[1];
    }

    const standalone = text.match(/(?<![\d.])(\d{4,8})(?![\d.])/);
    if (standalone?.[1]) {
      return standalone[1];
    }
  }

  return null;
};

// The shared mailbox can hold other runs' codes, so anything we print from a
// message gets its digits and token-like runs blanked first.
const mask = (value: string) => value.replace(/[A-Za-z0-9]{10,}/g, '####').replace(/\d/g, '#').slice(0, 800);

// Failures anywhere in this flow are likely to be real API findings, so
// surface the exact step, status, and response body instead of a bare
// AxiosError message.
const step = async <T>(name: string, call: () => Promise<T>): Promise<T> => {
  try {
    return await call();
  } catch (e) {
    const error = e as { message?: string; response?: { status?: number; data?: unknown } };
    if (error.response) {
      throw new Error(`${name} failed: HTTP ${error.response.status} ${JSON.stringify(error.response.data)}`);
    }

    throw e;
  }
};

describe.skipIf(!imapEnv)('signup (gated: creates one real beta account)', () => {
  it('signs up, verifies the emailed code, and authenticates as the new user', { timeout: 240000 }, async () => {
    const env = loadEnv();
    const imap = imapEnv!;

    const [ localPart, domain ] = imap.user.split('@');
    if (!localPart || !domain) {
      throw new Error('VERDOCS_TEST_IMAP_USER must be a full email address so we can derive plus addresses from it.');
    }

    const stamp = timestamp();
    const email = `${localPart}+sdk-${stamp}@${domain}`;
    const password = generatePassword();

    // Step 1: create the profile (this also creates a new org owned by it).
    const endpoint = new VerdocsEndpoint({ baseURL: env.apiBase, persist: false });
    const signupStarted = new Date();
    const created = await step('createProfile (POST /v2/profiles)', () => createProfile(endpoint, {
      email,
      password,
      first_name: 'SDK',
      last_name: 'Conformance',
      org_name: `SDK Conformance ${stamp}`,
      phone: '+12125551212',
      timezone: 'America/New_York',
      locale: 'en-US',
    }));

    expect(created.access_token).toBeTruthy();
    endpoint.setToken(created.access_token);

    // Step 2: wait for the verification email and pull the code out of it.
    const message = await waitForMessage(imap, { to: email, since: signupStarted, timeoutMs: 120000, pollMs: 5000 });
    const deliverySeconds = Math.round((Date.now() - signupStarted.getTime()) / 1000);
    console.log(`[signup] Verification email arrived after ~${deliverySeconds}s (subject, masked: "${mask(message.subject)}")`);

    const code = extractVerificationCode(message);
    if (!code) {
      throw new Error(`Could not find a verification code in the email. Masked body: ${mask(message.text)} / ${mask(message.html)}`);
    }

    // Step 3: verify. The endpoint must still carry the signup session's
    // token: /v2/users/verify returns 401 Access Denied without a bearer, so
    // email + code alone are not enough (mirrors how VerdocsAuth calls it).
    const verified = await step('verifyEmail (POST /v2/users/verify)', () => verifyEmail(endpoint, { email, token: code }));
    expect(verified.access_token).toBeTruthy();

    // Step 4: a fresh login as the new identity proves the account is real.
    const fresh = new VerdocsEndpoint({ baseURL: env.apiBase, persist: false });
    const session = await step('authenticate (POST /v2/oauth2/token)', () => authenticate(fresh, { username: email, password, grant_type: 'password' }));
    expect(session.access_token).toBeTruthy();
    fresh.setToken(session.access_token);

    const me = await step('getMyUser (GET /v2/users/me)', () => getMyUser(fresh));
    expect(me.email).toBe(email);
    expect(me.email_verified).toBe(true);
  });
});
