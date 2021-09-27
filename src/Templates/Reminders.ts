import {Endpoint} from '../HTTP/Transport';
import {IReminder, ITemplate} from "./Types";

export const createReminder = (templateId: string, params: any) =>
  Endpoint.post<ITemplate>(`/templates/${templateId}/reminder/`, params).then((r) => r.data);

export const getReminder = (templateId: string, reminderId: string) =>
  Endpoint.get<IReminder>(`/templates/${templateId}/reminder/${reminderId}`).then((r) => r.data);

export const editReminder = (templateId: string, reminderId: string) =>
  Endpoint.put<IReminder>(`/templates/${templateId}/reminder/${reminderId}`).then((r) => r.data);

export const deleteReminder = (templateId: string, reminderId: string) =>
  Endpoint.delete(`/templates/${templateId}/reminder/${reminderId}`).then((r) => r.data);
