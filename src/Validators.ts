import {Endpoint} from './HTTP/Transport';

export interface IValidator {
  name: string;
  regex: string;
}

export const getValidators = () => Endpoint.get<IValidator[]>('/validators').then((r) => r.data);

export const getValidator = (validatorName: string) =>
  Endpoint.get<IValidator>(`/validators/${validatorName}`).then((r) => r.data);
