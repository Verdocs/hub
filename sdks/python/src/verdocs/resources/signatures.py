"""Signature block operations (js-sdk: Envelopes/Signatures.ts).

The multipart plumbing lives in envelopes.py until the endpoint itself grows
files support; we share it rather than repeat the error translation here.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from ..models.core import Signature
from ..models.envelopes import FileInput
from .envelopes import _async_multipart_request, _file_part, _multipart_request

if TYPE_CHECKING:
    from .._endpoint import AsyncVerdocsEndpoint, VerdocsEndpoint

_SIGNATURES_PATH = "/v2/profiles/signatures"


class Signatures:
    """Signature block calls for a sync endpoint."""

    def __init__(self, endpoint: VerdocsEndpoint) -> None:
        self._endpoint = endpoint

    def create(self, image: FileInput) -> Signature:
        """Store a signature block image for the caller's profile.

        Sends multipart/form-data to POST /v2/profiles/signatures with the
        image under a part named "signature". Works with a user or signing
        session (guest signer profiles are created automatically). Signers
        typically "adopt" one block at the start of signing and reuse its ID
        for every signature field via envelopes.update_field. Guest signers
        usually have exactly one, tied to their session; authenticated users
        can keep several. Mirrors js-sdk createSignature, folding its
        separate name argument into the file input (the server does not
        consume the filename).

        Example:
            block = endpoint.signatures.create("/tmp/signature.png")
            endpoint.envelopes.update_field(envelope_id, "Recipient 1", "sig-1", block.id)

        Args:
            image: The signature image: a file path, raw bytes, a binary
                file-like object, or an httpx-style (filename, content,
                content_type) tuple.

        Returns:
            The stored signature block. Its url field is the storage object
            key, not a fetchable URL; the id is what signature fields accept.

        Raises:
            VerdocsAPIError: The API rejected the upload.
            VerdocsConnectionError: The request never reached the API.

        @sdkOperation signature.createSignature
        @sdkGroup Signature
        @sdkPage Endpoints
        """
        response = _multipart_request(
            self._endpoint, "POST", _SIGNATURES_PATH, files=[("signature", _file_part(image))]
        )
        return Signature.model_validate(response.json())


class AsyncSignatures:
    """Signature block calls for an async endpoint."""

    def __init__(self, endpoint: AsyncVerdocsEndpoint) -> None:
        self._endpoint = endpoint

    async def create(self, image: FileInput) -> Signature:
        """Store a signature block image for the caller's profile.

        Sends multipart/form-data to POST /v2/profiles/signatures with the
        image under a part named "signature". Works with a user or signing
        session (guest signer profiles are created automatically). Signers
        typically "adopt" one block at the start of signing and reuse its ID
        for every signature field via envelopes.update_field. Guest signers
        usually have exactly one, tied to their session; authenticated users
        can keep several. Mirrors js-sdk createSignature, folding its
        separate name argument into the file input (the server does not
        consume the filename).

        Example:
            block = await endpoint.signatures.create("/tmp/signature.png")
            await endpoint.envelopes.update_field(envelope_id, "Recipient 1", "sig-1", block.id)

        Args:
            image: The signature image: a file path, raw bytes, a binary
                file-like object, or an httpx-style (filename, content,
                content_type) tuple.

        Returns:
            The stored signature block. Its url field is the storage object
            key, not a fetchable URL; the id is what signature fields accept.

        Raises:
            VerdocsAPIError: The API rejected the upload.
            VerdocsConnectionError: The request never reached the API.
        """
        response = await _async_multipart_request(
            self._endpoint, "POST", _SIGNATURES_PATH, files=[("signature", _file_part(image))]
        )
        return Signature.model_validate(response.json())
