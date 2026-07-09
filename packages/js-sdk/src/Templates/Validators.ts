import {IRole} from '../Models';

export interface IValidator {
  name: string;
  regex: string;
}

const EMAIL_REGEX =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

// @see https://www.regextester.com/1978
const PHONE_REGEX =
  /((?:\+|00)[17](?: |\-)?|(?:\+|00)[1-9]\d{0,2}(?: |\-)?|(?:\+|00)1\-\d{3}(?: |\-)?)?(0\d|\([0-9]{3}\)|[1-9]{0,3})(?:((?: |\-)[0-9]{2}){4}|((?:[0-9]{2}){4})|((?: |\-)[0-9]{3}(?: |\-)[0-9]{4})|([0-9]{7}))/;

const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

const POSTAL_CODE_REGEX = /^[A-Za-z0-9-\s]{3,10}$/;

const NUMBER_REGEX = /^\d+$/;

const DATE_REGEX = /^(\d{4}[-\/]\d{2}[-\/]\d{2})|(\d{2}[-\/]\d{2}[-\/]\d{4})$/;

const VALIDATORS = {
  email: {regex: EMAIL_REGEX, label: 'Email Address'},
  phone: {regex: PHONE_REGEX, label: 'Phone Number'},
  url: {regex: URL_REGEX, label: 'URL'},
  postal_code: {regex: POSTAL_CODE_REGEX, label: 'Zip/Postal Code'},
  number: {regex: NUMBER_REGEX, label: 'Number'},
  date: {regex: DATE_REGEX, label: 'Date'},
};

export const isValidInput = (value: string, validator: string) =>
  Object.keys(VALIDATORS).includes(validator) && VALIDATORS[validator as keyof typeof VALIDATORS].regex.test(value);

/**
 * Get a list of available validators for field inputs. Note that validators always check strings,
 * because that is all a user can enter in an HTML input field. Numeric-format validators should
 * perform any necessary conversions internally. Validators never throw - they just return a boolean.
 * indicating whether the value is valid.
 */
export const getValidators = () => Object.keys(VALIDATORS);

export const isValidEmail = (email: string | undefined) => !!email && EMAIL_REGEX.test(email);

export const isValidPhone = (phone: string | undefined) => !!phone && PHONE_REGEX.test(phone);

export const isValidRoleName = (value: string, roles: IRole[]) => roles.findIndex((role) => role.name === value) !== -1;

const TagRegEx = /^[a-zA-Z0-9-]{0,32}$/;

export const isValidTag = (value: string, tags: string[]) => TagRegEx.test(value) || tags.findIndex((tag) => tag === value) !== -1;
