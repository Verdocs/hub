import MockAdapter from 'axios-mock-adapter';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {
  acceptClickwrap,
  createClickwrapAgreement,
  createClickwrapDraft,
  createClickwrapSession,
  declineClickwrap,
  deleteClickwrapDraft,
  getClickwrapAcceptance,
  getClickwrapAcceptances,
  getClickwrapAgreement,
  getClickwrapAgreements,
  getClickwrapCoverage,
  getClickwrapDownloadLink,
  getClickwrapSession,
  getClickwrapStatus,
  publishClickwrapVersion,
  recordClickwrapOutcome,
  renameClickwrapAgreement,
  sendClickwrapEvent,
  updateClickwrapDraft,
} from '../../Clickwrap';
import {VerdocsEndpoint} from '../../VerdocsEndpoint';

const endpoint = VerdocsEndpoint.getDefault();
const TOKEN = 'vd_cw_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG';

let mock: MockAdapter;

beforeEach(() => {
  mock = new MockAdapter(endpoint.api);
});

afterEach(() => {
  mock.restore();
});

// The body of the nth POST axios actually sent, parsed back from JSON
const sentBody = (index = 0) => JSON.parse(mock.history.post![index]!.data);

describe('agreements', () => {
  it('lists agreements, unwrapping the response', async () => {
    mock.onGet('/v2/clickwraps/agreements').reply(200, {agreements: [{id: 'a_1', key: 'tos'}]});

    expect(await getClickwrapAgreements(endpoint)).toEqual([{id: 'a_1', key: 'tos'}]);
  });

  it('gets, creates, and renames one agreement', async () => {
    mock.onGet('/v2/clickwraps/agreements/a_1').reply(200, {agreement: {id: 'a_1', versions: []}});
    mock.onPost('/v2/clickwraps/agreements', {key: 'tos', name: 'Terms'}).reply(201, {agreement: {id: 'a_1', key: 'tos'}});
    mock.onPatch('/v2/clickwraps/agreements/a_1', {name: 'Terms of Use'}).reply(200, {agreement: {id: 'a_1', name: 'Terms of Use'}});

    expect(await getClickwrapAgreement(endpoint, 'a_1')).toEqual({id: 'a_1', versions: []});
    expect(await createClickwrapAgreement(endpoint, {key: 'tos', name: 'Terms'})).toEqual({id: 'a_1', key: 'tos'});
    expect(await renameClickwrapAgreement(endpoint, 'a_1', 'Terms of Use')).toEqual({id: 'a_1', name: 'Terms of Use'});
  });

  it('creates, edits, publishes, and deletes drafts', async () => {
    mock.onPost('/v2/clickwraps/agreements/a_1/versions').reply(201, {version: {id: 'v_1', status: 'draft'}});
    mock.onPatch('/v2/clickwraps/versions/v_1', {content: '<p>Be nice.</p>'}).reply(200, {version: {id: 'v_1', content: '<p>Be nice.</p>'}});
    mock.onPost('/v2/clickwraps/versions/v_1/publish', {requires_reacceptance: true}).reply(200, {version: {id: 'v_1', status: 'published'}});
    mock.onDelete('/v2/clickwraps/versions/v_2').reply(204);

    expect(await createClickwrapDraft(endpoint, 'a_1', {copy_current: true})).toEqual({id: 'v_1', status: 'draft'});
    expect(sentBody()).toEqual({copy_current: true});
    expect(await updateClickwrapDraft(endpoint, 'v_1', '<p>Be nice.</p>')).toEqual({id: 'v_1', content: '<p>Be nice.</p>'});
    expect(await publishClickwrapVersion(endpoint, 'v_1', {requires_reacceptance: true})).toEqual({id: 'v_1', status: 'published'});
    expect(await deleteClickwrapDraft(endpoint, 'v_2')).toBeUndefined();
  });

  it('starts an empty draft when given no fields', async () => {
    mock.onPost('/v2/clickwraps/agreements/a_1/versions').reply(201, {version: {id: 'v_1'}});

    await createClickwrapDraft(endpoint, 'a_1');

    expect(sentBody()).toEqual({});
  });

  it('gets coverage as the api returns it', async () => {
    const coverage = {agreement_id: 'a_1', cutoff_number: 2, accepted_any: 10, current: 7, versions: []};
    mock.onGet('/v2/clickwraps/agreements/a_1/coverage').reply(200, coverage);

    expect(await getClickwrapCoverage(endpoint, 'a_1')).toEqual(coverage);
  });
});

