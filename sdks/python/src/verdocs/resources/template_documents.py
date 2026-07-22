"""Template document operations (js-sdk: Templates/TemplateDocuments.ts).

Two js-sdk functions here (getTemplateDocumentFile and
getTemplateDocumentThumbnail) target routes that do not exist on the deployed
API; they are ported for shape parity with doc comments stating the reality.
getTemplateDocumentPreviewLink fetches the envelope-documents path for a
template document; the code is the wire truth, so we mirror the anomaly.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Literal

from ..models import Template, TemplateDocument
from .templates import TemplateFile, _file_part, _multipart_request, _multipart_request_async

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_DOCUMENTS_PATH = "/v2/template-documents"


class TemplateDocuments:
    """Template document calls for a sync endpoint."""

    def __init__(self, endpoint: VerdocsEndpoint) -> None:
        self._endpoint = endpoint

    def create(self, template_id: str, file: TemplateFile) -> TemplateDocument:
        """Attach a document to a template. Mirrors js-sdk createTemplateDocument.

        Sends POST /v2/template-documents as multipart with exactly one file
        part named "file" plus a template_id text part (the js-sdk doc tag
        claims a different path; this is the one the code uses and the server
        serves). The document name comes from the uploaded filename, with no
        override, and the API accepts PDF and DOCX only, judged by the part's
        declared content type.

        Example:
            document = template_documents.create(template.id, "/contracts/nda.pdf")

        Args:
            template_id: ID of the template to attach the document to.
            file: The document: a path, raw PDF bytes, an open binary file,
                or an httpx-style (filename, content[, content_type]) tuple.

        Returns:
            The created template document row (not the containing template).

        Raises:
            VerdocsAPIError: The API rejected the upload.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation templateDocument.createTemplateDocument
        @sdkGroup TemplateDocument
        @sdkPage Endpoints
        """
        parts = [("file", _file_part(file))]
        response = _multipart_request(
            self._endpoint, "POST", _DOCUMENTS_PATH, data={"template_id": template_id}, files=parts
        )
        return TemplateDocument.model_validate(response.json())

    def delete(self, document_id: str) -> Template:
        """Delete a template document via DELETE /v2/template-documents/{document_id}.

        Mirrors js-sdk deleteTemplateDocument. The server answers with the
        remaining deep template (documents, fields, roles), not the status
        string the js-sdk doc tag claims, so this returns the updated template.

        Args:
            document_id: ID of the document to delete.

        Returns:
            The template as it stands after the deletion.

        Raises:
            NotFoundError: No visible document has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation templateDocument.deleteTemplateDocument
        @sdkGroup TemplateDocument
        @sdkPage Endpoints
        """
        response = self._endpoint._request("DELETE", f"{_DOCUMENTS_PATH}/{document_id}")
        return Template.model_validate(response.json())

    def get(self, document_id: str) -> TemplateDocument:
        """Get a template document's metadata via GET /v2/template-documents/{document_id}.

        Mirrors js-sdk getTemplateDocument. Non-creators (e.g. org
        collaborators) get only the metadata they are allowed to view. The
        server stringifies the JSON itself and sends it with a text/html
        content type; we parse the body as JSON regardless.

        Args:
            document_id: ID of the document to fetch.

        Returns:
            The document metadata.

        Raises:
            NotFoundError: No visible document has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation templateDocument.getTemplateDocument
        @sdkGroup TemplateDocument
        @sdkPage Endpoints
        """
        response = self._endpoint._request("GET", f"{_DOCUMENTS_PATH}/{document_id}")
        return TemplateDocument.model_validate(response.json())

    def download(self, document_id: str) -> bytes:
        """Download a template document's raw bytes. Mirrors js-sdk downloadTemplateDocument.

        Calls GET /v2/template-documents/{document_id}?type=file. The response
        carries the document's stored mime type; there is no redirect.

        Args:
            document_id: ID of the document to download.

        Returns:
            The document content.

        Raises:
            NotFoundError: No visible document has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation templateDocument.downloadTemplateDocument
        @sdkGroup TemplateDocument
        @sdkPage Endpoints
        """
        response = self._endpoint._request("GET", f"{_DOCUMENTS_PATH}/{document_id}", params={"type": "file"})
        return response.content

    def get_download_link(self, document_id: str) -> str:
        """Get a pre-signed download link for a template document.

        Mirrors js-sdk getTemplateDocumentDownloadLink (minus its unused
        envelope_id parameter). Calls
        GET /v2/template-documents/{document_id}?type=download; the server
        answers with a signed Cloudfront URL as a bare string (text/html
        content type, not JSON), attachment disposition, one hour expiry.
        Fetch the link immediately and never share it.

        Args:
            document_id: ID of the document to link to.

        Returns:
            The signed download URL.

        Raises:
            NotFoundError: No visible document has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation templateDocument.getTemplateDocumentDownloadLink
        @sdkGroup TemplateDocument
        @sdkPage Endpoints
        """
        response = self._endpoint._request("GET", f"{_DOCUMENTS_PATH}/{document_id}", params={"type": "download"})
        return response.text

    def get_preview_link(self, document_id: str) -> str:
        """Get a pre-signed preview link (inline disposition) for a template document.

        Mirrors js-sdk getTemplateDocumentPreviewLink (minus its unused
        envelope_id parameter), which fetches
        GET /v2/envelope-documents/{document_id}?type=preview: the ENVELOPE
        document family, not the template one. The code is the wire truth, so
        we mirror it; the template-family route
        GET /v2/template-documents/{id}?type=preview also serves preview
        links. The URL comes back as a bare string and expires quickly, so use
        it immediately and never share it.

        Args:
            document_id: ID of the document to link to.

        Returns:
            The signed preview URL.

        Raises:
            NotFoundError: No visible document has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation templateDocument.getTemplateDocumentPreviewLink
        @sdkGroup TemplateDocument
        @sdkPage Endpoints
        """
        response = self._endpoint._request("GET", f"/v2/envelope-documents/{document_id}", params={"type": "preview"})
        return response.text

    def get_file(self, template_id: str, document_id: str) -> bytes:
        """Get (binary download) a file attached to a template. Mirrors js-sdk getTemplateDocumentFile.

        Dead on the deployed API: the
        GET /v2/templates/{template_id}/documents/{document_id} route it
        targets exists nowhere in the API, so every call fails with a 404.
        download() is the working equivalent. Ported for shape parity only.

        Args:
            template_id: ID of the template the document belongs to.
            document_id: ID of the document to download.

        Returns:
            The document content, if the API ever ships the route.

        Raises:
            NotFoundError: Always today; the deployed API has no such route.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation templateDocument.getTemplateDocumentFile
        @sdkGroup TemplateDocument
        @sdkPage Endpoints
        """
        response = self._endpoint._request(
            "GET", f"/v2/templates/{template_id}/documents/{document_id}", params={"file": "true"}
        )
        return response.content

    def get_thumbnail(self, template_id: str, document_id: str) -> bytes:
        """Get a thumbnail image for a template document. Mirrors js-sdk getTemplateDocumentThumbnail.

        Dead on the deployed API: the
        GET /v2/templates/{template_id}/documents/{document_id} route it
        targets exists nowhere in the API, so every call fails with a 404.
        get_page_display_uri(document_id, "thumb") is the working equivalent.
        Ported for shape parity only.

        Args:
            template_id: ID of the template the document belongs to.
            document_id: ID of the document to thumbnail.

        Returns:
            The thumbnail content, if the API ever ships the route.

        Raises:
            NotFoundError: Always today; the deployed API has no such route.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation templateDocument.getTemplateDocumentThumbnail
        @sdkGroup TemplateDocument
        @sdkPage Endpoints
        """
        response = self._endpoint._request(
            "GET", f"/v2/templates/{template_id}/documents/{document_id}", params={"thumbnail": "true"}
        )
        return response.content

    def get_page_display_uri(
        self, document_id: str, page: int | Literal["thumb"], variant: Literal["original", "tagged"] = "original"
    ) -> str:
        """Get a display URL for one page of a template document, rendered server-side as a PNG.

        Mirrors js-sdk getTemplateDocumentPageDisplayUri. Calls
        GET /v2/template-documents/page-image/{document_id}/{variant}/{page}
        and returns a signed Cloudfront URL as a bare string. Pages are
        0-based; pass "thumb" for the thumbnail rendition (the js-sdk types
        page as a number, but the server accepts the literal). These renders
        are for display only: they are not legally binding documents and carry
        no participant metadata; download() returns the original asset.

        Example:
            url = template_documents.get_page_display_uri(document.id, 0)
            thumb = template_documents.get_page_display_uri(document.id, "thumb")

        Args:
            document_id: ID of the document to render.
            page: 0-based page number, or "thumb" for the thumbnail.
            variant: "original" (default) or "tagged".

        Returns:
            The signed page image URL.

        Raises:
            VerdocsAPIError: The API rejected the request.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation templateDocument.getTemplateDocumentPageDisplayUri
        @sdkGroup TemplateDocument
        @sdkPage Endpoints
        """
        response = self._endpoint._request("GET", f"{_DOCUMENTS_PATH}/page-image/{document_id}/{variant}/{page}")
        return response.text


class AsyncTemplateDocuments:
    """Template document calls for an async endpoint."""

    def __init__(self, endpoint: AsyncVerdocsEndpoint) -> None:
        self._endpoint = endpoint

    async def create(self, template_id: str, file: TemplateFile) -> TemplateDocument:
        """Attach a document to a template. Mirrors js-sdk createTemplateDocument.

        Sends POST /v2/template-documents as multipart with exactly one file
        part named "file" plus a template_id text part (the js-sdk doc tag
        claims a different path; this is the one the code uses and the server
        serves). The document name comes from the uploaded filename, with no
        override, and the API accepts PDF and DOCX only, judged by the part's
        declared content type.

        Example:
            document = await template_documents.create(template.id, "/contracts/nda.pdf")

        Args:
            template_id: ID of the template to attach the document to.
            file: The document: a path, raw PDF bytes, an open binary file,
                or an httpx-style (filename, content[, content_type]) tuple.

        Returns:
            The created template document row (not the containing template).

        Raises:
            VerdocsAPIError: The API rejected the upload.
            VerdocsConnectionError: The request never reached the API.
        """
        parts = [("file", _file_part(file))]
        response = await _multipart_request_async(
            self._endpoint, "POST", _DOCUMENTS_PATH, data={"template_id": template_id}, files=parts
        )
        return TemplateDocument.model_validate(response.json())

    async def delete(self, document_id: str) -> Template:
        """Delete a template document via DELETE /v2/template-documents/{document_id}.

        Mirrors js-sdk deleteTemplateDocument. The server answers with the
        remaining deep template (documents, fields, roles), not the status
        string the js-sdk doc tag claims, so this returns the updated template.

        Args:
            document_id: ID of the document to delete.

        Returns:
            The template as it stands after the deletion.

        Raises:
            NotFoundError: No visible document has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("DELETE", f"{_DOCUMENTS_PATH}/{document_id}")
        return Template.model_validate(response.json())

    async def get(self, document_id: str) -> TemplateDocument:
        """Get a template document's metadata via GET /v2/template-documents/{document_id}.

        Mirrors js-sdk getTemplateDocument. Non-creators (e.g. org
        collaborators) get only the metadata they are allowed to view. The
        server stringifies the JSON itself and sends it with a text/html
        content type; we parse the body as JSON regardless.

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
        return TemplateDocument.model_validate(response.json())

    async def download(self, document_id: str) -> bytes:
        """Download a template document's raw bytes. Mirrors js-sdk downloadTemplateDocument.

        Calls GET /v2/template-documents/{document_id}?type=file. The response
        carries the document's stored mime type; there is no redirect.

        Args:
            document_id: ID of the document to download.

        Returns:
            The document content.

        Raises:
            NotFoundError: No visible document has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", f"{_DOCUMENTS_PATH}/{document_id}", params={"type": "file"})
        return response.content

    async def get_download_link(self, document_id: str) -> str:
        """Get a pre-signed download link for a template document.

        Mirrors js-sdk getTemplateDocumentDownloadLink (minus its unused
        envelope_id parameter). Calls
        GET /v2/template-documents/{document_id}?type=download; the server
        answers with a signed Cloudfront URL as a bare string (text/html
        content type, not JSON), attachment disposition, one hour expiry.
        Fetch the link immediately and never share it.

        Args:
            document_id: ID of the document to link to.

        Returns:
            The signed download URL.

        Raises:
            NotFoundError: No visible document has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", f"{_DOCUMENTS_PATH}/{document_id}", params={"type": "download"})
        return response.text

    async def get_preview_link(self, document_id: str) -> str:
        """Get a pre-signed preview link (inline disposition) for a template document.

        Mirrors js-sdk getTemplateDocumentPreviewLink (minus its unused
        envelope_id parameter), which fetches
        GET /v2/envelope-documents/{document_id}?type=preview: the ENVELOPE
        document family, not the template one. The code is the wire truth, so
        we mirror it; the template-family route
        GET /v2/template-documents/{id}?type=preview also serves preview
        links. The URL comes back as a bare string and expires quickly, so use
        it immediately and never share it.

        Args:
            document_id: ID of the document to link to.

        Returns:
            The signed preview URL.

        Raises:
            NotFoundError: No visible document has that ID.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "GET", f"/v2/envelope-documents/{document_id}", params={"type": "preview"}
        )
        return response.text

    async def get_file(self, template_id: str, document_id: str) -> bytes:
        """Get (binary download) a file attached to a template. Mirrors js-sdk getTemplateDocumentFile.

        Dead on the deployed API: the
        GET /v2/templates/{template_id}/documents/{document_id} route it
        targets exists nowhere in the API, so every call fails with a 404.
        download() is the working equivalent. Ported for shape parity only.

        Args:
            template_id: ID of the template the document belongs to.
            document_id: ID of the document to download.

        Returns:
            The document content, if the API ever ships the route.

        Raises:
            NotFoundError: Always today; the deployed API has no such route.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "GET", f"/v2/templates/{template_id}/documents/{document_id}", params={"file": "true"}
        )
        return response.content

    async def get_thumbnail(self, template_id: str, document_id: str) -> bytes:
        """Get a thumbnail image for a template document. Mirrors js-sdk getTemplateDocumentThumbnail.

        Dead on the deployed API: the
        GET /v2/templates/{template_id}/documents/{document_id} route it
        targets exists nowhere in the API, so every call fails with a 404.
        get_page_display_uri(document_id, "thumb") is the working equivalent.
        Ported for shape parity only.

        Args:
            template_id: ID of the template the document belongs to.
            document_id: ID of the document to thumbnail.

        Returns:
            The thumbnail content, if the API ever ships the route.

        Raises:
            NotFoundError: Always today; the deployed API has no such route.
            VerdocsAPIError: The API returned another non-2xx status.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request(
            "GET", f"/v2/templates/{template_id}/documents/{document_id}", params={"thumbnail": "true"}
        )
        return response.content

    async def get_page_display_uri(
        self, document_id: str, page: int | Literal["thumb"], variant: Literal["original", "tagged"] = "original"
    ) -> str:
        """Get a display URL for one page of a template document, rendered server-side as a PNG.

        Mirrors js-sdk getTemplateDocumentPageDisplayUri. Calls
        GET /v2/template-documents/page-image/{document_id}/{variant}/{page}
        and returns a signed Cloudfront URL as a bare string. Pages are
        0-based; pass "thumb" for the thumbnail rendition (the js-sdk types
        page as a number, but the server accepts the literal). These renders
        are for display only: they are not legally binding documents and carry
        no participant metadata; download() returns the original asset.

        Example:
            url = await template_documents.get_page_display_uri(document.id, 0)
            thumb = await template_documents.get_page_display_uri(document.id, "thumb")

        Args:
            document_id: ID of the document to render.
            page: 0-based page number, or "thumb" for the thumbnail.
            variant: "original" (default) or "tagged".

        Returns:
            The signed page image URL.

        Raises:
            VerdocsAPIError: The API rejected the request.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await self._endpoint._request("GET", f"{_DOCUMENTS_PATH}/page-image/{document_id}/{variant}/{page}")
        return response.text
