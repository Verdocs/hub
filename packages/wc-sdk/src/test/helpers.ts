import type { LitElement } from 'lit';

/**
 * Shared spec helpers. Specs fake the API at the HTTP layer with
 * axios-mock-adapter (the same pattern as the angular-sdk specs), which
 * exercises the real js-sdk request path.
 */
export const TEST_API_BASE = 'https://stage-api.verdocs.com';

/** Build a decodable, unexpired JWT for VerdocsEndpoint.setToken. */
export const makeTestJwt = (claims: Record<string, unknown> = {}) => {
  const encode = (value: unknown) => btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payload = {
    sub: 'user-test-1',
    profile_id: 'profile-test-1',
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...claims,
  };
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.signature`;
};

/** Attach an element to the document and wait for its first render. */
export const mount = async <T extends LitElement>(element: T): Promise<T> => {
  document.body.appendChild(element);
  await element.updateComplete;
  return element;
};
