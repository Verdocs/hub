import {Endpoint} from './Endpoint';

export const getNotifications = async () => Endpoint.get('/notifications').then((r:any) => r.data);
