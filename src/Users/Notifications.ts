import {getEndpoint} from '../HTTP/Transport';

export const getNotifications = async () =>
  getEndpoint()
    .api.get('/notifications')
    .then((r) => r.data);
