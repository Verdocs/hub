import mockAxios from 'jest-mock-axios';
import {
  authenticateUser,
  authenticateApp,
  validateToken,
  refreshTokens,
  updateEmail,
  updatePassword,
} from '../Api/Auth';

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

it('updatePassword should return a success message', () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const request = {email: 'EMAIL', oldPassword: 'OLD', newPassword: 'NEW'};
  updatePassword(request).then(thenFn).catch(catchFn);
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
  updateEmail(request).then(thenFn).catch(catchFn);
  expect(mockAxios.put).toBeCalledWith('/user/update_email', request);

  const response = {profiles: []};
  mockAxios.mockResponse({data: response});
  expect(thenFn).toBeCalledWith(response);
  expect(catchFn).not.toBeCalled();
});
