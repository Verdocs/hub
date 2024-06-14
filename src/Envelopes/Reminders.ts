import {ICreateEnvelopeReminderRequest} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {IReminder} from '../Models';

/**
 * Enable automatic reminders. setup_time is the number of days after the envelope is sent that the first reminder
 * should be sent. interval_time is the number of days between reminders.
 */
export const createReminder = (endpoint: VerdocsEndpoint, envelopeId: string, params: ICreateEnvelopeReminderRequest) =>
  endpoint.api //
    .post<IReminder>(`/envelopes/${envelopeId}/reminder/`, params)
    .then((r) => r.data);

/**
 * Get the reminder configuration for an envelope.
 */
export const getReminder = (endpoint: VerdocsEndpoint, envelopeId: string, reminderId: string) =>
  endpoint.api //
    .get<IReminder>(`/envelopes/${envelopeId}/reminder/${reminderId}`)
    .then((r) => r.data);

/**
 * Update the reminder configuration for an envelope.
 */
export const updateReminder = (endpoint: VerdocsEndpoint, envelopeId: string, reminderId: string, params: ICreateEnvelopeReminderRequest) =>
  endpoint.api //
    .put<IReminder>(`/envelopes/${envelopeId}/reminder/${reminderId}`, params)
    .then((r) => r.data);

/**
 * Delete the reminder configuration for an envelope.
 */
export const deleteReminder = (endpoint: VerdocsEndpoint, envelopeId: string, reminderId: string) =>
  endpoint.api //
    .delete(`/envelopes/${envelopeId}/reminder/${reminderId}`)
    .then((r) => r.data);
