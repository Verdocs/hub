import {getEndpoint} from '../HTTP/Transport';
import {ITemplatesSummary} from './Types';

export const getTemplates = async () =>
  getEndpoint()
    .get('/templates')
    .then((r) => r.data);

export const searchTemplates = async () =>
  getEndpoint()
    .post('/templates/search')
    .then((r) => r.data);

export const getSummary = async (page: number): Promise<ITemplatesSummary> =>
  getEndpoint()
    .post('/templates/summary', {page})
    .then((r) => r.data);