describe('acceptances', () => {
  it('sends status keys as one comma-separated query value', async () => {
    mock.onGet('/v2/clickwraps/status', {params: {user_id: 'user-1', agreements: 'tos,privacy'}}).reply(200, [{key: 'tos', current: true, pending_version: null}]);

    expect(await getClickwrapStatus(endpoint, 'user-1', ['tos', 'privacy'])).toEqual([{key: 'tos', current: true, pending_version: null}]);
  });

  it('returns either kind of session answer as is', async () => {
    mock.onPost('/v2/clickwraps/session').replyOnce(200, {current: true, agreements: []}).onPost('/v2/clickwraps/session').replyOnce(201, {current: false, token: TOKEN});

    const params = {user_id: 'user-1', agreements: ['tos']};
    expect(await createClickwrapSession(endpoint, params)).toEqual({current: true, agreements: []});
    expect(await createClickwrapSession(endpoint, params)).toEqual({current: false, token: TOKEN});
    expect(sentBody()).toEqual(params);
  });

  it('records a headless outcome', async () => {
    const params = {user_id: 'user-1', outcome: 'accepted' as const, agreements: [{key: 'tos', version_id: 'v_1'}], ip_address: '203.0.113.7'};
    mock.onPost('/v2/clickwraps/acceptances').reply(201, {acceptance_id: 'r_1', outcome: 'accepted', created_at: '2026-11-12T00:00:00.000Z'});

    expect(await recordClickwrapOutcome(endpoint, params)).toEqual({acceptance_id: 'r_1', outcome: 'accepted', created_at: '2026-11-12T00:00:00.000Z'});
    expect(sentBody()).toEqual(params);
  });

  it('searches records with its filters as query params', async () => {
    const page = {count: 0, rows: 10, page: 0, acceptances: []};
    mock.onGet('/v2/clickwraps/acceptances', {params: {metadata_key: 'email', metadata_value: 'pat@example.com', rows: 10}}).reply(200, page);

    expect(await getClickwrapAcceptances(endpoint, {metadata_key: 'email', metadata_value: 'pat@example.com', rows: 10})).toEqual(page);
  });

  it('gets one record and a download link for it', async () => {
    mock.onGet('/v2/clickwraps/acceptances/r_1').reply(200, {id: 'r_1', has_presentation: true});
    mock.onGet('/v2/clickwraps/acceptances/r_1/download', {params: {type: 'evidence'}}).reply(200, {type: 'evidence', url: 'https://s3.test/e.zip', expires_in: 900});

    expect(await getClickwrapAcceptance(endpoint, 'r_1')).toEqual({id: 'r_1', has_presentation: true});
    expect(await getClickwrapDownloadLink(endpoint, 'r_1', 'evidence')).toEqual({type: 'evidence', url: 'https://s3.test/e.zip', expires_in: 900});
  });
});

describe('sessions', () => {
  const outcome = {surface: 'component' as const, labels: {agreements: [{version_id: 'v_1', label: 'I agree'}], button: 'Continue'}, presentation: '<p>tos</p>'};

  it('sends the session token on each session call', async () => {
    mock.onGet('/v2/clickwraps/session').reply(200, {id: 's_1', agreements: []});
    mock.onPost('/v2/clickwraps/session/events').reply(204);
    mock.onPost('/v2/clickwraps/session/accept').reply(201, {acceptance_id: 'r_1', outcome: 'accepted'});
    mock.onPost('/v2/clickwraps/session/decline').reply(201, {acceptance_id: 'r_2', outcome: 'declined'});

    expect(await getClickwrapSession(endpoint, TOKEN)).toEqual({id: 's_1', agreements: []});
    expect(await sendClickwrapEvent(endpoint, TOKEN, {event: 'checked', version_id: 'v_1'})).toBeUndefined();
    expect(await acceptClickwrap(endpoint, TOKEN, outcome)).toEqual({acceptance_id: 'r_1', outcome: 'accepted'});
    expect(await declineClickwrap(endpoint, TOKEN, outcome)).toEqual({acceptance_id: 'r_2', outcome: 'declined'});

    const sent = [...mock.history.get!, ...mock.history.post!];
    expect(sent.map((request) => request.headers?.Authorization)).toEqual(Array(4).fill(`Bearer ${TOKEN}`));
    expect(sentBody(0)).toEqual({event: 'checked', version_id: 'v_1'});
    expect(sentBody(1)).toEqual(outcome);
  });

  it("leaves the endpoint's own authorization alone", async () => {
    const before = endpoint.api.defaults.headers.common.Authorization;
    mock.onGet('/v2/clickwraps/session').reply(200, {});
    mock.onGet('/v2/clickwraps/agreements').reply(200, {agreements: []});

    await getClickwrapSession(endpoint, TOKEN);
    await getClickwrapAgreements(endpoint);

    expect(endpoint.api.defaults.headers.common.Authorization).toBe(before);
    expect(mock.history.get![1]!.headers?.Authorization).not.toBe(`Bearer ${TOKEN}`);
  });
});
