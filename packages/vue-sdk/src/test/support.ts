/**
 * Shared spec helpers. Specs fake the API at the HTTP layer with
 * axios-mock-adapter (matching the angular-sdk suite), which exercises the
 * real js-sdk request path instead of stubbing modules.
 */

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
