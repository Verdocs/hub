import {
  ICreateDataCatalogRequest,
  IDataCatalog,
  IDataCatalogEntry,
  IDataCatalogListing,
  IDataCatalogUpdate,
  IDataCatalogVersion,
  ISaveDataCatalogEntry,
  IUpdateDataCatalogEntryRequest,
  IUpdateDataCatalogRequest,
} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';

const catalogPath = (organizationId: string, catalogId?: string) =>
  `/v2/organizations/${organizationId}/data-catalogs${catalogId ? `/${catalogId}` : ''}`;

/**
 * List an organization's data catalogs. A catalog describes the keys template fields can be bound to with data_key and
 * filled from createEnvelope's prefill_data. Each one shows whether it's the default and whether an imported catalog has
 * an update waiting.
 *
 * ```typescript
 * import {getDataCatalogs} from '@verdocs/js-sdk';
 *
 * const catalogs = await getDataCatalogs(VerdocsEndpoint.getDefault(), organizationId);
 * ```
 *
 * @group Data Catalogs
 * @api GET /v2/organizations/:organizationId/data-catalogs List data catalogs
 * @apiSuccess array(items: IDataCatalog) . The organization's catalogs.
 *
 * @sdkOperation dataCatalog.getDataCatalogs
 * @sdkGroup DataCatalog
 * @sdkPage Endpoints
 */
export const getDataCatalogs = (endpoint: VerdocsEndpoint, organizationId: string) =>
  endpoint.api //
    .get<IDataCatalog[]>(catalogPath(organizationId))
    .then((r) => r.data);

/**
 * Get one data catalog with its entries. Members see live entries and their own proposals; admins see every proposal.
 *
 * @group Data Catalogs
 * @api GET /v2/organizations/:organizationId/data-catalogs/:catalogId Get a data catalog
 * @apiSuccess IDataCatalog . The catalog and its entries.
 *
 * @sdkOperation dataCatalog.getDataCatalog
 * @sdkGroup DataCatalog
 * @sdkPage Endpoints
 */
export const getDataCatalog = (endpoint: VerdocsEndpoint, organizationId: string, catalogId: string) =>
  endpoint.api //
    .get<IDataCatalog>(catalogPath(organizationId, catalogId))
    .then((r) => r.data);

/**
 * Create a data catalog from scratch, from a JSON sample or JSON Schema, or as a copy of a marketplace catalog. The
 * organization's first catalog becomes its default. Admins and owners only.
 *
 * ```typescript
 * import {createDataCatalog} from '@verdocs/js-sdk';
 *
 * const catalog = await createDataCatalog(VerdocsEndpoint.getDefault(), organizationId, {
 *   name: 'Applicants',
 *   import: {format: 'json_sample', content: {applicant: {full_name: 'Jordan Rivera'}}},
 * });
 * ```
 *
 * @group Data Catalogs
 * @api POST /v2/organizations/:organizationId/data-catalogs Create a data catalog
 * @apiBody string name? Required unless importing from the marketplace, where it defaults to the source's name.
 * @apiBody string description? What the catalog is for.
 * @apiBody IDataCatalogImport import? Create the entries from a JSON sample or JSON Schema.
 * @apiBody string from_catalog_id? Import a copy of a marketplace catalog's newest version.
 * @apiSuccess IDataCatalog . The new catalog.
 *
 * @sdkOperation dataCatalog.createDataCatalog
 * @sdkGroup DataCatalog
 * @sdkPage Endpoints
 */
export const createDataCatalog = (endpoint: VerdocsEndpoint, organizationId: string, params: ICreateDataCatalogRequest) =>
  endpoint.api //
    .post<IDataCatalog>(catalogPath(organizationId), params)
    .then((r) => r.data);

/**
 * Rename a data catalog, change its description, or share it with every organization below this one. To make a
 * catalog the default, set default_data_catalog_id with updateOrganization. Admins and owners only.
 *
 * @group Data Catalogs
 * @api PATCH /v2/organizations/:organizationId/data-catalogs/:catalogId Update a data catalog
 * @apiBody string name? The catalog's name.
 * @apiBody string description? What the catalog is for.
 * @apiBody string(enum: 'private' | 'shared') sharing? "shared" makes released versions available to every organization below this one.
 * @apiSuccess IDataCatalog . The updated catalog.
 *
 * @sdkOperation dataCatalog.updateDataCatalog
 * @sdkGroup DataCatalog
 * @sdkPage Endpoints
 */
