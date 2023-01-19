/**
 * Create an array containing a sequence of integers, e.g. [START, START+1, START+2, ...] This is frequently useful
 * in rendering operations when there is no source array to .map() across.
 */
export const integerSequence = (start: number, count: number): number[] =>
  Array(count)
    .fill(1)
    .map((_, index) => index + start);

/**
 * Generate suggested initials for a full name, e.g. "John Doe" will yield "JD".
 */
export const fullNameToInitials = (name: string) =>
  name
    .split(' ')
    .map((word) => word[0])
    .join('');
