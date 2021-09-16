import {Endpoint} from '../HTTP/Transport';
import {ITemplateSummaryEntry} from './Types';

export const toggleStar = async (templateId: string) =>
  Endpoint.post<ITemplateSummaryEntry>(`/templates/${templateId}/stars/toggle`).then((r) => r.data);
