"""Envelope operations (js-sdk: Envelopes/Envelopes.ts).

Envelope creation is JSON-only on the wire: the API route registers an upload
middleware, but the handler never reads uploaded files and rejects document
entries that are not data or uri. Documents therefore attach as base64
strings or download URIs, never as multipart file parts.

The js-sdk's sortFields/sortDocuments/sortRecipients are client-side helpers
with no network calls, so they live here as module-level functions.
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import TYPE_CHECKING, Any, Literal, TypeVar
from urllib.parse import quote

import httpx

from ..errors import VerdocsConnectionError, api_error_from_response
from ..models.core import Envelope, EnvelopeDocument, EnvelopeField, Recipient, TemplateField
from ..models.envelopes import (
    EnvelopeCreateParams,
    EnvelopeList,
    EnvelopeListParams,
    EnvelopeUpdateParams,
    FileInput,
)

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_ENVELOPES_PATH = "/v2/envelopes"
_DOCUMENTS_PATH = "/v2/envelope-documents"


def _list_query(params: EnvelopeListParams | None) -> dict[str, Any] | None:
    if params is None:
        return None
    query = params.model_dump(mode="json", exclude_none=True)
    # axios serializes array params with bracketed keys (status[]=a&status[]=b)
    # and the server's query parser is configured around that; a bare
    # status=a would reach the handler as a string instead of an array.
    if "status" in query:
        query["status[]"] = query.pop("status")
    return query


def _write_body(params: EnvelopeCreateParams | EnvelopeUpdateParams) -> dict[str, Any]:
    # exclude_unset rather than exclude_none: an explicit None must reach the
    # wire (null disables reminders) while untouched fields stay off it.
    return params.model_dump(mode="json", exclude_unset=True)


def _field_path(envelope_id: str, role_name: str, field_name: str) -> str:
    # Role and field names routinely contain spaces ("Recipient 1"), so we
    # encode them the way the js-sdk's encodeURIComponent does.
    return f"{_ENVELOPES_PATH}/{envelope_id}/recipients/{quote(role_name, safe='')}/fields/{quote(field_name, safe='')}"


def _file_part(file: FileInput) -> Any:
    """Normalize a file argument into what httpx files= accepts.

    Paths are read up front and the part is named after their basename so
    httpx can guess a sensible content type; bytes, file-likes, and
    (filename, content, ...) tuples pass through untouched.
    """
    if isinstance(file, (str, Path)) or hasattr(file, "__fspath__"):
        path = Path(file)  # type: ignore[arg-type]
        return (path.name, path.read_bytes())
    return file


# The endpoint's _request helper only speaks query params and JSON bodies
# today, so the multipart calls in this module (and in signatures.py and
# initials.py) go through the raw client with the same error translation.
# Fold these into _request if it grows data/files support.


def _multipart_request(
    endpoint: VerdocsEndpoint,
    method: str,
    path: str,
    *,
    data: dict[str, Any] | None = None,
    files: list[tuple[str, Any]] | None = None,
) -> httpx.Response:
    try:
        response = endpoint._client.request(method, path, data=data, files=files)
    except httpx.TransportError as exc:
        raise VerdocsConnectionError(f"{method} {path} failed: {exc}") from exc
    if response.status_code >= 400:
        raise api_error_from_response(response)
    return response


async def _async_multipart_request(
    endpoint: AsyncVerdocsEndpoint,
    method: str,
    path: str,
    *,
    data: dict[str, Any] | None = None,
    files: list[tuple[str, Any]] | None = None,
) -> httpx.Response:
    try:
        response = await endpoint._client.request(method, path, data=data, files=files)
    except httpx.TransportError as exc:
        raise VerdocsConnectionError(f"{method} {path} failed: {exc}") from exc
    if response.status_code >= 400:
        raise api_error_from_response(response)
    return response


# A lone text part value="" with no file part is the working removal shape:
# the handler treats "no file" as remove, but its body schema still requires
# the value key, so the js-sdk's completely empty form body draws a 400. The
# (None, b"") tuple keeps the part a plain text field (no filename).
_REMOVE_ATTACHMENT_PARTS: list[tuple[str, Any]] = [("value", (None, b""))]


class Envelopes:
    """Envelope calls for a sync endpoint."""

    def __init__(self, endpoint: VerdocsEndpoint) -> None:
        self._endpoint = endpoint

    def list(self, params: EnvelopeListParams | None = None) -> EnvelopeList:
        """Get the envelopes accessible to the caller, with optional filters.

        Calls GET /v2/envelopes with a user session. Mirrors js-sdk getEnvelopes.

        Example:
            page = endpoint.envelopes.list(EnvelopeListParams(view="inbox", rows=10, page=0))

        Args:
            params: Optional filters, sorting, and pagination.

        Returns:
            One page of envelopes plus pagination counts.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("GET", _ENVELOPES_PATH, params=_list_query(params))
        return EnvelopeList.model_validate(response.json())

    def get(self, envelope_id: str) -> Envelope:
        """Get one envelope by ID via GET /v2/envelopes/{envelope_id}.

        Works with a user or signing session. Non-creators (e.g. recipients)
        receive only the metadata they are allowed to view. Mirrors js-sdk
        getEnvelope.

        Args:
            envelope_id: ID of the envelope to fetch.

        Returns:
            The envelope with its documents, fields, and recipients.

        Raises:
            NotFoundError: No visible envelope has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("GET", f"{_ENVELOPES_PATH}/{envelope_id}")
        return Envelope.model_validate(response.json())

    def create(self, params: EnvelopeCreateParams) -> Envelope:
        """Create an envelope via POST /v2/envelopes with a user session. Mirrors js-sdk createEnvelope.

        The request is JSON only. Recipients must always carry the email key,
        so phone-only recipients send an empty string, and duplicate
        recipient emails within one envelope are rejected. When created from
        a template, every template role needs a matching recipient by
        role_name, and each returned recipient carries an in_app_key access
        key.

        Example:
            envelope = endpoint.envelopes.create(
                EnvelopeCreateFromTemplateParams(
                    template_id="d2338742-f3a1-465b-8592-806587413cc1",
                    recipients=[
                        EnvelopeCreateRecipientFromTemplate(
                            role_name="Recipient 1",
                            first_name="Paige",
                            last_name="Turner",
                            email="paige.turner@example.com",
                        )
                    ],
                )
            )

        Args:
            params: The envelope definition, built from a template or directly.

        Returns:
            The newly created envelope with documents, fields, and recipients.

        Raises:
            VerdocsAPIError: The API rejected the request.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("POST", _ENVELOPES_PATH, json=_write_body(params))
        return Envelope.model_validate(response.json())

    def update(self, envelope_id: str, params: EnvelopeUpdateParams) -> Envelope:
        """Update an envelope via PATCH /v2/envelopes/{envelope_id}. Mirrors js-sdk updateEnvelope.

        Called by the envelope creator with a user session.

        Args:
            envelope_id: ID of the envelope to update.
            params: The fields to change; unset fields are left alone.

        Returns:
            The updated envelope.

        Raises:
            NotFoundError: No visible envelope has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("PATCH", f"{_ENVELOPES_PATH}/{envelope_id}", json=_write_body(params))
        return Envelope.model_validate(response.json())

    def cancel(self, envelope_id: str) -> Envelope:
        """Cancel an envelope via PUT /v2/envelopes/{envelope_id}. Mirrors js-sdk cancelEnvelope.

        Called by the envelope creator with a user session. Cancellation is a
        permanent end state.

        Args:
            envelope_id: ID of the envelope to cancel.

        Returns:
            The canceled envelope. The payload omits joined relations, which
            are optional on the model.

        Raises:
            NotFoundError: No visible envelope has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("PUT", f"{_ENVELOPES_PATH}/{envelope_id}", json={"action": "cancel"})
        return Envelope.model_validate(response.json())

    def get_document(self, document_id: str) -> EnvelopeDocument:
        """Get an envelope document's metadata via GET /v2/envelope-documents/{document_id}.

        Works with a user or signing session; the caller must be the envelope
        creator or one of its recipients. Mirrors js-sdk getEnvelopeDocument.
        (The server also accepts type=base64 in its request schema, but no
        handler implements it and it falls through to this metadata response,
        so the SDK does not offer it.)

        Args:
            document_id: ID of the document to fetch.

        Returns:
            The document metadata.

        Raises:
            NotFoundError: No visible document has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("GET", f"{_DOCUMENTS_PATH}/{document_id}")
        # The server sends JSON.stringify output with a text/html Content-Type
        # on this route, so we parse the text ourselves instead of trusting
        # the header.
        return EnvelopeDocument.model_validate(json.loads(response.text))

    def download_document(self, document_id: str) -> bytes:
        """Download an envelope document via GET /v2/envelope-documents/{document_id}?type=file.

        Works with a user or signing session. For attachment-type documents
        this serves the filled variant; for anything else it serves the
        certificate. Signed and certificate variants render asynchronously
        after finalize, so poll the envelope until the certificate document's
        signed flag is true before downloading. Mirrors js-sdk
        downloadEnvelopeDocument.

        Args:
            document_id: ID of the document to download.

        Returns:
            The raw file bytes; the response Content-Type is the document's
            stored MIME type.

        Raises:
            NotFoundError: No visible document has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("GET", f"{_DOCUMENTS_PATH}/{document_id}", params={"type": "file"})
        return response.content

    def get_document_download_link(self, document_id: str) -> str:
        """Get a signed download link via GET /v2/envelope-documents/{document_id}?type=download.

        Works with a user or signing session. Mirrors js-sdk
        getEnvelopeDocumentDownloadLink.

        Args:
            document_id: ID of the document to link to.

        Returns:
            A signed URL (attachment disposition, 1 hour expiry) sent as a
            bare string body. Use it immediately and never share or store it.

        Raises:
            NotFoundError: No visible document has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("GET", f"{_DOCUMENTS_PATH}/{document_id}", params={"type": "download"})
        return response.text

    def get_combined_document_download_link(self, document_id: str) -> str:
        """Get a signed link to the combined PDF: all documents plus the completion certificate.

        Calls GET /v2/envelope-documents/{document_id}?type=download&combined=true
        with the CERTIFICATE document's ID (the combined PDF shares it). Pages
        follow the recipients' action order. Envelopes finalized before the
        combined PDF existed may not have one. Mirrors js-sdk
        getCombinedEnvelopeDocumentDownloadLink.

        Args:
            document_id: ID of the envelope's certificate document.

        Returns:
            A signed URL sent as a bare string body. Use it immediately and
            never share or store it.

        Raises:
            NotFoundError: No visible document has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request(
            "GET", f"{_DOCUMENTS_PATH}/{document_id}", params={"type": "download", "combined": True}
        )
        return response.text

    def get_document_preview_link(self, document_id: str) -> str:
        """Get a signed preview link via GET /v2/envelope-documents/{document_id}?type=preview.

        Works with a user or signing session. Same as the download link but
        with an inline Content-Disposition. Mirrors js-sdk
        getEnvelopeDocumentPreviewLink.

        Args:
            document_id: ID of the document to link to.

        Returns:
            A signed URL sent as a bare string body. Use it immediately and
            never share or store it.

        Raises:
            NotFoundError: No visible document has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("GET", f"{_DOCUMENTS_PATH}/{document_id}", params={"type": "preview"})
        return response.text

    def get_file(self, document_id: str) -> bytes:
        """Download an envelope document's raw bytes. Mirrors js-sdk getEnvelopeFile.

        Deprecated in the js-sdk: use download_document,
        get_document_download_link, or get_document_preview_link instead.
        This is the same wire call as download_document.

        Args:
            document_id: ID of the document to download.

        Returns:
            The raw file bytes.

        Raises:
            NotFoundError: No visible document has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        return self.download_document(document_id)

    def update_field(
        self, envelope_id: str, role_name: str, field_name: str, value: str, prepared: bool = False
    ) -> EnvelopeField:
        """Set an envelope field's value, typically as a recipient fills in fields while signing.

        Calls PUT /v2/envelopes/{envelope_id}/recipients/{role_name}/fields/{field_name}.
        Works with a signing session for the role or a user session that can
        act for it (the envelope owner). Mirrors js-sdk updateEnvelopeField.

        The value is always a string: for signature and initial fields the
        UUID of a signature/initial block (see endpoint.signatures and
        endpoint.initials), for checkboxes and radios the literal string
        "true" or "false" (the server deliberately does not coerce), and for
        attachment fields use upload_field_attachment instead. Timestamp and
        payment fields reject direct writes.

        Args:
            envelope_id: ID of the envelope to operate on.
            role_name: The role the field belongs to, e.g. "Recipient 1".
            field_name: The machine name of the field, e.g. "Buyer-textbox-1".
            value: The value to set.
            prepared: Mark the field as prepared by the envelope creator. The
                js-sdk makes callers pass this explicitly; it defaults to
                False here.

        Returns:
            The updated envelope field.

        Raises:
            VerdocsAPIError: The field is unknown, belongs to another role,
                or the value was rejected.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request(
            "PUT", _field_path(envelope_id, role_name, field_name), json={"value": value, "prepared": prepared}
        )
        return EnvelopeField.model_validate(response.json())

    def upload_field_attachment(
        self, envelope_id: str, role_name: str, field_name: str, file: FileInput
    ) -> EnvelopeField:
        """Upload a file into an attachment field.

        Sends multipart/form-data to
        PUT /v2/envelopes/{envelope_id}/recipients/{role_name}/fields/{field_name}
        with the file under a part named "document" plus the text part
        value="" the body schema requires. Works with a signing session for
        the role or a user session that can act for it. Any declared MIME
        type is accepted; the only server-side gate is an antivirus scan.
        Mirrors js-sdk uploadEnvelopeFieldAttachment.

        Example:
            field = endpoint.envelopes.upload_field_attachment(
                envelope_id, "Recipient 1", "Buyer-attachment-1", "/tmp/receipt.pdf"
            )

        Args:
            envelope_id: ID of the envelope to operate on.
            role_name: The role the field belongs to.
            field_name: The machine name of the attachment field.
            file: A file path, raw bytes, a binary file-like object, or an
                httpx-style (filename, content, content_type) tuple.

        Returns:
            The updated envelope field. (The js-sdk types this response as
            the field's settings object, but the server returns the full
            field row.)

        Raises:
            VerdocsAPIError: The field is unknown, is not an attachment
                field, or the file failed the antivirus scan.
            VerdocsConnectionError: The request never reached the API.
        """
        response = _multipart_request(
            self._endpoint,
            "PUT",
            _field_path(envelope_id, role_name, field_name),
            data={"value": ""},
            files=[("document", _file_part(file))],
        )
        return EnvelopeField.model_validate(response.json())

    def delete_field_attachment(self, envelope_id: str, role_name: str, field_name: str) -> EnvelopeField:
        """Remove the current file from an attachment field.

        This is a PUT, not a DELETE, because the field itself survives:
        sending the update with no file part tells the server to clear the
        current attachment. Mirrors js-sdk deleteEnvelopeFieldAttachment,
        with one fix: the js-sdk sends a completely empty form body, which
        the server's body schema rejects, so we send the required value=""
        text part.

        Args:
            envelope_id: ID of the envelope to operate on.
            role_name: The role the field belongs to.
            field_name: The machine name of the attachment field.

        Returns:
            The updated envelope field.

        Raises:
            VerdocsAPIError: The field is unknown or is not an attachment field.
            VerdocsConnectionError: The request never reached the API.
        """
        response = _multipart_request(
            self._endpoint,
            "PUT",
            _field_path(envelope_id, role_name, field_name),
            files=_REMOVE_ATTACHMENT_PARTS,
        )
        return EnvelopeField.model_validate(response.json())

    def get_document_page_display_uri(
        self, document_id: str, page: int, variant: Literal["original", "filled", "certificate"] = "original"
    ) -> str:
        """Get a display URI for one page of an envelope document, rendered server-side as a PNG.

        Calls GET /v2/envelope-documents/page-image/{document_id}/{variant}/{page}.
        Works with a user or signing session; signing sessions are blocked
        until all of the recipient's auth methods are complete. The images
        are for display only: they are not legally binding documents and
        carry no participant metadata. Mirrors js-sdk
        getEnvelopeDocumentPageDisplayUri.

        Args:
            document_id: ID of the document to render.
            page: The page number to retrieve.
            variant: Which rendering of the document to use.

        Returns:
            A signed URL with a short expiry. Use it immediately and never
            store or cache it.

        Raises:
            NotFoundError: No visible document has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("GET", f"{_DOCUMENTS_PATH}/page-image/{document_id}/{variant}/{page}")
        return response.text

    def get_zip(self, envelope_ids: list[str]) -> bytes:
        """Download a ZIP of all data for the given envelopes via GET /v2/envelopes/zip/{ids}.

        Works with a user or signing session; the caller must be the owner or
        a recipient of every envelope listed. The archive contains the filled
        PDFs, the certificate, the combined PDF when present, and signer
        attachments under an attachments/ folder. Mirrors js-sdk
        getEnvelopesZip, except this returns the bytes rather than the whole
        transport response.

        Args:
            envelope_ids: IDs of the envelopes to include.

        Returns:
            The ZIP archive bytes. The server labels the response
            application/octet-stream, but it is a standard ZIP file.

        Raises:
            VerdocsAPIError: An envelope is unknown or not accessible.
            VerdocsConnectionError: The request never reached the API.
        """
        response = self._endpoint._request("GET", f"{_ENVELOPES_PATH}/zip/{','.join(envelope_ids)}")
        return response.content


