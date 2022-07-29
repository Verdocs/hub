import {IRecipient} from './Documents';
import {VerdocsEndpoint} from '../VerdocsEndpoint';

export type TRecipientAction = 'submit' | 'decline' | 'prepare' | 'update';

export interface IUpdateRecipientParams {
  new_full_name?: string;
  agreed?: boolean;
}

/**
 * Update a recipient's status block
 */
export const updateRecipientStatus = async (
  endpoint: VerdocsEndpoint,
  documentId: string,
  roleName: string,
  action: TRecipientAction,
  params?: IUpdateRecipientParams,
): Promise<IRecipient> =>
  endpoint.api //
    .put<IRecipient>(`/documents/${documentId}/recipients/${roleName}`, {
      role_name: roleName,
      action,
      ...(params || {}),
    })
    .then((r) => r.data);
