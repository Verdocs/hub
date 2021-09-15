import mockAxios from 'jest-mock-axios';
import {authenticateUser, authenticateApp, validateToken, refreshTokens} from '../Api/Auth';

afterEach(() => {
  mockAxios.reset();
});

it('authenticateUser should return access tokens', () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const request = {username: 'test@test.com', password: 'PASSWORD'};
  authenticateUser(request).then(thenFn).catch(catchFn);
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
  authenticateApp(headers).then(thenFn).catch(catchFn);
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
  validateToken(request).then(thenFn).catch(catchFn);
  expect(mockAxios.post).toBeCalledWith('/token/isValid', request);

  const response = {valid: true};
  mockAxios.mockResponse({data: response});
  expect(thenFn).toBeCalledWith(response);
  expect(catchFn).not.toBeCalled();
});

it('refreshTokens should return access tokens', () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  refreshTokens().then(thenFn).catch(catchFn);
  expect(mockAxios.get).toBeCalledWith('/token');

  const response = {accessToken: 'A', idToken: 'B', refreshToken: 'C'};
  mockAxios.mockResponse({data: response});
  expect(thenFn).toBeCalledWith(response);
  expect(catchFn).not.toBeCalled();
});