class AsyncEnvelopes:
    """Envelope calls for an async endpoint."""

    def __init__(self, endpoint: AsyncVerdocsEndpoint) -> None:
        self._endpoint = endpoint

    async def list(self, params: EnvelopeListParams | None = None) -> EnvelopeList:
        """Get the envelopes accessible to the caller, with optional filters.

        Calls GET /v2/envelopes with a user session. Mirrors js-sdk getEnvelopes.

        Example:
            page = await endpoint.envelopes.list(EnvelopeListParams(view="inbox", rows=10, page=0))

        Args:
            params: Optional filters, sorting, and pagination.

        Returns:
            One page of envelopes plus pagination counts.

        Raises:
            AuthenticationError: The endpoint has no valid user session.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", _ENVELOPES_PATH, params=_list_query(params))
        return EnvelopeList.model_validate(response.json())

    async def get(self, envelope_id: str) -> Envelope:
        """Get one envelope by ID via GET /v2/envelopes/{envelope_id}.

        Works with a user or signing session. Non-creators (e.g. recipients)
        receive only the metadata they are allowed to view. Mirrors js-sdk
        getEnvelope.

        Args:
            envelope_id: ID of the envelope to fetch.

        Returns:
            The envelope with its documents, fields, and recipients.

        Raises:
            NotFoundError: No visible envelope has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", f"{_ENVELOPES_PATH}/{envelope_id}")
        return Envelope.model_validate(response.json())

    async def create(self, params: EnvelopeCreateParams) -> Envelope:
        """Create an envelope via POST /v2/envelopes with a user session. Mirrors js-sdk createEnvelope.

        The request is JSON only. Recipients must always carry the email key,
        so phone-only recipients send an empty string, and duplicate
        recipient emails within one envelope are rejected. When created from
        a template, every template role needs a matching recipient by
        role_name, and each returned recipient carries an in_app_key access
        key.

        Example:
            envelope = await endpoint.envelopes.create(
                EnvelopeCreateFromTemplateParams(
                    template_id="d2338742-f3a1-465b-8592-806587413cc1",
                    recipients=[
                        EnvelopeCreateRecipientFromTemplate(
                            role_name="Recipient 1",
                            first_name="Paige",
                            last_name="Turner",
                            email="paige.turner@example.com",
                        )
                    ],
                )
            )

        Args:
            params: The envelope definition, built from a template or directly.

        Returns:
            The newly created envelope with documents, fields, and recipients.

        Raises:
            VerdocsAPIError: The API rejected the request.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("POST", _ENVELOPES_PATH, json=_write_body(params))
        return Envelope.model_validate(response.json())

    async def update(self, envelope_id: str, params: EnvelopeUpdateParams) -> Envelope:
        """Update an envelope via PATCH /v2/envelopes/{envelope_id}. Mirrors js-sdk updateEnvelope.

        Called by the envelope creator with a user session.

        Args:
            envelope_id: ID of the envelope to update.
            params: The fields to change; unset fields are left alone.

        Returns:
            The updated envelope.

        Raises:
            NotFoundError: No visible envelope has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("PATCH", f"{_ENVELOPES_PATH}/{envelope_id}", json=_write_body(params))
        return Envelope.model_validate(response.json())

    async def cancel(self, envelope_id: str) -> Envelope:
        """Cancel an envelope via PUT /v2/envelopes/{envelope_id}. Mirrors js-sdk cancelEnvelope.

        Called by the envelope creator with a user session. Cancellation is a
        permanent end state.

        Args:
            envelope_id: ID of the envelope to cancel.

        Returns:
            The canceled envelope. The payload omits joined relations, which
            are optional on the model.

        Raises:
            NotFoundError: No visible envelope has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("PUT", f"{_ENVELOPES_PATH}/{envelope_id}", json={"action": "cancel"})
        return Envelope.model_validate(response.json())

    async def get_document(self, document_id: str) -> EnvelopeDocument:
        """Get an envelope document's metadata via GET /v2/envelope-documents/{document_id}.

        Works with a user or signing session; the caller must be the envelope
        creator or one of its recipients. Mirrors js-sdk getEnvelopeDocument.
        (The server also accepts type=base64 in its request schema, but no
        handler implements it and it falls through to this metadata response,
        so the SDK does not offer it.)

        Args:
            document_id: ID of the document to fetch.

        Returns:
            The document metadata.

        Raises:
            NotFoundError: No visible document has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", f"{_DOCUMENTS_PATH}/{document_id}")
        # The server sends JSON.stringify output with a text/html Content-Type
        # on this route, so we parse the text ourselves instead of trusting
        # the header.
        return EnvelopeDocument.model_validate(json.loads(response.text))

    async def download_document(self, document_id: str) -> bytes:
        """Download an envelope document via GET /v2/envelope-documents/{document_id}?type=file.

        Works with a user or signing session. For attachment-type documents
        this serves the filled variant; for anything else it serves the
        certificate. Signed and certificate variants render asynchronously
        after finalize, so poll the envelope until the certificate document's
        signed flag is true before downloading. Mirrors js-sdk
        downloadEnvelopeDocument.

        Args:
            document_id: ID of the document to download.

        Returns:
            The raw file bytes; the response Content-Type is the document's
            stored MIME type.

        Raises:
            NotFoundError: No visible document has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", f"{_DOCUMENTS_PATH}/{document_id}", params={"type": "file"})
        return response.content

    async def get_document_download_link(self, document_id: str) -> str:
        """Get a signed download link via GET /v2/envelope-documents/{document_id}?type=download.

        Works with a user or signing session. Mirrors js-sdk
        getEnvelopeDocumentDownloadLink.

        Args:
            document_id: ID of the document to link to.

        Returns:
            A signed URL (attachment disposition, 1 hour expiry) sent as a
            bare string body. Use it immediately and never share or store it.

        Raises:
            NotFoundError: No visible document has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", f"{_DOCUMENTS_PATH}/{document_id}", params={"type": "download"})
        return response.text

    async def get_combined_document_download_link(self, document_id: str) -> str:
        """Get a signed link to the combined PDF: all documents plus the completion certificate.

        Calls GET /v2/envelope-documents/{document_id}?type=download&combined=true
        with the CERTIFICATE document's ID (the combined PDF shares it). Pages
        follow the recipients' action order. Envelopes finalized before the
        combined PDF existed may not have one. Mirrors js-sdk
        getCombinedEnvelopeDocumentDownloadLink.

        Args:
            document_id: ID of the envelope's certificate document.

        Returns:
            A signed URL sent as a bare string body. Use it immediately and
            never share or store it.

        Raises:
            NotFoundError: No visible document has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "GET", f"{_DOCUMENTS_PATH}/{document_id}", params={"type": "download", "combined": True}
        )
        return response.text

    async def get_document_preview_link(self, document_id: str) -> str:
        """Get a signed preview link via GET /v2/envelope-documents/{document_id}?type=preview.

        Works with a user or signing session. Same as the download link but
        with an inline Content-Disposition. Mirrors js-sdk
        getEnvelopeDocumentPreviewLink.

        Args:
            document_id: ID of the document to link to.

        Returns:
            A signed URL sent as a bare string body. Use it immediately and
            never share or store it.

        Raises:
            NotFoundError: No visible document has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", f"{_DOCUMENTS_PATH}/{document_id}", params={"type": "preview"})
        return response.text

    async def get_file(self, document_id: str) -> bytes:
        """Download an envelope document's raw bytes. Mirrors js-sdk getEnvelopeFile.

        Deprecated in the js-sdk: use download_document,
        get_document_download_link, or get_document_preview_link instead.
        This is the same wire call as download_document.

        Args:
            document_id: ID of the document to download.

        Returns:
            The raw file bytes.

        Raises:
            NotFoundError: No visible document has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        return await self.download_document(document_id)

    async def update_field(
        self, envelope_id: str, role_name: str, field_name: str, value: str, prepared: bool = False
    ) -> EnvelopeField:
        """Set an envelope field's value, typically as a recipient fills in fields while signing.

        Calls PUT /v2/envelopes/{envelope_id}/recipients/{role_name}/fields/{field_name}.
        Works with a signing session for the role or a user session that can
        act for it (the envelope owner). Mirrors js-sdk updateEnvelopeField.

        The value is always a string: for signature and initial fields the
        UUID of a signature/initial block (see endpoint.signatures and
        endpoint.initials), for checkboxes and radios the literal string
        "true" or "false" (the server deliberately does not coerce), and for
        attachment fields use upload_field_attachment instead. Timestamp and
        payment fields reject direct writes.

        Args:
            envelope_id: ID of the envelope to operate on.
            role_name: The role the field belongs to, e.g. "Recipient 1".
            field_name: The machine name of the field, e.g. "Buyer-textbox-1".
            value: The value to set.
            prepared: Mark the field as prepared by the envelope creator. The
                js-sdk makes callers pass this explicitly; it defaults to
                False here.

        Returns:
            The updated envelope field.

        Raises:
            VerdocsAPIError: The field is unknown, belongs to another role,
                or the value was rejected.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "PUT", _field_path(envelope_id, role_name, field_name), json={"value": value, "prepared": prepared}
        )
        return EnvelopeField.model_validate(response.json())

    async def upload_field_attachment(
        self, envelope_id: str, role_name: str, field_name: str, file: FileInput
    ) -> EnvelopeField:
        """Upload a file into an attachment field.

        Sends multipart/form-data to
        PUT /v2/envelopes/{envelope_id}/recipients/{role_name}/fields/{field_name}
        with the file under a part named "document" plus the text part
        value="" the body schema requires. Works with a signing session for
        the role or a user session that can act for it. Any declared MIME
        type is accepted; the only server-side gate is an antivirus scan.
        Mirrors js-sdk uploadEnvelopeFieldAttachment.

        Example:
            field = await endpoint.envelopes.upload_field_attachment(
                envelope_id, "Recipient 1", "Buyer-attachment-1", "/tmp/receipt.pdf"
            )

        Args:
            envelope_id: ID of the envelope to operate on.
            role_name: The role the field belongs to.
            field_name: The machine name of the attachment field.
            file: A file path, raw bytes, a binary file-like object, or an
                httpx-style (filename, content, content_type) tuple.

        Returns:
            The updated envelope field. (The js-sdk types this response as
            the field's settings object, but the server returns the full
            field row.)

        Raises:
            VerdocsAPIError: The field is unknown, is not an attachment
                field, or the file failed the antivirus scan.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await _async_multipart_request(
            self._endpoint,
            "PUT",
            _field_path(envelope_id, role_name, field_name),
            data={"value": ""},
            files=[("document", _file_part(file))],
        )
        return EnvelopeField.model_validate(response.json())

    async def delete_field_attachment(self, envelope_id: str, role_name: str, field_name: str) -> EnvelopeField:
        """Remove the current file from an attachment field.

        This is a PUT, not a DELETE, because the field itself survives:
        sending the update with no file part tells the server to clear the
        current attachment. Mirrors js-sdk deleteEnvelopeFieldAttachment,
        with one fix: the js-sdk sends a completely empty form body, which
        the server's body schema rejects, so we send the required value=""
        text part.

        Args:
            envelope_id: ID of the envelope to operate on.
            role_name: The role the field belongs to.
            field_name: The machine name of the attachment field.

        Returns:
            The updated envelope field.

        Raises:
            VerdocsAPIError: The field is unknown or is not an attachment field.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await _async_multipart_request(
            self._endpoint,
            "PUT",
            _field_path(envelope_id, role_name, field_name),
            files=_REMOVE_ATTACHMENT_PARTS,
        )
        return EnvelopeField.model_validate(response.json())

    async def get_document_page_display_uri(
        self, document_id: str, page: int, variant: Literal["original", "filled", "certificate"] = "original"
    ) -> str:
        """Get a display URI for one page of an envelope document, rendered server-side as a PNG.

        Calls GET /v2/envelope-documents/page-image/{document_id}/{variant}/{page}.
        Works with a user or signing session; signing sessions are blocked
        until all of the recipient's auth methods are complete. The images
        are for display only: they are not legally binding documents and
        carry no participant metadata. Mirrors js-sdk
        getEnvelopeDocumentPageDisplayUri.

        Args:
            document_id: ID of the document to render.
            page: The page number to retrieve.
            variant: Which rendering of the document to use.

        Returns:
            A signed URL with a short expiry. Use it immediately and never
            store or cache it.

        Raises:
            NotFoundError: No visible document has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", f"{_DOCUMENTS_PATH}/page-image/{document_id}/{variant}/{page}")
        return response.text

    async def get_zip(self, envelope_ids: list[str]) -> bytes:
        """Download a ZIP of all data for the given envelopes via GET /v2/envelopes/zip/{ids}.

        Works with a user or signing session; the caller must be the owner or
        a recipient of every envelope listed. The archive contains the filled
        PDFs, the certificate, the combined PDF when present, and signer
        attachments under an attachments/ folder. Mirrors js-sdk
        getEnvelopesZip, except this returns the bytes rather than the whole
        transport response.

        Args:
            envelope_ids: IDs of the envelopes to include.

        Returns:
            The ZIP archive bytes. The server labels the response
            application/octet-stream, but it is a standard ZIP file.

        Raises:
            VerdocsAPIError: An envelope is unknown or not accessible.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", f"{_ENVELOPES_PATH}/zip/{','.join(envelope_ids)}")
        return response.content


