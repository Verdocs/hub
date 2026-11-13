import {
  IClickwrapAgreement,
  IClickwrapAgreementDetail,
  IClickwrapAgreementSummary,
  IClickwrapCoverage,
  IClickwrapVersion,
  ICreateClickwrapAgreementRequest,
  ICreateClickwrapDraftRequest,
  IPublishClickwrapVersionRequest,
} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';

/**
 * Get the organization's clickwrap agreements, each with its current (latest published) version and its open draft.
 * Requires an admin profile and the clickwrap entitlement.
 *
 * ```typescript
 * import {getClickwrapAgreements} from '@verdocs/js-sdk';
 *
 * const agreements = await getClickwrapAgreements(VerdocsEndpoint.getDefault());
 * ```
 *
 * @group Clickwrap
 * @api GET /v2/clickwraps/agreements List clickwrap agreements
 * @apiSuccess array(items: IClickwrapAgreementSummary) . The organization's agreements, oldest first
 *
 * @sdkOperation clickwrap.getClickwrapAgreements
 * @sdkGroup Clickwrap
 * @sdkPage Endpoints
 */
export const getClickwrapAgreements = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<{agreements: IClickwrapAgreementSummary[]}>('/v2/clickwraps/agreements')
    .then((r) => r.data.agreements);

/**
 * Get one clickwrap agreement with every version, newest first, including each version's text.
 *
 * ```typescript
 * import {getClickwrapAgreement} from '@verdocs/js-sdk';
 *
 * const {versions} = await getClickwrapAgreement(VerdocsEndpoint.getDefault(), agreementId);
 * ```
 *
 * @group Clickwrap
 * @api GET /v2/clickwraps/agreements/:agreement_id Get a clickwrap agreement
 * @apiParam string(format:uuid) agreement_id The agreement to get
 * @apiSuccess IClickwrapAgreementDetail . The agreement with its versions
 *
 * @sdkOperation clickwrap.getClickwrapAgreement
 * @sdkGroup Clickwrap
 * @sdkPage Endpoints
 */
export const getClickwrapAgreement = (endpoint: VerdocsEndpoint, agreementId: string) =>
  endpoint.api //
    .get<{agreement: IClickwrapAgreementDetail}>(`/v2/clickwraps/agreements/${agreementId}`)
    .then((r) => r.data.agreement);

/**
 * Create a clickwrap agreement. It starts with no versions: add one with createClickwrapDraft, then publish it. The
 * key can never change, because developers put it in their code.
 *
 * ```typescript
 * import {createClickwrapAgreement} from '@verdocs/js-sdk';
 *
 * const agreement = await createClickwrapAgreement(VerdocsEndpoint.getDefault(), {key: 'terms-of-service', name: 'Terms of Service'});
 * ```
 *
 * @group Clickwrap
 * @api POST /v2/clickwraps/agreements Create a clickwrap agreement
 * @apiBody string key Unique in the organization: lowercase letters and digits separated by single hyphens, such as "terms-of-service"
 * @apiBody string name What admins see, such as "Terms of Service"
 * @apiSuccess IClickwrapAgreement . The new agreement
 *
 * @sdkOperation clickwrap.createClickwrapAgreement
 * @sdkGroup Clickwrap
 * @sdkPage Endpoints
 */
export const createClickwrapAgreement = (endpoint: VerdocsEndpoint, params: ICreateClickwrapAgreementRequest) =>
  endpoint.api //
    .post<{agreement: IClickwrapAgreement}>('/v2/clickwraps/agreements', params)
    .then((r) => r.data.agreement);

/**
 * Change a clickwrap agreement's name. Its key never changes.
 *
 * ```typescript
 * import {renameClickwrapAgreement} from '@verdocs/js-sdk';
 *
 * await renameClickwrapAgreement(VerdocsEndpoint.getDefault(), agreementId, 'Terms of Use');
 * ```
 *
 * @group Clickwrap
 * @api PATCH /v2/clickwraps/agreements/:agreement_id Rename a clickwrap agreement
 * @apiParam string(format:uuid) agreement_id The agreement to rename
 * @apiBody string name The new name
 * @apiSuccess IClickwrapAgreement . The renamed agreement
 *
 * @sdkOperation clickwrap.renameClickwrapAgreement
 * @sdkGroup Clickwrap
 * @sdkPage Endpoints
 */
export const renameClickwrapAgreement = (endpoint: VerdocsEndpoint, agreementId: string, name: string) =>
  endpoint.api //
    .patch<{agreement: IClickwrapAgreement}>(`/v2/clickwraps/agreements/${agreementId}`, {name})
    .then((r) => r.data.agreement);

/**
 * Start a new draft version of an agreement: empty, with the given text, or copied from the current version. An
 * agreement has at most one draft, and nobody sees it until it's published.
 *
 * ```typescript
 * import {createClickwrapDraft} from '@verdocs/js-sdk';
 *
 * const draft = await createClickwrapDraft(VerdocsEndpoint.getDefault(), agreementId, {copy_current: true});
 * ```
 *
 * @group Clickwrap
 * @api POST /v2/clickwraps/agreements/:agreement_id/versions Create a draft version
 * @apiParam string(format:uuid) agreement_id The agreement to add the draft to
 * @apiBody string content? The agreement text as HTML. Only headings, paragraphs, lists, links, bold, italic, underline, and line breaks are kept.
 * @apiBody boolean copy_current? Start from the current version's text instead of content
 * @apiSuccess IClickwrapVersion . The new draft
 *
 * @sdkOperation clickwrap.createClickwrapDraft
 * @sdkGroup Clickwrap
 * @sdkPage Endpoints
 */
