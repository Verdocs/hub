// this.router.put('/organizations/:organization_id/invitation/:email/token/:token', this.claim);
// this.router.put('/organizations/:organization_id/invitation/:email/token/:token/new_user', this.claimNewUser);
import {Endpoint, StandardDataReponse} from './Endpoint';

export const getOrgInvitations = (organizationId: string) =>
  Endpoint.get(`/organizations/${organizationId}/invitation`).then(StandardDataReponse);

export const createOrgInvitation = (organizationId: string, params: any) =>
  Endpoint.post(`/organizations/${organizationId}/invitation`, params).then(StandardDataReponse);

export const deleteOrgInvitation = (organizationId: string, email: string) =>
  Endpoint.delete(`/organizations/${organizationId}/invitation/${email}`).then(StandardDataReponse);

export const updateOrgInvitation = (organizationId: string, email: string, params: any) =>
  Endpoint.patch(`/organizations/${organizationId}/invitation/${email}`, params).then(StandardDataReponse);

export const resendOrgInvitation = (organizationId: string, email: string) =>
  Endpoint.post(`/organizations/${organizationId}/invitation/${email}/resend`).then(StandardDataReponse);

export const claimOrgInvitation = (organizationId: string, email: string, params: any) =>
  Endpoint.put(`/organizations/${organizationId}/invitation/${email}`, params).then(StandardDataReponse);

export const claimNewUser = (organizationId: string, email: string, token: string) =>
  Endpoint.put(`/organizations/${organizationId}/invitation/${email}/token/${token}/new_user`).then(
    StandardDataReponse,
  );
