import mockAxios from 'jest-mock-axios';
import {Profiles} from '../../Users';
import {IPermission, IProfile, IRole} from '../../Users/Types';

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

afterEach(() => {
  mockAxios.reset();
});

it('getProfiles should return a "current" profile', () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  Profiles.getProfiles().then(thenFn).catch(catchFn);
  expect(mockAxios.get).toBeCalledWith('/profiles');

  mockAxios.mockResponse({data: [MockProfile]});
  expect(thenFn).toBeCalledWith([MockProfile]);
  expect(catchFn).not.toBeCalled();
});

it('getRoles should return a list of system roles', () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  Profiles.getRoles().then(thenFn).catch(catchFn);
  expect(mockAxios.get).toBeCalledWith('/roles');

  const roles = [] as IRole[];
  mockAxios.mockResponse({data: roles});
  expect(thenFn).toBeCalledWith(roles);
  expect(catchFn).not.toBeCalled();
});

it('getPermissions should return a list of system permissions', () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  Profiles.getPermissions().then(thenFn).catch(catchFn);
  expect(mockAxios.get).toBeCalledWith('/permissions');

  const permissions = [] as IPermission[];
  mockAxios.mockResponse({data: permissions});
  expect(thenFn).toBeCalledWith(permissions);
  expect(catchFn).not.toBeCalled();
});

it('createProfile should return the new profile', () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const profile = {first_name: 'FIRST', last_name: 'LAST', email: 'EMAIL', organization_id: 'ORGID', user_id: 'TEST'};
  Profiles.createProfile(profile).then(thenFn).catch(catchFn);
  expect(mockAxios.post).toBeCalledWith('/profiles', profile);

  mockAxios.mockResponse({data: profile});
  expect(thenFn).toBeCalledWith(profile);
  expect(catchFn).not.toBeCalled();
});

it('getProfile should return a profile', () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const profileId = 'TEST';
  Profiles.getProfile(profileId).then(thenFn).catch(catchFn);
  expect(mockAxios.get).toBeCalledWith(`/profiles/${profileId}`);

  mockAxios.mockResponse({data: {id: profileId}});
  expect(thenFn).toBeCalledWith({id: profileId});
  expect(catchFn).not.toBeCalled();
});

it('getProfilePermissions should return a permissions array', () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const profileId = 'TEST';
  Profiles.getProfilePermissions(profileId).then(thenFn).catch(catchFn);
  expect(mockAxios.get).toBeCalledWith(`/profiles/${profileId}/permissions`);

  mockAxios.mockResponse({data: []});
  expect(thenFn).toBeCalledWith([]);
  expect(catchFn).not.toBeCalled();
});

it('getProfileGroups should return a groups array', () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const profileId = 'TEST';
  Profiles.getProfileGroups(profileId).then(thenFn).catch(catchFn);
  expect(mockAxios.get).toBeCalledWith(`/profiles/${profileId}/groups`);

  mockAxios.mockResponse({data: []});
  expect(thenFn).toBeCalledWith([]);
  expect(catchFn).not.toBeCalled();
});

it('switchProfile should return a new profile', () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const profileId = 'TEST';
  Profiles.switchProfile(profileId).then(thenFn).catch(catchFn);
  expect(mockAxios.post).toBeCalledWith(`/profiles/${profileId}/switch`);

  mockAxios.mockResponse({data: {}});
  expect(thenFn).toBeCalledWith({});
  expect(catchFn).not.toBeCalled();
});

it('updateProfile should return a new profile', () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const profileId = 'TEST';
  const params = {first_name: 'TEST'};
  Profiles.updateProfile(profileId, params).then(thenFn).catch(catchFn);
  expect(mockAxios.put).toBeCalledWith(`/profiles/${profileId}`, params);

  mockAxios.mockResponse({data: {}});
  expect(thenFn).toBeCalledWith({});
  expect(catchFn).not.toBeCalled();
});

it('deleteProfile should return a new profile', () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const profileId = 'TEST';
  Profiles.deleteProfile(profileId).then(thenFn).catch(catchFn);
  expect(mockAxios.delete).toBeCalledWith(`/profiles/${profileId}`);

  mockAxios.mockResponse();
  expect(thenFn).toBeCalled();
  expect(catchFn).not.toBeCalled();
});
