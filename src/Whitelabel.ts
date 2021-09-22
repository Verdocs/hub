import {Endpoint} from './HTTP/Transport';

export const createWhitelabel = () => Endpoint.post('/whitelabel').then((r) => r.data);

export const getWhitelabel = () => Endpoint.get('/whitelabel').then((r) => r.data);
