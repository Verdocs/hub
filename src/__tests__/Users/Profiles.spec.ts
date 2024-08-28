import {jest} from '@jest/globals';
import MockAdapter from 'axios-mock-adapter';
import {createProfile, deleteProfile, getProfiles, switchProfile, updateProfile} from '../../Users';
import {VerdocsEndpoint} from '../../VerdocsEndpoint';
import type {IProfile} from '../../Models';

// TODO: Expand this test suite with more mock data and result checks

const endpoint = VerdocsEndpoint.getDefault();

const MockProfile: IProfile = {
  id: '1234',
  user_id: '4567',
  organization_id: '5678',
  first_name: 'first',
  last_name: 'last',
  email: 'test@test.com',
  phone: null,
  picture: null,
  current: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  organization: {
    id: '5678',
    name: 'test org',
    address: null,
    phone: null,
    address2: null,
    contact_email: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  permissions: [],
  roles: [],
};

it('getProfiles should return a "current" profile', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  mock.onGet('/v2/profiles').reply(200, [MockProfile]);

  await getProfiles(endpoint).then(thenFn).catch(catchFn);
  expect(thenFn).toHaveBeenCalledWith([MockProfile]);
  expect(catchFn).not.toHaveBeenCalled();
});

it('createProfile should return the new profile', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  const profile = {email: 'EMAIL', password: 'BOGUS', first_name: 'FIRST', last_name: 'LAST', org_name: 'ORG'};
  mock.onPost('/v2/profiles').reply(200, profile);

  await createProfile(endpoint, profile).then(thenFn).catch(catchFn);
  expect(thenFn).toHaveBeenCalledWith(profile);
  expect(catchFn).not.toHaveBeenCalled();
});

it('switchProfile should return a new profile', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  mock.onPost('/v2/profiles/TEST/switch').reply(200, {});

  await switchProfile(endpoint, 'TEST').then(thenFn).catch(catchFn);
  expect(thenFn).toHaveBeenCalledWith({});
  expect(catchFn).not.toHaveBeenCalled();
});

it('updateProfile should return a new profile', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  mock.onPatch('/v2/profiles/TEST').reply(200, {});

  await updateProfile(endpoint, 'TEST', {first_name: 'TEST'}).then(thenFn).catch(catchFn);
  expect(thenFn).toHaveBeenCalledWith({});
  expect(catchFn).not.toHaveBeenCalled();
});

it('deleteProfile should return a new profile', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  mock.onDelete('/v2/profiles/TEST').reply(200);

  await deleteProfile(endpoint, 'TEST').then(thenFn).catch(catchFn);
  expect(thenFn).toHaveBeenCalled();
  expect(catchFn).not.toHaveBeenCalled();
});
