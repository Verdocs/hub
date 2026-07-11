"""Template operations (js-sdk: Templates/Templates.ts).

The js-sdk applies some client-side legacy upgrades in getTemplate (copying
template_documents into documents, patching field settings). Those shims are
marked temporary in the js-sdk, so this SDK stays a faithful wire mirror and
returns responses exactly as the API sends them.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from ..models import Template, TemplateCreateParams, TemplateList, TemplateListParams, TemplateUpdateParams

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_TEMPLATES_PATH = "/v2/templates"


def _list_query(params: TemplateListParams | None) -> dict[str, Any] | None:
    if params is None:
        return None
    return params.model_dump(mode="json", exclude_none=True)


def _write_body(params: TemplateCreateParams | TemplateUpdateParams) -> dict[str, Any]:
    # exclude_unset rather than exclude_none: an explicit None must reach the
    # wire (null disables reminders) while untouched fields stay off it.
    return params.model_dump(mode="json", exclude_unset=True)


class Templates:
    """Template calls for a sync endpoint."""

    def __init__(self, endpoint: VerdocsEndpoint) -> None:
        self._endpoint = endpoint

    def list(self, params: TemplateListParams | None = None) -> TemplateList:
        """Get the templates accessible to the caller, with optional filters.

        Calls GET /v2/templates. Mirrors js-sdk getTemplates.

        Example:
            page = endpoint.templates.list(TemplateListParams(visibility="private_shared", rows=10, page=0))

        Args:
            params: Optional filters, sorting, and pagination.

        Returns:
            One page of templates plus pagination counts.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("GET", _TEMPLATES_PATH, params=_list_query(params))
        return TemplateList.model_validate(response.json())

    def get(self, template_id: str) -> Template:
        """Get one template by ID via GET /v2/templates/{template_id}.

        The caller needs at least View access to the template. Mirrors js-sdk getTemplate.

        Args:
            template_id: ID of the template to fetch.

        Returns:
            The requested template.

        Raises:
            NotFoundError: No visible template has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("GET", f"{_TEMPLATES_PATH}/{template_id}")
        return Template.model_validate(response.json())

    def create(self, params: TemplateCreateParams) -> Template:
        """Create a template via POST /v2/templates. Mirrors js-sdk createTemplate.

        Example:
            template = endpoint.templates.create(TemplateCreateParams(name="NDA"))

        Args:
            params: Fields for the new template; only name is required.

        Returns:
            The newly created template.

        Raises:
            VerdocsAPIError: The API rejected the request.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("POST", _TEMPLATES_PATH, json=_write_body(params))
        return Template.model_validate(response.json())

    def update(self, template_id: str, params: TemplateUpdateParams) -> Template:
        """Update a template via PATCH /v2/templates/{template_id}. Mirrors js-sdk updateTemplate.

        Args:
            template_id: ID of the template to update.
            params: The fields to change; unset fields are left alone.

        Returns:
            The updated template.

        Raises:
            NotFoundError: No visible template has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("PATCH", f"{_TEMPLATES_PATH}/{template_id}", json=_write_body(params))
        return Template.model_validate(response.json())

    def delete(self, template_id: str) -> None:
        """Delete a template via DELETE /v2/templates/{template_id}. Mirrors js-sdk deleteTemplate.

        The API answers with a bare success string that nothing consumes, so
        this returns None and relies on exceptions for failure.

        Args:
            template_id: ID of the template to delete.

        Raises:
            NotFoundError: No visible template has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        self._endpoint._request("DELETE", f"{_TEMPLATES_PATH}/{template_id}")


class AsyncTemplates:
    """Template calls for an async endpoint."""

    def __init__(self, endpoint: AsyncVerdocsEndpoint) -> None:
        self._endpoint = endpoint

    async def list(self, params: TemplateListParams | None = None) -> TemplateList:
        """Get the templates accessible to the caller, with optional filters.

        Calls GET /v2/templates. Mirrors js-sdk getTemplates.

        Example:
            page = await endpoint.templates.list(TemplateListParams(visibility="private_shared", rows=10, page=0))

        Args:
            params: Optional filters, sorting, and pagination.

        Returns:
            One page of templates plus pagination counts.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", _TEMPLATES_PATH, params=_list_query(params))
        return TemplateList.model_validate(response.json())

    async def get(self, template_id: str) -> Template:
        """Get one template by ID via GET /v2/templates/{template_id}.

        The caller needs at least View access to the template. Mirrors js-sdk getTemplate.

        Args:
            template_id: ID of the template to fetch.

        Returns:
            The requested template.

        Raises:
            NotFoundError: No visible template has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", f"{_TEMPLATES_PATH}/{template_id}")
        return Template.model_validate(response.json())

    async def create(self, params: TemplateCreateParams) -> Template:
        """Create a template via POST /v2/templates. Mirrors js-sdk createTemplate.

        Example:
            template = await endpoint.templates.create(TemplateCreateParams(name="NDA"))

        Args:
            params: Fields for the new template; only name is required.

        Returns:
            The newly created template.

        Raises:
            VerdocsAPIError: The API rejected the request.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", _TEMPLATES_PATH, json=_write_body(params))
        return Template.model_validate(response.json())

    async def update(self, template_id: str, params: TemplateUpdateParams) -> Template:
        """Update a template via PATCH /v2/templates/{template_id}. Mirrors js-sdk updateTemplate.

        Args:
            template_id: ID of the template to update.
            params: The fields to change; unset fields are left alone.

        Returns:
            The updated template.

        Raises:
            NotFoundError: No visible template has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("PATCH", f"{_TEMPLATES_PATH}/{template_id}", json=_write_body(params))
        return Template.model_validate(response.json())

    async def delete(self, template_id: str) -> None:
        """Delete a template via DELETE /v2/templates/{template_id}. Mirrors js-sdk deleteTemplate.

        The API answers with a bare success string that nothing consumes, so
        this returns None and relies on exceptions for failure.

        Args:
            template_id: ID of the template to delete.

        Raises:
            NotFoundError: No visible template has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        await self._endpoint._request("DELETE", f"{_TEMPLATES_PATH}/{template_id}")
