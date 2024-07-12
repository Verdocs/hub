import {jest} from '@jest/globals';
import MockAdapter from 'axios-mock-adapter';
import {VerdocsEndpoint} from '../../VerdocsEndpoint';
import {authenticate, refreshToken} from '../../Users';

const endpoint = VerdocsEndpoint.getDefault();

it('authenticateUser should return access tokens', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  const response = {accessToken: 'A', idToken: 'B', refreshToken: 'C'};
  mock.onPost('/v2/oauth2/token').reply(200, response);

  await authenticate(endpoint, {username: 'test@test.com', password: 'PASSWORD', grant_type: 'password'}).then(thenFn).catch(catchFn);
  expect(thenFn).toBeCalledWith(response);
  expect(catchFn).not.toBeCalled();
});

it('authenticateApp should return access tokens', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  const response = {accessToken: 'A', idToken: 'B', refreshToken: 'C'};
  mock.onPost('/v2/oauth2/token').reply(200, response);

  await authenticate(endpoint, {client_id: 'CLIENTID', client_secret: 'SECRET', grant_type: 'client_credentials'})
    .then(thenFn)
    .catch(catchFn);
  expect(thenFn).toBeCalledWith(response);
  expect(catchFn).not.toBeCalled();
});

it('refreshTokens should return access tokens', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  const response = {accessToken: 'A', idToken: 'B', refreshToken: 'C'};
  mock.onPost('/v2/oauth2/token').reply(200, response);

  await refreshToken(endpoint, response.refreshToken).then(thenFn).catch(catchFn);
  expect(thenFn).toBeCalledWith(response);
  expect(catchFn).not.toBeCalled();
});
