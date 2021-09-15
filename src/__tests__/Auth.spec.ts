import mockAxios from 'jest-mock-axios';
import {authenticate, getProfiles, IProfile} from '../Api/Auth';

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

it('authenticate should return access tokens', () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  const request = {username: 'test@test.com', password: 'PASSWORD'};
  authenticate({username: 'test@test.com', password: 'PASSWORD'}).then(thenFn).catch(catchFn);
  expect(mockAxios.post).toBeCalledWith('/authentication/login', request);

  const response = {accessToken: 'A', idToken: 'B', refreshToken: 'C'};
  mockAxios.mockResponse({data: response});
  expect(thenFn).toBeCalledWith(response);
  expect(catchFn).not.toBeCalled();
});

it('getProfiles should return a "current" profile', () => {
  const catchFn = jest.fn();
  const thenFn = jest.fn();

  getProfiles().then(thenFn).catch(catchFn);
  expect(mockAxios.post).toBeCalledWith('/profiles');

  mockAxios.mockResponse({data: [MockProfile]});
  expect(thenFn).toBeCalledWith([MockProfile]);
  expect(catchFn).not.toBeCalled();
});
