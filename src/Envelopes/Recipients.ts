import {IInPersonAccessKey, TRecipientAction} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {IEnvelope, IRecipient} from './Types';

export interface IUpdateRecipientParams {
  new_full_name?: string;
  agreed?: boolean;
}

/**
 * Update a recipient's status block
 */
export const updateRecipientStatus = async (
  endpoint: VerdocsEndpoint,
  envelopeId: string,
  roleName: string,
  action: TRecipientAction,
  params?: IUpdateRecipientParams,
): Promise<IRecipient> =>
  endpoint.api //
    .put<IRecipient>(`/envelopes/${envelopeId}/recipients/${roleName}`, {
      role_name: roleName,
      action,
      ...(params || {}),
    })
    .then((r) => r.data);

export interface ISignerTokenResponse {
  recipient: IRecipient;
  envelope: IEnvelope;
  signerToken: string;
  inPersonAccessKey: IInPersonAccessKey;
}

export const getSignerToken = (endpoint: VerdocsEndpoint, envelopeId: string, roleName: string) =>
  endpoint.api //
    .get<ISignerTokenResponse>(`/envelopes/${envelopeId}/recipients/${encodeURIComponent(roleName)}/signer-token`)
    .then((r) => r.data);

export const getInPersonLink = (endpoint: VerdocsEndpoint, envelopeId: string, roleName: string) =>
  endpoint.api //
    .get<ISignerTokenResponse>(`/envelopes/${envelopeId}/recipients/${encodeURIComponent(roleName)}?in_person_link=true`)
    .then((r) => r.data);
