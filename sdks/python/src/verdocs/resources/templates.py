"""Template operations (js-sdk: Templates/Templates.ts).

The js-sdk applies some client-side legacy upgrades in getTemplate (copying
template_documents into documents, patching field settings). Those shims are
marked temporary in the js-sdk, so this SDK stays a faithful wire mirror and
returns responses exactly as the API sends them.

Template create speaks two encodings: JSON, or multipart when files are
attached. The js-sdk's own multipart encoding is broken (roles and fields
serialize to "[object Object]" and draw a 400), so the multipart path here
follows sdks/WIRE-NOTES.md instead: file parts all named "documents", string
fields only as text parts.
"""

from __future__ import annotations

import mimetypes
import os
from collections.abc import Sequence
from pathlib import Path
from typing import IO, TYPE_CHECKING, Any

import httpx

from ..errors import VerdocsConnectionError, api_error_from_response
from ..models import Template, TemplateCreateParams, TemplateList, TemplateListParams, TemplateUpdateParams
from ..models.templates import TemplateCreateFromSharepointParams

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_TEMPLATES_PATH = "/v2/templates"

# One attachment for a multipart create: a filesystem path, raw PDF bytes, an
# open binary file, or an httpx-style (filename, content[, content_type]) tuple.
TemplateFile = (
    str
    | os.PathLike[str]
    | bytes
    | bytearray
    | IO[bytes]
    | tuple[str, bytes | IO[bytes]]
    | tuple[str, bytes | IO[bytes], str]
)

# The create handler parses multipart text parts with the same zod schema as
# JSON bodies, and zod does not coerce strings, so only these string-typed
# fields survive the trip. Everything else must go via JSON or follow-up calls.
_MULTIPART_TEXT_FIELDS = ("name", "description", "visibility", "sender")

