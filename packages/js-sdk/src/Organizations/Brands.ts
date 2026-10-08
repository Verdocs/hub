import {ICreateBrandRequest, IUpdateBrandRequest, IAddBrandAppDomainRequest, IAddBrandEmailDomainRequest} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {IBrand} from '../Models';

/**
 * Get all brands for an organization.
 *
 * ```typescript
 * import {getBrands} from '@verdocs/js-sdk';
 *
 * const brands = await getBrands(endpoint, organizationId);
 * ```
 *
 * @group Brands
 * @api GET /v2/organizations/:organizationId/brands List brands
 * @apiSuccess array(items: IBrand) . A list of the brands for the organization.
 *
 * @sdkOperation brand.getBrands
 * @sdkGroup Brand
 * @sdkPage Endpoints
 */
export const getBrands = (endpoint: VerdocsEndpoint, organizationId: string) =>
  endpoint.api //
    .get<IBrand[]>(`/v2/organizations/${organizationId}/brands`)
    .then((r) => r.data);

/**
 * Create a brand.
 *
 * @group Brands
 * @api POST /v2/organizations/:organizationId/brands Create brand
 * @apiBody string key A unique key for the brand (lowercase alphanumeric + hyphens)
 * @apiBody string timezone? Define the long-form timezone.
 * @apiBody string locale? Define the locale code.
 * @apiSuccess IBrand . The newly created brand.
 *
 * @sdkOperation brand.createBrand
 * @sdkGroup Brand
 * @sdkPage Endpoints
 */
export const createBrand = (endpoint: VerdocsEndpoint, organizationId: string, params: ICreateBrandRequest) =>
  endpoint.api //
    .post<IBrand>(`/v2/organizations/${organizationId}/brands`, params)
    .then((r) => r.data);

/**
 * Get a brand by ID.
 *
 * @group Brands
 * @api GET /v2/organizations/:organizationId/brands/:brandId Get brand
 * @apiSuccess IBrand . The brand details.
 *
 * @sdkOperation brand.getBrand
 * @sdkGroup Brand
 * @sdkPage Endpoints
 */
export const getBrand = (endpoint: VerdocsEndpoint, organizationId: string, brandId: string) =>
  endpoint.api //
    .get<IBrand>(`/v2/organizations/${organizationId}/brands/${brandId}`)
    .then((r) => r.data);

/**
 * Update a brand.
 *
 * @group Brands
 * @api PATCH /v2/organizations/:organizationId/brands/:brandId Update brand
 * @apiBody string timezone? Define the long-form timezone.
 * @apiBody string locale? Define the locale code.
 * @apiSuccess IBrand . The updated brand.
 *
 * @sdkOperation brand.updateBrand
 * @sdkGroup Brand
 * @sdkPage Endpoints
 */
export const updateBrand = (endpoint: VerdocsEndpoint, organizationId: string, brandId: string, params: IUpdateBrandRequest) =>
  endpoint.api //
    .patch<IBrand>(`/v2/organizations/${organizationId}/brands/${brandId}`, params)
    .then((r) => r.data);

/**
 * Update a brand's logo. Uploads the file and sets `full_logo_url`.
 *
 * @group Brands
 * @api PATCH /v2/organizations/:organizationId/brands/:brandId Update brand logo
 * @apiBody image/png logo Form-encoded file to upload
 * @apiSuccess IBrand . The updated brand.
 *
 * @sdkOperation brand.updateBrandLogo
 * @sdkGroup Brand
 * @sdkPage Endpoints
 */
export const updateBrandLogo = (
  endpoint: VerdocsEndpoint,
  organizationId: string,
  brandId: string,
  file: File,
  onUploadProgress?: (percent: number, loadedBytes: number, totalBytes: number) => void,
) => {
  const formData = new FormData();
  formData.append('logo', file, file.name);

  return endpoint.api //
    .patch<IBrand>(`/v2/organizations/${organizationId}/brands/${brandId}`, formData, {
      headers: {'Content-Type': 'multipart/form-data'},
      onUploadProgress: (event) => {
        const {loaded = 0, total} = event;
        onUploadProgress?.(Math.floor((loaded * 100) / (total || 1)), loaded, total || 1);
      },
    })
    .then((r) => r.data);
};

/**
 * Update a brand's thumbnail. Uploads the file and sets `thumbnail_url`.
 *
 * @group Brands
 * @api PATCH /v2/organizations/:organizationId/brands/:brandId Update brand thumbnail
 * @apiBody image/png thumbnail Form-encoded file to upload
 * @apiSuccess IBrand . The updated brand.
 *
 * @sdkOperation brand.updateBrandThumbnail
 * @sdkGroup Brand
 * @sdkPage Endpoints
 */
export const updateBrandThumbnail = (
  endpoint: VerdocsEndpoint,
  organizationId: string,
  brandId: string,
  file: File,
  onUploadProgress?: (percent: number, loadedBytes: number, totalBytes: number) => void,
) => {
  const formData = new FormData();
  formData.append('thumbnail', file, file.name);

  return endpoint.api //
    .patch<IBrand>(`/v2/organizations/${organizationId}/brands/${brandId}`, formData, {
      headers: {'Content-Type': 'multipart/form-data'},
      onUploadProgress: (event) => {
        const {loaded = 0, total} = event;
        onUploadProgress?.(Math.floor((loaded * 100) / (total || 1)), loaded, total || 1);
      },
    })
    .then((r) => r.data);
};

