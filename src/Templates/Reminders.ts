import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {IReminder, ITemplate} from '../Models';

export interface ICreateTemplateReminderRequest {
  setup_time: number;
  interval_time: number;
}

/**
 * Enable automatic reminders. setup_time is the number of days after the envelope is sent that the first reminder
 * should be sent. interval_time is the number of days between reminders.
 */
export const createTemplateReminder = (endpoint: VerdocsEndpoint, templateId: string, params: ICreateTemplateReminderRequest) =>
  endpoint.api //
    .post<ITemplate>(`/templates/${templateId}/reminder/`, params)
    .then((r) => r.data);

/**
 * Get the reminder configuration for a template.
 */
export const getTemplateReminder = (endpoint: VerdocsEndpoint, templateId: string, reminderId: string) =>
  endpoint.api //
    .get<IReminder>(`/templates/${templateId}/reminder/${reminderId}`)
    .then((r) => r.data);

/**
 * Update the reminder configuration for a template.
 */
export const updateTemplateReminder = (
  endpoint: VerdocsEndpoint,
  templateId: string,
  reminderId: string,
  params: ICreateTemplateReminderRequest,
) =>
  endpoint.api //
    .put<IReminder>(`/templates/${templateId}/reminder/${reminderId}`, params)
    .then((r) => r.data);

/**
 * Delete the reminder configuration for a template.
 */
export const deleteTemplateReminder = (endpoint: VerdocsEndpoint, templateId: string, reminderId: string) =>
  endpoint.api //
    .delete(`/templates/${templateId}/reminder/${reminderId}`)
    .then((r) => r.data);
