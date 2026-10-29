import MockAdapter from 'axios-mock-adapter';
import {
  applyDataCatalogUpdate,
  createDataCatalog,
  deleteDataCatalogEntry,
  getDataCatalogListing,
  getDataCatalogMarketplace,
  getDataCatalogs,
  saveDataCatalogEntries,
  updateDataCatalogEntry,
} from '../../Organizations';
import {VerdocsEndpoint} from '../../VerdocsEndpoint';

const endpoint = VerdocsEndpoint.getDefault();
const base = '/v2/organizations/org_1/data-catalogs';
const entry = {key: 'applicant.full_name', label: 'Applicant name', type: 'text' as const};

it('getDataCatalogs and createDataCatalog should address the organization', async () => {
  const mock = new MockAdapter(endpoint.api);
  mock.onGet(base).reply(200, [{id: 'cat_1'}]);
  mock.onPost(base, {name: 'Applicants'}).reply(200, {id: 'cat_1', name: 'Applicants'});

  expect(await getDataCatalogs(endpoint, 'org_1')).toEqual([{id: 'cat_1'}]);
  expect((await createDataCatalog(endpoint, 'org_1', {name: 'Applicants'})).id).toBe('cat_1');
});

it('entry functions should address the catalog and key', async () => {
  const mock = new MockAdapter(endpoint.api);
  mock.onPost(`${base}/cat_1/entries`, {entries: [entry]}).reply(200, [{...entry, status: 'active'}]);
  mock.onPatch(`${base}/cat_1/entries/applicant.full_name`, {status: 'active'}).reply(200, {...entry, status: 'active'});
  mock.onDelete(`${base}/cat_1/entries/applicant.full_name`).reply(200, {status: 'OK'});

  expect((await saveDataCatalogEntries(endpoint, 'org_1', 'cat_1', [entry]))[0].status).toBe('active');
  expect((await updateDataCatalogEntry(endpoint, 'org_1', 'cat_1', 'applicant.full_name', {status: 'active'})).status).toBe('active');
  expect(await deleteDataCatalogEntry(endpoint, 'org_1', 'cat_1', 'applicant.full_name')).toEqual({status: 'OK'});
});

it('getDataCatalogMarketplace and applyDataCatalogUpdate should send their parameters', async () => {
  const mock = new MockAdapter(endpoint.api);
  mock.onGet('/v2/organizations/org_1/data-catalog-marketplace', {params: {q: 'carrier'}}).reply(200, [{id: 'cat_9'}]);
  mock.onPost(`${base}/cat_1/update`, {resolutions: {b: 'local'}}).reply(200, {id: 'cat_1', source_version: 2});

  expect(await getDataCatalogMarketplace(endpoint, 'org_1', 'carrier')).toEqual([{id: 'cat_9'}]);
  expect((await applyDataCatalogUpdate(endpoint, 'org_1', 'cat_1', {b: 'local'})).source_version).toBe(2);
});

it('getDataCatalogListing should read one marketplace catalog', async () => {
  const mock = new MockAdapter(endpoint.api);
  mock.onGet('/v2/organizations/org_1/data-catalog-marketplace/cat_9').reply(200, {id: 'cat_9', entries: [entry]});

  expect((await getDataCatalogListing(endpoint, 'org_1', 'cat_9')).entries).toEqual([entry]);
});
