import {Endpoint, StandardDataReponse} from './Endpoint';

export const getNotifications = async () => Endpoint.get('/notifications').then(StandardDataReponse);