export const updateDataCatalog = (endpoint: VerdocsEndpoint, organizationId: string, catalogId: string, params: IUpdateDataCatalogRequest) =>
  endpoint.api //
    .patch<IDataCatalog>(catalogPath(organizationId, catalogId), params)
    .then((r) => r.data);

/**
 * Delete a data catalog. The default catalog can't be deleted, and neither can a catalog that templates use; that
 * refusal lists the templates. Admins and owners only.
 *
 * @group Data Catalogs
 * @api DELETE /v2/organizations/:organizationId/data-catalogs/:catalogId Delete a data catalog
 * @apiSuccess string . Success.
 *
 * @sdkOperation dataCatalog.deleteDataCatalog
 * @sdkGroup DataCatalog
 * @sdkPage Endpoints
 */
export const deleteDataCatalog = (endpoint: VerdocsEndpoint, organizationId: string, catalogId: string) =>
  endpoint.api //
    .delete<{status: 'OK'}>(catalogPath(organizationId, catalogId))
    .then((r) => r.data);

/**
 * Add or change entries in a data catalog, matched by key. Entries saved by an admin or owner go live, and approve a
 * matching proposal. Entries saved by a member become proposals for an admin to approve, and can't change a live entry.
 *
 * @group Data Catalogs
 * @api POST /v2/organizations/:organizationId/data-catalogs/:catalogId/entries Save data catalog entries
 * @apiBody array(items: ISaveDataCatalogEntry) entries Up to 500 entries. Each key may appear only once.
 * @apiSuccess array(items: IDataCatalogEntry) . The saved entries.
 *
 * @sdkOperation dataCatalog.saveDataCatalogEntries
 * @sdkGroup DataCatalog
 * @sdkPage Endpoints
 */
export const saveDataCatalogEntries = (endpoint: VerdocsEndpoint, organizationId: string, catalogId: string, entries: ISaveDataCatalogEntry[]) =>
  endpoint.api //
    .post<IDataCatalogEntry[]>(`${catalogPath(organizationId, catalogId)}/entries`, {entries})
    .then((r) => r.data);

/**
 * Change a data catalog entry, or approve a member's proposal by setting status to "active". Admins and owners only.
 *
 * @group Data Catalogs
 * @api PATCH /v2/organizations/:organizationId/data-catalogs/:catalogId/entries/:key Update a data catalog entry
 * @apiBody string label? What template owners see for this key.
 * @apiBody string(enum: 'text' | 'date' | 'boolean' | 'choice') type? What a caller sends for this key.
 * @apiBody string description? What the value is.
 * @apiBody string example? An example value.
 * @apiBody array(items: IDataCatalogOption) options? For a choice, the accepted values.
 * @apiBody boolean sensitive? Keeps the example out of MCP answers and AI prompts.
 * @apiBody string(enum: 'active') status? Set to "active" to approve a proposal.
 * @apiSuccess IDataCatalogEntry . The updated entry.
 *
 * @sdkOperation dataCatalog.updateDataCatalogEntry
 * @sdkGroup DataCatalog
 * @sdkPage Endpoints
 */
export const updateDataCatalogEntry = (
  endpoint: VerdocsEndpoint,
  organizationId: string,
  catalogId: string,
  key: string,
  params: IUpdateDataCatalogEntryRequest,
) =>
  endpoint.api //
    .patch<IDataCatalogEntry>(`${catalogPath(organizationId, catalogId)}/entries/${encodeURIComponent(key)}`, params)
    .then((r) => r.data);

/**
 * Remove an entry from a data catalog. Members can only withdraw their own proposals. Fields bound to the key keep it.
 *
 * @group Data Catalogs
 * @api DELETE /v2/organizations/:organizationId/data-catalogs/:catalogId/entries/:key Delete a data catalog entry
 * @apiSuccess string . Success.
 *
 * @sdkOperation dataCatalog.deleteDataCatalogEntry
 * @sdkGroup DataCatalog
 * @sdkPage Endpoints
 */
export const deleteDataCatalogEntry = (endpoint: VerdocsEndpoint, organizationId: string, catalogId: string, key: string) =>
  endpoint.api //
    .delete<{status: 'OK'}>(`${catalogPath(organizationId, catalogId)}/entries/${encodeURIComponent(key)}`)
    .then((r) => r.data);

