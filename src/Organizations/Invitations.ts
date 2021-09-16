import {Endpoint} from '../HTTP/Transport';

export const getInvitations = (organizationId: string) =>
  Endpoint.get(`/organizations/${organizationId}/invitation`).then((r) => r.data);

export const createInvitation = (organizationId: string, params: any) =>
  Endpoint.post(`/organizations/${organizationId}/invitation`, params).then((r) => r.data);

export const deleteInvitation = (organizationId: string, email: string) =>
  Endpoint.delete(`/organizations/${organizationId}/invitation/${email}`).then((r) => r.data);

export const updateInvitation = (organizationId: string, email: string, params: any) =>
  Endpoint.patch(`/organizations/${organizationId}/invitation/${email}`, params).then((r) => r.data);

export const resendInvitation = (organizationId: string, email: string) =>
  Endpoint.post(`/organizations/${organizationId}/invitation/${email}/resend`).then((r) => r.data);

export const claimInvitation = (organizationId: string, email: string, params: any) =>
  Endpoint.put(`/organizations/${organizationId}/invitation/${email}`, params).then((r) => r.data);

export const claimNewUser = (organizationId: string, email: string, token: string) =>
  Endpoint.put(`/organizations/${organizationId}/invitation/${email}/token/${token}/new_user`).then((r) => r.data);
