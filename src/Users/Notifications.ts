import {VerdocsEndpoint} from '../VerdocsEndpoint';

export const getNotifications = async (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get('/notifications')
    .then((r) => r.data);
