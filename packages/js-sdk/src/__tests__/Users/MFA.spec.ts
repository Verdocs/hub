import {vi} from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import {disableMFA, enrollMFA, getMFAStatus, regenerateBackupCodes, verifyMFAEnrollment} from '../../Users';
import {VerdocsEndpoint} from '../../VerdocsEndpoint';
import type {IMFAStatus} from '../../Users';

const endpoint = VerdocsEndpoint.getDefault();

const MockStatus: IMFAStatus = {
  enabled: true,
  type: 'totp',
  enrolled_at: new Date().toISOString(),
  backup_codes_remaining: 10,
};

it('getMFAStatus should return the caller MFA status', async () => {
  const catchFn = vi.fn();
  const thenFn = vi.fn();

  const mock = new MockAdapter(endpoint.api);
  mock.onGet('/v2/users/mfa').reply(200, MockStatus);

  await getMFAStatus(endpoint).then(thenFn).catch(catchFn);
  expect(thenFn).toHaveBeenCalledWith(MockStatus);
  expect(catchFn).not.toHaveBeenCalled();
});

it('enrollMFA should return a pending enrollment', async () => {
  const catchFn = vi.fn();
  const thenFn = vi.fn();

  const enrollment = {
    secret: 'JBSWY3DPEHPK3PXP',
    otpauth_url: 'otpauth://totp/Verdocs:test@test.com?secret=JBSWY3DPEHPK3PXP&issuer=Verdocs',
    expires_at: new Date().toISOString(),
  };

  const mock = new MockAdapter(endpoint.api);
  mock.onPost('/v2/users/mfa/enroll').reply(200, enrollment);

  await enrollMFA(endpoint).then(thenFn).catch(catchFn);
  expect(thenFn).toHaveBeenCalledWith(enrollment);
  expect(catchFn).not.toHaveBeenCalled();
});

it('verifyMFAEnrollment should post the code and return backup codes', async () => {
  const catchFn = vi.fn();
  const thenFn = vi.fn();

  const mock = new MockAdapter(endpoint.api);
  mock.onPost('/v2/users/mfa/enroll/verify').reply(200, {backup_codes: ['abcd-efgh']});

  await verifyMFAEnrollment(endpoint, '123456').then(thenFn).catch(catchFn);
  expect(thenFn).toHaveBeenCalledWith({backup_codes: ['abcd-efgh']});
  expect(catchFn).not.toHaveBeenCalled();
  expect(JSON.parse(mock.history.post[0].data)).toEqual({code: '123456'});
});

it('regenerateBackupCodes should post the code and return the new set', async () => {
  const catchFn = vi.fn();
  const thenFn = vi.fn();

  const mock = new MockAdapter(endpoint.api);
  mock.onPost('/v2/users/mfa/backup-codes').reply(200, {backup_codes: ['ijkl-mnop']});

  await regenerateBackupCodes(endpoint, '123456').then(thenFn).catch(catchFn);
  expect(thenFn).toHaveBeenCalledWith({backup_codes: ['ijkl-mnop']});
  expect(catchFn).not.toHaveBeenCalled();
  expect(JSON.parse(mock.history.post[0].data)).toEqual({code: '123456'});
});

it('disableMFA should send the code in the request body', async () => {
  const catchFn = vi.fn();
  const thenFn = vi.fn();

  const mock = new MockAdapter(endpoint.api);
  mock.onDelete('/v2/users/mfa').reply(200, {status: 'OK'});

  await disableMFA(endpoint, 'abcd-efgh').then(thenFn).catch(catchFn);
  expect(thenFn).toHaveBeenCalledWith({status: 'OK'});
  expect(catchFn).not.toHaveBeenCalled();
  expect(JSON.parse(mock.history.delete[0].data)).toEqual({code: 'abcd-efgh'});
});
