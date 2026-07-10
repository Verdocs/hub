import type { ITemplate, VerdocsEndpoint } from '@verdocs/js-sdk';

/**
 * js-sdk 6.10.0's toggleTemplateStar posts to /v2/templates/:id/stars/toggle,
 * a route the current API does not serve (the conformance suite caught the
 * drift). The deployed route is GET /v2/templates/:id/star, so call that
 * directly until js-sdk catches up, then delete this file. Note the deployed
 * handler currently 400s due to a server-side validation bug (see
 * hub/STATUS.md), so this works end to end only once the API fix ships.
 */
export const toggleTemplateStar = (endpoint: VerdocsEndpoint, templateId: string): Promise<ITemplate> =>
  endpoint.api.get<ITemplate>(`/v2/templates/${templateId}/star`).then(r => r.data);
