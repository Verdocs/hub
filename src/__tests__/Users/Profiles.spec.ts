import {jest} from '@jest/globals';
import MockAdapter from 'axios-mock-adapter';
import {createProfile, deleteProfile, getPermissions, getProfile, getProfileGroups} from '../../Users';
import {getProfilePermissions, getProfiles, getRoles, switchProfile, updateProfile} from '../../Users';
import {VerdocsEndpoint} from '../../VerdocsEndpoint';
import {TPermission, TRole} from '../../BaseTypes';
import {IProfile} from '../../Models';

// TODO: Expand this test suite with more mock data and result checks

const endpoint = VerdocsEndpoint.getDefault();

const MockProfile = {
  id: '1234',
  user_id: '4567',
  organization_id: '5678',
  first_name: 'first',
  last_name: 'last',
  email: 'test@test.com',
  phone: null,
  current: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  organization: {
    id: '5678',
    name: 'test org',
    address: null,
    phone: null,
    business_name: null,
    is_business: false,
    address2: null,
    contact_email: null,
    timezone: null,
    envelope_responsible: false,
    url: '',
    slug: '',
    full_logo_url: '',
    thumbnail_url: '',
    primary_color: '',
    secondary_color: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  permissions: [],
  roles: [],
  plans: [],
} as IProfile;

it('getProfiles should return a "current" profile', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  mock.onGet('/profiles').reply(200, [MockProfile]);

  await getProfiles(endpoint).then(thenFn).catch(catchFn);
  expect(thenFn).toHaveBeenCalledWith([MockProfile]);
  expect(catchFn).not.toHaveBeenCalled();
});

it('getRoles should return a list of system roles', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  const roles = [] as TRole[];
  mock.onGet('/roles').reply(200, roles);

  await getRoles(endpoint).then(thenFn).catch(catchFn);
  expect(thenFn).toHaveBeenCalledWith(roles);
  expect(catchFn).not.toHaveBeenCalled();
});

it('getPermissions should return a list of system permissions', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  const permissions = [] as TPermission[];
  mock.onGet('/permissions').reply(200, permissions);

  await getPermissions(endpoint).then(thenFn).catch(catchFn);
  expect(thenFn).toHaveBeenCalledWith(permissions);
  expect(catchFn).not.toHaveBeenCalled();
});

it('createProfile should return the new profile', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  const profile = {first_name: 'FIRST', last_name: 'LAST', email: 'EMAIL', organization_id: 'ORGID', user_id: 'TEST'};
  mock.onPost('/profiles').reply(200, profile);

  await createProfile(endpoint, profile).then(thenFn).catch(catchFn);
  expect(thenFn).toHaveBeenCalledWith(profile);
  expect(catchFn).not.toHaveBeenCalled();
});

it('getProfile should return a profile', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  const profileId = 'TEST';
  const response = {id: 'TEST'};
  mock.onGet('/profiles/TEST').reply(200, response);

  await getProfile(endpoint, profileId).then(thenFn).catch(catchFn);
  expect(thenFn).toHaveBeenCalledWith(response);
  expect(catchFn).not.toHaveBeenCalled();
});

it('getProfilePermissions should return a permissions array', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  mock.onGet('/profiles/TEST/permissions').reply(200, []);

  await getProfilePermissions(endpoint, 'TEST').then(thenFn).catch(catchFn);
  expect(thenFn).toHaveBeenCalledWith([]);
  expect(catchFn).not.toHaveBeenCalled();
});

it('getProfileGroups should return a groups array', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  mock.onGet('/profiles/TEST/groups').reply(200, []);

  await getProfileGroups(endpoint, 'TEST').then(thenFn).catch(catchFn);
  expect(thenFn).toHaveBeenCalledWith([]);
  expect(catchFn).not.toHaveBeenCalled();
});

it('switchProfile should return a new profile', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  mock.onPost('/profiles/TEST/switch').reply(200, {});

  await switchProfile(endpoint, 'TEST').then(thenFn).catch(catchFn);
  expect(thenFn).toHaveBeenCalledWith({});
  expect(catchFn).not.toHaveBeenCalled();
});

it('updateProfile should return a new profile', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  mock.onPut('/profiles/TEST').reply(200, {});

  await updateProfile(endpoint, 'TEST', {first_name: 'TEST'}).then(thenFn).catch(catchFn);
  expect(thenFn).toHaveBeenCalledWith({});
  expect(catchFn).not.toHaveBeenCalled();
});

it('deleteProfile should return a new profile', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(endpoint.api);
  mock.onDelete('/profiles/TEST').reply(200);

  await deleteProfile(endpoint, 'TEST').then(thenFn).catch(catchFn);
  expect(thenFn).toHaveBeenCalled();
  expect(catchFn).not.toHaveBeenCalled();
});
