import {VerdocsEndpoint} from '../VerdocsEndpoint';

/**
 * @sdkOperation notification.getNotifications
 * @sdkGroup Notification
 * @sdkPage Endpoints
 */
export const getNotifications = async (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get('/v2/notifications')
    .then((r) => r.data);
