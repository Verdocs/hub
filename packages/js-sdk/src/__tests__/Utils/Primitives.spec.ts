import {formatFullName} from '../../Utils';

it('formatFullName should work as expected', async () => {
  expect(formatFullName()).toBe('');
  expect(formatFullName({})).toBe('');
  expect(formatFullName({first_name: 'test'})).toBe('Test');
  expect(formatFullName({last_name: 'user'})).toBe('User');
  expect(formatFullName({first_name: 'test', last_name: 'user'})).toBe('Test User');
});
