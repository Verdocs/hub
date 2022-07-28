import {simpleE164Validator} from '../Utils/Locales';
import {getEndpoint} from '../HTTP/Transport';
import {IRole, ITag} from './Types';

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
export const getValidators = () =>
  getEndpoint()
    .api.get<IValidator[]>('/validators')
    .then((r) => r.data);

export const getValidator = (validatorName: string) =>
  getEndpoint()
    .api.get<IValidator>(`/validators/${validatorName}`)
    .then((r) => r.data);

const EmailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export const isValidEmail = (value: string) => EmailRegEx.test(value);

export const isValidPhone = (value: string) => simpleE164Validator(value);

export const isValidRoleName = (value: string, roles: IRole[]) => roles.findIndex((role) => role.name === value) !== -1;

const TagRegEx = /^[a-zA-Z0-9-]{0,32}$/;

export const isValidTag = (value: string, tags: ITag[]) =>
  TagRegEx.test(value) || tags.findIndex((tag) => tag.name === value) !== -1;
