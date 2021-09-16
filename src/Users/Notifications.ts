import {Endpoint} from '../HTTP/Transport';

export const getNotifications = async () => Endpoint.get('/notifications').then((r) => r.data);
