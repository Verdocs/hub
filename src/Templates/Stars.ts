import {getEndpoint} from '../HTTP/Transport';
import {IStar, ITemplatesSummary} from './Types';

export const getStars = (templateId: string) =>
  getEndpoint()
    .get<IStar[]>(`/templates/${templateId}/stars/`)
    .then((r) => r.data);

export const toggleStar = (templateId: string) =>
  getEndpoint()
    .get<ITemplatesSummary>(`/templates/${templateId}/stars/toggle`)
    .then((r) => r.data);
