import {Endpoint} from '../HTTP/Transport';
import {IStar, ITemplatesSummary} from "./Types";

export const getStars = (templateId: string) =>
  Endpoint.get<IStar[]>(`/templates/${templateId}/stars/`).then((r) => r.data);

export const toggleStar = (templateId: string) =>
  Endpoint.get<ITemplatesSummary>(`/templates/${templateId}/stars/toggle`).then((r) => r.data);