# The API gates uploads on each part's declared content type (PDF and DOCX
# only), and mimetypes does not know .docx on every platform, so we pin the
# two accepted types ourselves.
_MIME_BY_SUFFIX = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def _guess_mime(filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix in _MIME_BY_SUFFIX:
        return _MIME_BY_SUFFIX[suffix]
    guessed, _ = mimetypes.guess_type(filename)
    return guessed or "application/octet-stream"


def _file_part(entry: TemplateFile) -> Any:
    """Normalize one file input into something httpx can send as a file part.

    The server takes the document name from the part filename and gates the
    upload on the declared content type, so we fill in both wherever they can
    be derived. Tuples pass through untouched; the caller owns them.
    """
    if isinstance(entry, tuple):
        return entry
    if isinstance(entry, (str, os.PathLike)):
        path = Path(entry)
        return (path.name, path.read_bytes(), _guess_mime(path.name))
    if isinstance(entry, (bytes, bytearray)):
        # Bare bytes carry no filename, so we assume the common case. Pass a
        # (filename, content) tuple to control the name or to send DOCX.
        return ("document.pdf", bytes(entry), "application/pdf")
    name = getattr(entry, "name", None)
    if isinstance(name, str) and name:
        return (Path(name).name, entry, _guess_mime(name))
    return entry


def _document_parts(files: Sequence[TemplateFile]) -> list[tuple[str, Any]]:
    # The handler reads every file part from the one repeatable "documents" name.
    return [("documents", _file_part(entry)) for entry in files]


def _split_multipart_text(params: TemplateCreateParams) -> dict[str, str]:
    """Extract the text parts a multipart create can carry, or raise on fields that cannot ride."""
    body = params.model_dump(mode="json", exclude_unset=True)
    text: dict[str, str] = {}
    for key in _MULTIPART_TEXT_FIELDS:
        value = body.pop(key, None)
        if value is not None:
            text[key] = value
    if body:
        raise ValueError(
            "these create fields cannot be sent with file uploads: "
            + ", ".join(sorted(body))
            + ". Multipart text parts are string-only: send uri/data documents via a JSON create "
            "(no files argument), set reminders with update() after creating, and add roles with "
            "template_roles.create()."
        )
    return text


def _multipart_request(
    endpoint: VerdocsEndpoint, method: str, path: str, *, data: dict[str, str], files: list[tuple[str, Any]]
) -> httpx.Response:
    # endpoint._request only speaks query params and JSON bodies, so multipart
    # goes through the shared client with the same error mapping. Fold this
    # into _request if it ever grows files= support.
    try:
        response = endpoint._client.request(method, path, data=data, files=files)
    except httpx.TransportError as exc:
        raise VerdocsConnectionError(f"{method} {path} failed: {exc}") from exc

    if response.status_code >= 400:
        raise api_error_from_response(response)

    return response


async def _multipart_request_async(
    endpoint: AsyncVerdocsEndpoint, method: str, path: str, *, data: dict[str, str], files: list[tuple[str, Any]]
) -> httpx.Response:
    try:
        response = await endpoint._client.request(method, path, data=data, files=files)
    except httpx.TransportError as exc:
        raise VerdocsConnectionError(f"{method} {path} failed: {exc}") from exc

    if response.status_code >= 400:
        raise api_error_from_response(response)

    return response


def _list_query(params: TemplateListParams | None) -> dict[str, Any] | None:
    if params is None:
        return None
    return params.model_dump(mode="json", exclude_none=True)


def _write_body(
    params: TemplateCreateParams | TemplateCreateFromSharepointParams | TemplateUpdateParams,
) -> dict[str, Any]:
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

    def create(self, params: TemplateCreateParams, files: Sequence[TemplateFile] | None = None) -> Template:
        """Create a template via POST /v2/templates. Mirrors js-sdk createTemplate.

        Two encodings, chosen by the files argument. Without files the request
        is JSON and params may carry documents entries (uri or base64 data)
        plus inline roles. With files the request is multipart/form-data:
        every file rides as a part named "documents", only the string fields
        (name, description, visibility, sender) ride along as text parts, and
        setting anything else raises ValueError before a request is made. The
        API accepts PDF and DOCX only, judged by each part's declared content
        type.

        Inline fields are not supported on either path: the deployed API
        validates a fields array but never creates the rows, so add fields
        with endpoint.template_fields.create() afterwards.

        Example:
            template = endpoint.templates.create(
                TemplateCreateParams(name="NDA", visibility="shared"),
                files=["/contracts/nda.pdf"],
            )

        Args:
            params: Fields for the new template; only name is required.
            files: Optional documents to attach. Each entry may be a path, raw
                PDF bytes, an open binary file, or an httpx-style
                (filename, content[, content_type]) tuple. Bare bytes are sent
                as "document.pdf" with an application/pdf content type; use a
                tuple to control the name or to send DOCX bytes.

        Returns:
            The newly created template, with documents, fields, and roles.

        Raises:
            ValueError: files was given together with fields that cannot ride multipart.
            VerdocsAPIError: The API rejected the request.
            VerdocsConnectionError: The request never reached the API.
        """
        if files:
            response = _multipart_request(
                self._endpoint,
                "POST",
                _TEMPLATES_PATH,
                data=_split_multipart_text(params),
                files=_document_parts(files),
            )
        else:
            response = self._endpoint._request("POST", _TEMPLATES_PATH, json=_write_body(params))
        return Template.model_validate(response.json())

    def duplicate(self, template_id: str, name: str) -> Template:
        """Duplicate a template via PUT /v2/templates/{template_id}. Mirrors js-sdk duplicateTemplate.

        Creates a complete clone, including settings (reminders and friends),
        fields, roles, and documents.

        Args:
            template_id: ID of the template to copy.
            name: Name for the new copy.

        Returns:
            The newly copied template.

        Raises:
            NotFoundError: No visible template has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request(
            "PUT", f"{_TEMPLATES_PATH}/{template_id}", json={"action": "duplicate", "name": name}
        )
        return Template.model_validate(response.json())

    def create_from_sharepoint(self, params: TemplateCreateFromSharepointParams) -> Template:
        """Create a template from a Sharepoint asset. Mirrors js-sdk createTemplateFromSharepoint.

        Dead on the deployed API: POST /v2/templates/from-sharepoint has no
        handler anywhere in the API, so every call fails. Ported for js-sdk
        shape parity only; keep it out of examples until the API ships the
        route.

        Args:
            params: Sharepoint site/item coordinates and the On-Behalf-Of token.

        Returns:
            The newly created template, if the API ever ships the route.

        Raises:
            VerdocsAPIError: Always today; the deployed API has no such route.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("POST", f"{_TEMPLATES_PATH}/from-sharepoint", json=_write_body(params))
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

    def toggle_star(self, template_id: str) -> Template:
        """Toggle the caller's star on a template. Mirrors js-sdk toggleTemplateStar.

        Broken on both sides today: this posts the js-sdk's
        /v2/templates/{template_id}/stars/toggle path, which has no server
        route, and the server's own star route is a GET whose handler cannot
        be satisfied by any client. The deployed API rejects every call;
        retirement is pending. Ported for shape parity and excluded from
        conformance.

        Args:
            template_id: ID of the template to star or unstar.

        Returns:
            The updated template, if the API ever repairs the route.

        Raises:
            VerdocsAPIError: Always today; the deployed API has no such route.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("POST", f"{_TEMPLATES_PATH}/{template_id}/stars/toggle")
        return Template.model_validate(response.json())


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

    async def create(self, params: TemplateCreateParams, files: Sequence[TemplateFile] | None = None) -> Template:
        """Create a template via POST /v2/templates. Mirrors js-sdk createTemplate.

        Two encodings, chosen by the files argument. Without files the request
        is JSON and params may carry documents entries (uri or base64 data)
        plus inline roles. With files the request is multipart/form-data:
        every file rides as a part named "documents", only the string fields
        (name, description, visibility, sender) ride along as text parts, and
        setting anything else raises ValueError before a request is made. The
        API accepts PDF and DOCX only, judged by each part's declared content
        type.

        Inline fields are not supported on either path: the deployed API
        validates a fields array but never creates the rows, so add fields
        with endpoint.template_fields.create() afterwards.

        Example:
            template = await endpoint.templates.create(
                TemplateCreateParams(name="NDA", visibility="shared"),
                files=["/contracts/nda.pdf"],
            )

        Args:
            params: Fields for the new template; only name is required.
            files: Optional documents to attach. Each entry may be a path, raw
                PDF bytes, an open binary file, or an httpx-style
                (filename, content[, content_type]) tuple. Bare bytes are sent
                as "document.pdf" with an application/pdf content type; use a
                tuple to control the name or to send DOCX bytes.

        Returns:
            The newly created template, with documents, fields, and roles.

        Raises:
            ValueError: files was given together with fields that cannot ride multipart.
            VerdocsAPIError: The API rejected the request.
            VerdocsConnectionError: The request never reached the API.
        """
        if files:
            response = await _multipart_request_async(
                self._endpoint,
                "POST",
                _TEMPLATES_PATH,
                data=_split_multipart_text(params),
                files=_document_parts(files),
            )
        else:
            response = await self._endpoint._request("POST", _TEMPLATES_PATH, json=_write_body(params))
        return Template.model_validate(response.json())

    async def duplicate(self, template_id: str, name: str) -> Template:
        """Duplicate a template via PUT /v2/templates/{template_id}. Mirrors js-sdk duplicateTemplate.

        Creates a complete clone, including settings (reminders and friends),
        fields, roles, and documents.

        Args:
            template_id: ID of the template to copy.
            name: Name for the new copy.

        Returns:
            The newly copied template.

        Raises:
            NotFoundError: No visible template has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "PUT", f"{_TEMPLATES_PATH}/{template_id}", json={"action": "duplicate", "name": name}
        )
        return Template.model_validate(response.json())

    async def create_from_sharepoint(self, params: TemplateCreateFromSharepointParams) -> Template:
        """Create a template from a Sharepoint asset. Mirrors js-sdk createTemplateFromSharepoint.

        Dead on the deployed API: POST /v2/templates/from-sharepoint has no
        handler anywhere in the API, so every call fails. Ported for js-sdk
        shape parity only; keep it out of examples until the API ships the
        route.

        Args:
            params: Sharepoint site/item coordinates and the On-Behalf-Of token.

        Returns:
            The newly created template, if the API ever ships the route.

        Raises:
            VerdocsAPIError: Always today; the deployed API has no such route.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", f"{_TEMPLATES_PATH}/from-sharepoint", json=_write_body(params))
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

    async def toggle_star(self, template_id: str) -> Template:
        """Toggle the caller's star on a template. Mirrors js-sdk toggleTemplateStar.

        Broken on both sides today: this posts the js-sdk's
        /v2/templates/{template_id}/stars/toggle path, which has no server
        route, and the server's own star route is a GET whose handler cannot
        be satisfied by any client. The deployed API rejects every call;
        retirement is pending. Ported for shape parity and excluded from
        conformance.

        Args:
            template_id: ID of the template to star or unstar.

        Returns:
            The updated template, if the API ever repairs the route.

        Raises:
            VerdocsAPIError: Always today; the deployed API has no such route.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", f"{_TEMPLATES_PATH}/{template_id}/stars/toggle")
        return Template.model_validate(response.json())
