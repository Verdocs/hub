import mockAxios from 'jest-mock-axios';
import {getProfiles, IProfile} from '../Api/Profiles';

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

  getProfiles().then(thenFn).catch(catchFn);
  expect(mockAxios.get).toBeCalledWith('/profiles');

  mockAxios.mockResponse({data: [MockProfile]});
  expect(thenFn).toBeCalledWith([MockProfile]);
  expect(catchFn).not.toBeCalled();
});
