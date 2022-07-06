import {jest} from '@jest/globals';
import MockAdapter from 'axios-mock-adapter';
import {Profiles} from '../../Users';
import {IPermission, IProfile, IRole} from '../../Users/Types';
import {getEndpoint} from '../../HTTP/Transport';

// TODO: Expand this test suite with more mock data and result checks

const MockProfile = {
  id: '1234',
  user_id: '4567',
  organization_id: '5678',
  first_name: 'first',
  last_name: 'last',
  email: 'test@test.com',
  phone: null,
  current: true,
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
  },
} as IProfile;

it('getProfiles should return a "current" profile', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(getEndpoint().api);
  mock.onGet('/profiles').reply(200, [MockProfile]);

  await Profiles.getProfiles().then(thenFn).catch(catchFn);
  expect(thenFn).toBeCalledWith([MockProfile]);
  expect(catchFn).not.toBeCalled();
});

it('getRoles should return a list of system roles', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(getEndpoint().api);
  const roles = [] as IRole[];
  mock.onGet('/roles').reply(200, roles);

  await Profiles.getRoles().then(thenFn).catch(catchFn);
  expect(thenFn).toBeCalledWith(roles);
  expect(catchFn).not.toBeCalled();
});

it('getPermissions should return a list of system permissions', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(getEndpoint().api);
  const permissions = [] as IPermission[];
  mock.onGet('/permissions').reply(200, permissions);

  await Profiles.getPermissions().then(thenFn).catch(catchFn);
  expect(thenFn).toBeCalledWith(permissions);
  expect(catchFn).not.toBeCalled();
});

it('createProfile should return the new profile', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(getEndpoint().api);
  const profile = {first_name: 'FIRST', last_name: 'LAST', email: 'EMAIL', organization_id: 'ORGID', user_id: 'TEST'};
  mock.onPost('/profiles').reply(200, profile);

  await Profiles.createProfile(profile).then(thenFn).catch(catchFn);
  expect(thenFn).toBeCalledWith(profile);
  expect(catchFn).not.toBeCalled();
});

it('getProfile should return a profile', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(getEndpoint().api);
  const profileId = 'TEST';
  const response = {id: 'TEST'};
  mock.onGet('/profiles/TEST').reply(200, response);

  await Profiles.getProfile(profileId).then(thenFn).catch(catchFn);
  expect(thenFn).toBeCalledWith(response);
  expect(catchFn).not.toBeCalled();
});

it('getProfilePermissions should return a permissions array', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(getEndpoint().api);
  mock.onGet('/profiles/TEST/permissions').reply(200, []);

  await Profiles.getProfilePermissions('TEST').then(thenFn).catch(catchFn);
  expect(thenFn).toBeCalledWith([]);
  expect(catchFn).not.toBeCalled();
});

it('getProfileGroups should return a groups array', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(getEndpoint().api);
  mock.onGet('/profiles/TEST/groups').reply(200, []);

  await Profiles.getProfileGroups('TEST').then(thenFn).catch(catchFn);
  expect(thenFn).toBeCalledWith([]);
  expect(catchFn).not.toBeCalled();
});

it('switchProfile should return a new profile', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(getEndpoint().api);
  mock.onPost('/profiles/TEST/switch').reply(200, {});

  await Profiles.switchProfile('TEST').then(thenFn).catch(catchFn);
  expect(thenFn).toBeCalledWith({});
  expect(catchFn).not.toBeCalled();
});

it('updateProfile should return a new profile', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(getEndpoint().api);
  mock.onPut('/profiles/TEST').reply(200, {});

  await Profiles.updateProfile('TEST', {first_name: 'TEST'}).then(thenFn).catch(catchFn);
  expect(thenFn).toBeCalledWith({});
  expect(catchFn).not.toBeCalled();
});

it('deleteProfile should return a new profile', async () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const mock = new MockAdapter(getEndpoint().api);
  mock.onDelete('/profiles/TEST').reply(200);

  await Profiles.deleteProfile('TEST').then(thenFn).catch(catchFn);
  expect(thenFn).toBeCalled();
  expect(catchFn).not.toBeCalled();
});
