import {webcrypto} from 'node:crypto';
import {TextEncoder as NodeTextEncoder} from 'node:util';
import {vi} from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import {createCodeChallenge, createCodeVerifier, getMFAChallenge, getSocialLoginUrl, getSocialProviders, isMFARequired} from '../../Users';
import {VerdocsEndpoint} from '../../VerdocsEndpoint';

// jsdom supplies neither crypto.subtle nor TextEncoder, both of which the PKCE helpers use in
// real browsers and in Node. Node's own implementations are the same WebCrypto API.
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', {value: webcrypto, configurable: true});
}
if (typeof globalThis.TextEncoder === 'undefined') {
  Object.defineProperty(globalThis, 'TextEncoder', {value: NodeTextEncoder, configurable: true});
}

const endpoint = VerdocsEndpoint.getDefault();

it('getSocialProviders should return the enabled providers', async () => {
  const catchFn = vi.fn();
  const thenFn = vi.fn();

  const mock = new MockAdapter(endpoint.api);
  mock.onGet('/v2/oauth2/social/providers').reply(200, {google: true, microsoft: false});

  await getSocialProviders(endpoint).then(thenFn).catch(catchFn);
  expect(thenFn).toHaveBeenCalledWith({google: true, microsoft: false});
  expect(catchFn).not.toHaveBeenCalled();
});

it('getSocialLoginUrl should build a PKCE start URL', () => {
  const url = new URL(
    getSocialLoginUrl(endpoint, 'google', {returnUri: 'https://app.verdocs.com/login', codeChallenge: 'CHALLENGE', state: 'STATE'}),
  );

  expect(url.origin).toEqual(new URL(endpoint.getBaseURL()).origin);
  expect(url.pathname).toEqual('/v2/oauth2/social/google/start');
  expect(url.searchParams.get('return_uri')).toEqual('https://app.verdocs.com/login');
  expect(url.searchParams.get('code_challenge')).toEqual('CHALLENGE');
  expect(url.searchParams.get('code_challenge_method')).toEqual('S256');
  expect(url.searchParams.get('state')).toEqual('STATE');
});

it('getSocialLoginUrl should honor the requested provider', () => {
  const url = new URL(
    getSocialLoginUrl(endpoint, 'microsoft', {returnUri: 'https://app.verdocs.com/login', codeChallenge: 'CHALLENGE', state: 'STATE'}),
  );

  expect(url.pathname).toEqual('/v2/oauth2/social/microsoft/start');
});

it('isMFARequired should detect the 403 challenge', () => {
  const challenge = {response: {status: 403, data: {error: 'mfa_required', error_description: 'MFA is required', mfa_token: 'MFATOKEN'}}};

  expect(isMFARequired(challenge)).toEqual(true);
  expect(getMFAChallenge(challenge)).toEqual(challenge.response.data);
});

it('isMFARequired should ignore other errors', () => {
  expect(isMFARequired(undefined)).toEqual(false);
  expect(isMFARequired(new Error('Network Error'))).toEqual(false);
  expect(isMFARequired({response: {status: 403, data: {error: 'access_denied'}}})).toEqual(false);
  expect(isMFARequired({response: {status: 401, data: {error: 'mfa_required', mfa_token: 'MFATOKEN'}}})).toEqual(false);
  expect(isMFARequired({response: {status: 403, data: {error: 'mfa_required'}}})).toEqual(false);
  expect(getMFAChallenge(new Error('Network Error'))).toEqual(null);
});

it('createCodeVerifier should return 43 URL-safe characters', () => {
  const verifier = createCodeVerifier();

  expect(verifier).toHaveLength(43);
  expect(verifier).toMatch(/^[A-Za-z0-9\-._~]+$/);
  expect(createCodeVerifier()).not.toEqual(verifier);
});

it('createCodeChallenge should match the RFC 7636 test vector', async () => {
  // Appendix B of RFC 7636.
  const challenge = await createCodeChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk');

  expect(challenge).toEqual('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
});

it('createCodeChallenge should produce a URL-safe challenge for a generated verifier', async () => {
  const challenge = await createCodeChallenge(createCodeVerifier());

  expect(challenge).toHaveLength(43);
  expect(challenge).toMatch(/^[A-Za-z0-9\-_]+$/);
});
