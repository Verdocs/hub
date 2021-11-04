import {getEndpoint} from '../HTTP/Transport';

export const createWhitelabel = () =>
  getEndpoint()
    .post('/whitelabel')
    .then((r) => r.data);

export const getWhitelabel = () =>
  getEndpoint()
    .get('/whitelabel')
    .then((r) => r.data);
