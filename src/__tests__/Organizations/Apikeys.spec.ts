import {jest} from '@jest/globals';
import mockAxios from 'jest-mock-axios';
import {ApiKeys} from '../../Organizations';
import {IApiKey, IApiKeyWithSecret} from '../../Organizations/Types';

afterEach(() => {
  mockAxios.reset();
});

const MockKey = {
  client_id: 'TEST',
  name: 'TEST',
  profile_id: 'TEST',
  organization_id: 'TEST',
} as IApiKey;

const MockKeyWithSecret = {
  client_id: 'TEST',
  client_secret: 'TEST',
  name: 'TEST',
  profile_id: 'TEST',
  organization_id: 'TEST',
} as IApiKeyWithSecret;

it('getKeys should return a list of keys for an organization', () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  ApiKeys.getKeys('TEST').then(thenFn).catch(catchFn);
  expect(mockAxios.get).toBeCalledWith('/organizations/TEST/api_key');

  mockAxios.mockResponse({data: [MockKeyWithSecret]});
  expect(thenFn).toBeCalledWith([MockKeyWithSecret]);
  expect(catchFn).not.toBeCalled();
});

it('createKey should return a newly created key', () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const request = {name: 'TEST', profile_id: 'TEST'};
  ApiKeys.createKey('TEST', request).then(thenFn).catch(catchFn);
  expect(mockAxios.post).toBeCalledWith('/organizations/TEST/api_key', request);

  mockAxios.mockResponse({data: MockKeyWithSecret});
  expect(thenFn).toBeCalledWith(MockKeyWithSecret);
  expect(catchFn).not.toBeCalled();
});

it('rotateKey should return an updated key with secret', () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  ApiKeys.rotateKey('TEST', 'TEST').then(thenFn).catch(catchFn);
  expect(mockAxios.put).toBeCalledWith('/organizations/TEST/api_key/TEST/rotate');

  mockAxios.mockResponse({data: MockKeyWithSecret});
  expect(thenFn).toBeCalledWith(MockKeyWithSecret);
  expect(catchFn).not.toBeCalled();
});

it('updateKey should return an updated key without secret', () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const params = {name: 'TEST'};
  ApiKeys.updateKey('TEST', 'TEST', params).then(thenFn).catch(catchFn);
  expect(mockAxios.patch).toBeCalledWith('/organizations/TEST/api_key/TEST', params);

  mockAxios.mockResponse({data: MockKey});
  expect(thenFn).toBeCalledWith(MockKey);
  expect(catchFn).not.toBeCalled();
});

it('deleteKey should succeed', () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  ApiKeys.deleteKey('TEST', 'TEST').then(thenFn).catch(catchFn);
  expect(mockAxios.delete).toBeCalledWith('/organizations/TEST/api_key/TEST');

  mockAxios.mockResponse();
  expect(thenFn).toBeCalled();
  expect(catchFn).not.toBeCalled();
});
