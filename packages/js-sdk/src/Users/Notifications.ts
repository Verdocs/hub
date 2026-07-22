import {VerdocsEndpoint} from '../VerdocsEndpoint';

/**
 * Get notifications for the caller's current profile.
 *
 * @group Notifications
 * @api GET /v2/notifications Get notifications
 * @apiSuccess array(items: INotification) . Notifications for the caller
 *
 * @sdkOperation notification.getNotifications
 * @sdkGroup Notification
 * @sdkPage Endpoints
 */
export const getNotifications = async (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get('/v2/notifications')
    .then((r) => r.data);
