/**
 * An invitation represents an opportunity for a Member to join an Organization.
 *
 * @module
 */

import {getEndpoint} from '../HTTP/Transport';

export const getInvitations = (organizationId: string) =>
  getEndpoint()
    .api.get(`/organizations/${organizationId}/invitation`)
    .then((r) => r.data);

export const createInvitation = (organizationId: string, params: any) =>
  getEndpoint()
    .api.post(`/organizations/${organizationId}/invitation`, params)
    .then((r) => r.data);

export const deleteInvitation = (organizationId: string, email: string) =>
  getEndpoint()
    .api.delete(`/organizations/${organizationId}/invitation/${email}`)
    .then((r) => r.data);

export const updateInvitation = (organizationId: string, email: string, params: any) =>
  getEndpoint()
    .api.patch(`/organizations/${organizationId}/invitation/${email}`, params)
    .then((r) => r.data);

export const resendInvitation = (organizationId: string, email: string) =>
  getEndpoint()
    .api.post(`/organizations/${organizationId}/invitation/${email}/resend`)
    .then((r) => r.data);

export const claimInvitation = (organizationId: string, email: string, params: any) =>
  getEndpoint()
    .api.put(`/organizations/${organizationId}/invitation/${email}`, params)
    .then((r) => r.data);

export const claimNewUser = (organizationId: string, email: string, token: string) =>
  getEndpoint()
    .api.put(`/organizations/${organizationId}/invitation/${email}/token/${token}/new_user`)
    .then((r) => r.data);
