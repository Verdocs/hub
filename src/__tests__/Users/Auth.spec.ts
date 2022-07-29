import {jest} from '@jest/globals';
import MockAdapter from 'axios-mock-adapter';
import {VerdocsEndpoint} from '../../VerdocsEndpoint';
import {Auth} from '../../Users';

const endpoint = VerdocsEndpoint.getDefault();

it('authenticateUser should return access tokens', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  const response = {accessToken: 'A', idToken: 'B', refreshToken: 'C'};
  mock.onPost('/authentication/login').reply(200, response);

  await Auth.authenticateUser(endpoint, {username: 'test@test.com', password: 'PASSWORD'}).then(thenFn).catch(catchFn);
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
  await Auth.authenticateApp(endpoint, headers).then(thenFn).catch(catchFn);
  expect(thenFn).toBeCalledWith(response);
  expect(catchFn).not.toBeCalled();
});

it('validateToken should return access tokens', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  const response = {valid: true};
  mock.onPost('/token/isValid').reply(200, response);

  await Auth.validateToken(endpoint, {token: 'TOKEN'}).then(thenFn).catch(catchFn);
  expect(thenFn).toBeCalledWith(response);
  expect(catchFn).not.toBeCalled();
});

it('refreshTokens should return access tokens', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  const response = {accessToken: 'A', idToken: 'B', refreshToken: 'C'};
  mock.onGet('/token').reply(200, response);

  await Auth.refreshTokens(endpoint).then(thenFn).catch(catchFn);
  expect(thenFn).toBeCalledWith(response);
  expect(catchFn).not.toBeCalled();
});

it('updatePassword should return a success message', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  const response = {status: 'OK', message: 'Password has been updated.'};
  mock.onPut('/user/update_password').reply(200, response);

  const request = {email: 'EMAIL', oldPassword: 'OLD', newPassword: 'NEW'};
  await Auth.updatePassword(endpoint, request).then(thenFn).catch(catchFn);
  expect(thenFn).toBeCalledWith(response);
  expect(catchFn).not.toBeCalled();
});

it("updateEmail should return the user's profiles", async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  const response = {profiles: []};
  mock.onPut('/user/update_email').reply(200, response);

  await Auth.updateEmail(endpoint, {email: 'EMAIL'}).then(thenFn).catch(catchFn);
  expect(thenFn).toBeCalledWith(response);
  expect(catchFn).not.toBeCalled();
});
