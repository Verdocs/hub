"""Organization operations (js-sdk: Organizations/Organizations.ts).

There is no call to bulk-manage organizations: create() adds one (as a child
when parent_id is set), and delete() removes the caller's current one. The
logo and thumbnail updates are multipart uploads against the same PATCH route
as update(); part names and limits follow sdks/WIRE-NOTES.md.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import IO, TYPE_CHECKING, Any

import httpx

from ..errors import VerdocsConnectionError, VerdocsError, api_error_from_response
from ..models.core import Entitlement, Organization, OrganizationUsage, PipelineSettings
from ..models.organizations import (
    ActiveEntitlements,
    OrganizationCreateParams,
    OrganizationCreateResponse,
    OrganizationUpdateParams,
    PipelineSettingsUpdateParams,
)
from ..models.users import AuthenticateResponse
from ..utils.entitlements import collapse_entitlements

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_ORGANIZATIONS_PATH = "/v2/organizations"

# The js-sdk gives logo/thumbnail uploads a 120s timeout because they can
# outlast the default; we mirror that.
_UPLOAD_TIMEOUT = 120.0

# A file to upload: a filesystem path, raw bytes, an open binary file, or an
# httpx-style tuple of (filename, content) or (filename, content, content_type).
FileInput = str | os.PathLike[str] | bytes | IO[bytes] | tuple[Any, ...]


def _file_part(file: FileInput) -> Any:
    # A str or PathLike names a file on disk; we read it here so the part
    # carries a real filename (multer stores it as the asset name). Anything
    # else already fits what httpx files= accepts.
    if isinstance(file, (str, os.PathLike)):
        path = Path(file)
        return (path.name, path.read_bytes())
    return file


def _multipart_request(
    client: httpx.Client, method: str, path: str, files: dict[str, Any], timeout: float
) -> httpx.Response:
    # The endpoint's _request() only speaks JSON, so multipart goes straight
    # to the shared client with the same error translation.
    try:
        response = client.request(method, path, files=files, timeout=timeout)
    except httpx.TransportError as exc:
        raise VerdocsConnectionError(f"{method} {path} failed: {exc}") from exc

    if response.status_code >= 400:
        raise api_error_from_response(response)

    return response


async def _async_multipart_request(
    client: httpx.AsyncClient, method: str, path: str, files: dict[str, Any], timeout: float
) -> httpx.Response:
    try:
        response = await client.request(method, path, files=files, timeout=timeout)
    except httpx.TransportError as exc:
        raise VerdocsConnectionError(f"{method} {path} failed: {exc}") from exc

    if response.status_code >= 400:
        raise api_error_from_response(response)

    return response


def _write_body(params: OrganizationCreateParams | OrganizationUpdateParams | PipelineSettingsUpdateParams) -> dict:
    # exclude_unset rather than exclude_none: an explicit None must reach the
    # wire (null clears nullable fields) while untouched fields stay off it.
    return params.model_dump(mode="json", exclude_unset=True)


def _usage_query(start_date: str | None, end_date: str | None, usage_type: str | None) -> dict[str, str] | None:
    params = {
        key: value
        for key, value in (("start_date", start_date), ("end_date", end_date), ("usage_type", usage_type))
        if value is not None
    }
    return params or None


def _parse_create_response(payload: Any) -> OrganizationCreateResponse | Organization:
    # The wire answers with two different shapes: a child create returns the
    # new organization itself (api_key populated), while a top-level create
    # returns fresh session tokens plus the profile and organization.
    if isinstance(payload, dict) and "access_token" in payload:
        return OrganizationCreateResponse.model_validate(payload)
    return Organization.model_validate(payload)


def _parse_delete_response(response: httpx.Response) -> AuthenticateResponse | None:
    # 204 with an empty body means the caller had no other profile and is now
    # signed out; 200 carries tokens for their next remaining profile.
    if response.status_code == 204 or not response.content:
        return None
    return AuthenticateResponse.model_validate(response.json())


class Organizations:
    """Organization calls for a sync endpoint."""

    def __init__(self, endpoint: VerdocsEndpoint) -> None:
        self._endpoint = endpoint

    def get(self, organization_id: str) -> Organization:
        """Get an organization by ID via GET /v2/organizations/{organization_id}.

        Includes the organization's entitlements, children, and parent.
        Mirrors js-sdk getOrganization. The js-sdk describes a public-fields
        response for non-members, but the deployed handler denies non-members
        outright.

        Args:
            organization_id: ID of the organization to fetch. Must be the caller's own.

        Returns:
            The requested organization.

        Raises:
            NotFoundError: No organization has that ID.
            VerdocsAPIError: The API returned another non-2xx status (403 for non-members).
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("GET", f"{_ORGANIZATIONS_PATH}/{organization_id}")
        return Organization.model_validate(response.json())

    def get_children(self, organization_id: str) -> list[Organization]:
        """Get an organization's child organizations via GET /v2/organizations/{organization_id}/children.

        The caller must be an admin of the parent. Mirrors js-sdk
        getOrganizationChildren, which types the response as a single
        organization; the wire returns a list.

        Args:
            organization_id: ID of the parent organization. Must be the caller's own.

        Returns:
            The child organizations, each with its entitlements.

        Raises:
            NotFoundError: The organization has no children (the handler 404s
                rather than returning an empty list).
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("GET", f"{_ORGANIZATIONS_PATH}/{organization_id}/children")
        return [Organization.model_validate(entry) for entry in response.json()]

    def get_usage(
        self,
        organization_id: str,
        *,
        start_date: str | None = None,
        end_date: str | None = None,
        usage_type: str | None = None,
    ) -> OrganizationUsage:
        """Get usage counters via GET /v2/organizations/{organization_id}/usage.

        If the organization is a parent, children are included too. The
        caller must be an admin. Mirrors js-sdk getOrganizationUsage.

        Example:
            usage = endpoint.organizations.get_usage("org-1", usage_type="envelope")
            envelopes_created = usage["org-1"].get("envelope", 0)

        Args:
            organization_id: ID of the organization. Must be the caller's own.
            start_date: ISO 8601 UTC datetime string (e.g. "2026-01-01T00:00:00Z").
                The server defaults to 90 days ago.
            end_date: ISO 8601 UTC datetime string. The server defaults to now.
            usage_type: Restrict to one usage type. Known values: UsageType in models.base.

        Returns:
            Counters nested by organization ID, then usage type.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request(
            "GET",
            f"{_ORGANIZATIONS_PATH}/{organization_id}/usage",
            params=_usage_query(start_date, end_date, usage_type),
        )
        return response.json()

    def create(self, params: OrganizationCreateParams) -> OrganizationCreateResponse | Organization:
        """Create an organization via POST /v2/organizations. Mirrors js-sdk createOrganization.

        Creating a top-level organization switches the caller to a new owner
        profile in it and returns fresh session tokens; call set_token() with
        the new access token to continue as the new profile. Creating a child
        (params.parent_id set) leaves the session alone and returns the new
        organization with a ready-made "Default" API key attached.

        Example:
            result = endpoint.organizations.create(OrganizationCreateParams(name="NewOrg"))
            endpoint.set_token(result.access_token)

        Args:
            params: Fields for the new organization; only name is required.
                Note that the deployed handler consumes only name, parent_id,
                timezone, and locale; see OrganizationCreateParams.

        Returns:
            OrganizationCreateResponse (tokens plus profile and organization)
            for a top-level create, or the new Organization for a child create.

        Raises:
            VerdocsAPIError: The API rejected the request.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("POST", _ORGANIZATIONS_PATH, json=_write_body(params))
        return _parse_create_response(response.json())

    def update(self, organization_id: str, params: OrganizationUpdateParams) -> Organization:
        """Update an organization via PATCH /v2/organizations/{organization_id}.

        The caller must be an admin or owner. Mirrors js-sdk updateOrganization.

        Args:
            organization_id: ID of the organization to update. Must be the caller's own.
            params: The fields to change; unset fields are left alone.

        Returns:
            The updated organization, including its groups and entitlements.

        Raises:
            NotFoundError: No organization has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request(
            "PATCH", f"{_ORGANIZATIONS_PATH}/{organization_id}", json=_write_body(params)
        )
        return Organization.model_validate(response.json())

    def get_pipeline_settings(self, organization_id: str) -> PipelineSettings:
        """Get the document-pipeline settings via GET /v2/organizations/{organization_id}/pipeline-settings.

        The caller must be an admin. Every flag comes back normalized to a
        boolean. Mirrors js-sdk getOrganizationPipelineSettings.

        Args:
            organization_id: ID of the organization. Must be the caller's own.

        Returns:
            The organization's pipeline settings.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("GET", f"{_ORGANIZATIONS_PATH}/{organization_id}/pipeline-settings")
        return PipelineSettings.model_validate(response.json())

    def update_pipeline_settings(self, organization_id: str, params: PipelineSettingsUpdateParams) -> PipelineSettings:
        """Update document-pipeline settings via PATCH /v2/organizations/{organization_id}/pipeline-settings.

        Omitted flags are left unchanged. The caller must be an admin.
        Mirrors js-sdk updateOrganizationPipelineSettings.

        Args:
            organization_id: ID of the organization. Must be the caller's own.
            params: The flags to change.

        Returns:
            The updated pipeline settings, every flag normalized to a boolean.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request(
            "PATCH", f"{_ORGANIZATIONS_PATH}/{organization_id}/pipeline-settings", json=_write_body(params)
        )
        return PipelineSettings.model_validate(response.json())

    def delete(self, organization_id: str) -> AuthenticateResponse | None:
        """Delete the caller's current organization via DELETE /v2/organizations/{organization_id}.

        Owner only, and the organization's deletion_protected flag must be
        False (update it first). The ID is a safety check: it must match the
        caller's current organization. Mirrors js-sdk deleteOrganization.

        Args:
            organization_id: ID of the organization to delete.

        Returns:
            Session tokens for the caller's next remaining profile, or None
            if this was their last organization (the caller is signed out).

        Raises:
            NotFoundError: No organization has that ID.
            VerdocsAPIError: The API returned another non-2xx status (400 when
                deletion protection is on).
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("DELETE", f"{_ORGANIZATIONS_PATH}/{organization_id}")
        return _parse_delete_response(response)

    def update_logo(self, organization_id: str, logo: FileInput) -> Organization:
        """Upload a new full-size logo via multipart PATCH /v2/organizations/{organization_id}.

        The file goes up as a part named "logo" and lands in full_logo_url.
        The server performs no mime validation and caps uploads at 10 MB.
        Admin or owner only. Mirrors js-sdk updateOrganizationLogo.

        Example:
            org = endpoint.organizations.update_logo("org-1", "logo.png")
            org = endpoint.organizations.update_logo("org-1", ("logo.png", png_bytes, "image/png"))

        Args:
            organization_id: ID of the organization to update. Must be the caller's own.
            logo: The image: a path, raw bytes, an open binary file, or an
                httpx-style (filename, content[, content_type]) tuple.

        Returns:
            The updated organization.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = _multipart_request(
            self._endpoint._client,
            "PATCH",
            f"{_ORGANIZATIONS_PATH}/{organization_id}",
            {"logo": _file_part(logo)},
            _UPLOAD_TIMEOUT,
        )
        return Organization.model_validate(response.json())

    def update_thumbnail(self, organization_id: str, thumbnail: FileInput) -> Organization:
        """Upload a new thumbnail via multipart PATCH /v2/organizations/{organization_id}.

        The file goes up as a part named "thumbnail" and lands in
        thumbnail_url; square images are recommended. The server performs no
        mime validation and caps uploads at 10 MB. Admin or owner only.
        Mirrors js-sdk updateOrganizationThumbnail.

        Args:
            organization_id: ID of the organization to update. Must be the caller's own.
            thumbnail: The image: a path, raw bytes, an open binary file, or
                an httpx-style (filename, content[, content_type]) tuple.

        Returns:
            The updated organization.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = _multipart_request(
            self._endpoint._client,
            "PATCH",
            f"{_ORGANIZATIONS_PATH}/{organization_id}",
            {"thumbnail": _file_part(thumbnail)},
            _UPLOAD_TIMEOUT,
        )
        return Organization.model_validate(response.json())

    def get_entitlements(self) -> list[Entitlement]:
        """Get the caller's organization's entitlements via GET /v2/organizations/entitlements.

        The list is raw enablements and may include entries that are not yet
        active or have expired; see get_active_entitlements() for the
        collapsed view. Mirrors js-sdk getEntitlements.

        Returns:
            Every entitlement record for the caller's organization.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("GET", f"{_ORGANIZATIONS_PATH}/entitlements")
        return [Entitlement.model_validate(entry) for entry in response.json()]

    def get_active_entitlements(self) -> ActiveEntitlements:
        """Get the currently-active entitlements, collapsed to one entry per feature.

        Fetches the entitlements list and keeps only entries whose date
        window covers now, so presence of a key means the feature is active.
        Mirrors js-sdk getActiveEntitlements.

        Example:
            active = endpoint.organizations.get_active_entitlements()
            sms_enabled = "sms_auth" in active
            monthly_kba_limit = active["kba_auth"].monthly_max if "kba_auth" in active else 0

        Returns:
            Feature name to the entitlement record currently granting it.

        Raises:
            VerdocsError: The endpoint has no active session.
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        if self._endpoint.session is None:
            raise VerdocsError("No active session")

        return collapse_entitlements(self.get_entitlements())


class AsyncOrganizations:
    """Organization calls for an async endpoint."""

    def __init__(self, endpoint: AsyncVerdocsEndpoint) -> None:
        self._endpoint = endpoint

    async def get(self, organization_id: str) -> Organization:
        """Get an organization by ID via GET /v2/organizations/{organization_id}.

        Includes the organization's entitlements, children, and parent.
        Mirrors js-sdk getOrganization. The js-sdk describes a public-fields
        response for non-members, but the deployed handler denies non-members
        outright.

        Args:
            organization_id: ID of the organization to fetch. Must be the caller's own.

        Returns:
            The requested organization.

        Raises:
            NotFoundError: No organization has that ID.
            VerdocsAPIError: The API returned another non-2xx status (403 for non-members).
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", f"{_ORGANIZATIONS_PATH}/{organization_id}")
        return Organization.model_validate(response.json())

    async def get_children(self, organization_id: str) -> list[Organization]:
        """Get an organization's child organizations via GET /v2/organizations/{organization_id}/children.

        The caller must be an admin of the parent. Mirrors js-sdk
        getOrganizationChildren, which types the response as a single
        organization; the wire returns a list.

        Args:
            organization_id: ID of the parent organization. Must be the caller's own.

        Returns:
            The child organizations, each with its entitlements.

        Raises:
            NotFoundError: The organization has no children (the handler 404s
                rather than returning an empty list).
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", f"{_ORGANIZATIONS_PATH}/{organization_id}/children")
        return [Organization.model_validate(entry) for entry in response.json()]

    async def get_usage(
        self,
        organization_id: str,
        *,
        start_date: str | None = None,
        end_date: str | None = None,
        usage_type: str | None = None,
    ) -> OrganizationUsage:
        """Get usage counters via GET /v2/organizations/{organization_id}/usage.

        If the organization is a parent, children are included too. The
        caller must be an admin. Mirrors js-sdk getOrganizationUsage.

        Example:
            usage = await endpoint.organizations.get_usage("org-1", usage_type="envelope")
            envelopes_created = usage["org-1"].get("envelope", 0)

        Args:
            organization_id: ID of the organization. Must be the caller's own.
            start_date: ISO 8601 UTC datetime string (e.g. "2026-01-01T00:00:00Z").
                The server defaults to 90 days ago.
            end_date: ISO 8601 UTC datetime string. The server defaults to now.
            usage_type: Restrict to one usage type. Known values: UsageType in models.base.

        Returns:
            Counters nested by organization ID, then usage type.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "GET",
            f"{_ORGANIZATIONS_PATH}/{organization_id}/usage",
            params=_usage_query(start_date, end_date, usage_type),
        )
        return response.json()

    async def create(self, params: OrganizationCreateParams) -> OrganizationCreateResponse | Organization:
        """Create an organization via POST /v2/organizations. Mirrors js-sdk createOrganization.

        Creating a top-level organization switches the caller to a new owner
        profile in it and returns fresh session tokens; call set_token() with
        the new access token to continue as the new profile. Creating a child
        (params.parent_id set) leaves the session alone and returns the new
        organization with a ready-made "Default" API key attached.

        Example:
            result = await endpoint.organizations.create(OrganizationCreateParams(name="NewOrg"))
            endpoint.set_token(result.access_token)

        Args:
            params: Fields for the new organization; only name is required.
                Note that the deployed handler consumes only name, parent_id,
                timezone, and locale; see OrganizationCreateParams.

        Returns:
            OrganizationCreateResponse (tokens plus profile and organization)
            for a top-level create, or the new Organization for a child create.

        Raises:
            VerdocsAPIError: The API rejected the request.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", _ORGANIZATIONS_PATH, json=_write_body(params))
        return _parse_create_response(response.json())

    async def update(self, organization_id: str, params: OrganizationUpdateParams) -> Organization:
        """Update an organization via PATCH /v2/organizations/{organization_id}.

        The caller must be an admin or owner. Mirrors js-sdk updateOrganization.

        Args:
            organization_id: ID of the organization to update. Must be the caller's own.
            params: The fields to change; unset fields are left alone.

        Returns:
            The updated organization, including its groups and entitlements.

        Raises:
            NotFoundError: No organization has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "PATCH", f"{_ORGANIZATIONS_PATH}/{organization_id}", json=_write_body(params)
        )
        return Organization.model_validate(response.json())

    async def get_pipeline_settings(self, organization_id: str) -> PipelineSettings:
        """Get the document-pipeline settings via GET /v2/organizations/{organization_id}/pipeline-settings.

        The caller must be an admin. Every flag comes back normalized to a
        boolean. Mirrors js-sdk getOrganizationPipelineSettings.

        Args:
            organization_id: ID of the organization. Must be the caller's own.

        Returns:
            The organization's pipeline settings.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", f"{_ORGANIZATIONS_PATH}/{organization_id}/pipeline-settings")
        return PipelineSettings.model_validate(response.json())

    async def update_pipeline_settings(
        self, organization_id: str, params: PipelineSettingsUpdateParams
    ) -> PipelineSettings:
        """Update document-pipeline settings via PATCH /v2/organizations/{organization_id}/pipeline-settings.

        Omitted flags are left unchanged. The caller must be an admin.
        Mirrors js-sdk updateOrganizationPipelineSettings.

        Args:
            organization_id: ID of the organization. Must be the caller's own.
            params: The flags to change.

        Returns:
            The updated pipeline settings, every flag normalized to a boolean.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "PATCH", f"{_ORGANIZATIONS_PATH}/{organization_id}/pipeline-settings", json=_write_body(params)
        )
        return PipelineSettings.model_validate(response.json())

    async def delete(self, organization_id: str) -> AuthenticateResponse | None:
        """Delete the caller's current organization via DELETE /v2/organizations/{organization_id}.

        Owner only, and the organization's deletion_protected flag must be
        False (update it first). The ID is a safety check: it must match the
        caller's current organization. Mirrors js-sdk deleteOrganization.

        Args:
            organization_id: ID of the organization to delete.

        Returns:
            Session tokens for the caller's next remaining profile, or None
            if this was their last organization (the caller is signed out).

        Raises:
            NotFoundError: No organization has that ID.
            VerdocsAPIError: The API returned another non-2xx status (400 when
                deletion protection is on).
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("DELETE", f"{_ORGANIZATIONS_PATH}/{organization_id}")
        return _parse_delete_response(response)

    async def update_logo(self, organization_id: str, logo: FileInput) -> Organization:
        """Upload a new full-size logo via multipart PATCH /v2/organizations/{organization_id}.

        The file goes up as a part named "logo" and lands in full_logo_url.
        The server performs no mime validation and caps uploads at 10 MB.
        Admin or owner only. Mirrors js-sdk updateOrganizationLogo.

        Example:
            org = await endpoint.organizations.update_logo("org-1", "logo.png")
            org = await endpoint.organizations.update_logo("org-1", ("logo.png", png_bytes, "image/png"))

        Args:
            organization_id: ID of the organization to update. Must be the caller's own.
            logo: The image: a path, raw bytes, an open binary file, or an
                httpx-style (filename, content[, content_type]) tuple.

        Returns:
            The updated organization.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await _async_multipart_request(
            self._endpoint._client,
            "PATCH",
            f"{_ORGANIZATIONS_PATH}/{organization_id}",
            {"logo": _file_part(logo)},
            _UPLOAD_TIMEOUT,
        )
        return Organization.model_validate(response.json())

    async def update_thumbnail(self, organization_id: str, thumbnail: FileInput) -> Organization:
        """Upload a new thumbnail via multipart PATCH /v2/organizations/{organization_id}.

        The file goes up as a part named "thumbnail" and lands in
        thumbnail_url; square images are recommended. The server performs no
        mime validation and caps uploads at 10 MB. Admin or owner only.
        Mirrors js-sdk updateOrganizationThumbnail.

        Args:
            organization_id: ID of the organization to update. Must be the caller's own.
            thumbnail: The image: a path, raw bytes, an open binary file, or
                an httpx-style (filename, content[, content_type]) tuple.

        Returns:
            The updated organization.

        Raises:
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await _async_multipart_request(
            self._endpoint._client,
            "PATCH",
            f"{_ORGANIZATIONS_PATH}/{organization_id}",
            {"thumbnail": _file_part(thumbnail)},
            _UPLOAD_TIMEOUT,
        )
        return Organization.model_validate(response.json())

    async def get_entitlements(self) -> list[Entitlement]:
        """Get the caller's organization's entitlements via GET /v2/organizations/entitlements.

        The list is raw enablements and may include entries that are not yet
        active or have expired; see get_active_entitlements() for the
        collapsed view. Mirrors js-sdk getEntitlements.

        Returns:
            Every entitlement record for the caller's organization.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", f"{_ORGANIZATIONS_PATH}/entitlements")
        return [Entitlement.model_validate(entry) for entry in response.json()]

    async def get_active_entitlements(self) -> ActiveEntitlements:
        """Get the currently-active entitlements, collapsed to one entry per feature.

        Fetches the entitlements list and keeps only entries whose date
        window covers now, so presence of a key means the feature is active.
        Mirrors js-sdk getActiveEntitlements.

        Example:
            active = await endpoint.organizations.get_active_entitlements()
            sms_enabled = "sms_auth" in active

        Returns:
            Feature name to the entitlement record currently granting it.

        Raises:
            VerdocsError: The endpoint has no active session.
            VerdocsAPIError: The API returned a non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        if self._endpoint.session is None:
            raise VerdocsError("No active session")

        return collapse_entitlements(await self.get_entitlements())
