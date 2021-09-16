import {Endpoint} from '../HTTP/Endpoint';
import {ITemplateSummaryEntry} from './Types';

export const toggleStar = async (templateId: string) =>
  Endpoint.post<ITemplateSummaryEntry>(`/templates/${templateId}/stars/toggle`).then((r) => r.data);
