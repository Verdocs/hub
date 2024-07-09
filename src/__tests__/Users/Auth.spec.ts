import {jest} from '@jest/globals';
import MockAdapter from 'axios-mock-adapter';
import {VerdocsEndpoint} from '../../VerdocsEndpoint';
import {authenticateApp, authenticateUser, refreshTokens} from '../../Users';

const endpoint = VerdocsEndpoint.getDefault();

it('authenticateUser should return access tokens', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  const response = {accessToken: 'A', idToken: 'B', refreshToken: 'C'};
  mock.onPost('/authentication/login').reply(200, response);

  await authenticateUser(endpoint, {username: 'test@test.com', password: 'PASSWORD'}).then(thenFn).catch(catchFn);
  expect(thenFn).toBeCalledWith(response);
  expect(catchFn).not.toBeCalled();
});

it('authenticateApp should return access tokens', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  const response = {accessToken: 'A', idToken: 'B', refreshToken: 'C'};
  mock.onPost('/authentication/login_client').reply(200, response);

  const headers = {client_id: 'CLIENTID', client_secret: 'SECRET'};
  await authenticateApp(endpoint, headers).then(thenFn).catch(catchFn);
  expect(thenFn).toBeCalledWith(response);
  expect(catchFn).not.toBeCalled();
});

it('refreshTokens should return access tokens', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  const response = {accessToken: 'A', idToken: 'B', refreshToken: 'C'};
  mock.onGet('/token').reply(200, response);

  await refreshTokens(endpoint).then(thenFn).catch(catchFn);
  expect(thenFn).toBeCalledWith(response);
  expect(catchFn).not.toBeCalled();
});
