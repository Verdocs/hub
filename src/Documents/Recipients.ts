import {IInPersonAccessKey, TRecipientAction} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {IDocument, IRecipient} from './Types';

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

export interface ISignerTokenResponse {
  recipient: IRecipient;
  envelope: IDocument;
  signerToken: string;
  inPersonAccessKey: IInPersonAccessKey;
}

export const getSignerToken = (endpoint: VerdocsEndpoint, documentId: string, roleName: string) =>
  endpoint.api //
    .get<ISignerTokenResponse>(`/documents/${documentId}/recipients/${encodeURIComponent(roleName)}/signer-token`)
    .then((r) => r.data);

export const getInPersonLink = (endpoint: VerdocsEndpoint, documentId: string, roleName: string) =>
  endpoint.api //
    .get<ISignerTokenResponse>(`/documents/${documentId}/recipients/${encodeURIComponent(roleName)}?in_person_link=true`)
    .then((r) => r.data);
