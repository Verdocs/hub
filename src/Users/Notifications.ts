import {getEndpoint} from '../HTTP/Transport';

export const getNotifications = async () =>
  getEndpoint()
    .get('/notifications')
    .then((r) => r.data);