_FieldT = TypeVar("_FieldT", EnvelopeField, TemplateField)


def sort_fields(fields: list[_FieldT]) -> list[_FieldT]:
    """Sort fields by page, then by vertical band, then by X. Mirrors js-sdk sortFields.

    Y coordinates have their origin at the BOTTOM LEFT of the page, so within
    a page the highest field tops (y + height) sort first; tops are bucketed
    into bands of 5 units so fields on roughly the same line order left to
    right. Sorts in place and returns the same list, like the js-sdk.

    Args:
        fields: Envelope or template fields to sort.

    Returns:
        The input list, sorted.
    """

    def key(field: _FieldT) -> tuple[int, int, float]:
        top = (field.y or 0) + (field.height or 0)
        return (field.page or 0, -math.floor(top / 5), field.x or 0)

    fields.sort(key=key)
    return fields


def sort_documents(documents: list[EnvelopeDocument]) -> list[EnvelopeDocument]:
    """Sort documents by their order, falling back to created_at. Mirrors js-sdk sortDocuments.

    Sorts in place and returns the same list, like the js-sdk.

    Args:
        documents: Envelope documents to sort.

    Returns:
        The input list, sorted.
    """
    documents.sort(key=lambda document: (document.order, document.created_at))
    return documents


def sort_recipients(recipients: list[Recipient] | None) -> list[Recipient] | None:
    """Sort recipients by sequence, then by order within a sequence. Mirrors js-sdk sortRecipients.

    Sorts in place and returns the same list, like the js-sdk; None passes
    through, matching the js-sdk's optional input.

    Args:
        recipients: Recipients to sort, or None.

    Returns:
        The input list, sorted, or None if None was given.
    """
    if recipients is None:
        return None
    recipients.sort(key=lambda recipient: (recipient.sequence, recipient.order))
    return recipients
