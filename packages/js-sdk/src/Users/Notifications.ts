import {VerdocsEndpoint} from '../VerdocsEndpoint';

export const getNotifications = async (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get('/v2/notifications')
    .then((r) => r.data);