/**
 * Release a frozen version of a catalog's live entries, so organizations it's shared with can import it or update to
 * it. Proposals aren't included. Admins and owners only.
 *
 * @group Data Catalogs
 * @api POST /v2/organizations/:organizationId/data-catalogs/:catalogId/versions Release a data catalog version
 * @apiBody string notes? What changed in this version.
 * @apiSuccess IDataCatalogVersion . The released version.
 *
 * @sdkOperation dataCatalog.releaseDataCatalogVersion
 * @sdkGroup DataCatalog
 * @sdkPage Endpoints
 */
export const releaseDataCatalogVersion = (endpoint: VerdocsEndpoint, organizationId: string, catalogId: string, notes?: string) =>
  endpoint.api //
    .post<IDataCatalogVersion>(`${catalogPath(organizationId, catalogId)}/versions`, {notes})
    .then((r) => r.data);

/**
 * List a data catalog's released versions, newest first.
 *
 * @group Data Catalogs
 * @api GET /v2/organizations/:organizationId/data-catalogs/:catalogId/versions List data catalog versions
 * @apiSuccess array(items: IDataCatalogVersion) . The versions.
 *
 * @sdkOperation dataCatalog.getDataCatalogVersions
 * @sdkGroup DataCatalog
 * @sdkPage Endpoints
 */
export const getDataCatalogVersions = (endpoint: VerdocsEndpoint, organizationId: string, catalogId: string) =>
  endpoint.api //
    .get<IDataCatalogVersion[]>(`${catalogPath(organizationId, catalogId)}/versions`)
    .then((r) => r.data);

/**
 * Find catalogs this organization can import: those shared by any organization above it, once released.
 *
 * @group Data Catalogs
 * @api GET /v2/organizations/:organizationId/data-catalog-marketplace Browse the data catalog marketplace
 * @apiQuery string q? Text to search catalog names and descriptions for.
 * @apiSuccess array(items: IDataCatalogListing) . The catalogs available to import.
 *
 * @sdkOperation dataCatalog.getDataCatalogMarketplace
 * @sdkGroup DataCatalog
 * @sdkPage Endpoints
 */
export const getDataCatalogMarketplace = (endpoint: VerdocsEndpoint, organizationId: string, q?: string) =>
  endpoint.api //
    .get<IDataCatalogListing[]>(`/v2/organizations/${organizationId}/data-catalog-marketplace`, {params: {q}})
    .then((r) => r.data);

/**
 * For a catalog imported from the marketplace, what applying its source's newest version would change, key by key.
 * Removed and conflicting keys list the templates that use them.
 *
 * @group Data Catalogs
 * @api GET /v2/organizations/:organizationId/data-catalogs/:catalogId/update Review a data catalog update
 * @apiSuccess IDataCatalogUpdate . The changes, empty when there's nothing to apply.
 *
 * @sdkOperation dataCatalog.getDataCatalogUpdate
 * @sdkGroup DataCatalog
 * @sdkPage Endpoints
 */
export const getDataCatalogUpdate = (endpoint: VerdocsEndpoint, organizationId: string, catalogId: string) =>
  endpoint.api //
    .get<IDataCatalogUpdate>(`${catalogPath(organizationId, catalogId)}/update`)
    .then((r) => r.data);

/**
 * Apply an imported catalog's waiting update. Every conflict needs a resolution, "source" or "local". Other changes take
 * the source unless resolved "local", which keeps your entry, skips an addition, or keeps a removed key as your own.
 * Admins and owners only.
 *
 * @group Data Catalogs
 * @api POST /v2/organizations/:organizationId/data-catalogs/:catalogId/update Apply a data catalog update
 * @apiBody object resolutions? By key, "source" or "local".
 * @apiSuccess IDataCatalog . The updated catalog and its entries.
 *
 * @sdkOperation dataCatalog.applyDataCatalogUpdate
 * @sdkGroup DataCatalog
 * @sdkPage Endpoints
 */
export const applyDataCatalogUpdate = (
  endpoint: VerdocsEndpoint,
  organizationId: string,
  catalogId: string,
  resolutions: Record<string, 'source' | 'local'> = {},
) =>
  endpoint.api //
    .post<IDataCatalog>(`${catalogPath(organizationId, catalogId)}/update`, {resolutions})
    .then((r) => r.data);
