/* tslint:disable:no-bitwise */

import type {TSession} from '../Sessions';

const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
// Regular expression to check formal correctness of base64 encoded strings
const b64re = /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/;

/**
 * Simplified, Node/Browser-safe alternative to atob() for base64 decoding.
 * Modified from https://github.com/MaxArt2501/base64-js/blob/master/base64.js
 */
export const AtoB = (str: string) => {
  // atob can work with strings with whitespaces, even inside the encoded part,
  // but only \t, \n, \f, \r and ' ', which can be stripped.
  str = String(str).replace(/[\t\n\f\r ]+/g, '');
  if (!b64re.test(str)) throw new TypeError("Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded.");

  // Adding the padding if missing, for semplicity
  str += '=='.slice(2 - (str.length & 3));
  let bitmap;
  let result = '';
  let r1;
  let r2;
  let i = 0;

  for (; i < str.length; ) {
    bitmap =
      (b64.indexOf(str.charAt(i++)) << 18) |
      (b64.indexOf(str.charAt(i++)) << 12) |
      ((r1 = b64.indexOf(str.charAt(i++))) << 6) |
      (r2 = b64.indexOf(str.charAt(i++)));

    result +=
      r1 === 64
        ? String.fromCharCode((bitmap >> 16) & 255)
        : r2 === 64
          ? String.fromCharCode((bitmap >> 16) & 255, (bitmap >> 8) & 255)
          : String.fromCharCode((bitmap >> 16) & 255, (bitmap >> 8) & 255, bitmap & 255);
  }
  return result;
};

/**
 * Decode the body of a JWT. This helper may allow front-end applications to avoid a dependency on `jsonwebtoken` in
 * many cases. Note that this should only be used for true JWTs. Opaque tokens will cause this to throw.
 */
export const decodeJWTBody = (token: string) => JSON.parse(AtoB((token || '').split('.')[1] || ''));

/**
 * Decode the body of an Verdocs access token. Note that raw tokens contain namespaced fields, e.g.
 * `https://verdocs.com/profile_id`. To make these tokens easier to use in front-end code, this name-spacing
 * will be removed. Note that user and signing sessions have different access token formats. The calling
 * application should distinguish between the two based on the context of the authenticated session, or by
 * the presence of the `document_id` field, which will only be present for signing sessions.
 */
export const decodeAccessTokenBody = (token: string): TSession => {
  let decoded: any;
  try {
    decoded = decodeJWTBody(token) as TSession;
    if (decoded === null) {
      return null;
    }
  } catch (e) {
    return null;
  }

  Object.keys(decoded).forEach((key: any) => {
    if (typeof key === 'string' && key.startsWith('https://verdocs.com/')) {
      decoded[key.replace('https://verdocs.com/', '')] = decoded[key];
      delete decoded[key];
    }
  });

  return decoded;
};
