import {jest} from '@jest/globals';
import mockAxios from 'jest-mock-axios';
import {Auth} from '../../Users';

afterEach(() => {
  mockAxios.reset();
});

it('authenticateUser should return access tokens', () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const request = {username: 'test@test.com', password: 'PASSWORD'};
  Auth.authenticateUser(request).then(thenFn).catch(catchFn);
  expect(mockAxios.post).toBeCalledWith('/authentication/login', request);

  const response = {accessToken: 'A', idToken: 'B', refreshToken: 'C'};
  mockAxios.mockResponse({data: response});
  expect(thenFn).toBeCalledWith(response);
  expect(catchFn).not.toBeCalled();
});

it('authenticateApp should return access tokens', () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const headers = {client_id: 'CLIENTID', client_secret: 'SECRET'};
  Auth.authenticateApp(headers).then(thenFn).catch(catchFn);
  expect(mockAxios.post).toBeCalledWith('/authentication/login_client', {}, {headers});

  const response = {accessToken: 'A', idToken: 'B', refreshToken: 'C'};
  mockAxios.mockResponse({data: response});
  expect(thenFn).toBeCalledWith(response);
  expect(catchFn).not.toBeCalled();
});

it('validateToken should return access tokens', () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const request = {token: 'TOKEN'};
  Auth.validateToken(request).then(thenFn).catch(catchFn);
  expect(mockAxios.post).toBeCalledWith('/token/isValid', request);

  const response = {valid: true};
  mockAxios.mockResponse({data: response});
  expect(thenFn).toBeCalledWith(response);
  expect(catchFn).not.toBeCalled();
});

it('refreshTokens should return access tokens', () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  Auth.refreshTokens().then(thenFn).catch(catchFn);
  expect(mockAxios.get).toBeCalledWith('/token');

  const response = {accessToken: 'A', idToken: 'B', refreshToken: 'C'};
  mockAxios.mockResponse({data: response});
  expect(thenFn).toBeCalledWith(response);
  expect(catchFn).not.toBeCalled();
});

it('updatePassword should return a success message', () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const request = {email: 'EMAIL', oldPassword: 'OLD', newPassword: 'NEW'};
  Auth.updatePassword(request).then(thenFn).catch(catchFn);
  expect(mockAxios.put).toBeCalledWith('/user/update_password', request);

  const response = {status: 'OK', message: 'Password has been updated.'};
  mockAxios.mockResponse({data: response});
  expect(thenFn).toBeCalledWith(response);
  expect(catchFn).not.toBeCalled();
});

it("updateEmail should return the user's profiles", () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const request = {email: 'EMAIL'};
  Auth.updateEmail(request).then(thenFn).catch(catchFn);
  expect(mockAxios.put).toBeCalledWith('/user/update_email', request);

  const response = {profiles: []};
  mockAxios.mockResponse({data: response});
  expect(thenFn).toBeCalledWith(response);
  expect(catchFn).not.toBeCalled();
});
