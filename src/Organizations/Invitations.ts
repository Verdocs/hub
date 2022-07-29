import {VerdocsEndpoint} from '../VerdocsEndpoint';

/**
 * An invitation represents an opportunity for a Member to join an Organization.
 *
 * @module
 */

export const getInvitations = (endpoint: VerdocsEndpoint, organizationId: string) =>
  endpoint.api //
    .get(`/organizations/${organizationId}/invitation`)
    .then((r) => r.data);

export const createInvitation = (endpoint: VerdocsEndpoint, organizationId: string, params: any) =>
  endpoint.api //
    .post(`/organizations/${organizationId}/invitation`, params)
    .then((r) => r.data);

export const deleteInvitation = (endpoint: VerdocsEndpoint, organizationId: string, email: string) =>
  endpoint.api //
    .delete(`/organizations/${organizationId}/invitation/${email}`)
    .then((r) => r.data);

export const updateInvitation = (endpoint: VerdocsEndpoint, organizationId: string, email: string, params: any) =>
  endpoint.api //
    .patch(`/organizations/${organizationId}/invitation/${email}`, params)
    .then((r) => r.data);

export const resendInvitation = (endpoint: VerdocsEndpoint, organizationId: string, email: string) =>
  endpoint.api //
    .post(`/organizations/${organizationId}/invitation/${email}/resend`)
    .then((r) => r.data);

export const claimInvitation = (endpoint: VerdocsEndpoint, organizationId: string, email: string, params: any) =>
  endpoint.api //
    .put(`/organizations/${organizationId}/invitation/${email}`, params)
    .then((r) => r.data);

export const claimNewUser = (endpoint: VerdocsEndpoint, organizationId: string, email: string, token: string) =>
  endpoint.api //
    .put(`/organizations/${organizationId}/invitation/${email}/token/${token}/new_user`)
    .then((r) => r.data);
