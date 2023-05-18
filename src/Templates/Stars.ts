import {IStar, ITemplatesSummary} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';

/**
 * Get the template stars for a template.
 */
export const getStars = (endpoint: VerdocsEndpoint, templateId: string) =>
  endpoint.api //
    .get<IStar[]>(`/templates/${templateId}/stars`)
    .then((r) => r.data);

/**
 * Toggle the template star for a template.
 */
export const toggleStar = (endpoint: VerdocsEndpoint, templateId: string) =>
  endpoint.api //
    .post<ITemplatesSummary>(`/templates/${templateId}/stars/toggle`)
    .then((r) => r.data);
