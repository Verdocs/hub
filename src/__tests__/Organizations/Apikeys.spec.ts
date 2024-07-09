import {jest} from '@jest/globals';
import MockAdapter from 'axios-mock-adapter';
import {createApiKey, deleteApiKey, getApiKeys, rotateApiKey, updateApiKey} from '../../Organizations';
import {VerdocsEndpoint} from '../../VerdocsEndpoint';
import {IApiKey} from '../../Models';

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
} as IApiKey;

const endpoint = VerdocsEndpoint.getDefault();

it('getKeys should return a list of keys for an organization', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  mock.onGet('/v2/api-keys').reply(200, [MockKeyWithSecret]);

  await getApiKeys(endpoint).then(thenFn).catch(catchFn);
  expect(thenFn).toBeCalledWith([MockKeyWithSecret]);
  expect(catchFn).not.toBeCalled();
});

it('createKey should return a newly created key', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  mock.onPost('/v2/api-keys').reply(200, MockKeyWithSecret);

  await createApiKey(endpoint, {profile_id: 'TEST', name: 'TEST', permission: 'personal'}).then(thenFn).catch(catchFn);
  expect(thenFn).toBeCalledWith(MockKeyWithSecret);
  expect(catchFn).not.toBeCalled();
});

it('rotateKey should return an updated key with secret', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  mock.onPost('/v2/api-keys/TEST/rotate').reply(200, MockKeyWithSecret);

  await rotateApiKey(endpoint, 'TEST').then(thenFn).catch(catchFn);
  expect(thenFn).toBeCalledWith(MockKeyWithSecret);
  expect(catchFn).not.toBeCalled();
});

it('updateKey should return an updated key without secret', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  mock.onPatch('/v2/api-keys/TEST').reply(200, MockKey);

  await updateApiKey(endpoint, 'TEST', {name: 'TEST'}).then(thenFn).catch(catchFn);
  expect(thenFn).toBeCalledWith(MockKey);
  expect(catchFn).not.toBeCalled();
});

it('deleteKey should succeed', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  mock.onDelete('/v2/api-keys/TEST').reply(200);

  await deleteApiKey(endpoint, 'TEST').then(thenFn).catch(catchFn);
  expect(thenFn).toBeCalled();
  expect(catchFn).not.toBeCalled();
});