/**
 * Delete a brand. Cannot delete the org's default brand.
 *
 * @group Brands
 * @api DELETE /v2/organizations/:organizationId/brands/:brandId Delete brand
 * @apiSuccess string . Success.
 *
 * @sdkOperation brand.deleteBrand
 * @sdkGroup Brand
 * @sdkPage Endpoints
 */
export const deleteBrand = (endpoint: VerdocsEndpoint, organizationId: string, brandId: string) =>
  endpoint.api //
    .delete(`/v2/organizations/${organizationId}/brands/${brandId}`)
    .then((r) => r.data);

/**
 * Custom domains allow you to serve signing links, login pages, and documents for a brand from your own subdomain,
 * e.g. "sign.mycompany.com" instead of "app.verdocs.com". The returned Brand will include two CNAME records which must
 * be added to your DNS. The first provides the routing, and the second is used for DCV delegation for certificate renewal.
 * We will poll periodically for these records to be set, and the custom domain will not activate until this is done.
 *
 * ```typescript
 * import {addBrandAppDomain} from '@verdocs/js-sdk';
 *
 * const brand = await addBrandAppDomain(endpoint, organizationId, brandId, {subdomain: 'sign.acme.com'});
 * ```
 *
 * @group Brands
 * @api POST /v2/organizations/:organizationId/brands/:brandId/app-domain Add app domain
 * @apiBody string subdomain The subdomain to serve Verdocs from (e.g. sign.acme.com)
 * @apiSuccess IBrand . The updated brand with app domain configuration.
 *
 * @sdkOperation brand.addBrandAppDomain
 * @sdkGroup Brand
 * @sdkPage Endpoints
 */
export const addBrandAppDomain = (endpoint: VerdocsEndpoint, organizationId: string, brandId: string, params: IAddBrandAppDomainRequest) =>
  endpoint.api //
    .post<IBrand>(`/v2/organizations/${organizationId}/brands/${brandId}/app-domain`, params)
    .then((r) => r.data);

/**
 * Remove a brand's custom app domain. This change takes effect immediately, and should only be done
 * if you have no active envelopes with invitations pointing to the custom domain, or you plan to
 * send recipients fresh invite links.
 *
 * @group Brands
 * @api DELETE /v2/organizations/:organizationId/brands/:brandId/app-domain Remove app domain
 * @apiSuccess IBrand . The updated brand with app domain removed.
 *
 * @sdkOperation brand.removeBrandAppDomain
 * @sdkGroup Brand
 * @sdkPage Endpoints
 */
export const removeBrandAppDomain = (endpoint: VerdocsEndpoint, organizationId: string, brandId: string) =>
  endpoint.api //
    .delete<IBrand>(`/v2/organizations/${organizationId}/brands/${brandId}/app-domain`)
    .then((r) => r.data);

/**
 * Request an immediate verification check for a custom domain's registration status.
 *
 * @group Brands
 * @api POST /v2/organizations/:organizationId/brands/:brandId/app-domain/verify Verify app domain
 * @apiSuccess IBrand . The updated brand with current verification status.
 *
 * @sdkOperation brand.verifyBrandAppDomain
 * @sdkGroup Brand
 * @sdkPage Endpoints
 */
export const verifyBrandAppDomain = (endpoint: VerdocsEndpoint, organizationId: string, brandId: string) =>
  endpoint.api //
    .post<IBrand>(`/v2/organizations/${organizationId}/brands/${brandId}/app-domain/verify`)
    .then((r) => r.data);

/**
 * Add a custom email domain to a brand.
 *
 * @group Brands
 * @api POST /v2/organizations/:organizationId/brands/:brandId/email-domain Add email domain
 * @apiBody string subdomain The email subdomain (e.g. notify.acme.com)
 * @apiBody string local_part The local part of the from address (e.g. notifications)
 * @apiSuccess IBrand . The updated brand with email domain configuration.
 *
 * @sdkOperation brand.addBrandEmailDomain
 * @sdkGroup Brand
 * @sdkPage Endpoints
 */
export const addBrandEmailDomain = (
  endpoint: VerdocsEndpoint,
  organizationId: string,
  brandId: string,
  params: IAddBrandEmailDomainRequest,
) =>
  endpoint.api //
    .post<IBrand>(`/v2/organizations/${organizationId}/brands/${brandId}/email-domain`, params)
    .then((r) => r.data);

/**
 * Remove a custom email domain from a brand.
 *
 * @group Brands
 * @api DELETE /v2/organizations/:organizationId/brands/:brandId/email-domain Remove email domain
 * @apiSuccess IBrand . The updated brand with email domain removed.
 *
 * @sdkOperation brand.removeBrandEmailDomain
 * @sdkGroup Brand
 * @sdkPage Endpoints
 */
export const removeBrandEmailDomain = (endpoint: VerdocsEndpoint, organizationId: string, brandId: string) =>
  endpoint.api //
    .delete<IBrand>(`/v2/organizations/${organizationId}/brands/${brandId}/email-domain`)
    .then((r) => r.data);

/**
 * Trigger verification of a brand's email domain (checks SPF, DKIM, DMARC).
 *
 * @group Brands
 * @api POST /v2/organizations/:organizationId/brands/:brandId/email-domain/verify Verify email domain
 * @apiSuccess IBrand . The updated brand with current verification status.
 *
 * @sdkOperation brand.verifyBrandEmailDomain
 * @sdkGroup Brand
 * @sdkPage Endpoints
 */
export const verifyBrandEmailDomain = (endpoint: VerdocsEndpoint, organizationId: string, brandId: string) =>
  endpoint.api //
    .post<IBrand>(`/v2/organizations/${organizationId}/brands/${brandId}/email-domain/verify`)
    .then((r) => r.data);
