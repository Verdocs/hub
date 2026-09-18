import '@testing-library/jest-dom/vitest';

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
