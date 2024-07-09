import type {IProfile} from '../Models';
import {capitalize} from './Strings';

/**
 * Create an array containing a sequence of integers, e.g. [START, START+1, START+2, ...] This is frequently useful
 * in rendering operations when there is no source array to .map() across.
 */
export const integerSequence = (start: number, count: number): number[] =>
  Array(count)
    .fill(1)
    .map((_, index) => index + start);

/**
 * Format a profile's full name
 */
export const formatFullName = (profile?: IProfile) =>
  profile ? `${capitalize(profile.first_name)} ${capitalize(profile.last_name)}` : 'Invalid User';

/**
 * Format a profile's initials
 */
export const formatInitials = (profile?: IProfile) =>
  profile ? `${capitalize(profile.first_name).charAt(0)} ${capitalize(profile.last_name).charAt(0)}` : '--';

/**
 * Generate suggested initials for a full name, e.g. "John Doe" will yield "JD".
 */
export const fullNameToInitials = (name: string) =>
  name
    .split(' ')
    .map((word) => word[0])
    .join('');
