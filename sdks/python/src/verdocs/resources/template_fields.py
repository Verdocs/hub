"""Template field operations (js-sdk: Templates/Fields.ts).

Fields are always enumerated under template objects, so there are no list or
get calls here; fetch the template for the latest field list. Field names may
contain URL-hostile characters, so update and delete quote the name into the
path. Fields reference a role by name, so create roles first; note that the
template create endpoint never creates field rows itself, making this
resource the only way to add fields.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any
from urllib.parse import quote

from ..models import TemplateField
from ..models.templates import FieldCreateParams, FieldUpdateParams

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_FIELDS_PATH = "/v2/fields"


def _write_body(params: FieldCreateParams | FieldUpdateParams) -> dict[str, Any]:
    # exclude_unset keeps untouched fields off the wire so the per-type server
    # defaults (sizes and friends) apply.
    return params.model_dump(mode="json", exclude_unset=True)


class TemplateFields:
    """Template field calls for a sync endpoint."""

    def __init__(self, endpoint: VerdocsEndpoint) -> None:
        self._endpoint = endpoint

    def create(self, template_id: str, params: FieldCreateParams) -> TemplateField:
        """Add a field to a template via POST /v2/fields/{template_id}. Mirrors js-sdk createField.

        The document_id must belong to the template, the role_name must match
        an existing role, and a field cannot be both required and readonly.

        Example:
            field = template_fields.create(
                template.id,
                FieldCreateParams(
                    document_id=document.id,
                    name="tenant-signature-1",
                    role_name="Tenant 1",
                    type="signature",
                    page=0,
                    x=100,
                    y=200,
                ),
            )

        Args:
            template_id: ID of the template to add the field to.
            params: The field definition.

        Returns:
            The newly created field.

        Raises:
            NotFoundError: No visible template has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("POST", f"{_FIELDS_PATH}/{template_id}", json=_write_body(params))
        return TemplateField.model_validate(response.json())

    def update(self, template_id: str, name: str, params: FieldUpdateParams) -> TemplateField:
        """Update a field via PATCH /v2/fields/{template_id}/{name}. Mirrors js-sdk updateField.

        The current field name rides in the path (quoted). Set params.name to
        rename; field names must stay unique within the template. The deployed
        API does not consume type changes, so add a new field and delete the
        old one to change a type.

        Args:
            template_id: ID of the template the field belongs to.
            name: The field's current name.
            params: The fields to change; unset fields are left alone.

        Returns:
            The updated field.

        Raises:
            NotFoundError: The template or field does not exist.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request(
            "PATCH", f"{_FIELDS_PATH}/{template_id}/{quote(name, safe='')}", json=_write_body(params)
        )
        return TemplateField.model_validate(response.json())

    def delete(self, template_id: str, name: str) -> None:
        """Remove a field via DELETE /v2/fields/{template_id}/{name}. Mirrors js-sdk deleteField.

        The server answers with a status object that nothing consumes, so this
        returns None and relies on exceptions for failure.

        Args:
            template_id: ID of the template the field belongs to.
            name: Name of the field to delete.

        Raises:
            NotFoundError: The template does not exist.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        self._endpoint._request("DELETE", f"{_FIELDS_PATH}/{template_id}/{quote(name, safe='')}")


class AsyncTemplateFields:
    """Template field calls for an async endpoint."""

    def __init__(self, endpoint: AsyncVerdocsEndpoint) -> None:
        self._endpoint = endpoint

    async def create(self, template_id: str, params: FieldCreateParams) -> TemplateField:
        """Add a field to a template via POST /v2/fields/{template_id}. Mirrors js-sdk createField.

        The document_id must belong to the template, the role_name must match
        an existing role, and a field cannot be both required and readonly.

        Example:
            field = await template_fields.create(
                template.id,
                FieldCreateParams(
                    document_id=document.id,
                    name="tenant-signature-1",
                    role_name="Tenant 1",
                    type="signature",
                    page=0,
                    x=100,
                    y=200,
                ),
            )

        Args:
            template_id: ID of the template to add the field to.
            params: The field definition.

        Returns:
            The newly created field.

        Raises:
            NotFoundError: No visible template has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", f"{_FIELDS_PATH}/{template_id}", json=_write_body(params))
        return TemplateField.model_validate(response.json())

    async def update(self, template_id: str, name: str, params: FieldUpdateParams) -> TemplateField:
        """Update a field via PATCH /v2/fields/{template_id}/{name}. Mirrors js-sdk updateField.

        The current field name rides in the path (quoted). Set params.name to
        rename; field names must stay unique within the template. The deployed
        API does not consume type changes, so add a new field and delete the
        old one to change a type.

        Args:
            template_id: ID of the template the field belongs to.
            name: The field's current name.
            params: The fields to change; unset fields are left alone.

        Returns:
            The updated field.

        Raises:
            NotFoundError: The template or field does not exist.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "PATCH", f"{_FIELDS_PATH}/{template_id}/{quote(name, safe='')}", json=_write_body(params)
        )
        return TemplateField.model_validate(response.json())

    async def delete(self, template_id: str, name: str) -> None:
        """Remove a field via DELETE /v2/fields/{template_id}/{name}. Mirrors js-sdk deleteField.

        The server answers with a status object that nothing consumes, so this
        returns None and relies on exceptions for failure.

        Args:
            template_id: ID of the template the field belongs to.
            name: Name of the field to delete.

        Raises:
            NotFoundError: The template does not exist.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        await self._endpoint._request("DELETE", f"{_FIELDS_PATH}/{template_id}/{quote(name, safe='')}")
