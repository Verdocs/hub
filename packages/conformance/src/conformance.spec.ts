import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { IRole, ITemplate } from '@verdocs/js-sdk';
import {
  authenticate,
  createTemplate,
  createTemplateRole,
  deleteTemplate,
  deleteTemplateRole,
  getApiKeys,
  getBrand,
  getBrands,
  getCurrentProfile,
  getEntitlements,
  getEnvelope,
  getEnvelopes,
  getGroup,
  getGroups,
  getMyUser,
  getNotificationTemplate,
  getNotificationTemplates,
  getNotifications,
  getOrganization,
  getOrganizationChildren,
  getOrganizationContacts,
  getOrganizationInvitations,
  getOrganizationMembers,
  getOrganizationPipelineSettings,
  getOrganizationUsage,
  getProfiles,
  getTemplate,
  getTemplates,
  getWebhooks,
  updateTemplate,
  updateTemplateRole,
  VerdocsEndpoint,
} from '@verdocs/js-sdk';
import { curl, loadEnv, normalizeVolatile } from './support.js';

/**
 * Conformance baseline: each covered endpoint is called twice, once with raw
 * curl and once with the SDK, then status, shape, and data are compared with
 * volatile fields normalized. See platform/specs/sdk-restructure/SDKS.md.
 *
 * The read-only cases below are driven entirely by fixtures.json, the
 * contract this lane shares with the xunit and pytest lanes (sdks/csharp,
 * sdks/python): add a case there and every lane that reads the file picks it
 * up. Only callSdkForCase's dispatch table needs a new branch per case here,
 * mirroring sdks/python/tests/conformance/test_conformance.py's call_sdk.
 * Mutating flows (create, update, delete) intentionally aren't fixtures.json
 * cases (those stay read-only); they're the bespoke describe blocks below
 * the fixture loop instead.
 */

interface IConformanceCase {
  id: string;
  sdk: string;
  method: string;
  path: string;
  auth: boolean;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  note?: string;
}

const fixtures = JSON.parse(readFileSync(path.resolve(import.meta.dirname, '../fixtures.json'), 'utf8')) as {
  cases: IConformanceCase[];
};

const env = loadEnv();

const endpoint = new VerdocsEndpoint({ baseURL: env.apiBase, persist: false });
let token = '';
let organizationId = '';

beforeAll(async () => {
  const auth = await authenticate(endpoint, { username: env.email, password: env.password, grant_type: 'password' });
  token = auth.access_token;
  endpoint.setToken(token);

  organizationId = endpoint.session?.session_type === 'user' ? endpoint.session.organization_id : '';
  if (!organizationId) {
    throw new Error('The authenticated session carries no organization_id claim.');
  }
});

const resolvePath = (rawPath: string): string => rawPath.replace('$SESSION.organization_id', organizationId);

const ENV_PLACEHOLDERS: Record<string, () => string> = {
  $VERDOCS_TEST_EMAIL: () => env.email,
  $VERDOCS_TEST_PASSWORD: () => env.password,
};

/** Fills in $VERDOCS_* placeholders from fixture request bodies. */
const substituteEnv = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(substituteEnv);
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([ key, entry ]) => [ key, substituteEnv(entry) ]));
  }

  if (typeof value === 'string' && value.startsWith('$')) {
    const resolve = ENV_PLACEHOLDERS[value];
    if (!resolve) {
      throw new Error(`No substitution for fixture placeholder ${value}`);
    }

    return resolve();
  }

  return value;
};

