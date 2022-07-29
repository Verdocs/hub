import {IStar, ITemplatesSummary} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';

export const getStars = (endpoint: VerdocsEndpoint, templateId: string) =>
  endpoint.api //
    .get<IStar[]>(`/templates/${templateId}/stars/`)
    .then((r) => r.data);

export const toggleStar = (endpoint: VerdocsEndpoint, templateId: string) =>
  endpoint.api //
    .get<ITemplatesSummary>(`/templates/${templateId}/stars/toggle`)
    .then((r) => r.data);
