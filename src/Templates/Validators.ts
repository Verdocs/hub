import {getEndpoint} from '../HTTP/Transport';

export interface IValidator {
  name: string;
  regex: string;
}

export const getValidators = () =>
  getEndpoint()
    .get<IValidator[]>('/validators')
    .then((r) => r.data);

export const getValidator = (validatorName: string) =>
  getEndpoint()
    .get<IValidator>(`/validators/${validatorName}`)
    .then((r) => r.data);