export const createClickwrapDraft = (endpoint: VerdocsEndpoint, agreementId: string, params: ICreateClickwrapDraftRequest = {}) =>
  endpoint.api //
    .post<{version: IClickwrapVersion}>(`/v2/clickwraps/agreements/${agreementId}/versions`, params)
    .then((r) => r.data.version);

/**
 * Replace a draft's text. Only drafts can be edited; published versions never change.
 *
 * ```typescript
 * import {updateClickwrapDraft} from '@verdocs/js-sdk';
 *
 * await updateClickwrapDraft(VerdocsEndpoint.getDefault(), versionId, '<p>Be nice.</p>');
 * ```
 *
 * @group Clickwrap
 * @api PATCH /v2/clickwraps/versions/:version_id Update a draft version
 * @apiParam string(format:uuid) version_id The draft to edit
 * @apiBody string content The agreement text as HTML, sanitized on save
 * @apiSuccess IClickwrapVersion . The updated draft
 *
 * @sdkOperation clickwrap.updateClickwrapDraft
 * @sdkGroup Clickwrap
 * @sdkPage Endpoints
 */
export const updateClickwrapDraft = (endpoint: VerdocsEndpoint, versionId: string, content: string) =>
  endpoint.api //
    .patch<{version: IClickwrapVersion}>(`/v2/clickwraps/versions/${versionId}`, {content})
    .then((r) => r.data.version);

/**
 * Delete a draft version, which frees its number for the next draft. Published versions can never be deleted.
 *
 * ```typescript
 * import {deleteClickwrapDraft} from '@verdocs/js-sdk';
 *
 * await deleteClickwrapDraft(VerdocsEndpoint.getDefault(), versionId);
 * ```
 *
 * @group Clickwrap
 * @api DELETE /v2/clickwraps/versions/:version_id Delete a draft version
 * @apiParam string(format:uuid) version_id The draft to delete
 * @apiSuccess string . No content
 *
 * @sdkOperation clickwrap.deleteClickwrapDraft
 * @sdkGroup Clickwrap
 * @sdkPage Endpoints
 */
export const deleteClickwrapDraft = (endpoint: VerdocsEndpoint, versionId: string) =>
  endpoint.api //
    .delete(`/v2/clickwraps/versions/${versionId}`)
    .then(() => undefined);

/**
 * Publish a draft. This can't be undone: the version's text is hashed and frozen, and it becomes what people are shown.
 * With requires_reacceptance, everyone who accepted an earlier version must accept again.
 *
 * ```typescript
 * import {publishClickwrapVersion} from '@verdocs/js-sdk';
 *
 * await publishClickwrapVersion(VerdocsEndpoint.getDefault(), versionId, {requires_reacceptance: true, change_summary: 'New arbitration terms'});
 * ```
 *
 * @group Clickwrap
 * @api POST /v2/clickwraps/versions/:version_id/publish Publish a draft version
 * @apiParam string(format:uuid) version_id The draft to publish
 * @apiBody boolean requires_reacceptance Whether everyone must accept this version again
 * @apiBody string change_summary? What changed, kept with the version
 * @apiSuccess IClickwrapVersion . The published version
 *
 * @sdkOperation clickwrap.publishClickwrapVersion
 * @sdkGroup Clickwrap
 * @sdkPage Endpoints
 */
export const publishClickwrapVersion = (endpoint: VerdocsEndpoint, versionId: string, params: IPublishClickwrapVersionRequest) =>
  endpoint.api //
    .post<{version: IClickwrapVersion}>(`/v2/clickwraps/versions/${versionId}/publish`, params)
    .then((r) => r.data.version);

/**
 * Get how many people have accepted an agreement: everyone who accepted any version, how many are current, and the
 * count for each published version. Counts distinct people, not clicks.
 *
 * ```typescript
 * import {getClickwrapCoverage} from '@verdocs/js-sdk';
 *
 * const {accepted_any, current} = await getClickwrapCoverage(VerdocsEndpoint.getDefault(), agreementId);
 * ```
 *
 * @group Clickwrap
 * @api GET /v2/clickwraps/agreements/:agreement_id/coverage Get clickwrap coverage
 * @apiParam string(format:uuid) agreement_id The agreement to count
 * @apiSuccess IClickwrapCoverage . The counts
 *
 * @sdkOperation clickwrap.getClickwrapCoverage
 * @sdkGroup Clickwrap
 * @sdkPage Endpoints
 */
export const getClickwrapCoverage = (endpoint: VerdocsEndpoint, agreementId: string) =>
  endpoint.api //
    .get<IClickwrapCoverage>(`/v2/clickwraps/agreements/${agreementId}/coverage`)
    .then((r) => r.data);
