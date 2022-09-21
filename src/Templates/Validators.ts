// import {simpleE164Validator} from '../Utils/Locales';
import {IRole, ITag} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';

export interface IValidator {
  name: string;
  regex: string;
}

/**
 * Get all defined validators
 *
 * ```typescript
 * import {Documents} from '@verdocs/js-sdk/Templates';
 *
 * await Documents.getDocuments(templateID);
 * ```
 */
export const getValidators = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<IValidator[]>('/validators')
    .then((r) => r.data);

export const getValidator = (endpoint: VerdocsEndpoint, validatorName: string) =>
  endpoint.api //
    .get<IValidator>(`/validators/${validatorName}`)
    .then((r) => r.data);

const EMAIL_REGEX =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export const isValidEmail = (email: string | undefined) => !!email && EMAIL_REGEX.test(email);

// @see https://www.regextester.com/1978
const PHONE_REGEX =
  /((?:\+|00)[17](?: |\-)?|(?:\+|00)[1-9]\d{0,2}(?: |\-)?|(?:\+|00)1\-\d{3}(?: |\-)?)?(0\d|\([0-9]{3}\)|[1-9]{0,3})(?:((?: |\-)[0-9]{2}){4}|((?:[0-9]{2}){4})|((?: |\-)[0-9]{3}(?: |\-)[0-9]{4})|([0-9]{7}))/;

export const isValidPhone = (phone: string | undefined) => !!phone && PHONE_REGEX.test(phone);

export const isValidRoleName = (value: string, roles: IRole[]) => roles.findIndex((role) => role.name === value) !== -1;

const TagRegEx = /^[a-zA-Z0-9-]{0,32}$/;

export const isValidTag = (value: string, tags: ITag[]) => TagRegEx.test(value) || tags.findIndex((tag) => tag.name === value) !== -1;
