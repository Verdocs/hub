import {getEndpoint} from '../HTTP/Transport';
import {ITemplateSummaryEntry} from './Types';

export const toggleStar = async (templateId: string) =>
  getEndpoint().api.post<ITemplateSummaryEntry>(`/templates/${templateId}/stars/toggle`).then((r) => r.data);
