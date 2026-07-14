"""Brand operations (js-sdk: Organizations/Brands.ts).

Brands hold white-label settings: logos, colors, custom domains, and email
identity. Every call requires an admin or owner of the organization, and the
organization_id must be the caller's own. The logo and thumbnail updates are
multipart uploads against the same PATCH route as update(); part names and
limits follow sdks/WIRE-NOTES.md.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import IO, TYPE_CHECKING, Any

import httpx

from ..errors import VerdocsConnectionError, api_error_from_response
from ..models.core import Brand
from ..models.organizations import BrandCreateParams, BrandEmailDomainAddParams, BrandUpdateParams

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

# A file to upload: a filesystem path, raw bytes, an open binary file, or an
# httpx-style tuple of (filename, content) or (filename, content, content_type).
FileInput = str | os.PathLike[str] | bytes | IO[bytes] | tuple[Any, ...]


def _brands_path(organization_id: str) -> str:
    return f"/v2/organizations/{organization_id}/brands"


def _file_part(file: FileInput) -> Any:
    # A str or PathLike names a file on disk; we read it here so the part
    # carries a real filename (multer stores it as the asset name). Anything
    # else already fits what httpx files= accepts.
    if isinstance(file, (str, os.PathLike)):
        path = Path(file)
        return (path.name, path.read_bytes())
    return file


def _multipart_patch(client: httpx.Client, path: str, files: dict[str, Any]) -> httpx.Response:
    # The endpoint's _request() only speaks JSON, so multipart goes straight
    # to the shared client with the same error translation.
    try:
        response = client.request("PATCH", path, files=files)
    except httpx.TransportError as exc:
        raise VerdocsConnectionError(f"PATCH {path} failed: {exc}") from exc

    if response.status_code >= 400:
        raise api_error_from_response(response)

    return response


async def _async_multipart_patch(client: httpx.AsyncClient, path: str, files: dict[str, Any]) -> httpx.Response:
    try:
        response = await client.request("PATCH", path, files=files)
    except httpx.TransportError as exc:
        raise VerdocsConnectionError(f"PATCH {path} failed: {exc}") from exc

    if response.status_code >= 400:
        raise api_error_from_response(response)

    return response


def _write_body(params: BrandCreateParams | BrandUpdateParams | BrandEmailDomainAddParams) -> dict[str, Any]:
    return params.model_dump(mode="json", exclude_unset=True)


class Brands:
    """Brand calls for a sync endpoint."""

    def __init__(self, endpoint: VerdocsEndpoint) -> None:
        self._endpoint = endpoint

    def list(self, organization_id: str) -> list[Brand]:
        """Get an organization's brands via GET /v2/organizations/{organization_id}/brands.

        Mirrors js-sdk getBrands.

        Args:
            organization_id: ID of the organization. Must be the caller's own.

        Returns:
            The organization's brands, oldest first.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("GET", _brands_path(organization_id))
        return [Brand.model_validate(entry) for entry in response.json()]

    def create(self, organization_id: str, params: BrandCreateParams) -> Brand:
        """Create a brand via POST /v2/organizations/{organization_id}/brands. Mirrors js-sdk createBrand.

        Example:
            brand = endpoint.brands.create("org-1", BrandCreateParams(key="acme", name="Acme"))

        Args:
            organization_id: ID of the organization. Must be the caller's own.
            params: Fields for the new brand; only key is required.

        Returns:
            The newly-created brand.

        Raises:
            VerdocsAPIError: The API rejected the request.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("POST", _brands_path(organization_id), json=_write_body(params))
        return Brand.model_validate(response.json())

    def get(self, organization_id: str, brand_id: str) -> Brand:
        """Get a brand by ID via GET /v2/organizations/{organization_id}/brands/{brand_id}.

        Mirrors js-sdk getBrand.

        Args:
            organization_id: ID of the organization. Must be the caller's own.
            brand_id: ID of the brand to fetch.

        Returns:
            The requested brand.

        Raises:
            NotFoundError: No such brand in the organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("GET", f"{_brands_path(organization_id)}/{brand_id}")
        return Brand.model_validate(response.json())

    def update(self, organization_id: str, brand_id: str, params: BrandUpdateParams) -> Brand:
        """Update a brand via PATCH /v2/organizations/{organization_id}/brands/{brand_id}.

        Mirrors js-sdk updateBrand.

        Args:
            organization_id: ID of the organization. Must be the caller's own.
            brand_id: ID of the brand to update.
            params: The fields to change; unset fields are left alone.

        Returns:
            The updated brand.

        Raises:
            NotFoundError: No such brand in the organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request(
            "PATCH", f"{_brands_path(organization_id)}/{brand_id}", json=_write_body(params)
        )
        return Brand.model_validate(response.json())

    def update_logo(self, organization_id: str, brand_id: str, logo: FileInput) -> Brand:
        """Upload a brand logo via multipart PATCH /v2/organizations/{organization_id}/brands/{brand_id}.

        The file goes up as a part named "logo" and lands in full_logo_url.
        The server performs no mime validation and caps uploads at 10 MB.
        Mirrors js-sdk updateBrandLogo.

        Example:
            brand = endpoint.brands.update_logo("org-1", "brand-1", "logo.png")
            brand = endpoint.brands.update_logo("org-1", "brand-1", ("logo.png", png_bytes, "image/png"))

        Args:
            organization_id: ID of the organization. Must be the caller's own.
            brand_id: ID of the brand to update.
            logo: The image: a path, raw bytes, an open binary file, or an
                httpx-style (filename, content[, content_type]) tuple.

        Returns:
            The updated brand.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = _multipart_patch(
            self._endpoint._client,
            f"{_brands_path(organization_id)}/{brand_id}",
            {"logo": _file_part(logo)},
        )
        return Brand.model_validate(response.json())

    def update_thumbnail(self, organization_id: str, brand_id: str, thumbnail: FileInput) -> Brand:
        """Upload a brand thumbnail via multipart PATCH /v2/organizations/{organization_id}/brands/{brand_id}.

        The file goes up as a part named "thumbnail" and lands in
        thumbnail_url. The server performs no mime validation and caps
        uploads at 10 MB. Mirrors js-sdk updateBrandThumbnail.

        Args:
            organization_id: ID of the organization. Must be the caller's own.
            brand_id: ID of the brand to update.
            thumbnail: The image: a path, raw bytes, an open binary file, or
                an httpx-style (filename, content[, content_type]) tuple.

        Returns:
            The updated brand.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = _multipart_patch(
            self._endpoint._client,
            f"{_brands_path(organization_id)}/{brand_id}",
            {"thumbnail": _file_part(thumbnail)},
        )
        return Brand.model_validate(response.json())

    def delete(self, organization_id: str, brand_id: str) -> None:
        """Delete a brand via DELETE /v2/organizations/{organization_id}/brands/{brand_id}.

        The organization's default brand cannot be deleted. Mirrors js-sdk
        deleteBrand. The API answers with a status marker that nothing
        consumes, so this returns None and relies on exceptions for failure.

        Args:
            organization_id: ID of the organization. Must be the caller's own.
            brand_id: ID of the brand to delete.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        self._endpoint._request("DELETE", f"{_brands_path(organization_id)}/{brand_id}")

    def add_email_domain(self, organization_id: str, brand_id: str, params: BrandEmailDomainAddParams) -> Brand:
        """Add a custom email domain via POST /v2/organizations/{organization_id}/brands/{brand_id}/email-domain.

        Registers the sending identity; verify_email_domain() checks the DNS
        records afterwards. Mirrors js-sdk addBrandEmailDomain.

        Example:
            brand = endpoint.brands.add_email_domain(
                "org-1", "brand-1", BrandEmailDomainAddParams(subdomain="notify.acme.com", local_part="docs")
            )

        Args:
            organization_id: ID of the organization. Must be the caller's own.
            brand_id: ID of the brand.
            params: The domain and from-address details.

        Returns:
            The updated brand with its email domain configuration.

        Raises:
            VerdocsAPIError: The API rejected the request.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request(
            "POST", f"{_brands_path(organization_id)}/{brand_id}/email-domain", json=_write_body(params)
        )
        return Brand.model_validate(response.json())

    def remove_email_domain(self, organization_id: str, brand_id: str) -> Brand:
        """Remove the custom email domain via DELETE /v2/organizations/{organization_id}/brands/{brand_id}/email-domain.

        Mirrors js-sdk removeBrandEmailDomain.

        Args:
            organization_id: ID of the organization. Must be the caller's own.
            brand_id: ID of the brand.

        Returns:
            The updated brand with the email domain cleared.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("DELETE", f"{_brands_path(organization_id)}/{brand_id}/email-domain")
        return Brand.model_validate(response.json())

    def verify_email_domain(self, organization_id: str, brand_id: str) -> Brand:
        """Trigger verification of the brand's email domain (SPF, DKIM, DMARC).

        Calls POST /v2/organizations/{organization_id}/brands/{brand_id}/email-domain/verify
        and returns the current status flags. Mirrors js-sdk verifyBrandEmailDomain.

        Args:
            organization_id: ID of the organization. Must be the caller's own.
            brand_id: ID of the brand.

        Returns:
            The brand with its current verification status.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("POST", f"{_brands_path(organization_id)}/{brand_id}/email-domain/verify")
        return Brand.model_validate(response.json())


class AsyncBrands:
    """Brand calls for an async endpoint."""

    def __init__(self, endpoint: AsyncVerdocsEndpoint) -> None:
        self._endpoint = endpoint

    async def list(self, organization_id: str) -> list[Brand]:
        """Get an organization's brands via GET /v2/organizations/{organization_id}/brands.

        Mirrors js-sdk getBrands.

        Args:
            organization_id: ID of the organization. Must be the caller's own.

        Returns:
            The organization's brands, oldest first.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", _brands_path(organization_id))
        return [Brand.model_validate(entry) for entry in response.json()]

    async def create(self, organization_id: str, params: BrandCreateParams) -> Brand:
        """Create a brand via POST /v2/organizations/{organization_id}/brands. Mirrors js-sdk createBrand.

        Example:
            brand = await endpoint.brands.create("org-1", BrandCreateParams(key="acme", name="Acme"))

        Args:
            organization_id: ID of the organization. Must be the caller's own.
            params: Fields for the new brand; only key is required.

        Returns:
            The newly-created brand.

        Raises:
            VerdocsAPIError: The API rejected the request.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", _brands_path(organization_id), json=_write_body(params))
        return Brand.model_validate(response.json())

    async def get(self, organization_id: str, brand_id: str) -> Brand:
        """Get a brand by ID via GET /v2/organizations/{organization_id}/brands/{brand_id}.

        Mirrors js-sdk getBrand.

        Args:
            organization_id: ID of the organization. Must be the caller's own.
            brand_id: ID of the brand to fetch.

        Returns:
            The requested brand.

        Raises:
            NotFoundError: No such brand in the organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", f"{_brands_path(organization_id)}/{brand_id}")
        return Brand.model_validate(response.json())

    async def update(self, organization_id: str, brand_id: str, params: BrandUpdateParams) -> Brand:
        """Update a brand via PATCH /v2/organizations/{organization_id}/brands/{brand_id}.

        Mirrors js-sdk updateBrand.

        Args:
            organization_id: ID of the organization. Must be the caller's own.
            brand_id: ID of the brand to update.
            params: The fields to change; unset fields are left alone.

        Returns:
            The updated brand.

        Raises:
            NotFoundError: No such brand in the organization.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "PATCH", f"{_brands_path(organization_id)}/{brand_id}", json=_write_body(params)
        )
        return Brand.model_validate(response.json())

    async def update_logo(self, organization_id: str, brand_id: str, logo: FileInput) -> Brand:
        """Upload a brand logo via multipart PATCH /v2/organizations/{organization_id}/brands/{brand_id}.

        The file goes up as a part named "logo" and lands in full_logo_url.
        The server performs no mime validation and caps uploads at 10 MB.
        Mirrors js-sdk updateBrandLogo.

        Example:
            brand = await endpoint.brands.update_logo("org-1", "brand-1", "logo.png")

        Args:
            organization_id: ID of the organization. Must be the caller's own.
            brand_id: ID of the brand to update.
            logo: The image: a path, raw bytes, an open binary file, or an
                httpx-style (filename, content[, content_type]) tuple.

        Returns:
            The updated brand.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await _async_multipart_patch(
            self._endpoint._client,
            f"{_brands_path(organization_id)}/{brand_id}",
            {"logo": _file_part(logo)},
        )
        return Brand.model_validate(response.json())

    async def update_thumbnail(self, organization_id: str, brand_id: str, thumbnail: FileInput) -> Brand:
        """Upload a brand thumbnail via multipart PATCH /v2/organizations/{organization_id}/brands/{brand_id}.

        The file goes up as a part named "thumbnail" and lands in
        thumbnail_url. The server performs no mime validation and caps
        uploads at 10 MB. Mirrors js-sdk updateBrandThumbnail.

        Args:
            organization_id: ID of the organization. Must be the caller's own.
            brand_id: ID of the brand to update.
            thumbnail: The image: a path, raw bytes, an open binary file, or
                an httpx-style (filename, content[, content_type]) tuple.

        Returns:
            The updated brand.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await _async_multipart_patch(
            self._endpoint._client,
            f"{_brands_path(organization_id)}/{brand_id}",
            {"thumbnail": _file_part(thumbnail)},
        )
        return Brand.model_validate(response.json())

    async def delete(self, organization_id: str, brand_id: str) -> None:
        """Delete a brand via DELETE /v2/organizations/{organization_id}/brands/{brand_id}.

        The organization's default brand cannot be deleted. Mirrors js-sdk
        deleteBrand. The API answers with a status marker that nothing
        consumes, so this returns None and relies on exceptions for failure.

        Args:
            organization_id: ID of the organization. Must be the caller's own.
            brand_id: ID of the brand to delete.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        await self._endpoint._request("DELETE", f"{_brands_path(organization_id)}/{brand_id}")

    async def add_email_domain(self, organization_id: str, brand_id: str, params: BrandEmailDomainAddParams) -> Brand:
        """Add a custom email domain via POST /v2/organizations/{organization_id}/brands/{brand_id}/email-domain.

        Registers the sending identity; verify_email_domain() checks the DNS
        records afterwards. Mirrors js-sdk addBrandEmailDomain.

        Example:
            brand = await endpoint.brands.add_email_domain(
                "org-1", "brand-1", BrandEmailDomainAddParams(subdomain="notify.acme.com", local_part="docs")
            )

        Args:
            organization_id: ID of the organization. Must be the caller's own.
            brand_id: ID of the brand.
            params: The domain and from-address details.

        Returns:
            The updated brand with its email domain configuration.

        Raises:
            VerdocsAPIError: The API rejected the request.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "POST", f"{_brands_path(organization_id)}/{brand_id}/email-domain", json=_write_body(params)
        )
        return Brand.model_validate(response.json())

    async def remove_email_domain(self, organization_id: str, brand_id: str) -> Brand:
        """Remove the custom email domain via DELETE /v2/organizations/{organization_id}/brands/{brand_id}/email-domain.

        Mirrors js-sdk removeBrandEmailDomain.

        Args:
            organization_id: ID of the organization. Must be the caller's own.
            brand_id: ID of the brand.

        Returns:
            The updated brand with the email domain cleared.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("DELETE", f"{_brands_path(organization_id)}/{brand_id}/email-domain")
        return Brand.model_validate(response.json())

    async def verify_email_domain(self, organization_id: str, brand_id: str) -> Brand:
        """Trigger verification of the brand's email domain (SPF, DKIM, DMARC).

        Calls POST /v2/organizations/{organization_id}/brands/{brand_id}/email-domain/verify
        and returns the current status flags. Mirrors js-sdk verifyBrandEmailDomain.

        Args:
            organization_id: ID of the organization. Must be the caller's own.
            brand_id: ID of the brand.

        Returns:
            The brand with its current verification status.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "POST", f"{_brands_path(organization_id)}/{brand_id}/email-domain/verify"
        )
        return Brand.model_validate(response.json())