const buildQuery = (query: Record<string, unknown> | undefined): string => {
  if (!query || Object.keys(query).length === 0) {
    return '';
  }

  const pairs = Object.entries(query).map(([ key, value ]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  return `?${pairs.join('&')}`;
};

const callRawForCase = (kase: IConformanceCase) =>
  curl(kase.method, `${env.apiBase}${resolvePath(kase.path)}${buildQuery(kase.query)}`, {
    token: kase.auth ? token : undefined,
    json: kase.body ? substituteEnv(kase.body) : undefined,
  });

/**
 * Maps each fixture case's "sdk" field -- an @sdkOperation id
 * (docs/sdk-docs-generation.md), not a bare js-sdk function name -- to the
 * actual typed SDK call. This is the one hand-written piece per case;
 * everything else (the raw call, the status check, and the comparison) is
 * generic and shared by every case.
 */
const callSdkForCase = async (kase: IConformanceCase): Promise<unknown> => {
  switch (kase.sdk) {
    case 'auth.authenticate':
      // A fresh endpoint proves authenticate needs no existing session.
      return authenticate(new VerdocsEndpoint({ baseURL: env.apiBase, persist: false }), {
        username: env.email,
        password: env.password,
        grant_type: 'password',
      });
    case 'auth.getMyUser':
      return getMyUser(endpoint);
    case 'profile.getCurrentProfile':
      return getCurrentProfile(endpoint);
    case 'profile.getProfiles':
      return getProfiles(endpoint);
    case 'notification.getNotifications':
      return getNotifications(endpoint);
    case 'template.getTemplates':
      return getTemplates(endpoint, kase.query as Parameters<typeof getTemplates>[1]);
    case 'envelope.getEnvelopes':
      return getEnvelopes(endpoint, kase.query as Parameters<typeof getEnvelopes>[1]);
    case 'organization.getOrganization':
      return getOrganization(endpoint, organizationId);
    case 'member.getOrganizationMembers':
      return getOrganizationMembers(endpoint);
    case 'group.getGroups':
      return getGroups(endpoint);
    case 'organization.getEntitlements':
      return getEntitlements(endpoint);
    case 'apiKey.getApiKeys':
      return getApiKeys(endpoint);
    case 'brand.getBrands':
      return getBrands(endpoint, organizationId);
    case 'contact.getOrganizationContacts':
      return getOrganizationContacts(endpoint);
    case 'invitation.getOrganizationInvitations':
      return getOrganizationInvitations(endpoint);
    case 'notification.getNotificationTemplates':
      return getNotificationTemplates(endpoint);
    case 'webhook.getWebhooks':
      return getWebhooks(endpoint);
    case 'organization.getOrganizationChildren':
      return getOrganizationChildren(endpoint, organizationId);
    case 'organization.getOrganizationPipelineSettings':
      return getOrganizationPipelineSettings(endpoint, organizationId);
    case 'organization.getOrganizationUsage':
      return getOrganizationUsage(endpoint, organizationId);
    default:
      throw new Error(`Conformance case '${kase.id}' has no SDK mapping; add one when the SDK grows the operation.`);
  }
};

describe('fixture cases', () => {
  it.each(fixtures.cases)('$id matches curl', async kase => {
    const viaCurl = await callRawForCase(kase);
    expect(viaCurl.status).toBe(200);

    const viaSdk = await callSdkForCase(kase);

    let reference: unknown = viaCurl.body;
    if (kase.id === 'profiles-current') {
      // The raw response is an array; the SDK returns the entry with
      // current=true, so that entry is the comparison target (fixture note).
      reference = (viaCurl.body as Array<{ current: boolean }>).find(profile => profile.current);
    }

    expect(normalizeVolatile(viaSdk)).toEqual(normalizeVolatile(reference));
  });
});

describe('template lifecycle (create, get, update, delete)', () => {
  // One junk template per run, deleted at the end. The create path posts plain
  // JSON when no File documents are attached, which is all conformance needs.
  it('matches curl at every step', async () => {
    const name = `Conformance ${Date.now()}`;

    const created = await createTemplate(endpoint, { name });
    expect(created.id).toBeTruthy();
    expect(created.name).toBe(name);

    try {
      const viaCurl = await curl('GET', `${env.apiBase}/v2/templates/${created.id}`, { token });
      const viaSdk = await getTemplate(endpoint, created.id);

      expect(viaCurl.status).toBe(200);
      expect(normalizeVolatile(viaSdk)).toEqual(normalizeVolatile(viaCurl.body));

      const renamed = await updateTemplate(endpoint, created.id, { name: `${name} renamed` });
      expect(renamed.name).toBe(`${name} renamed`);

      const viaCurlAfter = await curl('GET', `${env.apiBase}/v2/templates/${created.id}`, { token });
      expect((viaCurlAfter.body as ITemplate).name).toBe(`${name} renamed`);
    } finally {
      await deleteTemplate(endpoint, created.id);
    }

    // Deletion is visible to raw HTTP too
    const viaCurlDeleted = await curl('GET', `${env.apiBase}/v2/templates/${created.id}`, { token });
    expect(viaCurlDeleted.status).toBeGreaterThanOrEqual(400);
  });
});

describe('template roles lifecycle', () => {
  // The templates-group components drive these endpoints (TemplateRoles,
  // TemplateRoleProperties). Same one-junk-template pattern as above.
  it('creates, updates, and deletes a role with curl-matching reads', async () => {
    const template = await createTemplate(endpoint, { name: `Conformance roles ${Date.now()}` });

    try {
      const role: Partial<IRole> = { name: 'Signer 1', type: 'signer', sequence: 1, delegator: false };
      const created = await createTemplateRole(endpoint, template.id, role as IRole);
      expect(created.name).toBe('Signer 1');

      const updated = await updateTemplateRole(endpoint, template.id, 'Signer 1', { first_name: 'Paige' });
      expect(updated.first_name).toBe('Paige');

      // The role rides in the template detail; raw HTTP sees the same state
      const viaCurl = await curl('GET', `${env.apiBase}/v2/templates/${template.id}`, { token });
      const viaSdk = await getTemplate(endpoint, template.id);
      expect(normalizeVolatile(viaSdk)).toEqual(normalizeVolatile(viaCurl.body));

      await deleteTemplateRole(endpoint, template.id, 'Signer 1');
      const after = await getTemplate(endpoint, template.id);
      expect((after.roles || []).find(r => r.name === 'Signer 1')).toBeUndefined();
    } finally {
      await deleteTemplate(endpoint, template.id);
    }
  });
});

describe('envelope detail', () => {
  it('matches curl for envelope detail when one exists', async () => {
    const { envelopes } = await getEnvelopes(endpoint, { rows: 1, page: 0 });
    const envelope = envelopes?.[0];

    if (!envelope) {
      console.warn('No envelopes on the test account; detail check skipped.');
      return;
    }

    const viaCurl = await curl('GET', `${env.apiBase}/v2/envelopes/${envelope.id}`, { token });
    const viaSdk = await getEnvelope(endpoint, envelope.id);

    expect(viaCurl.status).toBe(200);
    expect(normalizeVolatile(viaSdk)).toEqual(normalizeVolatile(viaCurl.body));
  });
});

// The three checks below share envelope detail's shape: list, pick the first entry, fetch its
// detail both ways. None are fixtures.json cases because each depends on an id only a prior list
// call can produce; a test account with none of a given resource skips rather than fails.

describe('group detail', () => {
  it('matches curl for a group detail when one exists', async () => {
    const groups = await getGroups(endpoint);
    const group = groups?.[0];

    if (!group) {
      console.warn('No groups on the test account; group detail check skipped.');
      return;
    }

    const viaCurl = await curl('GET', `${env.apiBase}/v2/organization-groups/${group.id}`, { token });
    const viaSdk = await getGroup(endpoint, group.id);

    expect(viaCurl.status).toBe(200);
    expect(normalizeVolatile(viaSdk)).toEqual(normalizeVolatile(viaCurl.body));
  });
});

describe('brand detail', () => {
  it('matches curl for a brand detail when one exists', async () => {
    const brands = await getBrands(endpoint, organizationId);
    const brand = brands?.[0];

    if (!brand) {
      console.warn('No brands on the test account; brand detail check skipped.');
      return;
    }

    const viaCurl = await curl('GET', `${env.apiBase}/v2/organizations/${organizationId}/brands/${brand.id}`, { token });
    const viaSdk = await getBrand(endpoint, organizationId, brand.id);

    expect(viaCurl.status).toBe(200);
    expect(normalizeVolatile(viaSdk)).toEqual(normalizeVolatile(viaCurl.body));
  });
});

describe('notification template detail', () => {
  it('matches curl for a notification template detail when one exists', async () => {
    const templates = await getNotificationTemplates(endpoint);
    const template = templates?.[0];

    if (!template) {
      console.warn('No notification templates on the test account; detail check skipped.');
      return;
    }

    const viaCurl = await curl('GET', `${env.apiBase}/v2/notifications/templates/${template.id}`, { token });
    const viaSdk = await getNotificationTemplate(endpoint, template.id);

    expect(viaCurl.status).toBe(200);
    expect(normalizeVolatile(viaSdk)).toEqual(normalizeVolatile(viaCurl.body));
  });
});

// Frozen in fixtures.json (template-star-toggle): server-broken for every client.
// Opt in with VERDOCS_STAR_TOGGLE=1 when debugging curl/SDK equivalence after an API fix.
describe.skipIf(process.env.VERDOCS_STAR_TOGGLE !== '1')('star toggle (frozen; set VERDOCS_STAR_TOGGLE=1)', () => {
  const toggleTemplateStarCompat = (templateId: string) =>
    endpoint.api
      .get<ITemplate>(`/v2/templates/${templateId}/star`)
      .then(r => ({ status: r.status, body: r.data as unknown }))
      .catch((e: { response?: { status: number; data: unknown } }) => {
        if (!e.response) {
          throw e;
        }

        return { status: e.response.status, body: e.response.data };
      });

  it('behaves identically to curl, and a toggle pair nets out to the original state', async () => {
    const { templates } = await getTemplates(endpoint, { rows: 1, page: 0 });
    const template = templates[0];

    if (!template) {
      throw new Error('The test account has no templates; seed one on beta before running the star toggle check.');
    }

    const initialStars = template.star_counter;
    const viaCurl = await curl('GET', `${env.apiBase}/v2/templates/${template.id}/star`, { token });
    const viaSdk = await toggleTemplateStarCompat(template.id);

    expect(viaSdk.status).toBe(viaCurl.status);
    expect(normalizeVolatile(viaSdk.body, [ 'star_counter', 'is_starred' ])).toEqual(normalizeVolatile(viaCurl.body, [ 'star_counter', 'is_starred' ]));

    const { templates: after } = await getTemplates(endpoint, { rows: 1, page: 0 });
    expect(after[0]?.star_counter).toBe(initialStars);
  });
});
