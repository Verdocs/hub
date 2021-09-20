import {Endpoint} from '../HTTP/Transport';

export const getTemplateStars = (templateId: string) => Endpoint.get(`/templates/${templateId}/stars/`).then((r) => r.data)

export const toggleTemplateStar = (templateId: string) => Endpoint.get(`/templates/${templateId}/stars/toggle`).then((r) => r.data)