import {IReminder, ITemplate} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';

export const createReminder = (endpoint: VerdocsEndpoint, templateId: string, params: any) =>
  endpoint.api //
    .post<ITemplate>(`/templates/${templateId}/reminder/`, params)
    .then((r) => r.data);

export const getReminder = (endpoint: VerdocsEndpoint, templateId: string, reminderId: string) =>
  endpoint.api //
    .get<IReminder>(`/templates/${templateId}/reminder/${reminderId}`)
    .then((r) => r.data);

export const editReminder = (endpoint: VerdocsEndpoint, templateId: string, reminderId: string) =>
  endpoint.api //
    .put<IReminder>(`/templates/${templateId}/reminder/${reminderId}`)
    .then((r) => r.data);

export const deleteReminder = (endpoint: VerdocsEndpoint, templateId: string, reminderId: string) =>
  endpoint.api //
    .delete(`/templates/${templateId}/reminder/${reminderId}`)
    .then((r) => r.data);
