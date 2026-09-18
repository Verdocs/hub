import {vi} from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import {getSessions, revokeOtherSessions, revokeSession} from '../../Users';
import {VerdocsEndpoint} from '../../VerdocsEndpoint';
import type {IUserLoginSession} from '../../Users';

const endpoint = VerdocsEndpoint.getDefault();

const MockSession: IUserLoginSession = {
  id: 'ses_1234',
  current: true,
  source: 'verdocs',
  created_at: new Date().toISOString(),
  last_seen_at: new Date().toISOString(),
  browser: 'Chrome',
  platform: 'macOS',
  mobile: false,
  location: 'Denver, Colorado, US',
  ip_address: '73.***.***.14',
};

it('getSessions should return the caller sessions', async () => {
  const catchFn = vi.fn();
  const thenFn = vi.fn();

  const mock = new MockAdapter(endpoint.api);
  mock.onGet('/v2/users/sessions').reply(200, [MockSession]);

  await getSessions(endpoint).then(thenFn).catch(catchFn);
  expect(thenFn).toHaveBeenCalledWith([MockSession]);
  expect(catchFn).not.toHaveBeenCalled();
});

it('revokeSession should call the session endpoint', async () => {
  const catchFn = vi.fn();
  const thenFn = vi.fn();

  const mock = new MockAdapter(endpoint.api);
  mock.onDelete('/v2/users/sessions/ses_1234').reply(200, {status: 'OK'});

  await revokeSession(endpoint, 'ses_1234').then(thenFn).catch(catchFn);
  expect(thenFn).toHaveBeenCalledWith({status: 'OK'});
  expect(catchFn).not.toHaveBeenCalled();
});

it('revokeOtherSessions should return the number revoked', async () => {
  const catchFn = vi.fn();
  const thenFn = vi.fn();

  const mock = new MockAdapter(endpoint.api);
  mock.onDelete('/v2/users/sessions').reply(200, {revoked: 3});

  await revokeOtherSessions(endpoint).then(thenFn).catch(catchFn);
  expect(thenFn).toHaveBeenCalledWith({revoked: 3});
  expect(catchFn).not.toHaveBeenCalled();
});
