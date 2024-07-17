import type {IProfile} from '../../Models';
import {userHasPermissions} from '../../Sessions';

it('userHasPermissions should work as expected', async () => {
  const mockProfile: IProfile = {
    created_at: '',
    current: false,
    email: '',
    first_name: '',
    id: 'BOGUS',
    last_name: '',
    organization_id: '',
    phone: '',
    picture: '',
    user_id: '',
    updated_at: '',
    roles: ['member'],
    // Directly-applied permission that normal members don't have
    permissions: ['admin:add'],
    group_profiles: [
      {
        group_id: 'BOGUS',
        profile_id: 'BOGUS',
        organization_id: 'BOGUS',
        group: {
          id: 'BOGUS',
          name: '',
          organization_id: 'BOGUS',
          // Group-applied permission that normal members don't have
          permissions: ['admin:remove'],
        },
      },
    ],
  };

  // Permission not applied by role, directly, or via group
  expect(userHasPermissions(mockProfile, ['org:delete'])).toBe(false);

  // Permission applied by group
  expect(userHasPermissions(mockProfile, ['admin:remove'])).toBe(true);

  // Permission applied directly
  expect(userHasPermissions(mockProfile, ['admin:add'])).toBe(true);

  // Permission applied by role
  expect(userHasPermissions(mockProfile, ['template:member:delete'])).toBe(true);
});
