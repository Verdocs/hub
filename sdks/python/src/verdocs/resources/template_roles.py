"""Template role operations (js-sdk: Templates/Roles.ts).

Roles are always enumerated under template objects, so there are no list or
get calls here; fetch the template for the latest role list. Role names may
contain spaces and other URL-hostile characters, so update and delete quote
the name into the path.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any
from urllib.parse import quote

from ..models import Role
from ..models.templates import RoleCreateParams, RoleUpdateParams

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_ROLES_PATH = "/v2/roles"


def _write_body(params: RoleCreateParams | RoleUpdateParams) -> dict[str, Any]:
    # exclude_unset keeps untouched fields off the wire so the server defaults
    # (type signer, sequence 1, order 1) apply.
    return params.model_dump(mode="json", exclude_unset=True)


class TemplateRoles:
    """Template role calls for a sync endpoint."""

    def __init__(self, endpoint: VerdocsEndpoint) -> None:
        self._endpoint = endpoint

    def create(self, template_id: str, params: RoleCreateParams) -> Role:
        """Add a role to a template via POST /v2/roles/{template_id}. Mirrors js-sdk createTemplateRole.

        Example:
            role = template_roles.create(template.id, RoleCreateParams(name="Tenant 1", type="signer"))

        Args:
            template_id: ID of the template to add the role to.
            params: The role definition; only name is required.

        Returns:
            The newly created role.

        Raises:
            NotFoundError: No visible template has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation role.createTemplateRole
        @sdkGroup Role
        @sdkPage Endpoints
        """
        response = self._endpoint._request("POST", f"{_ROLES_PATH}/{template_id}", json=_write_body(params))
        return Role.model_validate(response.json())

    def update(self, template_id: str, name: str, params: RoleUpdateParams) -> Role:
        """Update a role via PATCH /v2/roles/{template_id}/{name}. Mirrors js-sdk updateTemplateRole.

        The current role name rides in the path (quoted, so spaces are fine).
        Set params.name to rename; renames fail when the new name is already
        used within the template.

        Args:
            template_id: ID of the template the role belongs to.
            name: The role's current name.
            params: The fields to change; unset fields are left alone.

        Returns:
            The updated role.

        Raises:
            NotFoundError: The template or role does not exist.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation role.updateTemplateRole
        @sdkGroup Role
        @sdkPage Endpoints
        """
        response = self._endpoint._request(
            "PATCH", f"{_ROLES_PATH}/{template_id}/{quote(name, safe='')}", json=_write_body(params)
        )
        return Role.model_validate(response.json())

    def delete(self, template_id: str, name: str) -> None:
        """Delete a role via DELETE /v2/roles/{template_id}/{name}. Mirrors js-sdk deleteTemplateRole.

        The role's fields are deleted with it. The server answers with a
        status object that nothing consumes, so this returns None and relies
        on exceptions for failure.

        Args:
            template_id: ID of the template the role belongs to.
            name: Name of the role to delete.

        Raises:
            NotFoundError: The template or role does not exist.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation role.deleteTemplateRole
        @sdkGroup Role
        @sdkPage Endpoints
        """
        self._endpoint._request("DELETE", f"{_ROLES_PATH}/{template_id}/{quote(name, safe='')}")


class AsyncTemplateRoles:
    """Template role calls for an async endpoint."""

    def __init__(self, endpoint: AsyncVerdocsEndpoint) -> None:
        self._endpoint = endpoint

    async def create(self, template_id: str, params: RoleCreateParams) -> Role:
        """Add a role to a template via POST /v2/roles/{template_id}. Mirrors js-sdk createTemplateRole.

        Example:
            role = await template_roles.create(template.id, RoleCreateParams(name="Tenant 1", type="signer"))

        Args:
            template_id: ID of the template to add the role to.
            params: The role definition; only name is required.

        Returns:
            The newly created role.

        Raises:
            NotFoundError: No visible template has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", f"{_ROLES_PATH}/{template_id}", json=_write_body(params))
        return Role.model_validate(response.json())

    async def update(self, template_id: str, name: str, params: RoleUpdateParams) -> Role:
        """Update a role via PATCH /v2/roles/{template_id}/{name}. Mirrors js-sdk updateTemplateRole.

        The current role name rides in the path (quoted, so spaces are fine).
        Set params.name to rename; renames fail when the new name is already
        used within the template.

        Args:
            template_id: ID of the template the role belongs to.
            name: The role's current name.
            params: The fields to change; unset fields are left alone.

        Returns:
            The updated role.

        Raises:
            NotFoundError: The template or role does not exist.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "PATCH", f"{_ROLES_PATH}/{template_id}/{quote(name, safe='')}", json=_write_body(params)
        )
        return Role.model_validate(response.json())

    async def delete(self, template_id: str, name: str) -> None:
        """Delete a role via DELETE /v2/roles/{template_id}/{name}. Mirrors js-sdk deleteTemplateRole.

        The role's fields are deleted with it. The server answers with a
        status object that nothing consumes, so this returns None and relies
        on exceptions for failure.

        Args:
            template_id: ID of the template the role belongs to.
            name: Name of the role to delete.

        Raises:
            NotFoundError: The template or role does not exist.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        await self._endpoint._request("DELETE", f"{_ROLES_PATH}/{template_id}/{quote(name, safe='')}")
