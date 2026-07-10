/**
 * Shared spec helpers. The Angular unit-test builder pre-bundles sources, so
 * vi.mock-style module mocking is unsupported; specs fake the API at the HTTP
 * layer instead, which exercises the real js-sdk request path.
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
