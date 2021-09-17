import {Endpoint} from './HTTP/Transport';

export interface IValidator {
    name: string;
    regex: string;
}

export const getValidators = () => Endpoint.get<IValidator[]>('/validators').then((r) => r.data);

export const getValidator = (validator_name: string) => Endpoint.get<IValidator>(`/validators/${validator_name}`).then((r) => r.data);