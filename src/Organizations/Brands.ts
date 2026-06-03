import {ICreateBrandRequest, IUpdateBrandRequest, IAddBrandEmailDomainRequest} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';
import {IBrand} from '../Models';

/**
 * Get all brands for an organization.
 *
 * @group Brands
 * @api GET /v2/organizations/:organizationId/brands List brands
 * @apiSuccess array(items: IBrand) . A list of the brands for the organization.
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
 * @apiSuccess IBrand . The newly created brand.
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
 * @apiSuccess IBrand . The updated brand.
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
 */
export const deleteBrand = (endpoint: VerdocsEndpoint, organizationId: string, brandId: string) =>
  endpoint.api //
    .delete(`/v2/organizations/${organizationId}/brands/${brandId}`)
    .then((r) => r.data);

/**
 * Add a custom email domain to a brand.
 *
 * @group Brands
 * @api POST /v2/organizations/:organizationId/brands/:brandId/email-domain Add email domain
 * @apiBody string subdomain The email subdomain (e.g. notify.acme.com)
 * @apiBody string local_part The local part of the from address (e.g. notifications)
 * @apiSuccess IBrand . The updated brand with email domain configuration.
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
 */
export const verifyBrandEmailDomain = (endpoint: VerdocsEndpoint, organizationId: string, brandId: string) =>
  endpoint.api //
    .post<IBrand>(`/v2/organizations/${organizationId}/brands/${brandId}/email-domain/verify`)
    .then((r) => r.data);
