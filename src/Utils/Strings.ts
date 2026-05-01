/**
 * Capitalize the first letter of a string.
 */
export const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Convert a phone-number-like string to E164 format.
 * @see https://46elks.com/kb/e164
 */
export const convertToE164 = (input: string) => {
  // "(212) 555-1212" => +12125551212
  // "+46766861004" => "+46766861004"
  // "212-555-1212" => +12125551212
  // "212.555.1212" => +12125551212
  // "212 555 1212" => +12125551212

  let temp = (input || '').trim();
  // If we are already prefixed, assume the user did it deliberately and attempt to use what they entered. We also short-circuit blanks.
  if (!temp || temp.startsWith('+')) {
    return temp;
  }

  // Remove any spaces, parenthesis or other punctuation.
  temp = temp.replace(/[^0-9]/g, '');

  // If the number begins with a zero, remove the leading zero. Do not combine this with the previous step because it needs to be removed
  // whether it's the actual first character e.g. `0(5)` or just the first digit e.g. `(05`.
  temp = temp.replace(/^0/g, '');

  // Prepend the country code and +. We're assuming US in this case given the target demographic. Users in other countries would/should be
  // already entering a prefix so they'd shortcut out of this routine via the + prefix check.
  return `+1${temp}`;
};

// Generate a random string of a given length. This is NOT cryptographically strong. It is meant for light-duty
// uses such as assigning IDs to DOM elements.
export const randomString = (length: number) =>
  Math.random()
    .toString(36)
    .substring(2, 2 + length + 1);
