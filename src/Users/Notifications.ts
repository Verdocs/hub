import {Endpoint} from '../HTTP/Endpoint';

export const getNotifications = async () => Endpoint.get('/notifications').then((r) => r.data);
