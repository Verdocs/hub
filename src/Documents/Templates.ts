import {Endpoint} from '../HTTP/Endpoint';
import {ITemplatesSummary} from './Types';

export const getTemplates = async () => Endpoint.get('/templates').then((r) => r.data);

export const searchTemplates = async () => Endpoint.post('/templates/search').then((r) => r.data);

export const getSummary = async (page: number): Promise<ITemplatesSummary> =>
  Endpoint.post('/templates/summary', {page}).then((r) => r.data);
