import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {IReminder, ITemplate} from './Types';

export interface ICreateTemplateReminderRequest {
  setup_time: number;
  interval_time: number;
}

export const createReminder = (endpoint: VerdocsEndpoint, templateId: string, params: ICreateTemplateReminderRequest) =>
  endpoint.api //
    .post<ITemplate>(`/templates/${templateId}/reminder/`, params)
    .then((r) => r.data);

export const getReminder = (endpoint: VerdocsEndpoint, templateId: string, reminderId: string) =>
  endpoint.api //
    .get<IReminder>(`/templates/${templateId}/reminder/${reminderId}`)
    .then((r) => r.data);

export const updateReminder = (endpoint: VerdocsEndpoint, templateId: string, reminderId: string, params: ICreateTemplateReminderRequest) =>
  endpoint.api //
    .put<IReminder>(`/templates/${templateId}/reminder/${reminderId}`, params)
    .then((r) => r.data);

export const deleteReminder = (endpoint: VerdocsEndpoint, templateId: string, reminderId: string) =>
  endpoint.api //
    .delete(`/templates/${templateId}/reminder/${reminderId}`)
    .then((r) => r.data);
