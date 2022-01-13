import {getEndpoint} from '../HTTP/Transport';
import {IRecipient} from './Documents';

export type TRecipientAction = 'submit' | 'decline' | 'prepare' | 'update';

export interface IUpdateRecipientParams {
  new_full_name?: string;
  agreed?: boolean;
}

export const updateRecipientStatus = async (
  documentId: string,
  roleName: string,
  action: TRecipientAction,
  params?: IUpdateRecipientParams,
): Promise<IRecipient> =>
  getEndpoint()
    .api.put<IRecipient>(`/documents/${documentId}/recipients/${roleName}`, {
      role_name: roleName,
      action,
      ...(params || {}),
    })
    .then((r) => r.data);
