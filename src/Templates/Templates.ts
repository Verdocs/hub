import {Endpoint} from '../HTTP/Transport';
import {ITemplatesSummary} from "./Types";

export const getTemplates = () => Endpoint.get('/templates/').then((r) => r.data)

export const getTemplate = (templateId: string) => Endpoint.get(`/templates/${templateId}`).then((r) => r.data)

export const createTemplate = () => Endpoint.post('/templates/').then((r) => r.data)

export const editTemplate = (templateId: string) => Endpoint.put(`/templates/${templateId}`).then((r) => r.data)

export const searchTemplate = () => Endpoint.post('/templates/search').then((r) => r.data)

export const getSummary = async (page: number): Promise<ITemplatesSummary> =>
    Endpoint.post('/templates/summary', {page}).then((r) => r.data);